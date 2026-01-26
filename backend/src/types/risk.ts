/**
 * Risk Management Types
 *
 * Defines the risk control contracts used across the trading system.
 */

/** Account-level risk configuration */
export interface AccountRiskConfig {
  maxAccountValue: number;
  initialCapital: number;
  maxLeverage: number;
  marginCallThreshold: number;
  maxDrawdownPct: number;
  dailyLossLimitPct: number;
  weeklyLossLimitPct: number;
}

/** Strategy-level risk configuration */
export interface StrategyRiskConfig {
  strategyId: string;
  maxCapitalPct: number;
  maxDrawdownPct: number;
  maxCorrelation: number;
  consecutiveLossLimit: number;
  minWinRate: number;
  cooldownHours: number;
}

/** Trade-level risk configuration */
export interface TradeRiskConfig {
  maxPositionPct: number;
  maxOrderPct: number;
  minOrderValue: number;
  maxOpenPositions: number;
  defaultStopLossPct: number;
  defaultTakeProfitPct: number;
  trailingStopPct: number;
  maxSlippagePct: number;
  orderTimeoutSec: number;
  maxRetries: number;
  retryDelayMs: number;
  priceDeviationLimit: number;
}

/** Combined risk configuration */
export interface RiskConfig {
  account: AccountRiskConfig;
  strategies: Record<string, StrategyRiskConfig>;
  trade: TradeRiskConfig;
}

/** Risk check result */
export interface RiskCheckResult {
  passed: boolean;
  checks: RiskCheckItem[];
  blockers: string[];
  warnings: string[];
}

/** Individual risk check item */
export interface RiskCheckItem {
  name: string;
  passed: boolean;
  value: number | string | boolean;
  threshold: number | string | boolean;
  severity: 'blocker' | 'warning' | 'info';
  message: string;
}

/** Account state for risk calculations */
export interface AccountState {
  /** Total account equity (alias: equity) */
  totalEquity: number;
  /** Alias for totalEquity for backward compatibility */
  equity: number;
  cash: number;
  margin: number;
  /** Margin level = equity / margin (for margin call check) */
  marginLevel: number;
  unrealizedPnl: number;
  realizedPnl: number;
  dailyPnl: number;
  weeklyPnl: number;
  peakEquity: number;
  drawdown: number;
  drawdownPct: number;
  /** Number of open positions */
  openPositions: number;
  /** Array of current positions (for position-level risk checks) */
  positions: Position[];
  timestamp: number;
}

/** Position for risk calculations */
export interface Position {
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  /** Current market price (alias: currentPrice) */
  markPrice: number;
  /** Alias for markPrice for backward compatibility */
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  leverage: number;
  marginUsed: number;
  stopLoss?: number;
  takeProfit?: number;
}

/** Order request for risk validation */
export interface OrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  quantity: number;
  price?: number;
  stopPrice?: number;
  strategyId?: string;
}

/** Risk event for audit logging */
export interface RiskEvent {
  timestamp: number;
  type: 'check' | 'breach' | 'action';
  level: 'info' | 'warning' | 'critical';
  category: 'account' | 'strategy' | 'trade' | 'system';
  message: string;
  data: Record<string, unknown>;
}
