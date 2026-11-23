import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";
export async function GET(request:NextRequest){
 const auth=await requireAdminApi(request);if(auth.response)return auth.response;
 const payments=await prisma.payment.findMany({orderBy:{createdAt:"desc"},take:200,include:{order:{select:{id:true,orderCode:true,status:true,totalPaise:true,user:{select:{name:true,email:true}}}},webhookEvents:{orderBy:{createdAt:"desc"},take:3,select:{eventType:true,processedAt:true,createdAt:true}}}});
 return NextResponse.json({payments});
}
