import { NextRequest, NextResponse } from "next/server";
import { createOAuthContext, pkceChallenge } from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Google sign-in is not configured on this server yet." }, { status: 503 });
  }
  try {
    const configuredCallback = new URL(redirectUri);
    if (configuredCallback.pathname !== "/api/customer/google/callback" ||
        (process.env.NODE_ENV === "production" && configuredCallback.protocol !== "https:")) {
      return NextResponse.json({ error: "Google redirect URI configuration is invalid." }, { status: 503 });
    }
    const context = createOAuthContext();
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", context.state);
    url.searchParams.set("nonce", context.nonce);
    url.searchParams.set("code_challenge", pkceChallenge(context.verifier));
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("prompt", "select_account");
    const response = NextResponse.redirect(url);
    response.cookies.set(context.cookieName, context.cookie, {
      httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "lax", path: "/", maxAge: 600,
    });
    return response;
  } catch (error) {
    console.error("Google OAuth start failed", error);
    return NextResponse.json({ error: "Unable to start Google sign-in." }, { status: 500 });
  }
}
