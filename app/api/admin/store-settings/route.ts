import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

export const dynamic = "force-dynamic";
const schema = z.object({
  storeName: z.string().trim().min(2).max(100),
  tagline: z.string().trim().max(160),
  supportEmail: z.string().trim().email().max(254).or(z.literal("")),
  supportPhone: z.string().trim().max(20).regex(/^[+0-9(). -]*$/),
  businessAddress: z.string().trim().max(500),
  timezone: z.literal("Asia/Kolkata"),
  lowStockThreshold: z.number().int().min(0).max(100000),
  codEnabled: z.boolean(),
  codMaxOrderPaise: z.number().int().min(0).max(1000000000),
});
const KEYS = ["STORE_NAME","STORE_TAGLINE","SUPPORT_EMAIL","SUPPORT_PHONE","BUSINESS_ADDRESS","STORE_TIMEZONE","LOW_STOCK_THRESHOLD","COD_ENABLED","COD_MAX_ORDER_PAISE"];
function normalize(rows: {key:string;valueJson:any}[]) {
  const v = Object.fromEntries(rows.map(r=>[r.key,r.valueJson]));
  return {
    storeName: typeof v.STORE_NAME==="string"?v.STORE_NAME:"VEXAUSE LABS",
    tagline: typeof v.STORE_TAGLINE==="string"?v.STORE_TAGLINE:"BUILDING WHAT'S NEXT.",
    supportEmail: typeof v.SUPPORT_EMAIL==="string"?v.SUPPORT_EMAIL:"",
    supportPhone: typeof v.SUPPORT_PHONE==="string"?v.SUPPORT_PHONE:"",
    businessAddress: typeof v.BUSINESS_ADDRESS==="string"?v.BUSINESS_ADDRESS:"",
    timezone: "Asia/Kolkata" as const,
    lowStockThreshold: typeof v.LOW_STOCK_THRESHOLD==="number"?v.LOW_STOCK_THRESHOLD:5,
    codEnabled: v.COD_ENABLED===true,
    codMaxOrderPaise: typeof v.COD_MAX_ORDER_PAISE==="number"?v.COD_MAX_ORDER_PAISE:0,
  };
}
export async function GET(request:NextRequest) {
  const auth=await requireAdminApi(request); if(auth.response)return auth.response;
  const rows=await prisma.storeSetting.findMany({where:{key:{in:KEYS}}});
  return NextResponse.json({settings:normalize(rows)},{headers:{"Cache-Control":"no-store, private"}});
}
export async function PUT(request:NextRequest) {
  const auth=await requireAdminApi(request); if(auth.response)return auth.response;
  try {
    const d=schema.parse(await request.json());
    const values:[string,unknown][]=[
      ["STORE_NAME",d.storeName],["STORE_TAGLINE",d.tagline],["SUPPORT_EMAIL",d.supportEmail],
      ["SUPPORT_PHONE",d.supportPhone],["BUSINESS_ADDRESS",d.businessAddress],["STORE_TIMEZONE",d.timezone],
      ["LOW_STOCK_THRESHOLD",d.lowStockThreshold],["COD_ENABLED",d.codEnabled],["COD_MAX_ORDER_PAISE",d.codMaxOrderPaise],
    ];
    await prisma.$transaction(async tx=>{
      for(const [key,valueJson] of values) await tx.storeSetting.upsert({
        where:{key},create:{key,valueJson:valueJson as any},update:{valueJson:valueJson as any}
      });
      await tx.auditLog.create({data:{
        actorId:auth.session!.userId,action:"STORE_CONFIGURATION_UPDATED",entityType:"StoreSetting",entityId:"STORE_CONFIGURATION",
        metadata:{storeNameChanged:true,codEnabled:d.codEnabled,lowStockThreshold:d.lowStockThreshold,supportEmailConfigured:!!d.supportEmail,supportPhoneConfigured:!!d.supportPhone}
      }});
    });
    return NextResponse.json({ok:true});
  } catch(e) {
    if(e instanceof z.ZodError)return NextResponse.json({error:"Check the store details and configuration values."},{status:400});
    return NextResponse.json({error:"Could not save store configuration."},{status:500});
  }
}
