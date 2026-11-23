CREATE SEQUENCE tax_invoice_number_seq START 1;
ALTER TABLE "Product" ADD COLUMN "hsnCode" TEXT, ADD COLUMN "gstRateBps" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "cgstPaise" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "sgstPaise" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "igstPaise" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "taxSnapshot" JSONB;
ALTER TABLE "OrderItem" ADD COLUMN "hsnCode" TEXT, ADD COLUMN "gstRateBps" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "taxPaise" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "TaxInvoice" (
 "id" TEXT NOT NULL,
 "invoiceNumber" TEXT NOT NULL,
 "orderId" TEXT NOT NULL,
 "sellerName" TEXT NOT NULL,
 "sellerGstin" TEXT,
 "sellerStateCode" TEXT NOT NULL,
 "buyerName" TEXT NOT NULL,
 "buyerGstin" TEXT,
 "placeOfSupply" TEXT NOT NULL,
 "subtotalPaise" INTEGER NOT NULL,
 "discountPaise" INTEGER NOT NULL,
 "taxablePaise" INTEGER NOT NULL,
 "cgstPaise" INTEGER NOT NULL,
 "sgstPaise" INTEGER NOT NULL,
 "igstPaise" INTEGER NOT NULL,
 "totalTaxPaise" INTEGER NOT NULL,
 "grandTotalPaise" INTEGER NOT NULL,
 "linesJson" JSONB NOT NULL,
 "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "TaxInvoice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TaxInvoice_invoiceNumber_key" ON "TaxInvoice"("invoiceNumber");
CREATE UNIQUE INDEX "TaxInvoice_orderId_key" ON "TaxInvoice"("orderId");
CREATE INDEX "TaxInvoice_issuedAt_idx" ON "TaxInvoice"("issuedAt");
ALTER TABLE "TaxInvoice" ADD CONSTRAINT "TaxInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
