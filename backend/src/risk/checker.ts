/**
 * Risk Checker
 *
 * Pre-trade and in-trade risk validation.
 */

import type {
  RiskConfig,
  RiskCheckResult,
  RiskCheckItem,
  AccountState,
  Position,
  OrderRequest,
} from '../types/risk';
import { MVP_RISK_CONFIG } from './config';

export class RiskChecker {
  private config: RiskConfig;
  private accountState: AccountState | null = null;
  private positions: Map<string, Position> = new Map();

  constructor(config: RiskConfig = MVP_RISK_CONFIG) {
    this.config = config;
  }

  /**
   * Update account state
   */
  updateAccountState(state: AccountState): void {
    this.accountState = state;
  }

  /**
   * Update position
   */
  updatePosition(position: Position): void {
    this.positions.set(position.symbol, position);
  }

  /**
   * Remove position
   */
  removePosition(symbol: string): void {
    this.positions.delete(symbol);
  }

  /**
   * Validate order request
   */
  validateOrder(order: OrderRequest): RiskCheckResult {
    const checks: RiskCheckItem[] = [];
    const blockers: string[] = [];
    const warnings: string[] = [];

    if (!this.accountState) {
      blockers.push('Account state not initialized');
      return { passed: false, checks, blockers, warnings };
    }

    // Check 1: Account drawdown
    const drawdownCheck = this.checkDrawdown();
    checks.push(drawdownCheck);
    if (!drawdownCheck.passed) {
      if (drawdownCheck.severity === 'blocker') {
        blockers.push(drawdownCheck.message);
      } else {
        warnings.push(drawdownCheck.message);
      }
    }

    // Check 2: Daily loss limit
    const dailyLossCheck = this.checkDailyLoss();
    checks.push(dailyLossCheck);
    if (!dailyLossCheck.passed) {
      blockers.push(dailyLossCheck.message);
    }

    // Check 3: Weekly loss limit
    const weeklyLossCheck = this.checkWeeklyLoss();
    checks.push(weeklyLossCheck);
    if (!weeklyLossCheck.passed) {
      blockers.push(weeklyLossCheck.message);
    }

    // Check 4: Position limit
    const positionLimitCheck = this.checkPositionLimit(order);
    checks.push(positionLimitCheck);
    if (!positionLimitCheck.passed) {
      blockers.push(positionLimitCheck.message);
    }

    // Check 5: Order size
    const orderSizeCheck = this.checkOrderSize(order);
    checks.push(orderSizeCheck);
    if (!orderSizeCheck.passed) {
      if (orderSizeCheck.severity === 'blocker') {
        blockers.push(orderSizeCheck.message);
      } else {
        warnings.push(orderSizeCheck.message);
      }
    }

    // Check 6: Open positions count
    const openPositionsCheck = this.checkOpenPositions();
    checks.push(openPositionsCheck);
    if (!openPositionsCheck.passed) {
      blockers.push(openPositionsCheck.message);
    }

    // Check 7: Leverage
    const leverageCheck = this.checkLeverage(order);
    checks.push(leverageCheck);
    if (!leverageCheck.passed) {
      blockers.push(leverageCheck.message);
    }

    return {
      passed: blockers.length === 0,
      checks,
      blockers,
      warnings,
    };
  }

  private checkDrawdown(): RiskCheckItem {
    const state = this.accountState!;
    const threshold = this.config.account.maxDrawdownPct;
    const passed = state.drawdownPct < threshold;

    return {
      name: 'max_drawdown',
      passed,
      value: state.drawdownPct,
      threshold,
      severity: passed ? 'info' : 'blocker',
      message: passed
        ? `Drawdown ${(state.drawdownPct * 100).toFixed(2)}% within limit`
        : `Drawdown ${(state.drawdownPct * 100).toFixed(2)}% exceeds ${(threshold * 100).toFixed(0)}% limit`,
    };
  }

  private checkDailyLoss(): RiskCheckItem {
    const state = this.accountState!;
    const threshold = this.config.account.dailyLossLimitPct;
    const dailyLossPct = Math.min(0, state.dailyPnl / state.equity);
    const passed = Math.abs(dailyLossPct) < threshold;

    return {
      name: 'daily_loss_limit',
      passed,
      value: dailyLossPct,
      threshold: -threshold,
      severity: passed ? 'info' : 'blocker',
      message: passed
        ? `Daily P&L ${(dailyLossPct * 100).toFixed(2)}% within limit`
        : `Daily loss ${(Math.abs(dailyLossPct) * 100).toFixed(2)}% exceeds ${(threshold * 100).toFixed(0)}% limit`,
    };
  }

