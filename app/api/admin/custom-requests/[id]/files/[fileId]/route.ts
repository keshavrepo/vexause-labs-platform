import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";
import { readPrivateUpload } from "@/lib/private-storage";

export const runtime="nodejs";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string;fileId:string}>}){
 const auth=await requireAdminApi(request, { allowStaff: true });if(auth.response)return auth.response;
 const {id,fileId}=await params;
 const file=await prisma.customRequestFile.findFirst({where:{id:fileId,customRequestId:id}});
 if(!file)return NextResponse.json({error:"File not found."},{status:404});
 if(file.scanStatus!=="CLEAN")return NextResponse.json({error:"File is awaiting security review and cannot be downloaded."},{status:423});
 try{
  const data=await readPrivateUpload(file.storageKey);
  return new NextResponse(new Uint8Array(data),{headers:{
   "Content-Type":"application/octet-stream","Content-Length":String(data.length),
   "Content-Disposition":`attachment; filename="${file.originalName.replace(/[^a-zA-Z0-9._-]/g,"_")}"`,
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"
  }});
 }catch{return NextResponse.json({error:"Private file unavailable."},{status:404});}
}
