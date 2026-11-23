import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";
import { enqueueJob } from "@/lib/jobs";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request, { staffMethods: ["GET"] });
  if (auth.response) return auth.response;
  const requests = await prisma.customRequest.findMany({
    orderBy:{createdAt:"desc"},take:200,
    include:{user:{select:{name:true,email:true}},files:{select:{id:true,purpose:true,originalName:true,mimeType:true,sizeBytes:true,scanStatus:true,createdAt:true}},quotes:{orderBy:{createdAt:"desc"}}}
  });
  return NextResponse.json({requests});
}
const schema=z.object({
  requestId:z.string().min(1),
  status:z.enum(["UNDER_REVIEW","NEEDS_INFORMATION","QUOTED","ACCEPTED","REJECTED","CLOSED"]).optional(),
  designStatus:z.enum(["BRIEF_RECEIVED","DESIGNING","PREVIEW_READY","REVISION_REQUESTED","CUSTOMER_APPROVED","COMPLETED"]).optional(),
  adminNotes:z.string().max(4000).optional(),
  designNotes:z.string().max(4000).optional()
}).refine(d=>d.status!==undefined||d.designStatus!==undefined||d.adminNotes!==undefined||d.designNotes!==undefined);
export async function PATCH(request:NextRequest){
 const auth=await requireAdminApi(request, { staffMethods: ["GET"] });if(auth.response)return auth.response;
 try{
  const d=schema.parse(await request.json());
  const current=await prisma.customRequest.findUnique({where:{id:d.requestId}});
  if(!current)return NextResponse.json({error:"Request not found."},{status:404});
  const updated=await prisma.$transaction(async tx=>{
   const row=await tx.customRequest.update({where:{id:d.requestId},data:{
    ...(d.status?{status:d.status}:{}),...(d.designStatus?{designStatus:d.designStatus}:{}),
    ...(d.adminNotes!==undefined?{adminNotes:d.adminNotes}:{}),...(d.designNotes!==undefined?{designNotes:d.designNotes}:{})
   }});
   await tx.auditLog.create({data:{actorId:auth.session!.userId,action:"CUSTOM_PRINT_REQUEST_UPDATED",entityType:"CustomRequest",entityId:d.requestId,metadata:{status:d.status,designStatus:d.designStatus}}});
   if(current.userId && (d.status||d.designStatus)){
    await enqueueJob("SERVICE_REQUEST_NOTIFICATION",{userId:current.userId,title:"Custom 3D request update",message:`Your custom request ${current.requestCode} has a new update.`,href:"/account/custom-requests"},tx);
   }
   return row;
  });
  return NextResponse.json({request:updated});
 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid update details."},{status:400});return NextResponse.json({error:"Could not update request."},{status:500});}
}
