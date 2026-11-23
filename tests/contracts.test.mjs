import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");

test("current Prisma schema contains Google identity relation and verified email", () => {
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /emailVerifiedAt\s+DateTime\?/);
  assert.match(schema, /googleAccounts\s+GoogleAccount\[\]/);
  assert.match(schema, /providerAccountId\s+String\s+@unique/);
});

test("baseline schema deliberately excludes the later Google delta", () => {
  const schema = read("prisma/schema.baseline.prisma");
  assert.doesNotMatch(schema, /model GoogleAccount/);
  assert.doesNotMatch(schema, /emailVerifiedAt/);
});

test("Google OAuth flow includes state, PKCE and nonce validation", () => {
  const helper = read("lib/google-oauth.ts");
  const start = read("app/api/customer/google/start/route.ts");
  const callback = read("app/api/customer/google/callback/route.ts");
  assert.match(helper, /timingSafeEqual/);
  assert.match(start, /code_challenge_method.*S256/);
  assert.match(callback, /state !== context\.state/);
  assert.match(callback, /identity\.nonce !== context\.nonce/);
  assert.match(callback, /identity\.email_verified !== "true"/);
});

test("password reset tokens are hashed and consumed with expiry checks", () => {
  const route = read("app/api/customer/reset-password/route.ts");
  assert.match(route, /hashOneTimeToken/);
  assert.match(route, /expiresAt: \{ gt: new Date\(\) \}/);
  assert.match(route, /updateMany/);
});

test("production deploy is blocked until reviewed initial migration exists", () => {
  const script = read("scripts/predeploy-check.sh");
  assert.match(script, /Initial migration SQL is missing/);
});

test("example environment contains no live credentials", () => {
  const env = read(".env.example");
  assert.match(env, /GOOGLE_CLIENT_ID=/);
  assert.match(env, /SMTP_PASSWORD=/);
  assert.match(env, /replace-with/);
});


test("cart and wishlist can hydrate exact saved product IDs beyond the first catalogue page", () => {
  const api = read("app/api/products/route.ts");
  const shop = read("components/ShopClient.tsx");
  assert.match(api, /ids: z\.string\(\)\.max\(4000\)\.optional\(\)/);
  assert.match(api, /ids\.length > 48/);
  assert.match(api, /id: \{ in: ids \}/);
  assert.match(shop, /fetchProductsByIds/);
  assert.match(shop, /unique\.slice\(i\*48,\(i\+1\)\*48\)/);
});

