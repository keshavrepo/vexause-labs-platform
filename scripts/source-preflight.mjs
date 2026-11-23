#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"];
const problems = [];
let sourceCount = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
      sourceCount++;
      const source = fs.readFileSync(full, "utf8");
      const imports = [
        ...source.matchAll(/(?:from\s*|import\s*\()\s*["']([^"']+)["']/g),
      ];
      for (const match of imports) {
        const specifier = match[1];
        if (!specifier.startsWith("@/") && !specifier.startsWith(".")) continue;
        const base = specifier.startsWith("@/")
          ? path.join(root, specifier.slice(2))
          : path.resolve(path.dirname(full), specifier);
        const candidates = [base, ...sourceExtensions.map((ext) => base + ext),
          ...sourceExtensions.map((ext) => path.join(base, "index" + ext))];
        if (!candidates.some((candidate) => {
          try { return fs.statSync(candidate).isFile(); } catch { return false; }
        })) {
          problems.push(`${path.relative(root, full)}: unresolved internal import ${specifier}`);
        }
      }
    }
  }
}

walk(root);
const required = ["next", "react", "react-dom", "@prisma/client", "prisma", "typescript"];
for (const name of required) {
  if (!(pkg.dependencies?.[name] || pkg.devDependencies?.[name])) {
    problems.push(`package.json: required dependency ${name} is missing`);
  }
}
if (!pkg.engines?.node || !pkg.engines?.npm) {
  problems.push("package.json: Node.js and npm engine ranges must be declared");
}
if (!process.argv.includes("--source-only") && !fs.existsSync(path.join(root, "package-lock.json"))) {
  problems.push("package-lock.json is missing; generate and commit it before deployment");
}
if (problems.length) {
  console.error(`Source preflight found ${problems.length} issue(s):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}
console.log(`Source preflight passed: ${sourceCount} source files; internal imports and package metadata look consistent.`);
