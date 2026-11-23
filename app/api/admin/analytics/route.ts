import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
 const auth=await requireAdminApi(request);if(auth.response)return auth.response;
 const now=new Date();const start=new Date(now.getFullYear(),now.getMonth()-5,1);
 const [orders,products,customers,customRequests,paidPayments,pendingQuotes,orderGroups,customGroups,monthlyRevenue,recentOrders,topProducts]=await Promise.all([
  prisma.order.count(),
  prisma.product.count({where:{isPublished:true}}),
  prisma.user.count({where:{role:"CUSTOMER"}}),
  prisma.customRequest.count(),
  prisma.payment.aggregate({where:{status:"VERIFIED"},_sum:{amountPaise:true},_count:{_all:true}}),
  prisma.quote.count({where:{status:"SENT"}}),
  prisma.order.groupBy({by:["status"],_count:{_all:true}}),
  prisma.customRequest.groupBy({by:["requestType"],_count:{_all:true}}),
  prisma.$queryRaw<Array<{month:string;revenue:bigint}>>`
    SELECT to_char(date_trunc('month', "verifiedAt"), 'YYYY-MM') AS month,
           COALESCE(SUM("amountPaise"),0)::bigint AS revenue
    FROM "Payment"
    WHERE "status" = 'VERIFIED' AND "verifiedAt" >= ${start}
    GROUP BY date_trunc('month', "verifiedAt")
    ORDER BY date_trunc('month', "verifiedAt") ASC
  `,
  prisma.order.findMany({orderBy:{createdAt:"desc"},take:8,select:{id:true,orderCode:true,status:true,kind:true,totalPaise:true,createdAt:true}}),
  prisma.orderItem.groupBy({by:["productId","productName"],_sum:{quantity:true,lineTotalPaise:true},_count:{_all:true},orderBy:{_sum:{quantity:"desc"}},take:5,where:{productId:{not:null}}})
 ]);
 const months=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return {month:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,label:d.toLocaleString("en-IN",{month:"short"})};});
 const revenueMap=new Map(monthlyRevenue.map(r=>[r.month,Number(r.revenue)]));
 const monthly=months.map(m=>({...m,revenuePaise:revenueMap.get(m.month)||0}));
 const verifiedRevenuePaise=Number(paidPayments._sum.amountPaise||0);
 return NextResponse.json({
  kpis:{orders,products,customers,customRequests,verifiedRevenuePaise,verifiedPayments:paidPayments._count._all,pendingQuotes},
  orderStatuses:orderGroups.map(x=>({status:x.status,count:x._count._all})),
  customRequestTypes:customGroups.map(x=>({type:x.requestType,count:x._count._all})),
  monthlyRevenue:monthly,
  recentOrders,
  topProducts:topProducts.map(x=>({name:x.productName,quantity:x._sum.quantity||0,salesPaise:x._sum.lineTotalPaise||0}))
 },{headers:{"Cache-Control":"private, no-store"}});
}
