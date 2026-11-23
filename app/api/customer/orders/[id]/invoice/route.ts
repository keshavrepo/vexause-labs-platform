import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireCustomer} from "@/lib/customer-session";
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){const auth=await requireCustomer(request);if(auth.response)return auth.response;const{id}=await params;const invoice=await prisma.taxInvoice.findFirst({where:{orderId:id,order:{userId:auth.userId}},include:{order:{select:{orderCode:true,status:true}}}});if(!invoice)return NextResponse.json({error:"Tax invoice is not available for this order yet."},{status:404});return NextResponse.json({invoice});}
