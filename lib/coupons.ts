import {CouponDiscountType} from "@prisma/client";
export function calculateCouponDiscount(input:{discountType:CouponDiscountType;discountValue:number;maxDiscountPaise:number|null;minimumOrderPaise:number},subtotalPaise:number){
 if(subtotalPaise<input.minimumOrderPaise)return 0;
 let discount=input.discountType==="PERCENTAGE"?Math.floor(subtotalPaise*input.discountValue/100):input.discountValue;
 if(input.maxDiscountPaise!==null)discount=Math.min(discount,input.maxDiscountPaise);
 return Math.max(0,Math.min(subtotalPaise,Math.floor(discount)));
}
export function normalizeCouponCode(code:string){return code.trim().toUpperCase().replace(/\s+/g,"");}
