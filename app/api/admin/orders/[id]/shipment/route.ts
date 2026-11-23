import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";
import { enqueueJob } from "@/lib/jobs";

const schema=z.object({
 carrier:z.string().trim().min(2).max(80),
 trackingNumber:z.string().trim().min(3).max(100),
 trackingUrl:z.string().url().max(500).refine(v=>v.startsWith("https://")||v.startsWith("http://"),"Tracking URL must use HTTP or HTTPS"),
 status:z.enum(["LABEL_CREATED","PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED","EXCEPTION"]).default("LABEL_CREATED")
});
const shipmentTransitions:Record<string,string[]> = {
 LABEL_CREATED:["PICKED_UP","EXCEPTION"],
 PICKED_UP:["IN_TRANSIT","EXCEPTION"],
 IN_TRANSIT:["OUT_FOR_DELIVERY","EXCEPTION"],
 OUT_FOR_DELIVERY:["DELIVERED","IN_TRANSIT","EXCEPTION"],
 EXCEPTION:["PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY"],
 DELIVERED:[]
};
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await requireAdminApi(request, { allowStaff: true });if(auth.response)return auth.response;
 try{
  const {id}=await params;
  const d=schema.parse(await request.json());
  const result=await prisma.$transaction(async tx=>{
   const order=await tx.order.findUnique({where:{id},select:{id:true,orderCode:true,status:true,userId:true}});
   if(!order)throw new Error("ORDER_NOT_FOUND");
   if(!["READY_TO_SHIP","SHIPPED","DELIVERED"].includes(order.status))throw new Error("ORDER_NOT_READY");
   const existing=await tx.shipment.findFirst({where:{orderId:order.id},orderBy:{shippedAt:"desc"}});
   const previous=existing?.status||null;
   if(!previous&&d.status!=="LABEL_CREATED")throw new Error("LABEL_REQUIRED");
   if(previous&&previous!==d.status&&!(shipmentTransitions[previous]||[]).includes(d.status))throw new Error("INVALID_SHIPMENT_TRANSITION");
   if(order.status==="READY_TO_SHIP"&&["OUT_FOR_DELIVERY","DELIVERED"].includes(d.status))throw new Error("SHIPMENT_NOT_DISPATCHED");
   if(order.status==="SHIPPED"&&d.status==="LABEL_CREATED")throw new Error("SHIPMENT_ALREADY_DISPATCHED");
   if(order.status==="DELIVERED"&&d.status!=="DELIVERED")throw new Error("ORDER_ALREADY_DELIVERED");
   const now=new Date();
   const hasShipped=["PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED"].includes(d.status);
   const shipment=existing
    ? await tx.shipment.update({where:{id:existing.id},data:{carrier:d.carrier,trackingNumber:d.trackingNumber,trackingUrl:d.trackingUrl,status:d.status,shippedAt:existing.shippedAt||(hasShipped?now:undefined),deliveredAt:d.status==="DELIVERED"?now:null}})
    : await tx.shipment.create({data:{orderId:order.id,carrier:d.carrier,trackingNumber:d.trackingNumber,trackingUrl:d.trackingUrl,status:d.status,shippedAt:hasShipped?now:null,deliveredAt:d.status==="DELIVERED"?now:null}});
   let nextOrderStatus=order.status;
   if(hasShipped&&order.status==="READY_TO_SHIP")nextOrderStatus="SHIPPED";
   if(d.status==="DELIVERED"&&order.status==="SHIPPED")nextOrderStatus="DELIVERED";
   if(nextOrderStatus!==order.status){
    const changed=await tx.order.updateMany({where:{id:order.id,status:order.status},data:{status:nextOrderStatus}});
    if(changed.count!==1)throw new Error("ORDER_STATE_CHANGED");
    await tx.orderStatusHistory.create({data:{orderId:order.id,status:nextOrderStatus,note:d.status==="DELIVERED"?"Shipment marked delivered":"Shipment handed to carrier",actorId:auth.session!.userId}});
    await enqueueJob("ORDER_STATUS_NOTIFICATION",{userId:order.userId,title:nextOrderStatus==="DELIVERED"?"Order delivered":"Order shipped",message:nextOrderStatus==="DELIVERED"?`Your order ${order.orderCode} has been marked delivered.`:`Your order ${order.orderCode} has been handed to the carrier. Tracking details are available in your account.`,href:`/account/orders/${order.id}`},tx);
   }
   await tx.auditLog.create({data:{actorId:auth.session!.userId,action:"SHIPMENT_UPDATED",entityType:"Shipment",entityId:shipment.id,metadata:{orderId:order.id,carrier:d.carrier,trackingNumber:d.trackingNumber,from:previous,to:d.status}}});
   return shipment;
  });
  return NextResponse.json({shipment:result},{status:201});
 }catch(e){
  if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid shipment details.",details:e.flatten()},{status:400});
  const code=e instanceof Error?e.message:"";
  if(code==="ORDER_NOT_FOUND")return NextResponse.json({error:"Order not found."},{status:404});
  if(code==="ORDER_NOT_READY")return NextResponse.json({error:"Only orders ready to ship, shipped, or delivered can receive tracking details."},{status:409});
  if(code==="LABEL_REQUIRED")return NextResponse.json({error:"Create a shipment label before recording carrier pickup."},{status:409});
  if(code==="INVALID_SHIPMENT_TRANSITION")return NextResponse.json({error:"That shipment status transition is not allowed."},{status:409});
  if(code==="SHIPMENT_NOT_DISPATCHED")return NextResponse.json({error:"Record carrier pickup before marking the parcel out for delivery or delivered."},{status:409});
  if(code==="SHIPMENT_ALREADY_DISPATCHED")return NextResponse.json({error:"A dispatched shipment cannot return to label-created status."},{status:409});
  if(code==="ORDER_ALREADY_DELIVERED")return NextResponse.json({error:"A delivered order cannot be moved back to an earlier shipment status."},{status:409});
  if(code==="ORDER_STATE_CHANGED")return NextResponse.json({error:"The order changed while the shipment update was processing. Refresh and try again."},{status:409});
  return NextResponse.json({error:"Could not save shipment details."},{status:500});
 }
}