  private checkWeeklyLoss(): RiskCheckItem {
    const state = this.accountState!;
    const threshold = this.config.account.weeklyLossLimitPct;
    const weeklyLossPct = Math.min(0, state.weeklyPnl / state.equity);
    const passed = Math.abs(weeklyLossPct) < threshold;

    return {
      name: 'weekly_loss_limit',
      passed,
      value: weeklyLossPct,
      threshold: -threshold,
      severity: passed ? 'info' : 'blocker',
      message: passed
        ? `Weekly P&L ${(weeklyLossPct * 100).toFixed(2)}% within limit`
        : `Weekly loss ${(Math.abs(weeklyLossPct) * 100).toFixed(2)}% exceeds ${(threshold * 100).toFixed(0)}% limit`,
    };
  }

  private checkPositionLimit(order: OrderRequest): RiskCheckItem {
    const state = this.accountState!;
    const threshold = this.config.trade.maxPositionPct;
    const orderValue = order.quantity * (order.price || 0);
    const positionPct = orderValue / state.equity;
    const passed = positionPct <= threshold;

    return {
      name: 'position_limit',
      passed,
      value: positionPct,
      threshold,
      severity: passed ? 'info' : 'blocker',
      message: passed
        ? `Position size ${(positionPct * 100).toFixed(2)}% within limit`
        : `Position size ${(positionPct * 100).toFixed(2)}% exceeds ${(threshold * 100).toFixed(0)}% limit`,
    };
  }

  private checkOrderSize(order: OrderRequest): RiskCheckItem {
    const state = this.accountState!;
    const maxThreshold = this.config.trade.maxOrderPct;
    const minThreshold = this.config.trade.minOrderValue;
    const orderValue = order.quantity * (order.price || 0);
    const orderPct = orderValue / state.equity;

    const passedMax = orderPct <= maxThreshold;
    const passedMin = orderValue >= minThreshold;
    const passed = passedMax && passedMin;

    let message: string;
    let severity: 'blocker' | 'warning' | 'info';

    if (!passedMin) {
      message = `Order value $${orderValue.toFixed(2)} below minimum $${minThreshold}`;
      severity = 'blocker';
    } else if (!passedMax) {
      message = `Order size ${(orderPct * 100).toFixed(2)}% exceeds ${(maxThreshold * 100).toFixed(0)}% limit`;
      severity = 'blocker';
    } else {
      message = `Order size $${orderValue.toFixed(2)} (${(orderPct * 100).toFixed(2)}%) within limits`;
      severity = 'info';
    }

    return {
      name: 'order_size',
      passed,
      value: orderValue,
      threshold: minThreshold,
      severity,
      message,
    };
  }

  private checkOpenPositions(): RiskCheckItem {
    const threshold = this.config.trade.maxOpenPositions;
    const current = this.positions.size;
    const passed = current < threshold;

    return {
      name: 'open_positions',
      passed,
      value: current,
      threshold,
      severity: passed ? 'info' : 'blocker',
      message: passed
        ? `Open positions ${current} within limit of ${threshold}`
        : `Open positions ${current} at limit of ${threshold}`,
    };
  }

  private checkLeverage(order: OrderRequest): RiskCheckItem {
    const state = this.accountState!;
    const threshold = this.config.account.maxLeverage;
    const orderValue = order.quantity * (order.price || 0);
    const totalExposure = Array.from(this.positions.values())
      .reduce((sum, p) => sum + p.quantity * p.currentPrice, 0) + orderValue;
    const leverage = totalExposure / state.equity;
    const passed = leverage <= threshold;

    return {
      name: 'leverage',
      passed,
      value: leverage,
      threshold,
      severity: passed ? 'info' : 'blocker',
      message: passed
        ? `Leverage ${leverage.toFixed(2)}x within ${threshold}x limit`
        : `Leverage ${leverage.toFixed(2)}x exceeds ${threshold}x limit`,
    };
  }
}
