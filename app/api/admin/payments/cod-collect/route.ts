import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";
import { recordFinanceEntry } from "@/lib/finance-ledger";
import { ensureTaxInvoice } from "@/lib/tax-invoice";

const schema = z.object({ paymentId: z.string().min(1), collectionReference: z.string().trim().min(3).max(120), note: z.string().trim().max(300).optional() });
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  try {
    const input = schema.parse(await request.json());
    const result = await prisma.$transaction(async tx => {
      const payment = await tx.payment.findUnique({ where: { id: input.paymentId }, include: { order: true } });
      if (!payment) throw new Error("PAYMENT_NOT_FOUND");
      if (payment.method !== "COD" || payment.status !== "PENDING") throw new Error("COD_NOT_COLLECTIBLE");
      if (!["SHIPPED", "DELIVERED"].includes(payment.order.status)) throw new Error("COD_STAGE");
      const now = new Date();
      const changed = await tx.payment.updateMany({ where: { id: payment.id, method: "COD", status: "PENDING" }, data: { status: "VERIFIED", verifiedAt: now } });
      if (changed.count !== 1) throw new Error("COD_ALREADY_UPDATED");
      await recordFinanceEntry(tx,{orderId:payment.orderId,paymentId:payment.id,type:"COD_COLLECTION",direction:"CREDIT",amountPaise:payment.amountPaise,referenceKey:`cod:${payment.id}:collection`,description:`COD collected · Ref ${input.collectionReference}${input.note?` · ${input.note}`:""}`,recordedAt:now});
      await ensureTaxInvoice(tx,payment.orderId);
      await tx.auditLog.create({data:{actorId:auth.session!.userId,action:"COD_COLLECTION_RECORDED",entityType:"Payment",entityId:payment.id,metadata:{collectionReference:input.collectionReference,note:input.note||null,amountPaise:payment.amountPaise}}});
      return {paymentId:payment.id,status:"VERIFIED",amountPaise:payment.amountPaise,verifiedAt:now};
    },{isolationLevel:"Serializable"});
    return NextResponse.json({collection:result});
  } catch (error) {
    if(error instanceof z.ZodError)return NextResponse.json({error:"Provide a valid COD payment and collection reference."},{status:400});
    const code=error instanceof Error?error.message:"";
    if(code==="PAYMENT_NOT_FOUND")return NextResponse.json({error:"Payment not found."},{status:404});
    if(code==="COD_NOT_COLLECTIBLE")return NextResponse.json({error:"Only pending COD payments can be collected."},{status:409});
    if(code==="COD_STAGE")return NextResponse.json({error:"Record COD collection only after the order is shipped or delivered."},{status:409});
    if(code==="COD_ALREADY_UPDATED")return NextResponse.json({error:"COD payment was already updated. Refresh the page."},{status:409});
    return NextResponse.json({error:"Could not record COD collection."},{status:500});
  }
}
