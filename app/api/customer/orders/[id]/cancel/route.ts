import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-session";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { enqueueJob } from "@/lib/jobs";
import { restoreOrderInventory } from "@/lib/order-inventory";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rate = await enforceRateLimit(request, { namespace: "customer-order-cancel", limit: 5, windowMs: 3600000 });
  if (!rate.allowed) return rate.response;
  const auth = await requireCustomer(request);
  if (auth.response) return auth.response;
  try {
    const { id } = await params;
    const result = await prisma.$transaction(async tx => {
      const order = await tx.order.findFirst({ where: { id, userId: auth.userId! }, select: { id: true, status: true, userId: true } });
      if (!order) throw new Error("ORDER_NOT_FOUND");
      if (!["PENDING_REVIEW", "AWAITING_PAYMENT"].includes(order.status)) throw new Error("ORDER_NOT_CANCELLABLE");
      const verified = await tx.payment.findFirst({ where: { orderId: order.id, status: "VERIFIED" }, select: { id: true } });
      if (verified) throw new Error("PAYMENT_REQUIRES_SUPPORT");
      const changed = await tx.order.updateMany({ where: { id: order.id, userId: auth.userId!, status: order.status }, data: { status: "CANCELLED" } });
      if (changed.count !== 1) throw new Error("ORDER_STATE_CHANGED");
      await restoreOrderInventory(tx, order.id, "Customer cancelled unpaid order — stock restored");
      const redemption = await tx.couponRedemption.findUnique({ where: { orderId: order.id }, select: { couponId: true } });
      if (redemption) {
        await tx.couponRedemption.delete({ where: { orderId: order.id } });
        await tx.coupon.update({ where: { id: redemption.couponId }, data: { usedCount: { decrement: 1 } } });
      }
      await tx.payment.updateMany({ where: { orderId: order.id, status: { in: ["CREATED", "PENDING"] } }, data: { status: "FAILED" } });
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "CANCELLED", note: "Customer cancelled before payment or fulfilment" } });
      await tx.auditLog.create({ data: { actorId: auth.userId!, action: "CUSTOMER_ORDER_CANCELLED", entityType: "Order", entityId: order.id, metadata: { from: order.status, to: "CANCELLED" } } });
      await enqueueJob("ORDER_STATUS_NOTIFICATION", { userId: auth.userId!, title: "Order cancelled", message: "Your order was cancelled. Any allocated stock has been returned to inventory.", href: `/account/orders/${order.id}` }, tx);
      return { id: order.id, status: "CANCELLED" };
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ order: result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (code === "ORDER_NOT_CANCELLABLE") return NextResponse.json({ error: "This order can no longer be cancelled online. Please contact support." }, { status: 409 });
    if (code === "PAYMENT_REQUIRES_SUPPORT") return NextResponse.json({ error: "A payment has already been verified. Contact support to request cancellation and refund." }, { status: 409 });
    if (code === "ORDER_STATE_CHANGED") return NextResponse.json({ error: "The order changed while cancellation was processing. Refresh and try again." }, { status: 409 });
    if (code === "INVENTORY_RESTORE_TARGET_MISSING") return NextResponse.json({ error: "Stock needs manual reconciliation. Please contact support." }, { status: 409 });
    return NextResponse.json({ error: "Could not cancel this order." }, { status: 500 });
  }
}
