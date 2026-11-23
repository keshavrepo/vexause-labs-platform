CREATE TYPE "FinanceEntryType" AS ENUM ('PAYMENT_CAPTURE', 'REFUND', 'COD_COLLECTION');
CREATE TYPE "FinanceDirection" AS ENUM ('CREDIT', 'DEBIT');
CREATE TABLE "FinanceEntry" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "paymentId" TEXT,
  "refundId" TEXT,
  "type" "FinanceEntryType" NOT NULL,
  "direction" "FinanceDirection" NOT NULL,
  "amountPaise" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "referenceKey" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FinanceEntry_referenceKey_key" ON "FinanceEntry"("referenceKey");
CREATE INDEX "FinanceEntry_recordedAt_type_idx" ON "FinanceEntry"("recordedAt", "type");
CREATE INDEX "FinanceEntry_orderId_recordedAt_idx" ON "FinanceEntry"("orderId", "recordedAt");
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FinanceEntry" ADD CONSTRAINT "FinanceEntry_refundId_fkey" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
