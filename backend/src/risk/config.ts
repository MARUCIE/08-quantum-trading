/**
 * Risk Configuration
 *
 * MVP default risk parameters for quantitative trading system.
 */

import type {
  AccountRiskConfig,
  StrategyRiskConfig,
  TradeRiskConfig,
  RiskConfig,
} from '../types/risk';

/** MVP Account Risk Configuration */
export const MVP_ACCOUNT_RISK: AccountRiskConfig = {
  maxAccountValue: 10000,
  initialCapital: 10000,
  maxLeverage: 3,
  marginCallThreshold: 0.5,
  maxDrawdownPct: 0.2,
  dailyLossLimitPct: 0.05,
  weeklyLossLimitPct: 0.1,
};

/** MVP Strategy Risk Configurations */
export const MVP_STRATEGY_RISK: Record<string, StrategyRiskConfig> = {
  trend_following: {
    strategyId: 'trend_following',
    maxCapitalPct: 0.3,
    maxDrawdownPct: 0.15,
    maxCorrelation: 0.5,
    consecutiveLossLimit: 5,
    minWinRate: 0.3,
    cooldownHours: 24,
  },
  mean_reversion: {
    strategyId: 'mean_reversion',
    maxCapitalPct: 0.25,
    maxDrawdownPct: 0.1,
    maxCorrelation: 0.5,
    consecutiveLossLimit: 5,
    minWinRate: 0.35,
    cooldownHours: 24,
  },
  momentum: {
    strategyId: 'momentum',
    maxCapitalPct: 0.25,
    maxDrawdownPct: 0.12,
    maxCorrelation: 0.6,
    consecutiveLossLimit: 5,
    minWinRate: 0.3,
    cooldownHours: 24,
  },
  arbitrage: {
    strategyId: 'arbitrage',
    maxCapitalPct: 0.2,
    maxDrawdownPct: 0.05,
    maxCorrelation: 0.3,
    consecutiveLossLimit: 3,
    minWinRate: 0.5,
    cooldownHours: 12,
  },
};

/** MVP Trade Risk Configuration */
export const MVP_TRADE_RISK: TradeRiskConfig = {
  maxPositionPct: 0.1,
  maxOrderPct: 0.05,
  minOrderValue: 10,
  maxOpenPositions: 10,
  defaultStopLossPct: 0.02,
  defaultTakeProfitPct: 0.06,
  trailingStopPct: 0.015,
  maxSlippagePct: 0.005,
  orderTimeoutSec: 30,
  maxRetries: 3,
  retryDelayMs: 1000,
  priceDeviationLimit: 0.01,
};

/** Combined MVP Risk Configuration */
export const MVP_RISK_CONFIG: RiskConfig = {
  account: MVP_ACCOUNT_RISK,
  strategies: MVP_STRATEGY_RISK,
  trade: MVP_TRADE_RISK,
};

/** Get risk config with optional overrides */
export function getRiskConfig(overrides?: Partial<RiskConfig>): RiskConfig {
  if (!overrides) {
    return MVP_RISK_CONFIG;
  }

  return {
    account: { ...MVP_RISK_CONFIG.account, ...overrides.account },
    strategies: { ...MVP_RISK_CONFIG.strategies, ...overrides.strategies },
    trade: { ...MVP_RISK_CONFIG.trade, ...overrides.trade },
  };
}
