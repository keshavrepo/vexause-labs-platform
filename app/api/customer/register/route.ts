import { enforceRateLimit } from "@/lib/security/rate-limit";
import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setCustomerSession } from "@/lib/customer-session";
import { createOneTimeToken, siteUrl } from "@/lib/auth-tokens";

const schema=z.object({name:z.string().trim().min(2).max(100),email:z.string().email().max(254),phone:z.string().trim().min(7).max(24).optional(),password:z.string().min(10).max(128)});
export async function POST(request:NextRequest){
 const rate = await enforceRateLimit(request, { namespace: "customer-register", limit: 5, windowMs: 3600000 });
 if (!rate.allowed) return rate.response;
 try{
  const input=schema.parse(await request.json());const email=input.email.toLowerCase();
  const existing=await prisma.user.findUnique({where:{email}});
  if(existing)return NextResponse.json({error:"An account with this email already exists."},{status:409});
  const passwordHash=await bcrypt.hash(input.password,12);
  const user=await prisma.user.create({data:{name:input.name,email,phone:input.phone,passwordHash,role:"CUSTOMER"}});
  // Verification is sent only when a canonical site URL is configured; login is not blocked
  // until the operator explicitly enables an email-verification policy after delivery tests.
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const { token, tokenHash } = createOneTimeToken();
    const url = new URL("/account/verify-email", siteUrl());
    url.searchParams.set("token", token);
    await prisma.$transaction(async tx => {
      await tx.emailVerificationToken.create({ data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
      await tx.backgroundJob.create({ data: { type: "EMAIL_DELIVERY", payload: {
        to: user.email, subject: "Verify your VEXAUSE LABS email",
        text: `Verify your email within 24 hours: ${url.toString()}`,
        html: `<p>Welcome to VEXAUSE LABS.</p><p><a href="${url.toString()}">Verify your email address</a></p><p>This link expires in 24 hours.</p>`
      } } });
    });
  }
  await setCustomerSession(user.id);
  return NextResponse.json({user:{id:user.id,name:user.name,email:user.email,phone:user.phone}},{status:201});
 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Please check your details.",details:e.flatten()},{status:400});console.error(e);return NextResponse.json({error:"Could not create account."},{status:500});}
}
