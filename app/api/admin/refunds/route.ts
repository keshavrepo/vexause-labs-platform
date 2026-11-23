import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";
import { syncRefundCompletion } from "@/lib/refunds";

const createSchema = z.object({
  paymentId: z.string().min(1),
  amountPaise: z.number().int().positive(),
  reason: z.string().trim().min(5).max(500),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  const refunds = await prisma.refund.findMany({
    orderBy: { createdAt: "desc" }, take: 200,
    include: { order: { select: { orderCode: true, status: true } }, payment: { select: { method: true, gatewayPaymentId: true, amountPaise: true, status: true } } },
  });
  const payments = await prisma.payment.findMany({
    where: { method: "RAZORPAY", gatewayPaymentId: { not: null }, status: { in: ["VERIFIED", "REFUND_PENDING", "REFUNDED"] } },
    orderBy: { verifiedAt: "desc" }, take: 100,
    select: { id: true, orderId: true, amountPaise: true, status: true, gatewayPaymentId: true, order: { select: { orderCode: true } }, refunds: { select: { amountPaise: true, status: true } } },
  });
  return NextResponse.json({ refunds, payments });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  try {
    const input = createSchema.parse(await request.json());
    const prepared = await prisma.$transaction(async tx => {
      const payment = await tx.payment.findUnique({ where: { id: input.paymentId }, include: { order: true } });
      if (!payment) throw new Error("PAYMENT_NOT_FOUND");
      if (payment.method !== "RAZORPAY" || !["VERIFIED", "REFUND_PENDING"].includes(payment.status) || !payment.gatewayPaymentId) throw new Error("PAYMENT_NOT_REFUNDABLE");
      const prior = await tx.refund.aggregate({
        where: { paymentId: payment.id, status: { in: ["REQUESTED", "PROCESSING", "SUCCEEDED", "MANUAL_REVIEW"] } },
        _sum: { amountPaise: true },
      });
      const remaining = payment.amountPaise - (prior._sum.amountPaise || 0);
      if (input.amountPaise > remaining) throw new Error("REFUND_EXCEEDS_REMAINING");
      const refund = await tx.refund.create({
        data: {
          paymentId: payment.id, orderId: payment.orderId, amountPaise: input.amountPaise,
          reason: input.reason, status: "REQUESTED", idempotencyKey: randomUUID(), processedBy: auth.session!.userId,
        },
      });
      if (payment.order.status !== "REFUND_PENDING") {
        await tx.order.update({ where: { id: payment.orderId }, data: { status: "REFUND_PENDING" } });
        await tx.orderStatusHistory.create({ data: { orderId: payment.orderId, status: "REFUND_PENDING", note: "Refund initiated by administrator", actorId: auth.session!.userId } });
      }
      await tx.payment.update({ where: { id: payment.id }, data: { status: "REFUND_PENDING" } });
      await tx.auditLog.create({ data: { actorId: auth.session!.userId, action: "REFUND_REQUESTED", entityType: "Refund", entityId: refund.id, metadata: { paymentId: payment.id, amountPaise: input.amountPaise } } });
      return { refund, gatewayPaymentId: payment.gatewayPaymentId };
    }, { isolationLevel: "Serializable" });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !secret) {
      await prisma.refund.update({ where: { id: prepared.refund.id }, data: { status: "MANUAL_REVIEW", failureReason: "Razorpay credentials are not configured." } });
      return NextResponse.json({ error: "Refund saved for manual review; Razorpay credentials are not configured.", refundId: prepared.refund.id }, { status: 503 });
    }

    let response: Response;
    try {
      response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(prepared.gatewayPaymentId)}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: input.amountPaise, notes: { internalRefundId: prepared.refund.id, reason: input.reason } }),
        cache: "no-store",
      });
    } catch {
      await prisma.refund.update({ where: { id: prepared.refund.id }, data: { status: "MANUAL_REVIEW", failureReason: "Network outcome is unknown. Check Razorpay dashboard before retrying." } });
      return NextResponse.json({ error: "Refund outcome is unknown. It has been flagged for manual reconciliation; do not retry blindly.", refundId: prepared.refund.id }, { status: 202 });
    }
    const body: any = await response.json().catch(() => ({}));
    if (!response.ok || !body.id) {
      const failed = await prisma.refund.update({ where: { id: prepared.refund.id }, data: { status: "FAILED", gatewayStatus: String(body.status || "rejected"), failureReason: String(body.error?.description || "Razorpay rejected the refund request.") } });
      await prisma.auditLog.create({ data: { actorId: auth.session!.userId, action: "REFUND_PROVIDER_REJECTED", entityType: "Refund", entityId: failed.id, metadata: { providerStatus: failed.gatewayStatus } } });
      await syncRefundCompletion(failed.orderId, failed.paymentId);
      return NextResponse.json({ error: failed.failureReason, refund: failed }, { status: 502 });
    }
    const status = body.status === "processed" ? "SUCCEEDED" : body.status === "failed" ? "FAILED" : "PROCESSING";
    const saved = await prisma.refund.update({
      where: { id: prepared.refund.id },
      data: { gatewayRefundId: body.id, gatewayStatus: String(body.status || "pending"), status, processedAt: status === "SUCCEEDED" ? new Date() : null },
    });
    await prisma.auditLog.create({ data: { actorId: auth.session!.userId, action: "REFUND_SENT_TO_GATEWAY", entityType: "Refund", entityId: saved.id, metadata: { gatewayRefundId: body.id, status } } });
    if (status === "SUCCEEDED") await syncRefundCompletion(saved.orderId, saved.paymentId);
    return NextResponse.json({ refund: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid payment, amount in paise and refund reason." }, { status: 400 });
    const code = error instanceof Error ? error.message : "";
    if (code === "PAYMENT_NOT_FOUND") return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    if (code === "PAYMENT_NOT_REFUNDABLE") return NextResponse.json({ error: "Only captured Razorpay payments with a captured payment ID can be refunded through this workflow." }, { status: 409 });
    if (code === "REFUND_EXCEEDS_REMAINING") return NextResponse.json({ error: "Refund amount exceeds the remaining refundable amount." }, { status: 409 });
    return NextResponse.json({ error: "Could not create refund." }, { status: 500 });
  }
}

