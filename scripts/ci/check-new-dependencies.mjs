#!/usr/bin/env node

import fs from "node:fs";
import { execSync } from "node:child_process";

const allowlistPath = process.argv[2] ?? "configs/dependency-allowlist.json";
const packageJsonPaths = ["frontend/package.json", "backend/package.json"];
const depSections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

function readCurrentJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonAtRef(ref, filePath) {
  try {
    const content = execSync(`git show ${ref}:${filePath}`, { encoding: "utf8" });
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function depSet(pkgJson) {
  const out = new Set();
  for (const section of depSections) {
    const deps = pkgJson?.[section] ?? {};
    for (const dep of Object.keys(deps)) {
      out.add(dep);
    }
  }
  return out;
}

function getBaseRef() {
  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef) {
    return `origin/${baseRef}`;
  }
  const before = process.env.GITHUB_EVENT_BEFORE;
  if (before && before !== "0000000000000000000000000000000000000000") {
    return before;
  }
  try {
    execSync("git rev-parse --verify HEAD~1", { stdio: "ignore" });
    return "HEAD~1";
  } catch {
    return null;
  }
}

const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
const allowed = new Set(allowlist.allowed_new_dependencies ?? []);
const baseRef = getBaseRef();

if (!baseRef) {
  console.log("[allowlist] no base ref available, skip new dependency diff check");
  process.exit(0);
}

const violations = [];
const additions = [];

for (const filePath of packageJsonPaths) {
  const current = readCurrentJson(filePath);
  const previous = readJsonAtRef(baseRef, filePath);

  const currentDeps = depSet(current);
  const previousDeps = depSet(previous);

  for (const dep of currentDeps) {
    if (!previousDeps.has(dep)) {
      additions.push({ filePath, dep });
      if (!allowed.has(dep)) {
        violations.push({ filePath, dep });
      }
    }
  }
}

if (additions.length === 0) {
  console.log("[allowlist] no new dependencies detected");
  process.exit(0);
}

console.log("[allowlist] detected new dependencies:");
for (const item of additions) {
  console.log(`- ${item.filePath}: ${item.dep}`);
}

if (violations.length > 0) {
  console.error("[allowlist] blocked: dependency not in configs/dependency-allowlist.json");
  for (const item of violations) {
    console.error(`- ${item.filePath}: ${item.dep}`);
  }
  process.exit(1);
}

console.log("[allowlist] pass: all new dependencies are allowlisted");
