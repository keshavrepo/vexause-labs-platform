import { enqueueJob } from "@/lib/jobs";
import { restoreOrderInventory } from "@/lib/order-inventory";
import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";
export async function GET(request:NextRequest){
 const auth=await requireAdminApi(request);if(auth.response)return auth.response;
 const requests=await prisma.orderServiceRequest.findMany({orderBy:{createdAt:"desc"},take:200,include:{user:{select:{name:true,email:true}},order:{select:{orderCode:true,status:true,totalPaise:true}},events:{orderBy:{createdAt:"asc"}}}});
 return NextResponse.json({requests});
}
const schema=z.object({requestId:z.string().min(1),status:z.enum(["UNDER_REVIEW","APPROVED","REJECTED","RESOLVED","CANCELLED"]),adminReply:z.string().trim().max(2000).optional()});
export async function PATCH(request:NextRequest){
 const auth=await requireAdminApi(request);if(auth.response)return auth.response;
 try{
  const d=schema.parse(await request.json());
  const updated=await prisma.$transaction(async tx=>{
   const current=await tx.orderServiceRequest.findUnique({where:{id:d.requestId},include:{order:true}});
   if(!current)throw new Error("NOT_FOUND");
   const allowed:Record<string,string[]>={OPEN:["UNDER_REVIEW","APPROVED","REJECTED","CANCELLED"],UNDER_REVIEW:["APPROVED","REJECTED","RESOLVED","CANCELLED"],APPROVED:["RESOLVED"],REJECTED:[],RESOLVED:[],CANCELLED:[]};
   if(current.status===d.status||!(allowed[current.status]||[]).includes(d.status))throw new Error("INVALID_TRANSITION");
   if(d.status==="APPROVED"&&current.type==="CANCELLATION"){
    if(!current.orderId||!current.order||!["PENDING_REVIEW","AWAITING_PAYMENT"].includes(current.order.status))throw new Error("ORDER_STAGE");
    const verified=await tx.payment.findFirst({where:{orderId:current.orderId,status:"VERIFIED"},select:{id:true}});
    if(verified)throw new Error("PAYMENT_REQUIRES_REFUND_REVIEW");
    const changed=await tx.order.updateMany({where:{id:current.orderId,status:current.order.status},data:{status:"CANCELLED"}});
    if(changed.count!==1)throw new Error("ORDER_STATE_CHANGED");
    await restoreOrderInventory(tx,current.orderId,`Support-approved cancellation · ${current.requestCode}`);
    const redemption=await tx.couponRedemption.findUnique({where:{orderId:current.orderId},select:{couponId:true}});
    if(redemption){
     await tx.couponRedemption.delete({where:{orderId:current.orderId}});
     await tx.coupon.update({where:{id:redemption.couponId},data:{usedCount:{decrement:1}}});
    }
    await tx.payment.updateMany({where:{orderId:current.orderId,status:{in:["CREATED","PENDING"]}},data:{status:"FAILED"}});
    await tx.orderStatusHistory.create({data:{orderId:current.orderId,status:"CANCELLED",note:`Cancellation approved · ${current.requestCode}`,actorId:auth.session!.userId}});
    await enqueueJob("ORDER_STATUS_NOTIFICATION",{userId:current.userId,title:"Order cancelled",message:`Your cancellation request ${current.requestCode} was approved. The order was cancelled and eligible stock was returned.`,href:`/account/orders/${current.orderId}`},tx);
   }
   const row=await tx.orderServiceRequest.update({where:{id:d.requestId},data:{status:d.status,adminReply:d.adminReply??current.adminReply,resolvedAt:["REJECTED","RESOLVED","CANCELLED"].includes(d.status)?new Date():null}});
   await tx.orderServiceRequestEvent.create({data:{requestId:d.requestId,actorId:auth.session!.userId,actorRole:"ADMIN",fromStatus:current.status,toStatus:d.status,message:d.adminReply||`Request status changed to ${d.status}`}});
   await tx.auditLog.create({data:{actorId:auth.session!.userId,action:"SERVICE_REQUEST_UPDATED",entityType:"OrderServiceRequest",entityId:d.requestId,metadata:{from:current.status,to:d.status,type:current.type}}});
   await enqueueJob("SERVICE_REQUEST_NOTIFICATION", {
    userId: current.userId,
    title: "Support request updated",
    message: `Your request ${current.requestCode} is now ${d.status.toLowerCase().replaceAll("_", " ")}.`,
    href: "/account/support",
   }, tx);
   return row;
  });
  return NextResponse.json({request:updated});
 }catch(e){
  if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid request update."},{status:400});
  const c=e instanceof Error?e.message:"";
  if(c==="NOT_FOUND")return NextResponse.json({error:"Request not found."},{status:404});
  if(c==="ORDER_STAGE")return NextResponse.json({error:"This cancellation can no longer be approved at the current order stage."},{status:409});
  if(c==="PAYMENT_REQUIRES_REFUND_REVIEW")return NextResponse.json({error:"A verified payment exists. Use the refund workflow and resolve the payment before approving cancellation."},{status:409});
  if(c==="ORDER_STATE_CHANGED")return NextResponse.json({error:"The order changed while this request was being processed. Refresh and review it again."},{status:409});
  if(c==="INVENTORY_RESTORE_TARGET_MISSING")return NextResponse.json({error:"The original inventory record is missing. Reconcile stock before approving cancellation."},{status:409});
  if(c==="INVALID_TRANSITION")return NextResponse.json({error:"This request status change is not allowed."},{status:409});
  return NextResponse.json({error:"Could not update request."},{status:500});
 }
}
