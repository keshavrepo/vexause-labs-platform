import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/**
 * Restore stock allocated by checkout. Each order line is claimed once using
 * inventoryRestoredAt so retries/cancellation races cannot double-credit stock.
 */
export async function restoreOrderInventory(tx: Tx, orderId: string, reason: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId, inventoryRestoredAt: null },
    select: { id: true, productId: true, variantId: true, variantName: true, quantity: true, inventoryAllocated: true },
  });
  let restored = 0;
  for (const item of items) {
    if (!item.inventoryAllocated) {
      await tx.orderItem.updateMany({ where: { id: item.id, orderId, inventoryRestoredAt: null }, data: { inventoryRestoredAt: new Date() } });
      continue;
    }
    const productId = item.productId;
    const variantId = item.variantId;
    if (!productId) {
      // Never silently cancel an allocated line whose original stock target vanished.
      throw new Error("INVENTORY_RESTORE_TARGET_MISSING");
    }
    if (item.variantName && !variantId) {
      // A deleted variant must not be credited to the unrelated base product stock.
      throw new Error("INVENTORY_RESTORE_TARGET_MISSING");
    }
    const claimed = await tx.orderItem.updateMany({
      where: { id: item.id, orderId, inventoryRestoredAt: null },
      data: { inventoryRestoredAt: new Date() },
    });
    if (claimed.count !== 1) continue;

    if (variantId) {
      const variant = await tx.productVariant.updateMany({
        where: { id: variantId, productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
      if (variant.count !== 1) throw new Error("INVENTORY_RESTORE_TARGET_MISSING");
      await tx.inventoryMovement.create({
        data: { productId, variantId, type: "STOCK_IN", quantity: item.quantity, reason, referenceId: orderId },
      });
    } else {
      const product = await tx.product.updateMany({
        where: { id: productId },
        data: { stockQuantity: { increment: item.quantity } },
      });
      if (product.count !== 1) throw new Error("INVENTORY_RESTORE_TARGET_MISSING");
      await tx.inventoryMovement.create({
        data: { productId, type: "STOCK_IN", quantity: item.quantity, reason, referenceId: orderId },
      });
    }
    restored += item.quantity;
  }
  return { restoredQuantity: restored, lineCount: items.length };
}
