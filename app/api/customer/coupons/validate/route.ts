import { enforceRateLimit } from "@/lib/security/rate-limit";
import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireCustomer} from "@/lib/customer-session";
import {calculateCouponDiscount,normalizeCouponCode} from "@/lib/coupons";
const schema=z.object({code:z.string().min(2).max(40),subtotalPaise:z.number().int().positive()});
export async function POST(request:NextRequest){
  const rate = await enforceRateLimit(request, { namespace: "coupon-validate", limit: 30, windowMs: 3600000 });
  if (!rate.allowed) return rate.response;
 const auth=await requireCustomer(request);if(auth.response)return auth.response;
 try{
  const d=schema.parse(await request.json());const code=normalizeCouponCode(d.code);const now=new Date();
  const coupon=await prisma.coupon.findUnique({where:{code}});
  if(!coupon||!coupon.isActive)return NextResponse.json({error:"This coupon is not available."},{status:404});
  if(coupon.startsAt&&coupon.startsAt>now||coupon.expiresAt&&coupon.expiresAt<now)return NextResponse.json({error:"This coupon is not currently valid."},{status:409});
  if(coupon.usageLimit!==null&&coupon.usedCount>=coupon.usageLimit)return NextResponse.json({error:"This coupon has reached its usage limit."},{status:409});
  const used=await prisma.couponRedemption.count({where:{couponId:coupon.id,userId:auth.userId!}});
  if(used>=coupon.perCustomerLimit)return NextResponse.json({error:"You have already used this coupon the maximum number of times."},{status:409});
  if(d.subtotalPaise<coupon.minimumOrderPaise)return NextResponse.json({error:"Your cart does not meet this coupon's minimum order value."},{status:409});
  const discountPaise=calculateCouponDiscount(coupon,d.subtotalPaise);
  return NextResponse.json({valid:true,code:coupon.code,description:coupon.description,discountPaise,newTotalPaise:d.subtotalPaise-discountPaise});
 }catch(e){if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid coupon details."},{status:400});return NextResponse.json({error:"Could not validate coupon."},{status:500});}
}
