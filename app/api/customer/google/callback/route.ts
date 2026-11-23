import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setCustomerSession } from "@/lib/customer-session";
import { readOAuthContext } from "@/lib/google-oauth";

function fail(request: NextRequest, reason: string) {
  const url = new URL("/account/login", request.url);
  url.searchParams.set("google_error", reason);
  const response = NextResponse.redirect(url);
  response.cookies.delete("vexause_google_oauth");
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) return fail(request, "Google sign-in was cancelled or denied.");
  const context = readOAuthContext(request.cookies.get("vexause_google_oauth")?.value);
  if (!code || !state || !context || state !== context.state) return fail(request, "Google sign-in session expired. Please try again.");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return fail(request, "Google sign-in is not configured.");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: "authorization_code",
        code_verifier: context.verifier,
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return fail(request, "Google could not complete sign-in. Please retry.");
    const tokens = await tokenResponse.json() as { id_token?: string };
    if (!tokens.id_token) return fail(request, "Google did not return a verified identity.");

    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`, { cache: "no-store" });
    if (!verifyResponse.ok) return fail(request, "Google identity verification failed.");
    const identity = await verifyResponse.json() as {
      aud?: string; iss?: string; exp?: string; sub?: string; email?: string;
      email_verified?: string; name?: string; nonce?: string;
    };
    const expires = Number(identity.exp || 0);
    const issuerValid = identity.iss === "https://accounts.google.com" || identity.iss === "accounts.google.com";
    if (identity.aud !== clientId || !issuerValid || expires * 1000 <= Date.now() ||
        identity.nonce !== context.nonce || identity.email_verified !== "true" ||
        !identity.sub || !identity.email) {
      return fail(request, "Google account details could not be verified.");
    }

    const email = identity.email.toLowerCase();
    const existingLink = await prisma.googleAccount.findUnique({
      where: { providerAccountId: identity.sub }, include: { user: true },
    });
    let user = existingLink?.user ?? null;
    if (user && (!user.isActive || user.role !== "CUSTOMER")) return fail(request, "This account cannot sign in as a customer.");

    if (!user) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        if (!existingUser.isActive || existingUser.role !== "CUSTOMER") return fail(request, "This email is already associated with an account that cannot use customer sign-in.");
        user = existingUser;
      } else {
        const randomPassword = randomBytes(48).toString("base64url");
        const passwordHash = await bcrypt.hash(randomPassword, 12);
        user = await prisma.user.create({
          data: { name: (identity.name || email.split("@")[0]).slice(0, 100), email, passwordHash, role: "CUSTOMER", emailVerifiedAt: new Date() },
        });
      }
      await prisma.googleAccount.create({ data: { userId: user.id, providerAccountId: identity.sub, email } });
    } else if (!user.emailVerifiedAt) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    }

    await setCustomerSession(user.id);
    const response = NextResponse.redirect(new URL("/account", request.url));
    response.cookies.delete("vexause_google_oauth");
    return response;
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return fail(request, "Unable to complete Google sign-in. Please try again.");
  }
}
