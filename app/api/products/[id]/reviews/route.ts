import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reviews = await prisma.productReview.findMany({
    where: { productId: id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, rating: true, title: true, body: true, createdAt: true, user: { select: { name: true } } }
  });
  const summary = await prisma.productReview.aggregate({
    where: { productId: id, status: "APPROVED" },
    _avg: { rating: true }, _count: { _all: true }
  });
  return NextResponse.json({ reviews, summary: { average: summary._avg.rating, count: summary._count._all } });
}
