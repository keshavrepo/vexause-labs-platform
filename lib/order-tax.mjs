/**
 * @typedef {{
 *   productId: string;
 *   productName: string;
 *   sku: string | null;
 *   variantId?: string;
 *   variantName?: string;
 *   inventoryAllocated: boolean;
 *   quantity: number;
 *   unitPricePaise: number;
 *   lineTotalPaise: number;
 *   hsnCode: string | null;
 *   gstRateBps: number;
 * }} CheckoutLineSnapshot
 *
 * @typedef {CheckoutLineSnapshot & { taxPaise: number }} TaxLine
 *
 * @typedef {{
 *   taxLines: TaxLine[];
 *   taxPaise: number;
 *   cgstPaise: number;
 *   sgstPaise: number;
 *   igstPaise: number;
 *   intraState: boolean;
 *   totalPaise: number;
 * }} OrderTax
 */

/**
 * @param {CheckoutLineSnapshot[]} lines
 * @param {number} discountPaise
 * @param {number} subtotalPaise
 * @param {boolean} gstEnabled
 * @param {string} sellerState
 * @param {string} placeOfSupply
 * @returns {OrderTax}
 */
export function calculateOrderTax(lines, discountPaise, subtotalPaise, gstEnabled, sellerState, placeOfSupply) {
  const normalizeState = (state) => state.trim().toLocaleLowerCase("en-IN");
  const intraState = gstEnabled && normalizeState(sellerState) === normalizeState(placeOfSupply);
  let taxPaise = 0;
  let cgstPaise = 0;
  let sgstPaise = 0;
  let igstPaise = 0;

  const taxLines = lines.map((line) => {
    const lineDiscountPaise = gstEnabled
      ? Math.floor(discountPaise * line.lineTotalPaise / Math.max(1, subtotalPaise))
      : 0;
    const taxablePaise = line.lineTotalPaise - lineDiscountPaise;
    const lineTaxPaise = gstEnabled
      ? Math.round(taxablePaise * line.gstRateBps / 10_000)
      : 0;

    taxPaise += lineTaxPaise;
    if (intraState) {
      const lineCgstPaise = Math.floor(lineTaxPaise / 2);
      cgstPaise += lineCgstPaise;
      sgstPaise += lineTaxPaise - lineCgstPaise;
    } else if (gstEnabled) {
      igstPaise += lineTaxPaise;
    }

    return { ...line, taxPaise: lineTaxPaise };
  });

  return {
    taxLines,
    taxPaise,
    cgstPaise,
    sgstPaise,
    igstPaise,
    intraState,
    totalPaise: subtotalPaise - discountPaise + taxPaise,
  };
}
