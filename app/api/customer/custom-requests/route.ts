import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireCustomer} from "@/lib/customer-session";
import {z} from "zod";
import {randomBytes} from "node:crypto";
export async function GET(request:NextRequest){
 const auth=await requireCustomer(request);if(auth.response)return auth.response;
 const requests=await prisma.customRequest.findMany({where:{userId:auth.userId!},orderBy:{createdAt:"desc"},include:{
  files:{select:{id:true,purpose:true,originalName:true,sizeBytes:true,scanStatus:true}},
  quotes:{orderBy:{createdAt:"desc"},select:{id:true,quoteCode:true,status:true,subtotalPaise:true,shippingPaise:true,taxPaise:true,totalPaise:true,advancePaise:true,validUntil:true,customerMessage:true}},
 }});
 return NextResponse.json({requests},{headers:{"Cache-Control":"no-store"}});
}
export async function PATCH(request:NextRequest){
 const auth=await requireCustomer(request);if(auth.response)return auth.response;
 try{
  const d=z.object({requestId:z.string().min(1),action:z.enum(["APPROVE_DESIGN","REQUEST_REVISION","ACCEPT_QUOTE"]),quoteId:z.string().optional()}).parse(await request.json());
  const current=await prisma.customRequest.findFirst({where:{id:d.requestId,userId:auth.userId!}});
  if(!current)return NextResponse.json({error:"Request not found."},{status:404});
  if(d.action==="ACCEPT_QUOTE"){
   if(!d.quoteId)return NextResponse.json({error:"Quote selection required."},{status:400});
   const result=await prisma.$transaction(async tx=>{
    const quote=await tx.quote.findFirst({where:{id:d.quoteId,customRequestId:current.id}});
    if(!quote)throw new Error("QUOTE_UNAVAILABLE");
    const existing=await tx.order.findFirst({where:{quoteId:quote.id},select:{id:true,orderCode:true,status:true,totalPaise:true}});
    if(existing)return {quote,order:existing,created:false};
    if(quote.status!=="SENT"||(quote.validUntil&&quote.validUntil<new Date()))throw new Error("QUOTE_UNAVAILABLE");
    const payablePaise=quote.advancePaise>0?quote.advancePaise:quote.totalPaise;
    const orderCode=`VX-C-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const order=await tx.order.create({data:{
     orderCode,userId:auth.userId!,customRequestId:current.id,quoteId:quote.id,kind:"CUSTOM",
     status:"AWAITING_PAYMENT",subtotalPaise:quote.subtotalPaise,shippingPaise:quote.shippingPaise,taxPaise:quote.taxPaise,
     totalPaise:quote.totalPaise,paymentMethod:"RAZORPAY",codEligible:false,
     customerNotes:`Custom request ${current.requestCode}. ${quote.customerMessage||""}`,
     items:{create:{productName:`Custom 3D printing — ${current.requestCode}`,quantity:current.quantity,unitPricePaise:quote.totalPaise,lineTotalPaise:quote.totalPaise}},
     payments:{create:{method:"RAZORPAY",status:"CREATED",amountPaise:payablePaise}},
     statusHistory:{create:{status:"AWAITING_PAYMENT",note:`Customer accepted quote ${quote.quoteCode}. Initial payment due: ₹${(payablePaise/100).toFixed(2)}.`}}
    },select:{id:true,orderCode:true,status:true,totalPaise:true}});
    await tx.quote.update({where:{id:quote.id},data:{status:"ACCEPTED"}});
    await tx.customRequest.update({where:{id:current.id},data:{status:"ACCEPTED"}});
    await tx.auditLog.create({data:{actorId:auth.userId!,action:"CUSTOM_QUOTE_ACCEPTED_ORDER_CREATED",entityType:"Order",entityId:order.id,metadata:{requestId:current.id,quoteId:quote.id,payablePaise,totalPaise:quote.totalPaise}}});
    return {quote,order,created:true,payablePaise};
   },{isolationLevel:"Serializable"});
   return NextResponse.json({quote:result.quote,order:result.order,created:result.created,payablePaise:(result as any).payablePaise||null,message:"Quotation accepted and custom order created. Open the order to arrange the initial payment."});
  }
  if(current.designStatus!=="PREVIEW_READY")return NextResponse.json({error:"There is no design preview awaiting your decision."},{status:409});
  const updated=await prisma.customRequest.update({where:{id:d.requestId},data:d.action==="APPROVE_DESIGN"?{designStatus:"CUSTOMER_APPROVED",customerApprovedAt:new Date()}:{designStatus:"REVISION_REQUESTED",revisionCount:{increment:1}}});
  return NextResponse.json({request:updated});
 }catch(e){if(e instanceof Error&&e.message==="QUOTE_UNAVAILABLE")return NextResponse.json({error:"This quotation is unavailable or expired."},{status:409});return NextResponse.json({error:"Invalid design decision."},{status:400});}
}