test("product detail shares validated cart and wishlist state", () => {
  const detail = read("components/ProductDetailClient.tsx");
  const shop = read("components/ShopClient.tsx");
  assert.match(detail, /import \{ useShopState \} from "@\/components\/ShopClient"/);
  assert.match(detail, /shop\.add\(product\.id/);
  assert.match(detail, /shop\.toggleWish\(product\.id\)/);
  assert.match(shop, /window\.addEventListener\("storage",onStorage\)/);
});

test("cart quantity controls respect tracked inventory limits", () => {
  const shop = read("components/ShopClient.tsx");
  assert.match(shop, /trackInventory===false\?99:product!\.stockQuantity/);
  assert.match(shop, /line\.quantity>=product!\.stockQuantity/);
});


test("customer account pages share responsive, route-aware navigation", () => {
  const nav = read("components/CustomerNav.tsx");
  assert.match(nav, /usePathname/);
  assert.match(nav, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(nav, /overflow-x-auto/);
  for (const file of [
    "app/account/page.tsx",
    "app/account/orders/page.tsx",
    "app/account/orders/[id]/page.tsx",
    "app/account/addresses/page.tsx",
    "app/account/custom-requests/page.tsx",
    "app/account/reviews/page.tsx",
    "app/account/notifications/page.tsx",
    "app/account/support/page.tsx",
  ]) assert.match(read(file), /<CustomerNav \/>/, `${file} should render shared account navigation`);
});

test("custom 3D request form safely handles async failures and resets after success", () => {
  const page = read("app/custom-3d-printing/page.tsx");
  assert.match(page, /const formElement=e\.currentTarget/);
  assert.match(page, /formElement\.reset\(\)/);
  assert.match(page, /catch \(err\)/);
  assert.match(page, /finally \{ setBusy\(false\); \}/);
});

test("store navigation exposes key destinations with loading-safe cart and wishlist counts", () => {
  const shop = read("components/ShopClient.tsx");
  const header = read("components/StorefrontHeader.tsx");
  assert.match(header, /aria-label="Store navigation"/);
  assert.match(header, /href:"\/custom-3d-printing"/);
  assert.match(shop, /cartCount={state\.ready\?count:null}/);
  assert.match(shop, /wishlistCount={state\.ready\?state\.wishlist\.length:null}/);
});


test("product detail renders a selectable gallery from the product image records", () => {
  const detail = read("components/ProductDetailClient.tsx");
  const route = read("app/api/products/by-slug/[slug]/route.ts");
  assert.match(route, /images: \{ orderBy: \{ sortOrder: "asc" \}, select:/);
  assert.match(detail, /const selectedImage=images\[activeImage\]/);
  assert.match(detail, /aria-pressed=\{activeImage===index\}/);
  assert.match(detail, /View image \$\{index\+1\} of \$\{images\.length\}/);
});

test("product detail displays comparison pricing only when the stored compare price is higher", () => {
  const detail = read("components/ProductDetailClient.tsx");
  assert.match(detail, /comparePrice==="number"&&comparePrice>displayedPrice/);
  assert.match(detail, /Save \{money\(comparePrice!-displayedPrice\)\}/);
});

test("product availability respects non-inventory products and tracked stock", () => {
  const detail = read("components/ProductDetailClient.tsx");
  assert.match(detail, /product\.available\?\?\(!tracked\|\|product\.stockQuantity>0\)/);
  assert.match(detail, /disabled=\{!available\}/);
  assert.match(detail, /tracked\?`In stock/);
});

test("product page metadata canonical URL removes a trailing slash correctly", () => {
  const page = read("app/product/[slug]/page.tsx");
  assert.ok(page.includes("siteUrl.replace(/\\/$/, \"\")"));
});


test("product variant schema stores independent options, pricing and inventory", () => {
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /model ProductVariant \{/);
  assert.match(schema, /optionValues\s+Json/);
  assert.match(schema, /pricePaise\s+Int/);
  assert.match(schema, /stockQuantity\s+Int\s+@default\(0\)/);
  assert.match(schema, /variants\s+ProductVariant\[\]/);
});

test("product variant migration creates indexed table and cascades with product", () => {
  const migration = read("prisma/migrations/20261124000100_product_variants/migration.sql");
  assert.match(migration, /CREATE TABLE "ProductVariant"/);
  assert.match(migration, /"optionValues" JSONB NOT NULL/);
  assert.match(migration, /ProductVariant_productId_isActive_sortOrder_idx/);
  assert.match(migration, /ON DELETE CASCADE/);
});

test("variant administration requires admin auth and validates prices/options", () => {
  const route = read("app/api/admin/products/[id]/variants/route.ts");
  const detail = read("app/api/admin/products/[id]/variants/[variantId]/route.ts");
  assert.match(route, /requireAdminApi/);
  assert.match(route, /optionValuesSchema/);
  assert.match(route, /compareAtPaise <= data\.pricePaise/);
  assert.match(detail, /requireAdminApi/);
  assert.match(detail, /updateMany/);
});

test("public product detail exposes active variants and inventory-aware availability", () => {
  const route = read("app/api/products/by-slug/[slug]/route.ts");
  const detail = read("components/ProductDetailClient.tsx");
  assert.match(route, /variants: \{ where: \{ isActive: true \}/);
  assert.match(route, /available: !variant\.trackInventory \|\| variant\.stockQuantity > 0/);
  assert.match(detail, /Choose an option/);
  assert.match(detail, /selectedVariant\?\.pricePaise/);
  assert.match(detail, /disabled=\{!available\}/);
});

test("catalogue does not let variant products bypass option selection", () => {
  const route = read("app/api/products/route.ts");
  const shop = read("components/ShopClient.tsx");
  assert.match(route, /hasVariants: product\.variants\.length > 0/);
  assert.match(shop, /disabled=\{!p\.available\|\|!!p\.hasVariants\}/);
  assert.match(shop, /p\.hasVariants\?"View options"/);
});


test("variant cart and checkout validate selected variant identity and stock", () => {
  const cart = read("app/api/customer/cart/route.ts");
  const orders = read("app/api/customer/orders/route.ts");
  assert.match(cart, /if \(product\.variants\.length\)/);
  assert.match(cart, /Choose a product option first/);
  assert.match(cart, /variantId: variant\?\.id/);
  assert.match(orders, /VARIANT_SELECTION_REQUIRED/);
  assert.match(orders, /VARIANT_INVALID/);
  assert.match(orders, /variant\.productId !== product\.id/);
});

test("admin catalogue links to the variant manager and UI supports create/archive", () => {
  const list = read("app/admin/products/page.tsx");
  const manager = read("app/admin/products/[id]/variants/page.tsx");
  assert.match(list, /\/admin\/products\/\$\{p\.id\}\/variants/);
  assert.match(manager, /Key=Value/);
  assert.match(manager, /method:"POST"/);
  assert.match(manager, /method:"DELETE"/);
});


test("catalogue price and stock filters account for active variants", () => {
  const route = read("app/api/products/route.ts");
  assert.match(route, /variants: \{ some: \{ isActive: true, pricePaise: range \} \}/);
  assert.match(route, /variants: \{ some: \{ isActive: true, OR:/);
  assert.match(route, /pricePaise: product\.variants\[0\]\?\.pricePaise/);
});


test("cart lines persist product and variant identity separately", () => {
  const schema = read("prisma/schema.prisma");
  const cartApi = read("app/api/customer/cart/route.ts");
  const types = read("lib/shop-types.ts");
  assert.match(schema, /variantId String\?/);
  assert.match(schema, /@@unique\(\[cartId, productId, variantId\]\)/);
  assert.match(cartApi, /variantId: z\.string\(\)\.min\(1\)\.nullable\(\)\.optional\(\)/);
  assert.match(cartApi, /export async function PUT/);
  assert.match(types, /variantId\?: string \| null/);
});

test("cart page uses selected variant price and inventory limits", () => {
  const shop = read("components/ShopClient.tsx");
  assert.match(shop, /x\.variant\?\.pricePaise\?\?x\.product!\.pricePaise/);
  assert.match(shop, /variant\.stockQuantity/);
  assert.match(shop, /state\.qty\(line\.productId,line\.variantId/);
  assert.match(shop, /method:"PUT"/);
});

test("checkout snapshots selected variant and atomically decrements its stock", () => {
  const orders = read("app/api/customer/orders/route.ts");
  assert.match(orders, /variant\?\.pricePaise \?\? product\.pricePaise/);
  assert.match(orders, /variantId: variant\.id/);
  assert.match(orders, /tx\.productVariant\.updateMany/);
  assert.match(orders, /stockQuantity: \{ decrement: item\.quantity \}/);
  assert.match(orders, /variantName: variant\.name/);
});

test("order item keeps variant identity and human-readable snapshot", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20261124000200_variant_cart_checkout/migration.sql");
  assert.match(schema, /variantName\s+String\?/);
  assert.match(migration, /ALTER TABLE "OrderItem" ADD COLUMN "variantName"/);
  assert.match(migration, /CartItem_cartId_productId_variantId_key/);
});

test("product lookup used by cart returns active variant details", () => {
  const route = read("app/api/products/route.ts");
  assert.match(route, /optionValues: true/);
  assert.match(route, /variants: product\.variants\.map/);
});


test("cart migration preserves unique base-product lines despite nullable variantId", () => {
  const migration = read("prisma/migrations/20261124000200_variant_cart_checkout/migration.sql");
  assert.match(migration, /DROP INDEX IF EXISTS "CartItem_cartId_productId_key"/);
  assert.match(migration, /CartItem_cartId_productId_base_key/);
  assert.match(migration, /WHERE "variantId" IS NULL/);
});


test("checkout records whether inventory was actually allocated for each order line", () => {
  const schema = read("prisma/schema.prisma");
  const checkout = read("app/api/customer/orders/route.ts");
  assert.match(schema, /inventoryAllocated Boolean @default\(false\)/);
  assert.match(checkout, /inventoryAllocated: track/);
});

test("order inventory restoration is idempotent and distinguishes variant stock", () => {
  const helper = read("lib/order-inventory.ts");
  assert.match(helper, /inventoryRestoredAt: null/);
  assert.match(helper, /updateMany\([\s\S]*inventoryRestoredAt: null/);
  assert.match(helper, /tx\.productVariant\.updateMany/);
  assert.match(helper, /const variantId = item\.variantId/);
  assert.match(helper, /if \(variantId\) \{[\s\S]*tx\.productVariant\.updateMany\(\{\s*where: \{ id: variantId, productId \}/);
  assert.match(helper, /tx\.product\.updateMany/);
  assert.match(helper, /!item\.inventoryAllocated/);
});

test("customer can cancel only unpaid early-stage orders and restores stock atomically", () => {
  const route = read("app/api/customer/orders/[id]/cancel/route.ts");
  assert.match(route, /requireCustomer/);
  assert.match(route, /\["PENDING_REVIEW", "AWAITING_PAYMENT"\]/);
  assert.match(route, /status: "VERIFIED"/);
  assert.match(route, /restoreOrderInventory/);
  assert.match(route, /couponRedemption\.delete/);
  assert.match(route, /status: "CANCELLED"/);
  assert.match(route, /isolationLevel: "Serializable"/);
});

test("admin cancellation rejects verified payments and restores coupon and stock", () => {
  const route = read("app/api/admin/orders/route.ts");
  assert.match(route, /PAYMENT_REQUIRES_REFUND/);
  assert.match(route, /restoreOrderInventory/);
  assert.match(route, /couponRedemption\.delete/);
  assert.match(route, /PAYMENT_REQUIRES_REFUND/);
});

test("failed payment webhook does not overwrite a verified payment and retry creates a fresh gateway order", () => {
  const webhook = read("app/api/webhooks/razorpay/route.ts");
  const create = read("app/api/customer/payments/create/route.ts");
  assert.match(webhook, /event\?\.event==="payment\.failed"/);
  assert.match(webhook, /!\["VERIFIED","REFUND_PENDING"\]\.includes\(payment\.status\)/);
  assert.match(create, /\["CREATED","PENDING"\]\.includes\(existing\.status\)/);
  assert.match(create, /gatewayPaymentId:null/);
});

test("customer order page exposes safe cancellation only in unpaid states", () => {
  const page = read("app/account/orders/[id]/page.tsx");
  assert.match(page, /orders\/\$\{params\.id\}\/cancel/);
  assert.match(page, /Cancel order/);
  assert.match(page, /window\.confirm/);
});

test("inventory reconciliation migration adds allocation markers and variant movements", () => {
  const migration = read("prisma/migrations/20261124000300_order_inventory_reconciliation/migration.sql");
  assert.match(migration, /inventoryAllocated/);
  assert.match(migration, /inventoryRestoredAt/);
  assert.match(migration, /InventoryMovement.*variantId/s);
});


test("late Razorpay capture after cancellation is flagged for refund instead of reopening order", () => {
  const webhook = read("app/api/webhooks/razorpay/route.ts");
  assert.match(webhook, /capturedAfterCancellation=order\?\.status==="CANCELLED"/);
  assert.match(webhook, /capturedAfterCancellation\?"REFUND_PENDING":"VERIFIED"/);
  assert.match(webhook, /PAYMENT_CAPTURED_AFTER_CANCELLATION/);
});


test("refund ledger is linked to captured payments and orders with provider audit fields", () => {
  const schema = read("prisma/schema.prisma");
  const migration = read("prisma/migrations/20261124000400_refund_management/migration.sql");
  assert.match(schema, /enum RefundStatus/);
  assert.match(schema, /model Refund \{/);
  assert.match(schema, /gatewayRefundId\s+String\? @unique/);
  assert.match(schema, /idempotencyKey\s+String @unique/);
  assert.match(schema, /refunds\s+Refund\[\]/);
  assert.match(migration, /CREATE TABLE "Refund"/);
  assert.match(migration, /Refund_paymentId_fkey/);
});

test("refund API is admin-only, verified-capture-only and caps cumulative refunds", () => {
  const route = read("app/api/admin/refunds/route.ts");
  assert.match(route, /requireAdminApi/);
  assert.match(route, /payment\.method !== "RAZORPAY"/);
  assert.match(route, /!\["VERIFIED", "REFUND_PENDING"\]\.includes\(payment\.status\)/);
  assert.match(route, /REFUND_EXCEEDS_REMAINING/);
  assert.match(route, /isolationLevel: "Serializable"/);
  assert.match(route, /\/v1\/payments\/\$\{encodeURIComponent\(prepared\.gatewayPaymentId\)\}\/refund/);
  assert.match(route, /MANUAL_REVIEW/);
});

test("refund webhooks update ledger and completion requires every captured payment fully refunded", () => {
  const webhook = read("app/api/webhooks/razorpay/route.ts");
  const helper = read("lib/refunds.ts");
  assert.match(webhook, /refund\.processed/);
  assert.match(webhook, /refund\.failed/);
  assert.match(webhook, /gatewayRefundId/);
  assert.match(helper, /status: "SUCCEEDED"/);
  assert.match(helper, /fullyRefunded/);
  assert.match(helper, /status: "REFUNDED"/);
});

test("admin refund workspace warns before sending provider request and exposes refund history", () => {
  const page = read("app/admin/refunds/page.tsx");
  const dashboard = read("app/admin/page.tsx");
  assert.match(page, /Initiate Razorpay refund/);
  assert.match(page, /Refund history/);
  assert.match(page, /remaining/);
  assert.match(dashboard, /href="\/admin\/refunds"/);
});


test("finance ledger stores immutable, idempotent payment, refund and COD entries", () => {
  const schema=read("prisma/schema.prisma");
  const migration=read("prisma/migrations/20261124000500_finance_ledger_reporting/migration.sql");
  const helper=read("lib/finance-ledger.ts");
  assert.match(schema,/model FinanceEntry \{/);
  assert.match(schema,/referenceKey\s+String @unique/);
  assert.match(schema,/enum FinanceEntryType/);
  assert.match(migration,/CREATE TABLE "FinanceEntry"/);
  assert.match(helper,/financeEntry\.upsert/);
  assert.match(helper,/INVALID_FINANCE_AMOUNT/);
});

test("verified Razorpay capture and successful refund create deduplicated finance ledger entries", () => {
  const verify=read("app/api/customer/payments/verify/route.ts");
  const webhook=read("app/api/webhooks/razorpay/route.ts");
  const refundHelper=read("lib/refunds.ts");
  assert.match(verify,/recordFinanceEntry/);
  assert.match(webhook,/payment:\$\{payment\.id\}:capture/);
  assert.match(refundHelper,/refund:\$\{refund\.id\}:success/);
  assert.match(refundHelper,/direction:"DEBIT"/);
});

test("COD collection requires admin, pending COD and shipped or delivered order", () => {
  const route=read("app/api/admin/payments/cod-collect/route.ts");
  const page=read("app/admin/payments/page.tsx");
  assert.match(route,/requireAdminApi/);
  assert.match(route,/payment\.method !== "COD"/);
  assert.match(route,/payment\.status !== "PENDING"/);
  assert.match(route,/\["SHIPPED", "DELIVERED"\]/);
  assert.match(route,/collectionReference/);
  assert.match(route,/recordFinanceEntry/);
  assert.match(page,/Record COD collected/);
});

test("finance reporting is admin protected and exports formula-safe CSV", () => {
  const api=read("app/api/admin/finance/route.ts");
  const csv=read("app/api/admin/finance/export/route.ts");
  const page=read("app/admin/finance/page.tsx");
  assert.match(api,/requireAdminApi/);
  assert.match(api,/direction:"CREDIT"/);
  assert.match(api,/direction:"DEBIT"/);
  assert.match(csv,/requireAdminApi/);
  assert.match(csv,/Content-Type.*text\/csv/);
  assert.match(csv,/\^\[=\+@/);
  assert.match(page,/Export ledger CSV/);
  assert.match(page,/Order-value context/);
});


test("GST configuration is admin protected and GST is disabled unless explicitly enabled", () => {
  const api=read("app/api/admin/tax-settings/route.ts");
  const page=read("app/admin/tax-settings/page.tsx");
  assert.match(api,/requireAdminApi/);
  assert.match(api,/GST_ENABLED/);
  assert.match(api,/GST_STATE_CODE/);
  assert.match(api,/GSTIN/);
  assert.match(page,/Enable GST calculation/);
  assert.match(page,/disabled by default/);
});

test("checkout snapshots product HSN and GST rate and calculates intra/inter-state tax separately", () => {
  const route=read("app/api/customer/orders/route.ts");
  const schema=read("prisma/schema.prisma");
  assert.match(schema,/hsnCode\s+String\?/);
  assert.match(schema,/gstRateBps\s+Int @default\(0\)/);
  assert.match(route,/GST_CONFIGURATION_INCOMPLETE/);
  assert.match(route,/cgstPaise/);
  assert.match(route,/sgstPaise/);
  assert.match(route,/igstPaise/);
  assert.match(route,/taxSnapshot/);
  assert.match(route,/gstRateBps: product\.gstRateBps/);
});

test("tax invoices are issued only for tax-enabled orders with a verified payment", () => {
  const helper=read("lib/tax-invoice.ts");
  const migration=read("prisma/migrations/20261124000600_gst_tax_invoice_foundation/migration.sql");
  const verify=read("app/api/customer/payments/verify/route.ts");
  const webhook=read("app/api/webhooks/razorpay/route.ts");
  const cod=read("app/api/admin/payments/cod-collect/route.ts");
  assert.match(helper,/order\.taxPaise <= 0/);
  assert.match(helper,/!order\.payments\.length/);
  assert.match(helper,/tax_invoice_number_seq/);
  assert.match(migration,/CREATE TABLE "TaxInvoice"/);
  assert.match(verify,/ensureTaxInvoice/);
  assert.match(webhook,/ensureTaxInvoice/);
  assert.match(cod,/ensureTaxInvoice/);
});

test("customer tax invoice endpoint is ownership-scoped and printable invoice page exposes tax components", () => {
  const api=read("app/api/customer/orders/[id]/invoice/route.ts");
  const page=read("app/account/orders/[id]/invoice/page.tsx");
  const orderApi=read("app/api/customer/orders/[id]/route.ts");
  assert.match(api,/order:\{userId:auth\.userId\}/);
  assert.match(page,/Print \/ Save PDF/);
  assert.match(page,/CGST/);
  assert.match(page,/SGST/);
  assert.match(page,/IGST/);
  assert.match(orderApi,/invoice:\{select:/);
});

test("admin product tax update validates GST rate bounds and writes an audit record", () => {
  const route=read("app/api/admin/products/[id]/tax/route.ts");
  assert.match(route,/requireAdminApi/);
  assert.match(route,/gstRateBps:z\.number\(\)\.int\(\)\.min\(0\)\.max\(2800\)/);
  assert.match(route,/PRODUCT_TAX_UPDATED/);
});


test("production schema stores jobs, machine assignment, material usage and QC history", () => {
  const schema = read("prisma/schema.prisma");
  assert.match(schema, /model ProductionJob \{/);
  assert.match(schema, /orderId\s+String\s+@unique/);
  assert.match(schema, /model ProductionMachine \{/);
  assert.match(schema, /model ProductionMaterial \{/);
  assert.match(schema, /model MaterialConsumption \{/);
  assert.match(schema, /model QualityInspection \{/);
});

test("production API restricts job creation to paid workflow and consumes real material stock transactionally", () => {
  const route = read("app/api/admin/production/route.ts");
  assert.match(route, /requireAdminApi/);
  assert.match(route, /\["PAID", "IN_PRODUCTION"\]/);
  assert.match(route, /stockGrams: \{ gte: d\.quantityGrams \}/);
  assert.match(route, /stockGrams: \{ decrement: d\.quantityGrams \}/);
  assert.match(route, /tx\.materialConsumption\.create/);
});

test("dispatch readiness requires passed QC and full custom-order payment", () => {
  const route = read("app/api/admin/production/route.ts");
  const orders = read("app/api/admin/orders/route.ts");
  assert.match(route, /job\.inspections\[0\]\?\.passed/);
  assert.match(route, /paid < job\.order\.totalPaise/);
  assert.match(route, /status: "SUCCEEDED"/);
  assert.match(route, /captured - refunded/);
  assert.match(orders, /PRODUCTION_QC_REQUIRED/);
  assert.match(orders, /production\.status!=="READY_FOR_DISPATCH"/);
});

test("admin production workspace is linked from the dashboard", () => {
  const page = read("app/admin/production/page.tsx");
  const dashboard = read("app/admin/page.tsx");
  assert.match(page, /Material consumption/);
  assert.match(page, /Quality inspection/);
  assert.match(page, /Mark ready for dispatch/);
  assert.match(dashboard, /href="\/admin\/production"/);
});


test("production migration creates machine, job, material and inspection persistence", () => {
  const migration = read("prisma/migrations/20261124000700_production_fulfilment_management/migration.sql");
  for (const table of ["ProductionMachine","ProductionJob","ProductionJobLine","ProductionMaterial","MaterialConsumption","QualityInspection"]) {
    assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
  }
  assert.match(migration, /ProductionJob_orderId_key/);
  assert.match(migration, /MaterialConsumption_jobId_fkey/);
});


test("shipment lifecycle requires a label, enforces forward carrier events and synchronizes order completion", () => {
  const shipment = read("app/api/admin/orders/[id]/shipment/route.ts");
  const orders = read("app/api/admin/orders/route.ts");
  assert.match(shipment, /if\(!previous&&d\.status!=="LABEL_CREATED"\)/);
  assert.match(shipment, /shipmentTransitions/);
  assert.match(shipment, /SHIPMENT_NOT_DISPATCHED/);
  assert.match(shipment, /d\.status==="DELIVERED"&&order\.status==="SHIPPED"/);
  assert.match(orders, /SHIPMENT_NOT_DISPATCHED/);
  assert.match(orders, /SHIPMENT_NOT_DELIVERED/);
});

test("customer reviews page and custom OBJ upload validator remain syntactically valid source contracts", () => {
  const reviews = read("app/account/reviews/page.tsx");
  const uploads = read("app/api/custom-requests/route.ts");
  assert.match(reviews, /purchasedItems\.map/);
  assert.match(reviews, /Review submitted/);
  assert.match(uploads, /ext === "obj"/);
  assert.match(uploads, /\(v\|vt\|vn\|f\)/);
});

test("baseline migration generator is retry-safe and predeploy runs the migration-chain guard", () => {
  const generator = read("scripts/create-baseline-migration.sh");
  const checker = read("scripts/check-migration-chain.sh");
  const predeploy = read("scripts/predeploy-check.sh");
  assert.match(generator, /mktemp -d/);
  assert.match(generator, /npx prisma migrate diff/);
  assert.match(generator, /install -m 0644/);
  assert.match(checker, /20261122000000_initial/);
  assert.match(checker, /migration_lock\.toml/);
  assert.match(predeploy, /bash scripts\/check-migration-chain\.sh/);
});

test("dependency and source preflight is part of the production deployment sequence", () => {
  const pkg = JSON.parse(read("package.json"));
  const preflight = read("scripts/source-preflight.mjs");
  const deploy = read("scripts/deploy-vps.sh");
  assert.equal(pkg.engines.node, ">=20.0.0");
  assert.equal(pkg.engines.npm, ">=10.0.0");
  assert.equal(pkg.scripts.preflight, "node scripts/source-preflight.mjs");
  assert.match(preflight, /unresolved internal import/);
  assert.match(preflight, /package-lock\.json/);
  assert.match(deploy, /npm run preflight/);
  assert.match(read(".env.example"), /WORKER_POLL_MS/);
});

test("admin and customer API sessions re-check current account state and role", () => {
  const admin = read("lib/session.ts");
  const customer = read("lib/customer-session.ts");
  assert.match(admin, /prisma\.user\.findUnique/);
  assert.match(admin, /user\.isActive/);
  assert.match(admin, /user\.role !== payload\.role/);
  assert.match(customer, /prisma\.user\.findUnique/);
  assert.match(customer, /user\.role!=="CUSTOMER"/);
});

test("checkout callback verifies captured provider payment and exact order amount", () => {
  const helper = read("lib/payments/razorpay.ts");
  const verify = read("app/api/customer/payments/verify/route.ts");
  assert.match(helper, /\/v1\/payments\/\$\{encodeURIComponent\(paymentId\)\}/);
  assert.match(verify, /fetchCapturedPayment/);
  assert.match(verify, /gatewayPayment\.status!=="captured"/);
  assert.match(verify, /gatewayPayment\.order_id!==d\.razorpay_order_id/);
  assert.match(verify, /payment\.amountPaise!==gatewayPayment\.amount/);
  assert.match(verify, /payment\.currency!==gatewayPayment\.currency/);
});

test("online payment creation is limited to awaiting-payment orders", () => {
  const route = read("app/api/customer/payments/create/route.ts");
  assert.match(route, /order\.status!=="AWAITING_PAYMENT"/);
  assert.doesNotMatch(route, /PENDING_REVIEW/);
});

test("late captured payments awaiting refund can enter the admin refund workflow", () => {
  const route = read("app/api/admin/refunds/route.ts");
  assert.match(route, /\["VERIFIED", "REFUND_PENDING"\]\.includes\(payment\.status\)/);
});

test("private customer file downloads enforce ownership, clean scan status and no-store headers", () => {
  const route = read("app/api/customer/custom-requests/[id]/files/[fileId]/route.ts");
  const storage = read("lib/private-storage.ts");
  assert.match(route, /userId:auth\.userId/);
  assert.match(route, /scanStatus:"CLEAN"/);
  assert.match(route, /Cache-Control":"private, no-store"/);
  assert.match(storage, /randomBytes\(24\)/);
  assert.match(storage, /flag: "wx"/);
  assert.match(storage, /storageKey/);
});

test("custom orders can collect a verified advance and then a separate remaining-balance payment", () => {
  const create = read("app/api/customer/payments/create/route.ts");
  const verify = read("app/api/customer/payments/verify/route.ts");
  const detail = read("app/api/customer/orders/[id]/route.ts");
  const page = read("app/account/orders/[id]/page.tsx");
  assert.match(create, /order\.kind==="CUSTOM"/);
  assert.match(create, /order\.totalPaise-\(verified\._sum\.amountPaise\|\|0\)/);
  assert.match(create, /\["AWAITING_PAYMENT","PAID","IN_PRODUCTION"\]\.includes\(order\.status\)/);
  assert.match(create, /status!=="VERIFIED"\?await prisma\.payment\.update/);
  assert.match(verify, /customBalancePayment/);
  assert.match(verify, /payment\.order\.status==="AWAITING_PAYMENT"/);
  assert.match(detail, /refunds:\{select:\{id:true,status:true,amountPaise:true\}\}/);
  assert.match(page, /Pay remaining balance/);
});

test("production dispatch gate still requires custom-order net captured funds to cover the quote total", () => {
  const production = read("app/api/admin/production/route.ts");
  const orders = read("app/api/admin/orders/route.ts");
  assert.match(production, /job\.order\.kind === "CUSTOM" && paid < job\.order\.totalPaise/);
  assert.match(orders, /production\.order\.kind==="CUSTOM"&&paid<production\.order\.totalPaise/);
});

test("admin pages reject customer sessions and refresh account state from the database", () => {
  const session = read("lib/session.ts");
  const adminLayout = read("app/admin/layout.tsx");
  const accessLayout = read("app/admin/access/layout.tsx");
  assert.match(session, /const user = await prisma\.user\.findUnique/);
  assert.match(session, /user\.role !== payload\.role/);
  assert.match(adminLayout, /getSession\(\)/);
  assert.match(adminLayout, /\["ADMIN", "STAFF"\]\.includes\(session\.role\)/);
  assert.match(accessLayout, /session\.role !== "ADMIN"/);
});

test("staff permissions are least-privilege and default to administrator-only", () => {
  const session = read("lib/session.ts");
  assert.match(session, /options: \{ allowStaff\?: boolean; staffMethods\?: string\[\] \} = \{\}/);
  assert.match(session, /request\.method/);
  assert.match(session, /Administrator permission required/);
  const staffRoute = read("app/api/admin/staff/route.ts");
  assert.match(staffRoute, /requireAdminApi\(request\)/);
  assert.match(staffRoute, /STAFF_ACCESS_GRANTED/);
  assert.match(staffRoute, /STAFF_ACCESS_REVOKED/);
  assert.match(staffRoute, /You cannot change your own access/);
  assert.match(read("app/api/admin/finance/route.ts"), /requireAdminApi\(request\)/);
  assert.doesNotMatch(read("app/api/admin/finance/route.ts"), /allowStaff|staffMethods/);
  assert.match(read("app/api/admin/production/route.ts"), /allowStaff: true/);
  assert.match(read("app/api/admin/orders/route.ts"), /staffMethods: \["GET"\]/);
  assert.match(read("app/api/admin/orders/[id]/shipment/route.ts"), /allowStaff: true/);
  assert.match(read("app/api/admin/inventory/route.ts"), /staffMethods: \["GET"\]/);
});

test("staff access management promotes existing accounts and only toggles STAFF accounts", () => {
  const route = read("app/api/admin/staff/route.ts");
  assert.match(route, /where: \{ email: d\.email \}/);
  assert.match(route, /role: "STAFF", isActive: true/);
  assert.match(route, /where: \{ id: d\.userId, role: "STAFF", isActive: target\.isActive \}/);
  assert.match(route, /STAFF_ACCESS_RESTORED/);
  assert.match(read("app/admin/access/page.tsx"), /Grant staff access/);
  assert.match(read("app/admin/access/page.tsx"), /Revoke access/);
});


test("Phase 43 audit history is administrator-only and paginated", async () => {
  const api = await read("app/api/admin/audit-logs/route.ts");
  const page = await read("app/admin/audit-logs/page.tsx");
  const layout = await read("app/admin/audit-logs/layout.tsx");
  assert.match(api, /requireAdminApi\(request\)/);
  assert.match(api, /pageSize: z\.coerce\.number\(\)\.int\(\)\.min\(10\)\.max\(100\)/);
  assert.match(api, /orderBy: \[\{ createdAt: "desc" \}, \{ id: "desc" \}\]/);
  assert.match(api, /totalPages/);
  assert.match(layout, /session\.role !== "ADMIN"/);
  assert.match(page, /Results update as filters change/);
  assert.match(page, /Previous/);
  assert.match(page, /View filtered metadata/);
});

test("Phase 43 audit metadata redacts sensitive fields and does not expose IP address", async () => {
  const api = await read("app/api/admin/audit-logs/route.ts");
  assert.match(api, /password\|secret\|token\|authorization\|cookie/);
  assert.match(api, /"\[redacted\]"/);
  assert.match(api, /metadata: safeMetadata\(row\.metadata\)/);
  assert.doesNotMatch(api, /ipAddress:\s*true/);
});

test("Phase 43 audit filters validate date ranges and constrain range length", async () => {
  const api = await read("app/api/admin/audit-logs/route.ts");
  assert.match(api, /Choose a valid date range/);
  assert.match(api, /366 \* 86400000/);
  assert.match(api, /from > to/);
});


test("Phase 44 store configuration API is admin-only and uses a strict allowlist", async () => {
  const api = await read("app/api/admin/store-settings/route.ts");
  const page = await read("app/admin/store-settings/page.tsx");
  assert.match(api, /requireAdminApi\(request\)/);
  assert.match(api, /STORE_NAME/);
  assert.match(api, /COD_ENABLED/);
  assert.match(api, /LOW_STOCK_THRESHOLD/);
  assert.match(api, /z\.literal\("Asia\/Kolkata"\)/);
  assert.match(api, /STORE_CONFIGURATION_UPDATED/);
  assert.match(page, /Enable Cash on Delivery/);
  assert.match(page, /COD is disabled by default/);
});

test("Phase 44 public store config exposes only approved business identity fields", async () => {
  const api = await read("app/api/store-config/route.ts");
  assert.match(api, /STORE_NAME.*STORE_TAGLINE.*SUPPORT_EMAIL.*SUPPORT_PHONE.*BUSINESS_ADDRESS/s);
  assert.match(api, /Cache-Control/);
  assert.doesNotMatch(api, /GSTIN|COD_ENABLED|LOW_STOCK_THRESHOLD|RAZORPAY/);
});

test("Phase 44 dashboard links to store settings on desktop and mobile", async () => {
  const page = await read("app/admin/page.tsx");
  assert.match(page, /href="\/admin\/store-settings"/);
  assert.match(page, /Store settings/);
});


test("Phase 45 homepage and custom request page consume dynamic store identity and contact details", async () => {
  const home = await read("app/page.tsx");
  const custom = await read("app/custom-3d-printing/page.tsx");
  const chrome = await read("components/StorefrontConfig.tsx");
  assert.match(home, /StorefrontHeader/);
  assert.match(home, /StoreTagline/);
  assert.match(home, /StoreContactFooter/);
  assert.match(custom, /StoreContactFooter/);
  assert.match(chrome, /\/api\/store-config/);
  assert.match(chrome, /mailto:/);
  assert.match(chrome, /tel:/);
});

test("Phase 45 shop header uses configurable store brand and public API excludes operational secrets", async () => {
  const header = await read("components/StorefrontHeader.tsx");
  const endpoint = await read("app/api/store-config/route.ts");
  assert.match(header, /StoreBrand compact/);
  assert.match(endpoint, /SUPPORT_EMAIL/);
  assert.doesNotMatch(endpoint, /GSTIN|COD_ENABLED|COD_MAX_ORDER_PAISE|RAZORPAY_KEY/);
});

test("Phase 45 fixes audit history filter form without referencing a missing handler", async () => {
  const page = await read("app/admin/audit-logs/page.tsx");
  assert.match(page, /onSubmit=\{e=>e\.preventDefault\(\)\}/);
  assert.doesNotMatch(page, /onSubmit=\{apply\}/);
});


test("Phase 46 storefront chrome is shared across customer routes", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const base = process.cwd();
  const header = fs.readFileSync(path.join(base, "components/StorefrontHeader.tsx"), "utf8");
  assert.match(header, /aria-label="Store navigation"/);
  for (const route of ["app/account/layout.tsx", "components/ProductDetailClient.tsx", "app/checkout/page.tsx", "app/custom-3d-printing/page.tsx"]) {
    assert.ok(fs.existsSync(path.join(base, route)), `missing ${route}`);
    assert.match(fs.readFileSync(path.join(base, route), "utf8"), /StorefrontHeader/);
  }
  const shop = fs.readFileSync(path.join(base, "components/ShopClient.tsx"), "utf8");
  assert.match(shop, /export function CartPageClient/);
  assert.match(shop, /export function WishlistPageClient/);
  assert.match(shop, /StoreContactFooter/);
  assert.ok(!fs.readFileSync(path.join(base, "app/admin/layout.tsx"), "utf8").includes("StorefrontHeader"));
});


test("Phase 47 public help centre and contact page use factual workflow guidance", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const base = process.cwd();
  const help = fs.readFileSync(path.join(base, "app/help/page.tsx"), "utf8");
  const contact = fs.readFileSync(path.join(base, "app/contact/page.tsx"), "utf8");
  const config = fs.readFileSync(path.join(base, "components/StorefrontConfig.tsx"), "utf8");
  assert.match(help, /STL, OBJ or 3MF/);
  assert.match(help, /not automatic approvals/);
  assert.match(help, /does not promise a universal turnaround time/);
  assert.match(contact, /StoreContactDetails/);
  assert.match(config, /aria-label="Help links"/);
  assert.ok(config.includes('href="/help"'));
  assert.ok(config.includes('href="/contact"'));
});


test("Phase 48 checkout waits for synchronized cart and handles verification failures", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const base = process.cwd();
  const cart = fs.readFileSync(path.join(base, "components/ShopClient.tsx"), "utf8");
  const checkout = fs.readFileSync(path.join(base, "app/checkout/page.tsx"), "utf8");
  assert.match(cart, /syncQueue=useRef/);
  assert.match(cart, /setCartSync\("synced"\)/);
  assert.match(cart, /aria-disabled=\{cartSync!=="synced"\|\|lines\.length===0\}/);
  assert.match(cart, /Sign in to continue/);
  assert.match(checkout, /Payment verification failed/);
  assert.match(checkout, /subtotalPaise<=0/);
  assert.match(checkout, /retry payment from order details/);
});


test("Phase 48 client component directives remain before imports", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const base = process.cwd();
  for (const file of ["app/checkout/page.tsx", "components/ShopClient.tsx"]) {
    const source = fs.readFileSync(path.join(base, file), "utf8");
    assert.match(source, /^["']use client["'];/);
  }
});


test("Phase 49 support-approved cancellation restores stock and releases unpaid reservations", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const base = process.cwd();
  const route = fs.readFileSync(path.join(base, "app/api/admin/support/route.ts"), "utf8");
  assert.match(route, /restoreOrderInventory\(tx,current\.orderId/);
  assert.match(route, /couponRedemption\.delete/);
  assert.match(route, /usedCount:\{decrement:1\}/);
  assert.match(route, /status:\{in:\["CREATED","PENDING"\]\}/);
  assert.match(route, /ORDER_STATUS_NOTIFICATION/);
  assert.match(route, /PAYMENT_REQUIRES_REFUND_REVIEW/);
  assert.match(route, /updateMany\(\{where:\{id:current\.orderId,status:current\.order\.status\}/);
});

test("Phase 49 custom order balance includes successful refunds", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const page = fs.readFileSync(path.join(process.cwd(), "app/account/orders/[id]/page.tsx"), "utf8");
  const support = fs.readFileSync(path.join(process.cwd(), "app/account/support/page.tsx"), "utf8");
  assert.match(page, /Successful refunds:/);
  assert.match(page, /order\.totalPaise-\(order\.payments\|\|\[\]\).*order\.refunds/);
  assert.match(support, /Return\/refund enquiries are available after delivery/);
});


test("Phase 50 production and shipment lifecycle writes history and customer notifications", async () => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const base = process.cwd();
  const production = fs.readFileSync(path.join(base, "app/api/admin/production/route.ts"), "utf8");
  const shipment = fs.readFileSync(path.join(base, "app/api/admin/orders/[id]/shipment/route.ts"), "utf8");
  assert.match(production, /status:"IN_PRODUCTION",note:"Production work has started/);
  assert.match(production, /title:"Production started"/);
  assert.match(production, /title:"Order ready to ship"/);
  assert.match(production, /updateMany\(\{ where: \{ id: job\.orderId, status: job\.order\.status \}/);
  assert.match(shipment, /title:nextOrderStatus==="DELIVERED"\?"Order delivered":"Order shipped"/);
  assert.match(shipment, /updateMany\(\{where:\{id:order\.id,status:order\.status\}/);
  assert.match(shipment, /ORDER_STATE_CHANGED/);
});
