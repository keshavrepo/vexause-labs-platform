import { enforceRateLimit } from "@/lib/security/rate-limit";
import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireCustomer} from "@/lib/customer-session";
import {verifyCheckoutSignature,fetchCapturedPayment} from "@/lib/payments/razorpay";
import { recordFinanceEntry } from "@/lib/finance-ledger";
import { ensureTaxInvoice } from "@/lib/tax-invoice";
const schema=z.object({razorpay_order_id:z.string().min(1),razorpay_payment_id:z.string().min(1),razorpay_signature:z.string().min(1)});
export async function POST(request:NextRequest){
  const rate = await enforceRateLimit(request, { namespace: "payment-verify", limit: 30, windowMs: 3600000 });
  if (!rate.allowed) return rate.response;
 const auth=await requireCustomer(request);if(auth.response)return auth.response;
 try{
  const d=schema.parse(await request.json());
  if(!verifyCheckoutSignature(d.razorpay_order_id,d.razorpay_payment_id,d.razorpay_signature))return NextResponse.json({error:"Payment signature verification failed."},{status:400});
  let gatewayPayment;
  try { gatewayPayment=await fetchCapturedPayment(d.razorpay_payment_id); }
  catch { return NextResponse.json({error:"Payment provider could not be reached. The payment will be reconciled by webhook; please do not pay again yet."},{status:503}); }
  if(!gatewayPayment || gatewayPayment.status!=="captured" || gatewayPayment.id!==d.razorpay_payment_id ||
     gatewayPayment.order_id!==d.razorpay_order_id || gatewayPayment.currency!=="INR")
    return NextResponse.json({error:"Payment is not confirmed as captured by the payment provider."},{status:409});
  const result=await prisma.$transaction(async tx=>{
   const payment=await tx.payment.findFirst({where:{gatewayOrderId:d.razorpay_order_id,method:"RAZORPAY"},include:{order:true}});
   if(!payment||payment.order.userId!==auth.userId)throw new Error("PAYMENT_NOT_FOUND");
   if(payment.gatewayOrderId!==gatewayPayment.order_id || payment.amountPaise!==gatewayPayment.amount || payment.currency!==gatewayPayment.currency)
     throw new Error("PAYMENT_DETAILS_MISMATCH");
   if(payment.status==="VERIFIED")return {orderId:payment.orderId,alreadyVerified:true};
   const customBalancePayment=payment.order.kind==="CUSTOM"&&["PAID","IN_PRODUCTION"].includes(payment.order.status);
   if(payment.order.status!=="AWAITING_PAYMENT"&&!customBalancePayment)throw new Error("ORDER_NOT_PAYABLE");
   const verifiedAt = new Date();
   await tx.payment.update({where:{id:payment.id},data:{gatewayPaymentId:d.razorpay_payment_id,gatewaySignature:d.razorpay_signature,status:"VERIFIED",verifiedAt}});
   await recordFinanceEntry(tx,{orderId:payment.orderId,paymentId:payment.id,type:"PAYMENT_CAPTURE",direction:"CREDIT",amountPaise:payment.amountPaise,referenceKey:`payment:${payment.id}:capture`,description:"Razorpay payment verified",recordedAt:verifiedAt});
   if(payment.order.status==="AWAITING_PAYMENT"){
    await tx.order.update({where:{id:payment.orderId},data:{status:"PAID"}});
    await tx.orderStatusHistory.create({data:{orderId:payment.orderId,status:"PAID",note:"Razorpay payment signature verified"}});
   } else {
    await tx.orderStatusHistory.create({data:{orderId:payment.orderId,status:payment.order.status,note:`Custom order balance payment of ₹${(payment.amountPaise/100).toFixed(2)} verified.`}});
   }
   await ensureTaxInvoice(tx,payment.orderId);
   await tx.auditLog.create({data:{actorId:auth.userId!,action:customBalancePayment?"CUSTOM_BALANCE_PAYMENT_VERIFIED":"PAYMENT_VERIFIED",entityType:"Payment",entityId:payment.id,metadata:{gatewayPaymentId:d.razorpay_payment_id,amountPaise:payment.amountPaise}}});
   return {orderId:payment.orderId,alreadyVerified:false};
  });
  return NextResponse.json({verified:true,...result});
 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid payment response."},{status:400});const c=e instanceof Error?e.message:"";if(c==="PAYMENT_NOT_FOUND")return NextResponse.json({error:"Payment record not found."},{status:404});if(c==="ORDER_NOT_PAYABLE")return NextResponse.json({error:"Order is not awaiting payment."},{status:409});if(c==="PAYMENT_DETAILS_MISMATCH")return NextResponse.json({error:"Captured payment details do not match this order."},{status:409});return NextResponse.json({error:"Could not verify payment."},{status:500});}
}
