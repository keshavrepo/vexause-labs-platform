import test from "node:test";
import assert from "node:assert/strict";
import { calculateOrderTax } from "../lib/order-tax.mjs";

const line = (overrides = {}) => ({
  productId: "product-1",
  productName: "GST product",
  sku: null,
  inventoryAllocated: true,
  quantity: 1,
  unitPricePaise: 10000,
  lineTotalPaise: 10000,
  hsnCode: "12345678",
  gstRateBps: 1800,
  ...overrides,
});

test("GST checkout splits intra-state tax after proportional discount allocation", () => {
  const result = calculateOrderTax(
    [line({ lineTotalPaise: 10001 }), line({ productId: "product-2", lineTotalPaise: 5000, gstRateBps: 500 })],
    1000,
    15001,
    true,
    " Karnataka ",
    "karnataka"
  );

  assert.deepEqual(
    {
      taxPaise: result.taxPaise,
      cgstPaise: result.cgstPaise,
      sgstPaise: result.sgstPaise,
      igstPaise: result.igstPaise,
      totalPaise: result.totalPaise,
      lineTaxes: result.taxLines.map((item) => item.taxPaise),
    },
    { taxPaise: 1913, cgstPaise: 956, sgstPaise: 957, igstPaise: 0, totalPaise: 15914, lineTaxes: [1680, 233] }
  );
  assert.equal(result.taxLines[0].hsnCode, "12345678");
  assert.equal(result.taxLines[0].gstRateBps, 1800);
});

test("GST checkout charges inter-state tax as IGST", () => {
  const result = calculateOrderTax([line({ lineTotalPaise: 50000 })], 0, 50000, true, "Karnataka", "Maharashtra");

  assert.deepEqual(
    { taxPaise: result.taxPaise, cgstPaise: result.cgstPaise, sgstPaise: result.sgstPaise, igstPaise: result.igstPaise, totalPaise: result.totalPaise },
    { taxPaise: 9000, cgstPaise: 0, sgstPaise: 0, igstPaise: 9000, totalPaise: 59000 }
  );
});

test("GST-disabled checkout preserves zero tax and the discounted total", () => {
  const result = calculateOrderTax([line()], 1000, 10000, false, "Karnataka", "Karnataka");

  assert.deepEqual(
    { taxPaise: result.taxPaise, cgstPaise: result.cgstPaise, sgstPaise: result.sgstPaise, igstPaise: result.igstPaise, intraState: result.intraState, totalPaise: result.totalPaise },
    { taxPaise: 0, cgstPaise: 0, sgstPaise: 0, igstPaise: 0, intraState: false, totalPaise: 9000 }
  );
  assert.equal(result.taxLines[0].taxPaise, 0);
  assert.equal(result.taxLines[0].hsnCode, "12345678");
  assert.equal(result.taxLines[0].gstRateBps, 1800);
});
