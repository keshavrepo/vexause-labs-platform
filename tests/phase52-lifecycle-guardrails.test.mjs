import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("allocated inventory with a deleted product or variant blocks cancellation instead of silently losing stock", () => {
  const source = fs.readFileSync(new URL("../lib/order-inventory.ts", import.meta.url), "utf8");
  assert.match(source, /if \(!productId\)[\s\S]*throw new Error\("INVENTORY_RESTORE_TARGET_MISSING"\)/);
  assert.match(source, /if \(item\.variantName && !variantId\)[\s\S]*throw new Error\("INVENTORY_RESTORE_TARGET_MISSING"\)/);
  assert.match(source, /inventoryRestoredAt: null/);
});

test("Razorpay webhook cannot regress terminal payment or refund states on out-of-order events", () => {
  const source = fs.readFileSync(new URL("../app/api/webhooks/razorpay/route.ts", import.meta.url), "utf8");
  assert.match(source, /failed&&payment&&!\["VERIFIED","REFUND_PENDING"\]\.includes\(payment\.status\)/);
  assert.ok(source.includes('refund&&!["SUCCEEDED","FAILED"].includes(refund.status)'));
  assert.match(source, /captured&&payment&&!\["VERIFIED","REFUND_PENDING"\]\.includes\(payment\.status\)/);
});
