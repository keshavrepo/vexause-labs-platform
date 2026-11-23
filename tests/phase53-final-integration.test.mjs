import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("deployment scripts contain real command boundaries, not escaped newline text", () => {
  for (const file of ["scripts/deploy-vps.sh", "scripts/predeploy-check.sh"]) {
    const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    assert.ok(!source.split("\n").some((line) => /\\n(?:npm|echo|bash|npx|sudo)\b/.test(line)), `${file} has a literal escaped newline`);
  }
  const predeploy = fs.readFileSync(new URL("../scripts/predeploy-check.sh", import.meta.url), "utf8");
  assert.match(predeploy, /bash scripts\/check-migration-chain\.sh\n echo|bash scripts\/check-migration-chain\.sh\necho/);
});

test("lint and typecheck commands have their required development tooling declared", () => {
  const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(pkg.scripts.lint, "eslint .");
  assert.equal(pkg.scripts.typecheck, "tsc --noEmit");
  assert.ok(pkg.devDependencies.eslint);
  assert.ok(pkg.devDependencies["eslint-config-next"]);
  const config = JSON.parse(fs.readFileSync(new URL("../.eslintrc.json", import.meta.url), "utf8"));
  assert.equal(config.extends, "next/core-web-vitals");
});
