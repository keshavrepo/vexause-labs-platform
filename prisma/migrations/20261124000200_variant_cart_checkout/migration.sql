-- Variant-aware cart identity and immutable order line snapshots.
DROP INDEX IF EXISTS "CartItem_cartId_productId_key";
ALTER TABLE "CartItem" ADD COLUMN "variantId" TEXT;
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantId_key" ON "CartItem"("cartId", "productId", "variantId");
-- PostgreSQL treats NULL values as distinct in unique indexes; retain one base-product line per cart.
CREATE UNIQUE INDEX "CartItem_cartId_productId_base_key" ON "CartItem"("cartId", "productId") WHERE "variantId" IS NULL;
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "variantName" TEXT;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
