import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireAdminApi} from "@/lib/session";

export async function GET(request:NextRequest){
 const auth=await requireAdminApi(request, { staffMethods: ["GET"] });if(auth.response)return auth.response;
 const [products,setting]=await Promise.all([
  prisma.product.findMany({orderBy:{name:"asc"},select:{id:true,name:true,sku:true,stockQuantity:true,trackInventory:true,isPublished:true,updatedAt:true,category:{select:{name:true}},movements:{orderBy:{createdAt:"desc"},take:3,select:{type:true,quantity:true,reason:true,createdAt:true}}}}),
  prisma.storeSetting.findUnique({where:{key:"LOW_STOCK_THRESHOLD"}})
 ]);
 const threshold=typeof setting?.valueJson==="number"&&setting.valueJson>=0?setting.valueJson:5;
 return NextResponse.json({products,lowStockThreshold:threshold});
}
const schema=z.object({productId:z.string().min(1),action:z.enum(["ADD","REMOVE","SET"]),quantity:z.number().int().min(0).max(100000),reason:z.string().trim().min(3).max(180)});
export async function PATCH(request:NextRequest){
 const auth=await requireAdminApi(request, { staffMethods: ["GET"] });if(auth.response)return auth.response;
 try{
  const d=schema.parse(await request.json());
  if(d.action!=="SET"&&d.quantity<1)return NextResponse.json({error:"Quantity must be at least 1."},{status:400});
  const result=await prisma.$transaction(async tx=>{
   const product=await tx.product.findUnique({where:{id:d.productId},select:{id:true,stockQuantity:true}});
   if(!product)throw new Error("NOT_FOUND");
   const next=d.action==="ADD"?product.stockQuantity+d.quantity:d.action==="REMOVE"?product.stockQuantity-d.quantity:d.quantity;
   if(next<0)throw new Error("INSUFFICIENT");
   if(!Number.isSafeInteger(next))throw new Error("INVALID");
   const delta=next-product.stockQuantity;
   if(delta===0)throw new Error("NO_CHANGE");
   const updated=await tx.product.update({where:{id:d.productId},data:{stockQuantity:next},select:{id:true,name:true,stockQuantity:true}});
   await tx.inventoryMovement.create({data:{
    productId:d.productId,type:d.action==="ADD"?"STOCK_IN":d.action==="REMOVE"?"STOCK_OUT":"ADJUSTMENT",
    quantity:Math.abs(delta),reason:d.reason,referenceId:`ADMIN:${auth.session!.userId}`
   }});
   await tx.auditLog.create({data:{actorId:auth.session!.userId,action:"INVENTORY_ADJUSTED",entityType:"Product",entityId:d.productId,metadata:{action:d.action,previous:product.stockQuantity,next,reason:d.reason}}});
   return updated;
  },{isolationLevel:"Serializable"});
  return NextResponse.json({product:result});
 }catch(e){
  if(e instanceof z.ZodError)return NextResponse.json({error:"Invalid inventory adjustment."},{status:400});
  const code=e instanceof Error?e.message:"";
  if(code==="NOT_FOUND")return NextResponse.json({error:"Product not found."},{status:404});
  if(code==="INSUFFICIENT")return NextResponse.json({error:"Cannot remove more stock than is available."},{status:409});
  if(code==="NO_CHANGE")return NextResponse.json({error:"Stock quantity is unchanged; no movement was recorded."},{status:409});
  return NextResponse.json({error:"Could not update inventory."},{status:500});
 }
}
