import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE = "vexause_google_oauth";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  return value;
}
function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}
export function createOAuthContext() {
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ state, verifier, nonce, exp: Date.now() + 10 * 60_000 })).toString("base64url");
  return {
    state, verifier, nonce,
    cookie: `${payload}.${sign(payload)}`,
    cookieName: COOKIE,
  };
}
export function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}
export function readOAuthContext(cookie: string | undefined) {
  if (!cookie) return null;
  const [payload, signature, extra] = cookie.split(".");
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload), "base64url");
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.state !== "string" || typeof data.verifier !== "string" ||
        typeof data.nonce !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data as { state: string; verifier: string; nonce: string; exp: number };
  } catch { return null; }
}
