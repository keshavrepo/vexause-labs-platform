import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";
import {storePrivateUpload} from "@/lib/private-storage";
import {enqueueJob} from "@/lib/jobs";
import {randomBytes} from "node:crypto";
export const runtime="nodejs";
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const auth=await requireAdminApi(request, { allowStaff: true });if(auth.response)return auth.response;
 const {id}=await params;
 const item=await prisma.customRequest.findUnique({where:{id}});
 if(!item)return NextResponse.json({error:"Request not found."},{status:404});
 const form=await request.formData();const file=form.get("file");
 if(!(file instanceof File)||file.size<1||file.size>25*1024*1024)return NextResponse.json({error:"Choose a file up to 25 MB."},{status:400});
 const ext=file.name.toLowerCase().split(".").pop();
 if(!["stl","obj","3mf","step","stp","pdf","png","jpg","jpeg"].includes(ext||""))return NextResponse.json({error:"Unsupported design deliverable format."},{status:400});
 const stored=await storePrivateUpload(file,"custom-requests");
 const saved=await prisma.customRequestFile.create({data:{customRequestId:item.id,purpose:"DESIGN_DELIVERABLE",originalName:file.name.slice(0,180),storageKey:stored.storageKey,mimeType:file.type||"application/octet-stream",sizeBytes:stored.sizeBytes,scanStatus:"PENDING"}});
 await prisma.customRequest.update({where:{id:item.id},data:{designStatus:"PREVIEW_READY"}});
 if(item.userId)await prisma.backgroundJob.create({data:{type:"SERVICE_REQUEST_NOTIFICATION",payload:{userId:item.userId,title:"Your 3D design preview is ready",message:`A design preview is ready for request ${item.requestCode}. Sign in to review it.`,href:"/account/custom-requests"}}});
 await prisma.auditLog.create({data:{actorId:auth.session!.userId,action:"CUSTOM_DESIGN_DELIVERABLE_UPLOADED",entityType:"CustomRequestFile",entityId:saved.id,metadata:{requestId:item.id}}});
 return NextResponse.json({file:{id:saved.id,originalName:saved.originalName,scanStatus:saved.scanStatus},message:"Preview uploaded. Mark it CLEAN after malware scanning to enable customer download."},{status:201});
}
