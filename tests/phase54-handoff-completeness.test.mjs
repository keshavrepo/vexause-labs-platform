import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("release audit checks all owner-configured app, worker, upload and integration settings", () => {
  const audit = fs.readFileSync(new URL("../scripts/release-readiness.mjs", import.meta.url), "utf8");
  const env = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  for (const key of ["ADMIN_NAME","ADMIN_EMAIL","ADMIN_PASSWORD","TRUSTED_ORIGINS","PRIVATE_UPLOAD_DIR","EMAIL_FROM","SMTP_PORT","WORKER_POLL_MS"]) {
    assert.ok(audit.includes(`"${key}"`), `release audit does not check ${key}`);
    assert.match(env, new RegExp(`^${key}=`, "m"), `.env.example does not document ${key}`);
  }
});

test("release handoff explicitly records missing npm cache and external verification limits", () => {
  const doc = fs.readFileSync(new URL("../docs/PHASE-53-FINAL-INTEGRATION-HANDOFF.md", import.meta.url), "utf8");
  assert.match(doc, /lockfile/);
  assert.match(doc, /Prisma baseline/);
  assert.match(doc, /live payment|Razorpay/i);
});
