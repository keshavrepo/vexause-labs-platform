import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COOKIE = "vexause_customer_session";
function key() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
}
export async function setCustomerSession(userId:string) {
  const token=await new SignJWT({ kind:"customer" }).setProtectedHeader({alg:"HS256"}).setSubject(userId).setIssuedAt().setExpirationTime("30d").sign(key());
  const jar=await cookies();
  jar.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*30});
}
export async function getCustomerSession() {
  const jar=await cookies(); const token=jar.get(COOKIE)?.value; if(!token)return null;
  try { const {payload}=await jwtVerify(token,key()); if(payload.kind!=="customer"||!payload.sub)return null; return {userId:payload.sub}; } catch{return null;}
}
export async function requireCustomer(request:NextRequest) {
  const token=request.cookies.get(COOKIE)?.value;
  if(!token)return {userId:null,response:NextResponse.json({error:"Customer login required"},{status:401})};
  try {
    const {payload}=await jwtVerify(token,key());
    if(payload.kind!=="customer"||!payload.sub)return {userId:null,response:NextResponse.json({error:"Invalid session"},{status:401})};
    const user=await prisma.user.findUnique({where:{id:payload.sub},select:{id:true,role:true,isActive:true}});
    if(!user||!user.isActive||user.role!=="CUSTOMER")return {userId:null,response:NextResponse.json({error:"Session is no longer authorised"},{status:401})};
    return {userId:user.id,response:null};
  } catch{return {userId:null,response:NextResponse.json({error:"Session expired"},{status:401})};}
}
export async function clearCustomerSession() {
  const jar=await cookies(); jar.set(COOKIE,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});
}
