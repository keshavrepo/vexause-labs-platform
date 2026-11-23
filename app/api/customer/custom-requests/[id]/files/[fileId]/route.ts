import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireCustomer} from "@/lib/customer-session";
import {readPrivateUpload} from "@/lib/private-storage";
export const runtime="nodejs";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string;fileId:string}>}){
 const auth=await requireCustomer(request);if(auth.response)return auth.response;
 const {id,fileId}=await params;
 const row=await prisma.customRequest.findFirst({where:{id,userId:auth.userId!,designStatus:{in:["PREVIEW_READY","CUSTOMER_APPROVED"]}},select:{id:true}});
 if(!row)return NextResponse.json({error:"File not found."},{status:404});
 const file=await prisma.customRequestFile.findFirst({where:{id:fileId,customRequestId:row.id,purpose:"DESIGN_DELIVERABLE",scanStatus:"CLEAN"}});
 if(!file)return NextResponse.json({error:"Preview not available."},{status:404});
 try{const data=await readPrivateUpload(file.storageKey);return new NextResponse(new Uint8Array(data),{headers:{"Content-Type":"application/octet-stream","Content-Length":String(data.length),"Content-Disposition":`attachment; filename="${file.originalName.replace(/[^a-zA-Z0-9._-]/g,"_")}"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}catch{return NextResponse.json({error:"File unavailable."},{status:404});}
}
