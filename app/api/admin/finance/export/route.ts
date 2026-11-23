import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";
function cell(value:unknown){const s=String(value??"");return `"${(/^[=+@\\-]/.test(s)?"'":"")+s.replace(/"/g,'""')}"`;}
export async function GET(request:NextRequest){
 const auth=await requireAdminApi(request);if(auth.response)return auth.response;
 const fromText=request.nextUrl.searchParams.get("from");const toText=request.nextUrl.searchParams.get("to");
 const from=fromText?new Date(`${fromText}T00:00:00.000Z`):new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),1));
 const to=toText?new Date(`${toText}T23:59:59.999Z`):new Date();
 if(Number.isNaN(from.getTime())||Number.isNaN(to.getTime())||from>to||to>new Date(Date.now()+86400000))return NextResponse.json({error:"Choose a valid date range."},{status:400});
 const entries=await prisma.financeEntry.findMany({where:{recordedAt:{gte:from,lte:to}},orderBy:{recordedAt:"asc"},take:10000,include:{order:{select:{orderCode:true}},payment:{select:{method:true}},refund:{select:{gatewayRefundId:true,status:true}}}});
 const header=["Recorded at","Order","Entry type","Direction","Amount (paise)","Amount (INR)","Payment method","Refund status","Provider refund ID","Reference","Description"];
 const rows=entries.map(e=>[e.recordedAt.toISOString(),e.order.orderCode,e.type,e.direction,e.amountPaise,(e.amountPaise/100).toFixed(2),e.payment?.method||"",e.refund?.status||"",e.refund?.gatewayRefundId||"",e.referenceKey,e.description]);
 const csv=[header,...rows].map(row=>row.map(cell).join(",")).join("\r\n");
 return new NextResponse(csv,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="vexause-finance-${from.toISOString().slice(0,10)}-${to.toISOString().slice(0,10)}.csv"`,"Cache-Control":"private, no-store"}});
}
