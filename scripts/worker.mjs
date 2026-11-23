import { PrismaClient } from "@prisma/client";
import os from "node:os";
import crypto from "node:crypto";
import nodemailer from "nodemailer";

const prisma = new PrismaClient({ log: ["error"] });
const workerId = `${os.hostname()}-${process.pid}-${crypto.randomBytes(4).toString("hex")}`;
const pollMs = Number(process.env.WORKER_POLL_MS || 3000);
const idleExit = process.env.WORKER_ONCE === "true";

async function claim() {
  const staleBefore = new Date(Date.now() - 5 * 60_000);
  await prisma.backgroundJob.updateMany({
    where: { status: "PROCESSING", lockedAt: { lt: staleBefore } },
    data: { status: "PENDING", lockedAt: null, lockedBy: null, runAt: new Date(), lastError: "Recovered stale job lock after worker interruption." },
  });
  const candidate = await prisma.backgroundJob.findFirst({
    where: {
      status: "PENDING",
      runAt: { lte: new Date() },
      attempts: { lt: 5 },
    },
    orderBy: [{ runAt: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!candidate) return null;
  const claimed = await prisma.backgroundJob.updateMany({
    where: { id: candidate.id, status: "PENDING" },
    data: { status: "PROCESSING", lockedAt: new Date(), lockedBy: workerId, attempts: { increment: 1 } },
  });
  if (!claimed.count) return null;
  return prisma.backgroundJob.findUnique({ where: { id: candidate.id } });
}

async function handle(job) {
  const payload = job.payload ?? {};
  if (job.type === "ORDER_STATUS_NOTIFICATION") {
    const userId = payload.userId;
    if (typeof userId !== "string") throw new Error("Missing userId in notification payload");
    await prisma.notification.create({
      data: {
        userId,
        title: typeof payload.title === "string" ? payload.title : "Order update",
        message: typeof payload.message === "string" ? payload.message : "Your order has been updated.",
        href: typeof payload.href === "string" ? payload.href : "/account/orders",
      },
    });
    return;
  }
  if (job.type === "SERVICE_REQUEST_NOTIFICATION") {
    const userId = payload.userId;
    if (typeof userId !== "string") throw new Error("Missing userId in service notification payload");
    await prisma.notification.create({
      data: {
        userId,
        title: typeof payload.title === "string" ? payload.title : "Support request update",
        message: typeof payload.message === "string" ? payload.message : "Your support request has been updated.",
        href: typeof payload.href === "string" ? payload.href : "/account/support",
      },
    });
    return;
  }
  if (job.type === "EMAIL_DELIVERY") {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.EMAIL_FROM;
    if (!host || !user || !pass || !from) {
      throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM.");
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT is invalid.");
    if (typeof payload.to !== "string" || typeof payload.subject !== "string" ||
        typeof payload.text !== "string" || typeof payload.html !== "string") {
      throw new Error("EMAIL_DELIVERY payload is incomplete.");
    }
    const transporter = nodemailer.createTransport({
      host, port, secure: port === 465,
      auth: { user, pass },
      requireTLS: port !== 465,
      tls: { minVersion: "TLSv1.2" },
    });
    await transporter.sendMail({
      from, to: payload.to, subject: payload.subject,
      text: payload.text, html: payload.html,
    });
    await transporter.close();
    return;
  }
  throw new Error(`Unsupported job type: ${job.type}`);
}

async function processOne() {
  const job = await claim();
  if (!job) return false;
  try {
    await handle(job);
    await prisma.backgroundJob.updateMany({
      where: { id: job.id, status: "PROCESSING", lockedBy: workerId },
      data: { status: "COMPLETED", completedAt: new Date(), lockedAt: null, lockedBy: null, lastError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown worker error";
    const retry = job.attempts < job.maxAttempts;
    await prisma.backgroundJob.updateMany({
      where: { id: job.id, status: "PROCESSING", lockedBy: workerId },
      data: {
        status: retry ? "PENDING" : "FAILED",
        runAt: retry ? new Date(Date.now() + Math.min(60_000 * 2 ** (job.attempts - 1), 60 * 60_000)) : job.runAt,
        lockedAt: null, lockedBy: null, lastError: message,
      },
    });
  }
  return true;
}

let stopping = false;
process.on("SIGINT", () => { stopping = true; });
process.on("SIGTERM", () => { stopping = true; });

try {
  do {
    const worked = await processOne();
    if (idleExit) break;
    if (!worked) await new Promise(resolve => setTimeout(resolve, pollMs));
  } while (!stopping);
} finally {
  await prisma.$disconnect();
}
