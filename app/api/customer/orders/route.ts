import { enforceRateLimit } from "@/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-session";
import { calculateCouponDiscount, normalizeCouponCode } from "@/lib/coupons";
import { calculateOrderTax } from "@/lib/order-tax.mjs";

export async function GET(request: NextRequest) {
  const auth = await requireCustomer(request);
  if (auth.response) return auth.response;
  const orders = await prisma.order.findMany({
    where: { userId: auth.userId! }, orderBy: { createdAt: "desc" },
    select: { id: true, orderCode: true, status: true, kind: true, totalPaise: true, createdAt: true, paymentMethod: true,
      items: { select: { id: true, productId: true, productName: true, sku: true, variantId: true, variantName: true, quantity: true, unitPricePaise: true, lineTotalPaise: true } },
      shipments: { select: { carrier: true, trackingNumber: true, trackingUrl: true, status: true, shippedAt: true } } }
  });
  return NextResponse.json({ orders });
}
const createSchema = z.object({ addressId: z.string().min(1), customerNotes: z.string().max(500).optional(), paymentMethod: z.enum(["COD","RAZORPAY"]), couponCode: z.string().max(40).optional() });
export async function POST(request: NextRequest) {
  const rate = await enforceRateLimit(request, { namespace: "customer-order-create", limit: 10, windowMs: 3600000 });
  if (!rate.allowed) return rate.response;
  const auth = await requireCustomer(request);
  if (auth.response) return auth.response;
  try {
    const input = createSchema.parse(await request.json());
    const address = await prisma.address.findFirst({ where: { id: input.addressId, userId: auth.userId! } });
    if (!address) return NextResponse.json({ error: "Please choose a valid delivery address." }, { status: 400 });
    const codSetting = await prisma.storeSetting.findUnique({ where: { key: "COD_ENABLED" } });
    const codMaxSetting = await prisma.storeSetting.findUnique({ where: { key: "COD_MAX_ORDER_PAISE" } });
    if(input.paymentMethod==="COD"&&codSetting?.valueJson!==true) return NextResponse.json({error:"Cash on Delivery is not enabled."},{status:409});
    if(input.paymentMethod==="RAZORPAY"&&(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET||!process.env.RAZORPAY_WEBHOOK_SECRET)) return NextResponse.json({error:"Online payment is not configured yet."},{status:503});
    const order = await prisma.$transaction(async tx => {
      const cart = await tx.cart.findUnique({ where: { userId: auth.userId! }, include: { items: { include: { product: { include: { variants: { where: { isActive: true }, select: { id: true } } } }, variant: true } } } });
      if (!cart || !cart.items.length) throw new Error("CART_EMPTY");
      let subtotalPaise = 0;
      const snapshots: { productId: string; productName: string; sku: string | null; variantId?: string; variantName?: string; inventoryAllocated: boolean; quantity: number; unitPricePaise: number; lineTotalPaise: number; hsnCode: string | null; gstRateBps: number }[] = [];
      for (const item of cart.items) {
        const { product, variant, quantity } = item;
        if (!product.isPublished) throw new Error("PRODUCT_UNAVAILABLE");
        if (product.variants.length > 0 && !variant) throw new Error("VARIANT_SELECTION_REQUIRED");
        if (product.variants.length === 0 && variant) throw new Error("VARIANT_INVALID");
        if (variant && (variant.productId !== product.id || !variant.isActive)) throw new Error("VARIANT_INVALID");
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("INVALID_QUANTITY");
        const track = variant ? variant.trackInventory : product.trackInventory;
        const stock = variant ? variant.stockQuantity : product.stockQuantity;
        if (track && quantity > stock) throw new Error("INSUFFICIENT_STOCK");
        const unitPricePaise = variant?.pricePaise ?? product.pricePaise;
        const lineTotalPaise = unitPricePaise * quantity;
        if (!Number.isSafeInteger(lineTotalPaise) || lineTotalPaise < 0) throw new Error("INVALID_PRICE");
        subtotalPaise += lineTotalPaise;
        snapshots.push({
          productId: product.id,
          productName: variant ? `${product.name} — ${variant.name}` : product.name,
          sku: variant?.sku ?? product.sku,
          ...(variant ? { variantId: variant.id, variantName: variant.name } : {}),
          inventoryAllocated: track,
          quantity, unitPricePaise, lineTotalPaise,
          hsnCode: product.hsnCode,
          gstRateBps: product.gstRateBps,
        });
      }
      if (!Number.isSafeInteger(subtotalPaise)||subtotalPaise<=0) throw new Error("INVALID_TOTAL");
      const maxPaise=typeof codMaxSetting?.valueJson==="number"?codMaxSetting.valueJson:0;
      if(input.paymentMethod==="COD"&&maxPaise>0&&subtotalPaise>maxPaise) throw new Error("COD_LIMIT");
      let coupon:any=null;let discountPaise=0;
      if(input.couponCode?.trim()){
        coupon=await tx.coupon.findUnique({where:{code:normalizeCouponCode(input.couponCode)}});
        const now=new Date();
        if(!coupon||!coupon.isActive)throw new Error("COUPON_INVALID");
        if((coupon.startsAt&&coupon.startsAt>now)||(coupon.expiresAt&&coupon.expiresAt<now))throw new Error("COUPON_EXPIRED");
        if(coupon.usageLimit!==null&&coupon.usedCount>=coupon.usageLimit)throw new Error("COUPON_LIMIT");
        const customerUses=await tx.couponRedemption.count({where:{couponId:coupon.id,userId:auth.userId!}});
        if(customerUses>=coupon.perCustomerLimit)throw new Error("COUPON_CUSTOMER_LIMIT");
        if(subtotalPaise<coupon.minimumOrderPaise)throw new Error("COUPON_MINIMUM");
        discountPaise=calculateCouponDiscount(coupon,subtotalPaise);
        if(discountPaise<=0)throw new Error("COUPON_INVALID");
        const claimed=await tx.coupon.updateMany({where:{id:coupon.id,isActive:true,usedCount:coupon.usedCount,...(coupon.usageLimit!==null?{usedCount:{equals:coupon.usedCount,lt:coupon.usageLimit}}:{})},data:{usedCount:{increment:1}}});
        if(claimed.count!==1)throw new Error("COUPON_LIMIT");
      }
      const gstSettings = await tx.storeSetting.findMany({
        where: { key: { in: ["GST_ENABLED", "GST_LEGAL_NAME", "GST_STATE_NAME", "GST_STATE_CODE"] } },
        select: { key: true, valueJson: true },
      });
      const gstConfig = new Map(gstSettings.map(setting => [setting.key, setting.valueJson]));
      const gstEnabled = gstConfig.get("GST_ENABLED") === true;
      const legalNameValue = gstConfig.get("GST_LEGAL_NAME");
      const sellerStateValue = gstConfig.get("GST_STATE_NAME");
      const sellerStateCodeValue = gstConfig.get("GST_STATE_CODE");
      const sellerState = typeof sellerStateValue === "string" ? sellerStateValue.trim() : "";
      const sellerStateCode = typeof sellerStateCodeValue === "string" ? sellerStateCodeValue.trim() : "";
      if (gstEnabled && (
        typeof legalNameValue !== "string" || !legalNameValue.trim() ||
        !sellerState || !sellerStateCode
      )) throw new Error("GST_CONFIGURATION_INCOMPLETE");
      const tax = calculateOrderTax(snapshots, discountPaise, subtotalPaise, gstEnabled, sellerState, address.state);
      const { taxLines, taxPaise, cgstPaise, sgstPaise, igstPaise, intraState, totalPaise } = tax;
      if(!Number.isSafeInteger(totalPaise)||totalPaise<=0)throw new Error("INVALID_TOTAL");
      const orderCode=`VX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
      const created=await tx.order.create({data:{
        orderCode,userId:auth.userId!,addressId:address.id,kind:"STORE",status:input.paymentMethod==="COD"?"PENDING_REVIEW":"AWAITING_PAYMENT",
        subtotalPaise,discountPaise,taxPaise,cgstPaise,sgstPaise,igstPaise,
        taxSnapshot:gstEnabled?{sellerState,sellerStateCode,placeOfSupply:address.state,intraState,lines:taxLines.map(x=>({productName:x.productName,hsnCode:x.hsnCode,gstRateBps:x.gstRateBps,taxPaise:x.taxPaise}))}:undefined,
        couponId:coupon?.id,couponCode:coupon?.code,totalPaise,paymentMethod:input.paymentMethod,codEligible:input.paymentMethod==="COD",customerNotes:input.customerNotes,
        items:{create:taxLines},statusHistory:{create:{status:input.paymentMethod==="COD"?"PENDING_REVIEW":"AWAITING_PAYMENT",note:coupon?`Order placed with coupon ${coupon.code}`:"Order placed by customer"}},
        payments:{create:{method:input.paymentMethod,status:input.paymentMethod==="COD"?"PENDING":"CREATED",amountPaise:totalPaise}}
      },select:{id:true,orderCode:true,status:true,totalPaise:true,createdAt:true}});
      for (const item of cart.items) {
        const variant = item.variant;
        const product = item.product;
        if (variant ? variant.trackInventory : product.trackInventory) {
          const changed = variant
            ? await tx.productVariant.updateMany({ where: { id: variant.id, productId: product.id, isActive: true, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } })
            : await tx.product.updateMany({ where: { id: product.id, isPublished: true, stockQuantity: { gte: item.quantity } }, data: { stockQuantity: { decrement: item.quantity } } });
          if (changed.count !== 1) throw new Error("INSUFFICIENT_STOCK");
          if (!variant) await tx.inventoryMovement.create({ data: { productId: product.id, type: "STOCK_OUT", quantity: item.quantity, reason: "Customer order stock allocation", referenceId: created.id } });
        }
      }
      if(coupon)await tx.couponRedemption.create({data:{couponId:coupon.id,orderId:created.id,userId:auth.userId!,code:coupon.code,discountPaise}});
      await tx.cartItem.deleteMany({where:{cartId:cart.id}});
      return {...created,subtotalPaise,discountPaise,taxPaise,cgstPaise,sgstPaise,igstPaise,couponCode:coupon?.code||null};
    },{isolationLevel:"Serializable"});
    return NextResponse.json({order},{status:201});
  } catch(error) {
    const code=error instanceof Error?error.message:"";
    const messages:Record<string,string>={CART_EMPTY:"Your cart is empty.",PRODUCT_UNAVAILABLE:"A product in your cart is no longer available.",VARIANT_SELECTION_REQUIRED:"A product in your cart requires a variant selection. Choose an option before ordering.",VARIANT_INVALID:"A selected product option is no longer available.",INVALID_QUANTITY:"A cart quantity is invalid.",INSUFFICIENT_STOCK:"Stock changed. Please review your cart.",INVALID_PRICE:"A product price is invalid. Please contact support.",INVALID_TOTAL:"The order total could not be calculated.",COD_LIMIT:"This order is above the current Cash on Delivery limit.",GST_CONFIGURATION_INCOMPLETE:"GST is enabled but seller state details are incomplete. Please contact support."};
    if(error instanceof z.ZodError)return NextResponse.json({error:"Invalid checkout details."},{status:400});
    if(messages[code])return NextResponse.json({error:messages[code]},{status:409});
    return NextResponse.json({error:"Could not place your order. Please try again."},{status:500});
  }
}
