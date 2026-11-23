import { prisma } from "@/lib/prisma";
import { recordFinanceEntry } from "@/lib/finance-ledger";

export async function syncRefundCompletion(orderId: string, paymentId: string) {
  await prisma.$transaction(async tx => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return;
    const successful = await tx.refund.aggregate({ where: { paymentId, status: "SUCCEEDED" }, _sum: { amountPaise: true } });
    const pending = await tx.refund.count({ where: { paymentId, status: { in: ["REQUESTED", "PROCESSING", "MANUAL_REVIEW"] } } });
    const total = successful._sum.amountPaise || 0;
    const successfulRefunds = await tx.refund.findMany({ where: { paymentId, status: "SUCCEEDED" }, select: { id: true, orderId: true, amountPaise: true, processedAt: true } });
    for (const refund of successfulRefunds) {
      await recordFinanceEntry(tx,{orderId:refund.orderId,paymentId,refundId:refund.id,type:"REFUND",direction:"DEBIT",amountPaise:refund.amountPaise,referenceKey:`refund:${refund.id}:success`,description:"Razorpay refund processed",recordedAt:refund.processedAt || new Date()});
    }
    await tx.payment.update({ where: { id: paymentId }, data: { status: total >= payment.amountPaise ? "REFUNDED" : pending > 0 ? "REFUND_PENDING" : "VERIFIED" } });

    const payments = await tx.payment.findMany({ where: { orderId, status: { in: ["VERIFIED", "REFUND_PENDING", "REFUNDED"] } }, select: { id: true, amountPaise: true } });
    let fullyRefunded = payments.length > 0;
    for (const p of payments) {
      const aggregate = await tx.refund.aggregate({ where: { paymentId: p.id, status: "SUCCEEDED" }, _sum: { amountPaise: true } });
      if ((aggregate._sum.amountPaise || 0) < p.amountPaise) fullyRefunded = false;
    }
    if (fullyRefunded) {
      await tx.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
      await tx.orderStatusHistory.create({ data: { orderId, status: "REFUNDED", note: "All verified payments have been fully refunded" } });
    }
  });
}
