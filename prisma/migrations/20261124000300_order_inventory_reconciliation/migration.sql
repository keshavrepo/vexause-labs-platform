-- Track idempotent stock restoration and variant-level inventory movements.
ALTER TABLE "OrderItem" ADD COLUMN "inventoryAllocated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrderItem" ADD COLUMN "inventoryRestoredAt" TIMESTAMP(3);
ALTER TABLE "InventoryMovement" ADD COLUMN "variantId" TEXT;
CREATE INDEX "InventoryMovement_variantId_createdAt_idx" ON "InventoryMovement"("variantId", "createdAt");
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
