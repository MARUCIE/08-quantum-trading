import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { afterEach, describe, expect, it } from "vitest";
import { AuditLogger } from "./audit";

type TestAuditEntry = {
  timestamp: number;
  action: "system_event";
  actor: string;
  subject: string;
  details: Record<string, unknown>;
  hash: string;
};

function currentAuditFilename(): string {
  return `audit_${new Date().toISOString().slice(0, 10)}.jsonl`;
}

function makeEntry(index: number): TestAuditEntry {
  return {
    timestamp: 1700000000000 + index,
    action: "system_event",
    actor: "test",
    subject: `subject-${index}`,
    details: { index },
    hash: `h${index}`,
  };
}

describe("AuditLogger file loading", () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("loads all entries when file is within max byte limit", () => {
    const dir = mkdtempSync(join(tmpdir(), "audit-logger-"));
    tempDirs.push(dir);
    const file = join(dir, currentAuditFilename());
    const lines = Array.from({ length: 5 }, (_, i) => JSON.stringify(makeEntry(i))).join("\n") + "\n";
    writeFileSync(file, lines, "utf-8");

    const logger = new AuditLogger(dir, 1024 * 1024);
    const stats = logger.getStats();
    const latest = logger.query({ limit: 1 })[0];

    expect(stats.totalEntries).toBe(5);
    expect(latest?.subject).toBe("subject-4");
    logger.stop();
  });

  it("loads tail entries when file exceeds max byte limit", () => {
    const dir = mkdtempSync(join(tmpdir(), "audit-logger-"));
    tempDirs.push(dir);
    const file = join(dir, currentAuditFilename());
    const lines = Array.from({ length: 40 }, (_, i) => JSON.stringify(makeEntry(i))).join("\n") + "\n";
    writeFileSync(file, lines, "utf-8");

    const logger = new AuditLogger(dir, 350);
    const stats = logger.getStats();
    const latest = logger.query({ limit: 1 })[0];

    expect(stats.totalEntries).toBeGreaterThan(0);
    expect(stats.totalEntries).toBeLessThan(40);
    expect(latest?.subject).toBe("subject-39");
    logger.stop();
  });
});
