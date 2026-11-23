import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";
import {randomBytes} from "node:crypto";
import {enqueueJob} from "@/lib/jobs";
const schema=z.object({
 requestId:z.string().min(1),subtotalPaise:z.number().int().min(0).max(100000000),
 shippingPaise:z.number().int().min(0).max(10000000).default(0),
 taxPaise:z.number().int().min(0).max(10000000).default(0),
 advancePaise:z.number().int().min(0).max(100000000),
 validUntil:z.string().datetime().optional(),customerMessage:z.string().max(2000).optional()
}).refine(d=>d.subtotalPaise+d.shippingPaise+d.taxPaise>0).refine(d=>d.advancePaise<=d.subtotalPaise+d.shippingPaise+d.taxPaise);
export async function POST(request:NextRequest){
 const auth=await requireAdminApi(request);if(auth.response)return auth.response;
 try{
  const d=schema.parse(await request.json());
  const item=await prisma.customRequest.findUnique({where:{id:d.requestId}});
  if(!item)return NextResponse.json({error:"Request not found."},{status:404});
  const totalPaise=d.subtotalPaise+d.shippingPaise+d.taxPaise;
  const quote=await prisma.$transaction(async tx=>{
   const row=await tx.quote.create({data:{
    quoteCode:`VQ-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`,
    customRequestId:item.id,status:"SENT",subtotalPaise:d.subtotalPaise,shippingPaise:d.shippingPaise,taxPaise:d.taxPaise,totalPaise,advancePaise:d.advancePaise,
    validUntil:d.validUntil?new Date(d.validUntil):null,customerMessage:d.customerMessage||null
   }});
   await tx.customRequest.update({where:{id:item.id},data:{status:"QUOTED"}});
   if(item.userId)await enqueueJob("SERVICE_REQUEST_NOTIFICATION",{userId:item.userId,title:"Your custom 3D quote is ready",message:`A quotation is ready for request ${item.requestCode}.`,href:"/account/custom-requests"},tx);
   await tx.auditLog.create({data:{actorId:auth.session!.userId,action:"CUSTOM_PRINT_QUOTE_SENT",entityType:"Quote",entityId:row.id,metadata:{requestId:item.id,totalPaise}}});
   return row;
  });
  return NextResponse.json({quote},{status:201});
 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid quotation details.",details:e.flatten()},{status:400});return NextResponse.json({error:"Could not create quotation."},{status:500});}
}
