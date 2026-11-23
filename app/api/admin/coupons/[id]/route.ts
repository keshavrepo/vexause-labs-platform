import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";
const schema=z.object({isActive:z.boolean().optional(),description:z.string().max(200).nullable().optional(),expiresAt:z.string().datetime().nullable().optional()});
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){const a=await requireAdminApi(request);if(a.response)return a.response;const{id}=await params;try{const d=schema.parse(await request.json());const coupon=await prisma.coupon.update({where:{id},data:{...d,expiresAt:d.expiresAt===undefined?undefined:d.expiresAt?new Date(d.expiresAt):null}});await prisma.auditLog.create({data:{actorId:a.session!.userId,action:"COUPON_UPDATED",entityType:"Coupon",entityId:coupon.id,metadata:{isActive:coupon.isActive}}});return NextResponse.json({coupon});}catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid coupon update."},{status:400});return NextResponse.json({error:"Coupon not found or update failed."},{status:404});}}
