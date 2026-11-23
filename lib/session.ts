import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "vexause_session";
const secret = () => {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return new TextEncoder().encode(value);
};

export async function createSession(user: { id: string; role: UserRole }) {
  const token = await new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || typeof payload.role !== "string") return null;
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, isActive: true } });
    if (!user || !user.isActive || user.role !== payload.role) return null;
    return { userId: user.id, role: user.role };
  } catch {
    return null;
  }
}

export async function requireAdminApi(request: NextRequest, options: { allowStaff?: boolean; staffMethods?: string[] } = {}) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return { session: null, response: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !["ADMIN", "STAFF"].includes(String(payload.role))) {
      return { session: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    const staffAllowed = options.allowStaff === true || (options.staffMethods || []).includes(request.method);
    if (payload.role === "STAFF" && !staffAllowed) {
      return { session: null, response: NextResponse.json({ error: "Administrator permission required" }, { status: 403 }) };
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, isActive: true } });
    if (!user || !user.isActive || !["ADMIN", "STAFF"].includes(user.role) || user.role !== payload.role) {
      return { session: null, response: NextResponse.json({ error: "Session is no longer authorised" }, { status: 401 }) };
    }
    return { session: { userId: user.id, role: user.role }, response: null };
  } catch {
    return { session: null, response: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
  }
}
