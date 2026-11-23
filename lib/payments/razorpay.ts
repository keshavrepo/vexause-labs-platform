import {createHmac,timingSafeEqual} from "node:crypto";
export function razorpayConfigured(){return Boolean(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET&&process.env.RAZORPAY_WEBHOOK_SECRET)}
export function razorpayAuth(){const id=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;if(!id||!secret)throw new Error("RAZORPAY_NOT_CONFIGURED");return {id,secret,authorization:"Basic "+Buffer.from(`${id}:${secret}`).toString("base64")}}
export function verifyCheckoutSignature(orderId:string,paymentId:string,signature:string){
 const secret=process.env.RAZORPAY_KEY_SECRET;if(!secret)return false;
 const expected=createHmac("sha256",secret).update(`${orderId}|${paymentId}`).digest();
 let actual:Buffer;try{actual=Buffer.from(signature,"hex")}catch{return false}
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function verifyWebhookSignature(body:string,signature:string){
 const secret=process.env.RAZORPAY_WEBHOOK_SECRET;if(!secret)return false;
 const expected=createHmac("sha256",secret).update(body).digest();
 let actual:Buffer;try{actual=Buffer.from(signature,"hex")}catch{return false}
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}

export type RazorpayCapturedPayment = { id: string; order_id: string; amount: number; currency: string; status: string };
export async function fetchCapturedPayment(paymentId: string): Promise<RazorpayCapturedPayment | null> {
 const { authorization } = razorpayAuth();
 const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
  method: "GET", headers: { Authorization: authorization }, cache: "no-store",
 });
 if (!response.ok) return null;
 const payment = await response.json().catch(() => null);
 if (!payment || typeof payment.id !== "string" || typeof payment.order_id !== "string" ||
     !Number.isInteger(payment.amount) || typeof payment.currency !== "string" ||
     typeof payment.status !== "string") return null;
 return payment as RazorpayCapturedPayment;
}
