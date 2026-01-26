/**
 * Risk Monitor
 *
 * Real-time risk monitoring and alerting.
 */

import type {
  RiskConfig,
  AccountState,
  Position,
  RiskEvent,
} from '../types/risk';
import { MVP_RISK_CONFIG } from './config';

type AlertCallback = (event: RiskEvent) => void;

interface MonitorState {
  peakEquity: number;
  dailyStartEquity: number;
  weeklyStartEquity: number;
  dailyStartTime: number;
  weeklyStartTime: number;
  consecutiveLosses: Map<string, number>;
  lastAlerts: Map<string, number>;
}

export class RiskMonitor {
  private config: RiskConfig;
  private state: MonitorState;
  private events: RiskEvent[] = [];
  private alertCallbacks: Set<AlertCallback> = new Set();
  private alertCooldownMs: number = 60000; // 1 minute between same alerts

  constructor(config: RiskConfig = MVP_RISK_CONFIG) {
    this.config = config;
    this.state = this.initializeState();
  }

  /**
   * Update with new account state
   */
  update(accountState: AccountState): RiskEvent[] {
    const newEvents: RiskEvent[] = [];

    // Update peak equity
    if (accountState.totalEquity > this.state.peakEquity) {
      this.state.peakEquity = accountState.totalEquity;
    }

    // Check account-level risks
    newEvents.push(...this.checkDrawdown(accountState));
    newEvents.push(...this.checkDailyLoss(accountState));
    newEvents.push(...this.checkWeeklyLoss(accountState));
    newEvents.push(...this.checkMarginLevel(accountState));

    // Check position-level risks
    for (const position of accountState.positions) {
      newEvents.push(...this.checkPosition(position, accountState));
    }

    // Store and notify
    for (const event of newEvents) {
      this.events.push(event);
      this.notifyAlert(event);
    }

    // Check for daily/weekly reset
    this.checkTimeReset(accountState);

    return newEvents;
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: AlertCallback): void {
    this.alertCallbacks.add(callback);
  }

  /**
   * Unsubscribe from alerts
   */
  offAlert(callback: AlertCallback): void {
    this.alertCallbacks.delete(callback);
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): RiskEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by level
   */
  getEventsByLevel(level: RiskEvent['level']): RiskEvent[] {
    return this.events.filter((e) => e.level === level);
  }

  /**
   * Clear events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Reset state
   */
  reset(initialEquity: number): void {
    this.state = this.initializeState(initialEquity);
    this.events = [];
  }

  /**
   * Record consecutive loss for a strategy
   */
  recordLoss(strategyId: string): void {
    const current = this.state.consecutiveLosses.get(strategyId) || 0;
    this.state.consecutiveLosses.set(strategyId, current + 1);
  }

  /**
   * Reset consecutive losses for a strategy
   */
  resetLosses(strategyId: string): void {
    this.state.consecutiveLosses.set(strategyId, 0);
  }

  private initializeState(equity: number = 10000): MonitorState {
    const now = Date.now();
    return {
      peakEquity: equity,
      dailyStartEquity: equity,
      weeklyStartEquity: equity,
      dailyStartTime: now,
      weeklyStartTime: now,
      consecutiveLosses: new Map(),
      lastAlerts: new Map(),
    };
  }

  private checkDrawdown(accountState: AccountState): RiskEvent[] {
    const events: RiskEvent[] = [];
    const drawdownPct =
      (this.state.peakEquity - accountState.totalEquity) / this.state.peakEquity;

    // Warning at 75% of max drawdown
    const warningThreshold = this.config.account.maxDrawdownPct * 0.75;
    if (drawdownPct >= warningThreshold && drawdownPct < this.config.account.maxDrawdownPct) {
      if (this.shouldAlert('drawdown_warning')) {
        events.push(this.createEvent(
          'check',
          'warning',
          'account',
          `Drawdown warning: ${(drawdownPct * 100).toFixed(1)}% approaching ${(this.config.account.maxDrawdownPct * 100).toFixed(0)}% limit`,
          { drawdownPct, threshold: this.config.account.maxDrawdownPct }
        ));
      }
    }

    // Critical at max drawdown
    if (drawdownPct >= this.config.account.maxDrawdownPct) {
      events.push(this.createEvent(
        'breach',
        'critical',
        'account',
        `Max drawdown breached: ${(drawdownPct * 100).toFixed(1)}% >= ${(this.config.account.maxDrawdownPct * 100).toFixed(0)}%`,
        { drawdownPct, threshold: this.config.account.maxDrawdownPct, action: 'close_all' }
      ));
    }

    return events;
  }

