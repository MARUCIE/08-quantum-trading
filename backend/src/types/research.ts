/**
 * Research Pipeline Types
 *
 * Defines contracts for experiments, models, and backtesting.
 */

/** Experiment configuration */
export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  strategyId: string;
  parameters: Record<string, unknown>;
  dataConfig: DataConfig;
  backtestConfig: BacktestConfig;
  createdAt: number;
  createdBy: string;
}

/** Data configuration for experiment */
export interface DataConfig {
  symbols: string[];
  startDate: string;
  endDate: string;
  interval: string;
  features: string[];
  trainTestSplit: number;
  validationSplit?: number;
}

/** Backtest configuration */
export interface BacktestConfig {
  initialCapital: number;
  commission: number;
  slippage: number;
  marginRequirement: number;
  maxPositionSize: number;
  stopLossEnabled: boolean;
  takeProfitEnabled: boolean;
}

/** Experiment result */
export interface ExperimentResult {
  experimentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  metrics: PerformanceMetrics;
  trades: TradeRecord[];
  equity: EquityPoint[];
  errors: string[];
}

/** Performance metrics */
export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  avgHoldingPeriod: number;
  calmarRatio: number;
}

/** Trade record */
export interface TradeRecord {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  entryTime: number;
  entryPrice: number;
  exitTime?: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  pnlPct?: number;
  commission: number;
  slippage: number;
  reason: string;
}

/** Equity curve point */
export interface EquityPoint {
  timestamp: number;
  equity: number;
  cash: number;
  positions: number;
  drawdown: number;
}

/** Model definition */
export interface ModelDefinition {
  id: string;
  name: string;
  type: 'rule_based' | 'ml' | 'hybrid';
  version: string;
  description: string;
  parameters: Record<string, unknown>;
  features: string[];
  createdAt: number;
  updatedAt: number;
}

/** Model registry entry */
export interface ModelRegistryEntry {
  model: ModelDefinition;
  status: 'draft' | 'staging' | 'production' | 'archived';
  metrics: PerformanceMetrics;
  experimentId: string;
  promotedAt?: number;
  promotedBy?: string;
  notes: string;
}

/** Signal definition */
export interface Signal {
  timestamp: number;
  symbol: string;
  type: 'entry' | 'exit' | 'adjust';
  direction: 'long' | 'short' | 'flat';
  strength: number; // -1 to 1
  confidence: number; // 0 to 1
  source: string;
  metadata: Record<string, unknown>;
}

/** Strategy gate result */
export interface StrategyGateResult {
  passed: boolean;
  gate: string;
  threshold: number;
  actual: number;
  message: string;
}

/** Strategy validation result */
export interface StrategyValidation {
  strategyId: string;
  experimentId: string;
  timestamp: number;
  gates: StrategyGateResult[];
  allPassed: boolean;
  recommendations: string[];
}
