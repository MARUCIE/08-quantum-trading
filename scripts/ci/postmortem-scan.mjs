#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const outputPath = process.argv[2] ?? "outputs/ci/postmortem/postmortem-scan.md";

function getBaseRef() {
  const baseRef = process.env.GITHUB_BASE_REF;
  if (baseRef) return `origin/${baseRef}`;

  const before = process.env.GITHUB_EVENT_BEFORE;
  if (before && before !== "0000000000000000000000000000000000000000") return before;

  try {
    execSync("git rev-parse --verify HEAD~1", { stdio: "ignore" });
    return "HEAD~1";
  } catch {
    return null;
  }
}

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function listPostmortems() {
  if (!fs.existsSync("postmortem")) return [];
  const files = safeExec("find postmortem -type f -name 'PM-*.md'");
  return files.split(/\n+/).filter(Boolean);
}

function extractTriggers(content) {
  const triggers = new Set();
  const inTriggerSection = content.split(/\n+/);
  let triggerMode = false;

  for (const line of inTriggerSection) {
    if (/^##\s+Triggers/i.test(line.trim())) {
      triggerMode = true;
      continue;
    }
    if (triggerMode && /^##\s+/.test(line.trim())) {
      break;
    }
    if (!triggerMode) continue;

    const bt = [...line.matchAll(/`([^`]{2,120})`/g)].map((m) => m[1]);
    const qt = [...line.matchAll(/"([^"]{2,120})"/g)].map((m) => m[1]);
    for (const token of [...bt, ...qt]) {
      triggers.add(token.trim());
    }
  }

  return [...triggers];
}

const baseRef = getBaseRef();
const postmortems = listPostmortems();

if (!baseRef) {
  const report = [
    "# Postmortem Scan",
    "",
    "- decision: SKIP",
    "- reason: no base ref available",
  ].join("\n");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, report);
  console.log(report);
  process.exit(0);
}

const commitRange = safeExec(`git log --oneline ${baseRef}...HEAD`);
const changedFiles = safeExec(`git diff --name-only ${baseRef}...HEAD`);
const corpus = `${commitRange}\n${changedFiles}`.toLowerCase();

const matches = [];
for (const file of postmortems) {
  const content = fs.readFileSync(file, "utf8");
  const status = /- Status:\s*(open|unresolved|todo)/i.test(content)
    ? "open"
    : "fixed_or_unknown";
  const triggers = extractTriggers(content);
  for (const trigger of triggers) {
    if (trigger.length < 2) continue;
    if (corpus.includes(trigger.toLowerCase())) {
      matches.push({ file, trigger, status });
    }
  }
}

const blocking = matches.filter((m) => m.status === "open");
const reportLines = [];
reportLines.push("# Postmortem Scan");
reportLines.push("");
reportLines.push(`- base_ref: ${baseRef}`);
reportLines.push(`- postmortems_scanned: ${postmortems.length}`);
reportLines.push(`- matches: ${matches.length}`);
reportLines.push(`- blocking_matches: ${blocking.length}`);

if (matches.length > 0) {
  reportLines.push("");
  reportLines.push("## Matches");
  for (const m of matches) {
    reportLines.push(`- [${m.status}] ${m.trigger} :: ${m.file}`);
  }
}

if (blocking.length > 0) {
  reportLines.push("");
  reportLines.push("## Decision");
  reportLines.push("- BLOCK: unresolved postmortem trigger matched release range");
} else {
  reportLines.push("");
  reportLines.push("## Decision");
  reportLines.push("- PASS: no unresolved trigger match");
}

const report = reportLines.join("\n");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, report);
console.log(report);

if (blocking.length > 0) {
  process.exit(1);
}
