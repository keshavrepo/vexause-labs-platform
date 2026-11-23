import { enforceRateLimit } from "@/lib/security/rate-limit";
import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireCustomer} from "@/lib/customer-session";
import {razorpayAuth} from "@/lib/payments/razorpay";
const schema=z.object({orderId:z.string().min(1)});
export async function POST(request:NextRequest){
  const rate = await enforceRateLimit(request, { namespace: "payment-order-create", limit: 15, windowMs: 3600000 });
  if (!rate.allowed) return rate.response;
 const auth=await requireCustomer(request);if(auth.response)return auth.response;
 try{
  const {orderId}=schema.parse(await request.json());
  const order=await prisma.order.findFirst({where:{id:orderId,userId:auth.userId!},include:{payments:{where:{method:"RAZORPAY"},orderBy:{createdAt:"desc"},take:1}}});
  if(!order)return NextResponse.json({error:"Order not found."},{status:404});
  if(order.paymentMethod!=="RAZORPAY")return NextResponse.json({error:"This order is not configured for online payment."},{status:409});
  const existing=order.payments[0];
  if(existing?.status==="VERIFIED" && order.kind!=="CUSTOM")return NextResponse.json({error:"This order is already paid."},{status:409});
  if(existing?.gatewayOrderId&&["CREATED","PENDING"].includes(existing.status))
    return NextResponse.json({keyId:process.env.RAZORPAY_KEY_ID,razorpayOrderId:existing.gatewayOrderId,amount:existing.amountPaise,currency:existing.currency,paymentId:existing.id});
  let amountPaise=order.totalPaise;
  if(order.kind==="CUSTOM"){
    if(!["AWAITING_PAYMENT","PAID","IN_PRODUCTION"].includes(order.status))return NextResponse.json({error:"This custom order is not open for payment."},{status:409});
    const verified=await prisma.payment.aggregate({where:{orderId:order.id,method:"RAZORPAY",status:"VERIFIED"},_sum:{amountPaise:true}});
    const refunded=await prisma.refund.aggregate({where:{orderId:order.id,status:"SUCCEEDED"},_sum:{amountPaise:true}});
    amountPaise=Math.max(0,order.totalPaise-(verified._sum.amountPaise||0)+(refunded._sum.amountPaise||0));
    if(amountPaise<=0)return NextResponse.json({error:"No outstanding balance is due."},{status:409});
  }else if(order.status!=="AWAITING_PAYMENT"){
    return NextResponse.json({error:"This order is not awaiting an online payment."},{status:409});
  }
  const {id,authorization}=razorpayAuth();
  const response=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:authorization,"Content-Type":"application/json"},body:JSON.stringify({amount:amountPaise,currency:"INR",receipt:order.orderCode,notes:{orderId:order.id,orderCode:order.orderCode}}),cache:"no-store"});
  const gateway=await response.json();
  if(!response.ok||!gateway.id)return NextResponse.json({error:"Payment provider could not create an order. Please retry or contact support."},{status:502});
  const payment=existing&&existing.status!=="VERIFIED"?await prisma.payment.update({where:{id:existing.id},data:{amountPaise,gatewayOrderId:gateway.id,gatewayPaymentId:null,gatewaySignature:null,verifiedAt:null,status:"CREATED"}}):await prisma.payment.create({data:{orderId:order.id,method:"RAZORPAY",status:"CREATED",amountPaise,gatewayOrderId:gateway.id}});
  return NextResponse.json({keyId:id,razorpayOrderId:gateway.id,amount:payment.amountPaise,currency:"INR",paymentId:payment.id});
 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid order."},{status:400});if(e instanceof Error&&e.message==="RAZORPAY_NOT_CONFIGURED")return NextResponse.json({error:"Razorpay keys are not configured."},{status:503});return NextResponse.json({error:"Could not start payment."},{status:500});}
}
