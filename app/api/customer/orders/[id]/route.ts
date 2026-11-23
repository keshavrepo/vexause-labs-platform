import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-session";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth=await requireCustomer(request); if(auth.response)return auth.response;
  const { id } = await params;
  const order=await prisma.order.findFirst({where:{id,userId:auth.userId!},include:{
    items:true,quote:{select:{quoteCode:true,totalPaise:true,advancePaise:true,customerMessage:true}},payments:{select:{id:true,method:true,status:true,amountPaise:true,verifiedAt:true,createdAt:true}},refunds:{select:{id:true,status:true,amountPaise:true}},address:{select:{fullName:true,phone:true,line1:true,line2:true,city:true,state:true,postalCode:true,country:true}},
    invoice:{select:{id:true,invoiceNumber:true}},shipments:true,statusHistory:{orderBy:{createdAt:"asc"},select:{status:true,note:true,createdAt:true}}
  }});
  if(!order)return NextResponse.json({error:"Order not found."},{status:404});
  return NextResponse.json({order});
}
