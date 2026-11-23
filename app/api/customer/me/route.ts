import {NextRequest,NextResponse} from "next/server";import {requireCustomer} from "@/lib/customer-session";import {prisma} from "@/lib/prisma";
export async function GET(request:NextRequest){
 const auth=await requireCustomer(request);if(auth.response)return auth.response;
 const user=await prisma.user.findUnique({where:{id:auth.userId!},select:{id:true,name:true,email:true,phone:true,createdAt:true}});
 if(!user)return NextResponse.json({error:"Account not found"},{status:404});
 return NextResponse.json({user});
}
