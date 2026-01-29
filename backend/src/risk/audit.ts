/**
 * Audit Logger
 *
 * Immutable audit trail for compliance and debugging.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

/** Audit entry types */
type AuditAction =
  | 'order_submit'
  | 'order_fill'
  | 'order_cancel'
  | 'order_reject'
  | 'position_open'
  | 'position_close'
  | 'risk_check'
  | 'risk_breach'
  | 'strategy_signal'
  | 'system_event'
  | 'account_event';

/** Audit entry */
interface AuditEntry {
  timestamp: number;
  action: AuditAction;
  actor: string;
  subject: string;
  details: Record<string, unknown>;
  hash?: string;
}

/** Audit query options */
interface AuditQuery {
  action?: AuditAction;
  actor?: string;
  subject?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export class AuditLogger {
  private logDir: string;
  private currentFile: string;
  private entries: AuditEntry[] = [];
  private lastHash: string = '';
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(logDir: string = './audit') {
    this.logDir = logDir;
    this.ensureDir(logDir);
    this.currentFile = this.getLogFilename();
    this.loadCurrentFile();
    this.startAutoFlush();
  }

  /**
   * Log an audit entry
   */
  log(
    action: AuditAction,
    actor: string,
    subject: string,
    details: Record<string, unknown> = {}
  ): AuditEntry {
    const entry: AuditEntry = {
      timestamp: Date.now(),
      action,
      actor,
      subject,
      details,
    };

    // Calculate chain hash
    entry.hash = this.calculateHash(entry, this.lastHash);
    this.lastHash = entry.hash;

    this.entries.push(entry);

    return entry;
  }

  /**
   * Log order submission
   */
  logOrderSubmit(
    orderId: string,
    symbol: string,
    side: string,
    quantity: number,
    price?: number,
    strategyId?: string
  ): AuditEntry {
    return this.log('order_submit', strategyId || 'manual', orderId, {
      symbol,
      side,
      quantity,
      price,
    });
  }

  /**
   * Log order fill
   */
  logOrderFill(
    orderId: string,
    fillPrice: number,
    fillQuantity: number,
    commission: number
  ): AuditEntry {
    return this.log('order_fill', 'exchange', orderId, {
      fillPrice,
      fillQuantity,
      commission,
    });
  }

  /**
   * Log order cancellation
   */
  logOrderCancel(orderId: string, reason: string): AuditEntry {
    return this.log('order_cancel', 'system', orderId, { reason });
  }

  /**
   * Log order rejection
   */
  logOrderReject(orderId: string, reason: string): AuditEntry {
    return this.log('order_reject', 'risk_engine', orderId, { reason });
  }

  /**
   * Log position open
   */
  logPositionOpen(
    symbol: string,
    side: string,
    quantity: number,
    entryPrice: number,
    strategyId?: string
  ): AuditEntry {
    return this.log('position_open', strategyId || 'manual', symbol, {
      side,
      quantity,
      entryPrice,
    });
  }

  /**
   * Log position close
   */
  logPositionClose(
    symbol: string,
    side: string,
    quantity: number,
    exitPrice: number,
    pnl: number,
    reason: string
  ): AuditEntry {
    return this.log('position_close', 'system', symbol, {
      side,
      quantity,
      exitPrice,
      pnl,
      reason,
    });
  }

  /**
   * Log risk check
   */
  logRiskCheck(
    orderId: string,
    passed: boolean,
    checks: Array<{ name: string; passed: boolean; value: unknown }>
  ): AuditEntry {
    return this.log('risk_check', 'risk_engine', orderId, {
      passed,
      checks,
    });
  }

  /**
   * Log risk breach
   */
  logRiskBreach(
    category: string,
    message: string,
    data: Record<string, unknown>
  ): AuditEntry {
    return this.log('risk_breach', 'risk_monitor', category, {
      message,
      ...data,
    });
  }

  /**
   * Log strategy signal
   */
  logStrategySignal(
    strategyId: string,
    symbol: string,
    type: string,
    direction: string,
    strength: number,
    confidence: number
  ): AuditEntry {
    return this.log('strategy_signal', strategyId, symbol, {
      type,
      direction,
      strength,
      confidence,
    });
  }

  /**
   * Log system event
   */
  logSystemEvent(event: string, details: Record<string, unknown> = {}): AuditEntry {
    return this.log('system_event', 'system', event, details);
  }

  /**
   * Log account event
   */
  logAccountEvent(
    event: string,
    accountId: string,
    details: Record<string, unknown> = {}
  ): AuditEntry {
    return this.log('account_event', event, accountId, details);
  }

  /**
   * Query audit log
   */
  query(options: AuditQuery = {}): AuditEntry[] {
    let results = [...this.entries];

    if (options.action) {
      results = results.filter((e) => e.action === options.action);
    }

    if (options.actor) {
      results = results.filter((e) => e.actor === options.actor);
    }

    if (options.subject) {
      results = results.filter((e) => e.subject === options.subject);
    }

    if (options.startTime) {
      results = results.filter((e) => e.timestamp >= options.startTime!);
    }

    if (options.endTime) {
      results = results.filter((e) => e.timestamp <= options.endTime!);
    }

    if (options.limit) {
      results = results.slice(-options.limit);
    }

    return results;
  }

  /**
   * Verify audit chain integrity
   */
  verifyIntegrity(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const prevHash = i > 0 ? this.entries[i - 1].hash : '';
      const expectedHash = this.calculateHash(entry, prevHash || '');

      if (entry.hash !== expectedHash) {
        errors.push(
          `Entry ${i} hash mismatch: expected ${expectedHash}, got ${entry.hash}`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Flush to disk
   */
  flush(): void {
    if (this.entries.length === 0) return;

    const content = this.entries
      .map((e) => JSON.stringify(e))
      .join('\n') + '\n';

    appendFileSync(join(this.logDir, this.currentFile), content);

    // Check for log rotation
    this.checkRotation();
  }

  /**
   * Stop auto flush
   */
  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntries: number;
    actionCounts: Record<string, number>;
    actorCounts: Record<string, number>;
    firstEntry?: number;
    lastEntry?: number;
  } {
    const actionCounts: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};

    for (const entry of this.entries) {
      actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
      actorCounts[entry.actor] = (actorCounts[entry.actor] || 0) + 1;
    }

    return {
      totalEntries: this.entries.length,
      actionCounts,
      actorCounts,
      firstEntry: this.entries[0]?.timestamp,
      lastEntry: this.entries[this.entries.length - 1]?.timestamp,
    };
  }

  private calculateHash(entry: AuditEntry, prevHash: string): string {
    const data = JSON.stringify({
      timestamp: entry.timestamp,
      action: entry.action,
      actor: entry.actor,
      subject: entry.subject,
      details: entry.details,
      prevHash,
    });

    // Simple hash for demo (use crypto.createHash in production)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private getLogFilename(): string {
    const now = new Date();
    return `audit_${now.toISOString().slice(0, 10)}.jsonl`;
  }

  private loadCurrentFile(): void {
    const filepath = join(this.logDir, this.currentFile);
    if (!existsSync(filepath)) return;

    try {
      const content = readFileSync(filepath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      this.entries = lines.map((line) => JSON.parse(line) as AuditEntry);

      if (this.entries.length > 0) {
        this.lastHash = this.entries[this.entries.length - 1].hash || '';
      }
    } catch (error) {
      console.error('[AuditLogger] Failed to load current file:', error);
    }
  }

  private checkRotation(): void {
    const newFile = this.getLogFilename();
    if (newFile !== this.currentFile) {
      this.currentFile = newFile;
      this.entries = [];
      this.lastHash = '';
    }
  }

  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  private ensureDir(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}
