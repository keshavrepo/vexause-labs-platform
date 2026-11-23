import { enforceRateLimit } from "@/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const rate = await enforceRateLimit(request, { namespace: "admin-login", limit: 10, windowMs: 900000 });
  if (!rate.allowed) return rate.response;
  try {
    const body = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });

    // Use the same response for unknown users and wrong passwords.
    if (!user || !user.isActive || !["ADMIN", "STAFF"].includes(user.role) ||
        !(await bcrypt.compare(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSession(user);
    return NextResponse.json({
      ok: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    console.error("Admin login failed", error);
    return NextResponse.json({ error: "Unable to sign in" }, { status: 500 });
  }
}
