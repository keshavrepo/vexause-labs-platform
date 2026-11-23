import { enforceRateLimit } from "@/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-session";
import { cleanReviewText, REVIEW_MAX_LENGTH, REVIEW_MIN_LENGTH, REVIEW_TITLE_MAX_LENGTH } from "@/lib/reviews";

const reviewSchema = z.object({
  productId: z.string().min(1),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(REVIEW_TITLE_MAX_LENGTH).optional(),
  body: z.string().min(REVIEW_MIN_LENGTH).max(REVIEW_MAX_LENGTH)
});

export async function GET(request: NextRequest) {
  const auth = await requireCustomer(request);
  if (auth.response) return auth.response;
  const reviews = await prisma.productReview.findMany({
    where: { userId: auth.userId! }, orderBy: { createdAt: "desc" },
    select: { id: true, productId: true, orderId: true, rating: true, title: true, body: true, status: true, createdAt: true }
  });
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const rate = await enforceRateLimit(request, { namespace: "customer-review-submit", limit: 10, windowMs: 3600000 });
  if (!rate.allowed) return rate.response;
  const auth = await requireCustomer(request);
  if (auth.response) return auth.response;
  try {
    const input = reviewSchema.parse(await request.json());
    const body = cleanReviewText(input.body);
    const title = input.title ? cleanReviewText(input.title) : undefined;
    if (body.length < REVIEW_MIN_LENGTH) return NextResponse.json({ error: "Please write at least 10 characters." }, { status: 400 });
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId: input.productId,
        orderId: input.orderId,
        order: { userId: auth.userId!, status: "DELIVERED", kind: "STORE" }
      },
      select: { id: true }
    });
    if (!purchased) return NextResponse.json({ error: "A delivered purchase is required to review this product." }, { status: 403 });
    const review = await prisma.productReview.create({
      data: { productId: input.productId, orderId: input.orderId, userId: auth.userId!, rating: input.rating, title, body },
      select: { id: true, rating: true, title: true, body: true, status: true, createdAt: true }
    });
    return NextResponse.json({ review, message: "Review submitted for moderation." }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Please check the review details." }, { status: 400 });
    if (error && typeof error === "object" && "code" in error && error.code === "P2002")
      return NextResponse.json({ error: "You have already reviewed this product." }, { status: 409 });
    return NextResponse.json({ error: "Could not submit review." }, { status: 500 });
  }
}
