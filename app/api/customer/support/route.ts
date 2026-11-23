import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireCustomer} from "@/lib/customer-session";

export async function GET(request:NextRequest){
 const auth=await requireCustomer(request); if(auth.response)return auth.response;
 const requests=await prisma.orderServiceRequest.findMany({where:{userId:auth.userId!},orderBy:{createdAt:"desc"},include:{order:{select:{orderCode:true,status:true}},events:{orderBy:{createdAt:"asc"},select:{actorRole:true,fromStatus:true,toStatus:true,message:true,createdAt:true}}}});
 return NextResponse.json({requests});
}
const schema=z.object({type:z.enum(["CANCELLATION","RETURN","REFUND","GENERAL"]),orderId:z.string().optional(),subject:z.string().trim().min(4).max(120),message:z.string().trim().min(10).max(2000)});
export async function POST(request:NextRequest){
 const auth=await requireCustomer(request); if(auth.response)return auth.response;
 try{
  const d=schema.parse(await request.json());
  const result=await prisma.$transaction(async tx=>{
   let order=null;
   if(d.orderId){
    order=await tx.order.findFirst({where:{id:d.orderId,userId:auth.userId!},select:{id:true,status:true}});
    if(!order)throw new Error("ORDER_NOT_FOUND");
   }
   if(d.type==="CANCELLATION"&&!order)throw new Error("ORDER_REQUIRED");
   if(d.type==="CANCELLATION"&&order&&!["PENDING_REVIEW","AWAITING_PAYMENT"].includes(order.status))throw new Error("CANCELLATION_STAGE");
   if(["RETURN","REFUND"].includes(d.type)&&(!order||order.status!=="DELIVERED"))throw new Error("RETURN_STAGE");
   const requestCode=`VX-SR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
   const created=await tx.orderServiceRequest.create({data:{requestCode,userId:auth.userId!,orderId:order?.id,type:d.type,subject:d.subject,message:d.message,events:{create:{actorId:auth.userId!,actorRole:"CUSTOMER",toStatus:"OPEN",message:"Request submitted by customer"}}},include:{order:{select:{orderCode:true,status:true}}}});
   await tx.auditLog.create({data:{actorId:auth.userId!,action:"SERVICE_REQUEST_CREATED",entityType:"OrderServiceRequest",entityId:created.id,metadata:{type:d.type,orderId:order?.id||null}}});
   return created;
  });
  return NextResponse.json({request:result},{status:201});
 }catch(e){
  if(e instanceof z.ZodError)return NextResponse.json({error:"Please check the request details."},{status:400});
  const c=e instanceof Error?e.message:"";
  const errors:Record<string,string>={ORDER_NOT_FOUND:"Order not found in your account.",ORDER_REQUIRED:"Select an order for a cancellation request.",CANCELLATION_STAGE:"Cancellation requests are available only before production starts. Please contact support for later-stage orders.",RETURN_STAGE:"Return or refund requests can be submitted after an order is marked delivered."};
  if(errors[c])return NextResponse.json({error:errors[c]},{status:409});
  return NextResponse.json({error:"Could not submit your request."},{status:500});
 }
}
