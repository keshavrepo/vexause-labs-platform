import type { Prisma } from "@prisma/client";

export async function recordFinanceEntry(tx: Prisma.TransactionClient, input: {
  orderId: string; paymentId?: string | null; refundId?: string | null;
  type: "PAYMENT_CAPTURE" | "REFUND" | "COD_COLLECTION";
  direction: "CREDIT" | "DEBIT"; amountPaise: number;
  referenceKey: string; description: string; recordedAt?: Date;
}) {
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0) throw new Error("INVALID_FINANCE_AMOUNT");
  await tx.financeEntry.upsert({
    where: { referenceKey: input.referenceKey },
    create: { ...input, currency: "INR" },
    update: {},
  });
}