  private checkDailyLoss(accountState: AccountState): RiskEvent[] {
    const events: RiskEvent[] = [];
    const dailyPnlPct =
      (accountState.totalEquity - this.state.dailyStartEquity) / this.state.dailyStartEquity;

    if (dailyPnlPct < -this.config.account.dailyLossLimitPct) {
      events.push(this.createEvent(
        'breach',
        'critical',
        'account',
        `Daily loss limit breached: ${(dailyPnlPct * 100).toFixed(1)}% < -${(this.config.account.dailyLossLimitPct * 100).toFixed(0)}%`,
        { dailyPnlPct, threshold: -this.config.account.dailyLossLimitPct, action: 'pause_trading' }
      ));
    }

    return events;
  }

  private checkWeeklyLoss(accountState: AccountState): RiskEvent[] {
    const events: RiskEvent[] = [];
    const weeklyPnlPct =
      (accountState.totalEquity - this.state.weeklyStartEquity) / this.state.weeklyStartEquity;

    if (weeklyPnlPct < -this.config.account.weeklyLossLimitPct) {
      events.push(this.createEvent(
        'breach',
        'critical',
        'account',
        `Weekly loss limit breached: ${(weeklyPnlPct * 100).toFixed(1)}% < -${(this.config.account.weeklyLossLimitPct * 100).toFixed(0)}%`,
        { weeklyPnlPct, threshold: -this.config.account.weeklyLossLimitPct, action: 'pause_trading' }
      ));
    }

    return events;
  }

  private checkMarginLevel(accountState: AccountState): RiskEvent[] {
    const events: RiskEvent[] = [];

    if (accountState.marginLevel < this.config.account.marginCallThreshold) {
      events.push(this.createEvent(
        'breach',
        'critical',
        'account',
        `Margin call: margin level ${accountState.marginLevel.toFixed(2)} < ${this.config.account.marginCallThreshold}`,
        { marginLevel: accountState.marginLevel, threshold: this.config.account.marginCallThreshold }
      ));
    }

    return events;
  }

  private checkPosition(position: Position, accountState: AccountState): RiskEvent[] {
    const events: RiskEvent[] = [];

    // Check position size
    const positionPct = (position.quantity * position.markPrice) / accountState.totalEquity;
    if (positionPct > this.config.trade.maxPositionPct * 1.5) {
      events.push(this.createEvent(
        'check',
        'warning',
        'trade',
        `Large position: ${position.symbol} at ${(positionPct * 100).toFixed(1)}% of equity`,
        { symbol: position.symbol, positionPct }
      ));
    }

    // Check unrealized loss
    const unrealizedLossPct = position.unrealizedPnl / (position.quantity * position.entryPrice);
    if (unrealizedLossPct < -0.1) { // 10% unrealized loss
      if (this.shouldAlert(`position_loss_${position.symbol}`)) {
        events.push(this.createEvent(
          'check',
          'warning',
          'trade',
          `Unrealized loss on ${position.symbol}: ${(unrealizedLossPct * 100).toFixed(1)}%`,
          { symbol: position.symbol, unrealizedLossPct, unrealizedPnl: position.unrealizedPnl }
        ));
      }
    }

    return events;
  }

  private checkTimeReset(accountState: AccountState): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;

    // Daily reset
    if (now - this.state.dailyStartTime >= dayMs) {
      this.state.dailyStartEquity = accountState.totalEquity;
      this.state.dailyStartTime = now;
    }

    // Weekly reset
    if (now - this.state.weeklyStartTime >= weekMs) {
      this.state.weeklyStartEquity = accountState.totalEquity;
      this.state.weeklyStartTime = now;
    }
  }

  private shouldAlert(alertKey: string): boolean {
    const lastAlert = this.state.lastAlerts.get(alertKey);
    if (lastAlert && Date.now() - lastAlert < this.alertCooldownMs) {
      return false;
    }
    this.state.lastAlerts.set(alertKey, Date.now());
    return true;
  }

  private createEvent(
    type: RiskEvent['type'],
    level: RiskEvent['level'],
    category: RiskEvent['category'],
    message: string,
    data: Record<string, unknown>
  ): RiskEvent {
    return {
      timestamp: Date.now(),
      type,
      level,
      category,
      message,
      data,
    };
  }

  private notifyAlert(event: RiskEvent): void {
    for (const callback of this.alertCallbacks) {
      try {
        callback(event);
      } catch (error) {
        console.error('[RiskMonitor] Alert callback error:', error);
      }
    }
  }
}
