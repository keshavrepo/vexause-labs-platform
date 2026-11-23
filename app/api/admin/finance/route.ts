import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

const querySchema=z.object({from:z.string().optional(),to:z.string().optional()});
function range(request:NextRequest){
 const q=querySchema.parse({from:request.nextUrl.searchParams.get("from")||undefined,to:request.nextUrl.searchParams.get("to")||undefined});
 const from=q.from?new Date(`${q.from}T00:00:00.000Z`):new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),1));
 const to=q.to?new Date(`${q.to}T23:59:59.999Z`):new Date();
 if(Number.isNaN(from.getTime())||Number.isNaN(to.getTime())||from>to||to>new Date(Date.now()+86400000))throw new Error("INVALID_RANGE");
 return {from,to};
}
export async function GET(request:NextRequest){
 const auth=await requireAdminApi(request);if(auth.response)return auth.response;
 try{
  const {from,to}=range(request);
  const [entries,credits,debits,byType,orders]=await Promise.all([
   prisma.financeEntry.findMany({where:{recordedAt:{gte:from,lte:to}},orderBy:{recordedAt:"desc"},take:1000,include:{order:{select:{orderCode:true,kind:true,status:true}},payment:{select:{method:true,status:true}},refund:{select:{status:true,gatewayRefundId:true}}}}),
   prisma.financeEntry.aggregate({where:{recordedAt:{gte:from,lte:to},direction:"CREDIT"},_sum:{amountPaise:true},_count:{_all:true}}),
   prisma.financeEntry.aggregate({where:{recordedAt:{gte:from,lte:to},direction:"DEBIT"},_sum:{amountPaise:true},_count:{_all:true}}),
   prisma.financeEntry.groupBy({by:["type","direction"],where:{recordedAt:{gte:from,lte:to}},_sum:{amountPaise:true},_count:{_all:true}}),
   prisma.order.aggregate({where:{createdAt:{gte:from,lte:to}},_sum:{subtotalPaise:true,discountPaise:true,shippingPaise:true,taxPaise:true,totalPaise:true},_count:{_all:true}})
  ]);
  const credit=credits._sum.amountPaise||0;const debit=debits._sum.amountPaise||0;
  return NextResponse.json({range:{from:from.toISOString(),to:to.toISOString()},summary:{creditsPaise:credit,refundsPaise:debit,netCashMovementPaise:credit-debit,creditCount:credits._count._all,debitCount:debits._count._all,orders:orders._count._all,orderSubtotalPaise:orders._sum.subtotalPaise||0,discountsPaise:orders._sum.discountPaise||0,shippingPaise:orders._sum.shippingPaise||0,taxPaise:orders._sum.taxPaise||0,orderTotalsPaise:orders._sum.totalPaise||0},byType:byType.map(x=>({type:x.type,direction:x.direction,amountPaise:x._sum.amountPaise||0,count:x._count._all})),entries});
 }catch(e){if(e instanceof z.ZodError||(e instanceof Error&&e.message==="INVALID_RANGE"))return NextResponse.json({error:"Choose a valid date range."},{status:400});return NextResponse.json({error:"Could not load finance report."},{status:500});}
}
