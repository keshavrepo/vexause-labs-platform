import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {verifyWebhookSignature} from "@/lib/payments/razorpay";
import { syncRefundCompletion } from "@/lib/refunds";
import { recordFinanceEntry } from "@/lib/finance-ledger";
import { ensureTaxInvoice } from "@/lib/tax-invoice";
export async function POST(request:NextRequest){
 const raw=await request.text();const signature=request.headers.get("x-razorpay-signature")||"";
 if(!verifyWebhookSignature(raw,signature))return NextResponse.json({error:"Invalid webhook signature."},{status:400});
 let event:any;try{event=JSON.parse(raw)}catch{return NextResponse.json({error:"Invalid JSON."},{status:400})}
 const eventId=request.headers.get("x-razorpay-event-id");
 if(!eventId)return NextResponse.json({error:"Missing event identifier."},{status:400});
 try{
  const refundSync: { orderId: string; paymentId: string }[] = [];
  await prisma.$transaction(async tx=>{
   const prior=await tx.paymentWebhookEvent.findUnique({where:{gatewayEventId:eventId}});
   if(prior)return;
   const entity=event?.payload?.payment?.entity;
   const gatewayOrderId=entity?.order_id;
   const gatewayPaymentId=entity?.id;
   const captured=event?.event==="payment.captured"||event?.event==="order.paid";
   const failed=event?.event==="payment.failed";
   const payment=gatewayOrderId?await tx.payment.findFirst({where:{gatewayOrderId,method:"RAZORPAY"}}):null;
   const saved=await tx.paymentWebhookEvent.create({data:{gatewayEventId:eventId,eventType:String(event?.event||"unknown"),payloadJson:event as any,processedAt:new Date(),paymentId:payment?.id}});
   if(failed&&payment&&!["VERIFIED","REFUND_PENDING"].includes(payment.status)){
    await tx.payment.update({where:{id:payment.id},data:{status:"FAILED",gatewayPaymentId:gatewayPaymentId||undefined}});
    await tx.auditLog.create({data:{action:"PAYMENT_FAILED_WEBHOOK",entityType:"Payment",entityId:payment.id,metadata:{eventId,eventType:event?.event,reason:String(entity?.error_description||entity?.error_reason||"Payment failed")}}});
   }
   const refundEntity=event?.payload?.refund?.entity;
   if((event?.event==="refund.processed"||event?.event==="refund.failed")&&refundEntity?.id){
    const refund=await tx.refund.findUnique({where:{gatewayRefundId:String(refundEntity.id)}});
    if(refund&&!["SUCCEEDED","FAILED"].includes(refund.status)){
     const nextStatus=event.event==="refund.processed"?"SUCCEEDED":"FAILED";
     await tx.refund.update({where:{id:refund.id},data:{status:nextStatus,gatewayStatus:String(refundEntity.status||nextStatus.toLowerCase()),failureReason:nextStatus==="FAILED"?String(refundEntity.error_description||"Refund failed at payment provider"):null,processedAt:nextStatus==="SUCCEEDED"?new Date():null}});
     refundSync.push({orderId:refund.orderId,paymentId:refund.paymentId});
     await tx.auditLog.create({data:{action:"REFUND_WEBHOOK_UPDATED",entityType:"Refund",entityId:refund.id,metadata:{eventId,eventType:event.event,status:nextStatus}}});
    }
   }
   if(captured&&payment&&!["VERIFIED","REFUND_PENDING"].includes(payment.status)&&payment.orderId&&Number(entity?.amount)===payment.amountPaise&&String(entity?.currency)==="INR"){
    const order=await tx.order.findUnique({where:{id:payment.orderId},select:{status:true}});
    const capturedAfterCancellation=order?.status==="CANCELLED";
    await tx.payment.update({where:{id:payment.id},data:{status:capturedAfterCancellation?"REFUND_PENDING":"VERIFIED",gatewayPaymentId:gatewayPaymentId||undefined,verifiedAt:new Date()}});
    await recordFinanceEntry(tx,{orderId:payment.orderId,paymentId:payment.id,type:"PAYMENT_CAPTURE",direction:"CREDIT",amountPaise:payment.amountPaise,referenceKey:`payment:${payment.id}:capture`,description:capturedAfterCancellation?"Razorpay capture confirmed after order cancellation":"Razorpay capture confirmed by signed webhook"});
    if(order?.status==="AWAITING_PAYMENT"){
     await tx.order.update({where:{id:payment.orderId},data:{status:"PAID"}});
     await ensureTaxInvoice(tx,payment.orderId);
     await tx.orderStatusHistory.create({data:{orderId:payment.orderId,status:"PAID",note:"Razorpay payment confirmed by signed webhook"}});
    }
    await tx.auditLog.create({data:{action:capturedAfterCancellation?"PAYMENT_CAPTURED_AFTER_CANCELLATION":"PAYMENT_WEBHOOK_VERIFIED",entityType:"Payment",entityId:payment.id,metadata:{eventId,eventType:event?.event,orderStatus:order?.status||"UNKNOWN"}}});
   }
   return saved;
  });
  for (const item of refundSync) await syncRefundCompletion(item.orderId,item.paymentId);
  return NextResponse.json({received:true});
 }catch(e){
  // A duplicate webhook can race on the unique gateway event id; provider may safely retry.
  return NextResponse.json({error:"Webhook processing failed; retry delivery."},{status:500});
 }
}
