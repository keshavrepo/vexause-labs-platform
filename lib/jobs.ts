import { Prisma, BackgroundJobType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function enqueueJob(
  type: BackgroundJobType,
  payload: Prisma.InputJsonValue,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  return tx.backgroundJob.create({ data: { type, payload } });
}

export async function createUserNotification(
  userId: string,
  title: string,
  message: string,
  href?: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
) {
  return tx.notification.create({
    data: { userId, title, message, href },
  });
}
