import { enforceRateLimit } from "@/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customer-session";
import { storePrivateUpload } from "@/lib/private-storage";

export const runtime = "nodejs";
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const text = (v: FormDataEntryValue | null) => typeof v === "string" ? v.trim() : "";

function signatureOk(bytes: Buffer, purpose: string, name: string) {
  const ext = name.toLowerCase().split(".").pop();
  if (purpose === "MODEL") {
    if (ext === "stl") {
      if (bytes.length < 84) return false;
      const ascii = bytes.toString("utf8",0,Math.min(bytes.length,512)).trimStart().startsWith("solid") && bytes.toString("utf8",0,Math.min(bytes.length,4096)).includes("facet");
      if (ascii) return true;
      const triangles = bytes.readUInt32LE(80);
      return 84 + triangles * 50 === bytes.length;
    }
    if (ext === "obj") return /(^|\n)\s*(v|vt|vn|f)\s+/.test(bytes.toString("utf8",0,Math.min(bytes.length,10000)));
    if (ext === "3mf") return bytes.subarray(0,2).toString() === "PK";
    return false;
  }
  if (ext === "jpg" || ext === "jpeg") return bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff;
  if (ext === "png") return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (ext === "webp") return bytes.subarray(0,4).toString()==="RIFF" && bytes.subarray(8,12).toString()==="WEBP";
  if (ext === "pdf") return bytes.subarray(0,5).toString()==="%PDF-";
  return false;
}

export async function POST(request: NextRequest) {
  const rate = await enforceRateLimit(request, { namespace: "custom-print-request", limit: 5, windowMs: 3600000 });
  if (!rate.allowed) return rate.response;
  try {
    const form = await request.formData();
    const requestType = z.enum(["PRINT_FROM_FILE","DESIGN_AND_PRINT","DESIGN_ONLY"]).parse(text(form.get("requestType")) || "PRINT_FROM_FILE");
    const name = text(form.get("name")), email = text(form.get("email")).toLowerCase(), phone = text(form.get("phone"));
    const description = text(form.get("description"));
    const quantity = Number(text(form.get("quantity")) || "1");
    const intendedUse = text(form.get("intendedUse"));
    const dimensions = text(form.get("dimensions"));
    const materialPreference = text(form.get("materialPreference"));
    const colourPreference = text(form.get("colourPreference"));
    const budget = text(form.get("budget"));
    const deadlineText = text(form.get("deadline"));
    const parsed = z.object({
      name:z.string().min(2).max(100), email:z.string().email().max(254),
      phone:z.string().min(7).max(24), description:z.string().min(15).max(5000),
      quantity:z.number().int().min(1).max(500), intendedUse:z.string().max(1500),
      dimensions:z.string().max(200), materialPreference:z.string().max(80), colourPreference:z.string().max(80),
      budget:z.string().max(40).refine(v=>!v || (Number.isFinite(Number(v)) && Number(v)>=0)), deadline:z.string().max(40).refine(v=>!v || !Number.isNaN(Date.parse(v)))
    }).safeParse({name,email,phone,description,quantity,intendedUse,dimensions,materialPreference,colourPreference,budget,deadline:deadlineText});
    if (!parsed.success) return NextResponse.json({error:"Please check the required details.",details:parsed.error.flatten()},{status:400});
    if (requestType === "PRINT_FROM_FILE" && !form.getAll("modelFiles").some(x=>x instanceof File && x.size>0))
      return NextResponse.json({error:"Please attach at least one 3D model file for print-from-file requests."},{status:400});
    const files = [...form.getAll("modelFiles"),...form.getAll("referenceFiles")].filter((x):x is File=>x instanceof File&&x.size>0);
    if(files.length>8) return NextResponse.json({error:"Maximum 8 files are allowed."},{status:400});
    for(const file of files) if(file.size>MAX_FILE_BYTES) return NextResponse.json({error:"Each file must be 25 MB or smaller."},{status:400});
    const user = await getCustomerSession();
    const requestCode = `VX-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
    const created = await prisma.customRequest.create({data:{
      requestCode,userId:user?.userId,guestName:name,guestEmail:email,guestPhone:phone,description,quantity,
      requestType,intendedUse:intendedUse||null,dimensions:dimensions||null,
      materialPreference:materialPreference||null,colourPreference:colourPreference||null,
      budgetPaise: budget ? Math.round(Number(budget)*100) : null,
      deadline: deadlineText ? new Date(deadlineText) : null,
      designStatus: requestType==="PRINT_FROM_FILE" ? "NOT_REQUIRED" : "BRIEF_RECEIVED",
      files:{create:[]}
    },select:{id:true,requestCode:true,status:true,createdAt:true}});
    try {
      for (const file of files) {
        const isModel = form.getAll("modelFiles").includes(file);
        const purpose = isModel ? "MODEL" : "REFERENCE";
        const bytes = Buffer.from(await file.arrayBuffer());
        if (!signatureOk(bytes,purpose,file.name)) throw new Error(`FILE_TYPE:${file.name}`);
        const stored = await storePrivateUpload(file,"custom-requests");
        await prisma.customRequestFile.create({data:{
          customRequestId:created.id,purpose,originalName:file.name.slice(0,180),
          storageKey:stored.storageKey,mimeType:file.type||"application/octet-stream",sizeBytes:stored.sizeBytes,scanStatus:"PENDING"
        }});
      }
    } catch (error) {
      await prisma.customRequest.delete({where:{id:created.id}});
      const msg=error instanceof Error?error.message:"";
      return NextResponse.json({error:msg.startsWith("FILE_TYPE:")?`Unsupported or invalid file: ${msg.slice(10)}`:"Could not securely store uploaded files."},{status:400});
    }
    return NextResponse.json({request:created,message:"Request received. Our team will review the brief and contact you with next steps."},{status:201});
  } catch (error) {
    if(error instanceof z.ZodError) return NextResponse.json({error:"Invalid request type."},{status:400});
    console.error("Custom request submission failed",error);
    return NextResponse.json({error:"Unable to submit request right now."},{status:500});
  }
}
