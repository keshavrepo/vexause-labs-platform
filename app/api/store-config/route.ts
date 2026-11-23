import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
export async function GET(){
  const keys=["STORE_NAME","STORE_TAGLINE","SUPPORT_EMAIL","SUPPORT_PHONE","BUSINESS_ADDRESS"];
  const rows=await prisma.storeSetting.findMany({where:{key:{in:keys}}});
  const v=Object.fromEntries(rows.map(r=>[r.key,r.valueJson]));
  return NextResponse.json({store:{
    name:typeof v.STORE_NAME==="string"?v.STORE_NAME:"VEXAUSE LABS",
    tagline:typeof v.STORE_TAGLINE==="string"?v.STORE_TAGLINE:"BUILDING WHAT'S NEXT.",
    supportEmail:typeof v.SUPPORT_EMAIL==="string"?v.SUPPORT_EMAIL:"",
    supportPhone:typeof v.SUPPORT_PHONE==="string"?v.SUPPORT_PHONE:"",
    businessAddress:typeof v.BUSINESS_ADDRESS==="string"?v.BUSINESS_ADDRESS:"",
  }},{headers:{"Cache-Control":"public, max-age=60, stale-while-revalidate=300"}});
}
