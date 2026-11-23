import type { Prisma } from "@prisma/client";

export async function ensureTaxInvoice(tx: Prisma.TransactionClient, orderId: string) {
  const existing = await tx.taxInvoice.findUnique({ where: { orderId } });
  if (existing) return existing;
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { address: true, items: true, payments: { where: { status: "VERIFIED" }, select: { id: true } } } });
  if (!order || order.taxPaise <= 0 || !order.payments.length) return null;
  const setting = async (key: string) => (await tx.storeSetting.findUnique({ where: { key } }))?.valueJson;
  const enabled = await setting("GST_ENABLED");
  if (enabled !== true) return null;
  const sellerName = await setting("GST_LEGAL_NAME");
  const sellerGstin = await setting("GSTIN");
  const sellerStateCode = await setting("GST_STATE_CODE");
  const invoicePrefix = await setting("GST_INVOICE_PREFIX");
  if (typeof sellerName !== "string" || typeof sellerStateCode !== "string") throw new Error("GST_INVOICE_SELLER_CONFIG_MISSING");
  const sequence = await tx.$queryRaw<Array<{ value: bigint }>>`SELECT nextval('tax_invoice_number_seq') AS value`;
  const rawCounter = Number(sequence[0]?.value || 1);
  const invoiceNumber = `${typeof invoicePrefix === "string" ? invoicePrefix : "VX"}/${new Date().getUTCFullYear()}/${String(rawCounter).padStart(6,"0")}`;
  const lines = order.items.map(line => ({
    name: line.productName, sku: line.sku, hsnCode: line.hsnCode,
    quantity: line.quantity, unitPricePaise: line.unitPricePaise,
    taxablePaise: line.lineTotalPaise - Math.floor(order.discountPaise * line.lineTotalPaise / Math.max(1,order.subtotalPaise)),
    gstRateBps: line.gstRateBps, taxPaise: line.taxPaise,
  }));
  return tx.taxInvoice.create({ data: {
    invoiceNumber, orderId, sellerName, sellerGstin: typeof sellerGstin === "string" ? sellerGstin : null,
    sellerStateCode, buyerName: order.address?.fullName || "Customer", placeOfSupply: order.address?.state || "Not recorded",
    subtotalPaise: order.subtotalPaise, discountPaise: order.discountPaise,
    taxablePaise: order.subtotalPaise - order.discountPaise, cgstPaise: order.cgstPaise,
    sgstPaise: order.sgstPaise, igstPaise: order.igstPaise, totalTaxPaise: order.taxPaise,
    grandTotalPaise: order.totalPaise, linesJson: lines,
  } });
}
