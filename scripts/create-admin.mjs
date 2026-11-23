import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || "VEXAUSE Administrator";

if (!email || !password || password.length < 14) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 14 characters) before running this script.");
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "ADMIN", isActive: true },
    create: { name, email, passwordHash, role: "ADMIN", isActive: true },
  });
  console.log(`Admin account provisioned for ${email}`);
} finally {
  await prisma.$disconnect();
}
