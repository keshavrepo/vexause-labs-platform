import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Phase 51 release audit exists and blocks missing lockfile and baseline migration", () => {
  const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const source = fs.readFileSync(new URL("../scripts/release-readiness.mjs", import.meta.url), "utf8");
  const guide = fs.readFileSync(new URL("../docs/PHASE-51-RELEASE-READINESS-HANDOFF.md", import.meta.url), "utf8");
  assert.equal(pkg.scripts["release:audit"], "node scripts/release-readiness.mjs");
  assert.match(source, /Committed npm lockfile/);
  assert.match(source, /Initial baseline migration SQL/);
  assert.match(source, /process\.exitCode = 1/);
  assert.match(guide, /Do not run migrations against a real database/);
  assert.match(guide, /real Android\/iOS-sized browsers/);
});
