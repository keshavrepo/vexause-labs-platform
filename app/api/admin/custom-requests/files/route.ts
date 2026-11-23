import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";
export async function PATCH(request:NextRequest){
 const auth=await requireAdminApi(request);if(auth.response)return auth.response;
 try{
  const d=z.object({fileId:z.string().min(1),scanStatus:z.enum(["CLEAN","REJECTED"])}).parse(await request.json());
  const result=await prisma.customRequestFile.updateMany({where:{id:d.fileId},data:{scanStatus:d.scanStatus}});
  if(!result.count)return NextResponse.json({error:"File not found."},{status:404});
  await prisma.auditLog.create({data:{actorId:auth.session!.userId,action:"CUSTOM_FILE_SCAN_REVIEWED",entityType:"CustomRequestFile",entityId:d.fileId,metadata:{scanStatus:d.scanStatus}}});
  return NextResponse.json({success:true});
 }catch{return NextResponse.json({error:"Invalid file review."},{status:400});}
}
