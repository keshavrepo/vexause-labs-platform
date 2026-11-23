import { enqueueJob } from "@/lib/jobs";
import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";
import { restoreOrderInventory } from "@/lib/order-inventory";
const updateSchema=z.object({orderId:z.string().min(1),status:z.enum(["PENDING_REVIEW","AWAITING_PAYMENT","PAID","IN_PRODUCTION","READY_TO_SHIP","SHIPPED","DELIVERED","CANCELLED","REFUND_PENDING","REFUNDED"]),note:z.string().max(300).optional()});
export async function GET(request:NextRequest){
 const auth=await requireAdminApi(request, { staffMethods: ["GET"] });if(auth.response)return auth.response;
 const orders=await prisma.order.findMany({orderBy:{createdAt:"desc"},take:100,include:{user:{select:{name:true,email:true}},address:{select:{fullName:true,phone:true,city:true,state:true,postalCode:true}},items:{select:{productName:true,quantity:true,lineTotalPaise:true,inventoryAllocated:true,inventoryRestoredAt:true}},payments:{select:{method:true,status:true,amountPaise:true,verifiedAt:true}},shipments:{orderBy:{shippedAt:"desc"},take:1}}});
 return NextResponse.json({orders,actorRole:auth.session!.role});
}
export async function PATCH(request:NextRequest){
 const auth=await requireAdminApi(request, { staffMethods: ["GET"] });if(auth.response)return auth.response;
 try{
  const d=updateSchema.parse(await request.json());
  const result=await prisma.$transaction(async tx=>{
   const current=await tx.order.findUnique({where:{id:d.orderId},select:{id:true,status:true,userId:true}});
   if(!current)throw new Error("NOT_FOUND");
   const transitions:Record<string,string[]> = {
    PENDING_REVIEW:["AWAITING_PAYMENT","CANCELLED"],
    QUOTED:["AWAITING_PAYMENT","CANCELLED"],
    AWAITING_PAYMENT:["PAID","CANCELLED"],
    PAID:["IN_PRODUCTION","REFUND_PENDING"],
    IN_PRODUCTION:["READY_TO_SHIP","REFUND_PENDING"],
    READY_TO_SHIP:["SHIPPED","REFUND_PENDING"],
    SHIPPED:["DELIVERED","REFUND_PENDING"],
    REFUND_PENDING:["REFUNDED"],
    DELIVERED:[],CANCELLED:[],REFUNDED:[]
   };
   if(current.status===d.status)throw new Error("NO_CHANGE");
   if(!(transitions[current.status]||[]).includes(d.status))throw new Error("INVALID_TRANSITION");
   if(d.status==="PAID"){
    const verified=await tx.payment.findFirst({where:{orderId:d.orderId,status:"VERIFIED"}});
    if(!verified)throw new Error("PAYMENT_NOT_VERIFIED");
   }
   if(d.status==="SHIPPED"){
    const shipment=await tx.shipment.findFirst({where:{orderId:d.orderId,status:{in:["PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED"]}}});
    if(!shipment)throw new Error("SHIPMENT_NOT_DISPATCHED");
   }
   if(d.status==="DELIVERED"){
    const shipment=await tx.shipment.findFirst({where:{orderId:d.orderId,status:"DELIVERED"}});
    if(!shipment)throw new Error("SHIPMENT_NOT_DELIVERED");
   }
   if(d.status==="READY_TO_SHIP"){
    const production=await tx.productionJob.findUnique({where:{orderId:d.orderId},include:{order:{select:{kind:true,totalPaise:true,payments:{where:{status:"VERIFIED"},select:{amountPaise:true}},refunds:{where:{status:"SUCCEEDED"},select:{amountPaise:true}}}}}});
    if(!production||production.status!=="READY_FOR_DISPATCH"||!production.qcPassedAt)throw new Error("PRODUCTION_QC_REQUIRED");
    const captured=production.order.payments.reduce((sum,p)=>sum+p.amountPaise,0);
    const refunded=production.order.refunds.reduce((sum,r)=>sum+r.amountPaise,0);
    const paid=Math.max(0,captured-refunded);
    if(production.order.kind==="CUSTOM"&&paid<production.order.totalPaise)throw new Error("CUSTOM_BALANCE_DUE");
   }
   if(d.status==="CANCELLED"){
    const verified=await tx.payment.findFirst({where:{orderId:d.orderId,status:"VERIFIED"}});
    if(verified)throw new Error("PAYMENT_REQUIRES_REFUND");
    await restoreOrderInventory(tx, d.orderId, "Cancelled unpaid order — stock restored");
    const redemption=await tx.couponRedemption.findUnique({where:{orderId:d.orderId},select:{couponId:true}});
    if(redemption){
      await tx.couponRedemption.delete({where:{orderId:d.orderId}});
      await tx.coupon.update({where:{id:redemption.couponId},data:{usedCount:{decrement:1}}});
    }
    await tx.payment.updateMany({where:{orderId:d.orderId,status:{in:["CREATED","PENDING"]}},data:{status:"FAILED"}});
   }
   const updated=await tx.order.update({where:{id:d.orderId},data:{status:d.status}});
   await tx.orderStatusHistory.create({data:{orderId:d.orderId,status:d.status,note:d.note||"Status updated by administrator",actorId:auth.session!.userId}});
   await tx.auditLog.create({data:{actorId:auth.session!.userId,action:"ORDER_STATUS_UPDATED",entityType:"Order",entityId:d.orderId,metadata:{from:current.status,to:d.status}}});
   if (current.userId) {
    await enqueueJob("ORDER_STATUS_NOTIFICATION", {
     userId: current.userId,
     title: "Order status updated",
     message: `Your order status is now ${d.status.replaceAll("_", " ").toLowerCase()}.`,
     href: `/account/orders`,
    }, tx);
   }
   return updated;
  });
  return NextResponse.json({order:result});
 }catch(e){
  if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid update details."},{status:400});
  const code=e instanceof Error?e.message:"";
  if(code==="NOT_FOUND")return NextResponse.json({error:"Order not found."},{status:404});
  if(code==="INVALID_TRANSITION")return NextResponse.json({error:"This status transition is not allowed."},{status:409});
  if(code==="PAYMENT_REQUIRES_REFUND")return NextResponse.json({error:"A verified payment exists. Start the refund workflow; do not cancel this order directly."},{status:409});
  if(code==="INVENTORY_RESTORE_TARGET_MISSING")return NextResponse.json({error:"Stock could not be restored because its original inventory record is missing. Reconcile this order manually."},{status:409});
  if(code==="PAYMENT_NOT_VERIFIED")return NextResponse.json({error:"An order cannot be marked paid without a verified payment record."},{status:409});
  if(code==="SHIPMENT_NOT_DISPATCHED")return NextResponse.json({error:"Record a carrier pickup in the shipment workspace before marking the order shipped."},{status:409});
  if(code==="SHIPMENT_NOT_DELIVERED")return NextResponse.json({error:"Mark the shipment delivered in the shipment workspace before completing the order."},{status:409});
  if(code==="PRODUCTION_QC_REQUIRED")return NextResponse.json({error:"Complete the production job and pass quality inspection before marking ready to ship."},{status:409});
  if(code==="CUSTOM_BALANCE_DUE")return NextResponse.json({error:"Custom order balance must be fully paid before dispatch."},{status:409});
  if(code==="NO_CHANGE")return NextResponse.json({error:"Order already has this status."},{status:409});
  return NextResponse.json({error:"Could not update order."},{status:500});
 }
}
