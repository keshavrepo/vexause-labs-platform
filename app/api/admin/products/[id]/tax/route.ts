import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";
const schema=z.object({hsnCode:z.string().trim().max(8).nullable(),gstRateBps:z.number().int().min(0).max(2800)});
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){const auth=await requireAdminApi(request);if(auth.response)return auth.response;const{id}=await params;try{const d=schema.parse(await request.json());const product=await prisma.product.update({where:{id},data:{hsnCode:d.hsnCode||null,gstRateBps:d.gstRateBps}});await prisma.auditLog.create({data:{actorId:auth.session!.userId,action:"PRODUCT_TAX_UPDATED",entityType:"Product",entityId:product.id,metadata:{hsnCode:product.hsnCode,gstRateBps:product.gstRateBps}}});return NextResponse.json({product:{id:product.id,hsnCode:product.hsnCode,gstRateBps:product.gstRateBps}});}catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Provide an HSN code and GST rate from 0% to 28%."},{status:400});return NextResponse.json({error:"Could not update product tax details."},{status:404});}}
