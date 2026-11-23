import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-session";

export async function GET(request: NextRequest) {
  const auth = await requireCustomer(request);
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const notifications = await prisma.notification.findMany({
    where: { userId: auth.userId!, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, title: true, message: true, href: true, readAt: true, createdAt: true },
  });
  const unreadCount = await prisma.notification.count({ where: { userId: auth.userId!, readAt: null } });
  return NextResponse.json({ notifications, unreadCount }, { headers: { "Cache-Control": "no-store" } });
}

const schema = z.object({
  notificationId: z.string().min(1).optional(),
  markAllRead: z.literal(true).optional(),
}).refine((value) => Boolean(value.notificationId) !== Boolean(value.markAllRead), {
  message: "Provide either notificationId or markAllRead.",
});

export async function PATCH(request: NextRequest) {
  const auth = await requireCustomer(request);
  if (auth.response) return auth.response;
  try {
    const input = schema.parse(await request.json());
    if (input.markAllRead) {
      const result = await prisma.notification.updateMany({
        where: { userId: auth.userId!, readAt: null },
        data: { readAt: new Date() },
      });
      return NextResponse.json({ success: true, updatedCount: result.count });
    }
    const result = await prisma.notification.updateMany({
      where: { id: input.notificationId!, userId: auth.userId!, readAt: null },
      data: { readAt: new Date() },
    });
    if (!result.count) return NextResponse.json({ error: "Notification not found or already read." }, { status: 404 });
    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch {
    return NextResponse.json({ error: "Invalid notification update." }, { status: 400 });
  }
}
