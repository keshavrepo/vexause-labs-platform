import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];
const add = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });
const exists = (rel) => fs.existsSync(path.join(root, rel));

add("Node package manifest", exists("package.json"), "package.json must exist");
add("Committed npm lockfile", exists("package-lock.json"), "Required for deterministic npm ci deployment");
add("Prisma migration lock", exists("prisma/migrations/migration_lock.toml"), "Required for migration chain");
const migrationRoot = path.join(root, "prisma/migrations");
const migrations = fs.existsSync(migrationRoot)
  ? fs.readdirSync(migrationRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  : [];
add("Initial baseline migration SQL", migrations.some((name) => fs.existsSync(path.join(migrationRoot, name, "migration.sql")) && name < "20261123000100_google_account"), "Generate and review the baseline SQL before applying migrations to a new database");
add("Environment template", exists(".env.example"), "Document required deployment variables");
add("Deployment runbook", exists("docs/PHASE-20-PRODUCTION-DEPLOYMENT-FOUNDATION.md"), "VPS setup and rollback guidance must be present");
add("Owner launch checklist", exists("docs/OWNER-LAUNCH-CHECKLIST.md"), "Owner must complete credential, domain, backup and smoke-test steps");
add("ESLint tooling and configuration", Boolean(JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).devDependencies?.eslint && JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).devDependencies?.["eslint-config-next"] && exists(".eslintrc.json")), "npm run lint requires ESLint and the Next.js ruleset");
add("Typecheck command", Boolean(JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).scripts?.typecheck), "Run npm run typecheck after installing dependencies");

const envText = exists(".env.example") ? fs.readFileSync(path.join(root, ".env.example"), "utf8") : "";
for (const key of ["DATABASE_URL", "DIRECT_URL", "SESSION_SECRET", "RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET", "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REDIRECT_URI", "NEXT_PUBLIC_SITE_URL", "TRUSTED_ORIGINS", "PRIVATE_UPLOAD_DIR", "ADMIN_NAME", "ADMIN_EMAIL", "ADMIN_PASSWORD", "EMAIL_FROM", "SMTP_PORT", "WORKER_POLL_MS"]) {
  add(`Environment variable documented: ${key}`, new RegExp(`^${key}=`, "m").test(envText), "Must be configured in the VPS environment; never commit real secrets");
}

const failed = checks.filter((item) => !item.ok);
console.log(`VEXAUSE release readiness: ${checks.length - failed.length}/${checks.length} checks passed`);
for (const item of checks) console.log(`${item.ok ? "PASS" : "BLOCK"}  ${item.name} — ${item.detail}`);
if (failed.length) {
  console.error(`Release is NOT READY: ${failed.length} blocker(s) remain.`);
  process.exitCode = 1;
} else {
  console.log("Static release prerequisites are present. This does not replace live deployment, payment, email, database, browser or mobile testing.");
}
