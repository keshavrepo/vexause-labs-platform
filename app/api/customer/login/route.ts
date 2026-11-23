import { enforceRateLimit } from "@/lib/security/rate-limit";
import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";import bcrypt from "bcryptjs";
import {prisma} from "@/lib/prisma";import {setCustomerSession} from "@/lib/customer-session";
const schema=z.object({email:z.string().email().max(254),password:z.string().min(1).max(128)});
export async function POST(request:NextRequest){
  const rate = await enforceRateLimit(request, { namespace: "customer-login", limit: 10, windowMs: 900000 });
  if (!rate.allowed) return rate.response;
 try{
  const input=schema.parse(await request.json());const user=await prisma.user.findUnique({where:{email:input.email.toLowerCase()}});
  if(!user||!user.isActive||user.role!=="CUSTOMER"||!(await bcrypt.compare(input.password,user.passwordHash)))return NextResponse.json({error:"Invalid email or password."},{status:401});
  await setCustomerSession(user.id);return NextResponse.json({user:{id:user.id,name:user.name,email:user.email,phone:user.phone}});
 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid login details."},{status:400});console.error(e);return NextResponse.json({error:"Unable to sign in."},{status:500});}
}
