/**
 * Backtesting Engine
 *
 * Event-driven backtesting with realistic simulation.
 */

import type { OHLCVBar } from '../types/market';
import type {
  BacktestConfig,
  ExperimentResult,
  PerformanceMetrics,
  TradeRecord,
  EquityPoint,
  Signal,
} from '../types/research';

const DEFAULT_CONFIG: BacktestConfig = {
  initialCapital: 10000,
  commission: 0.001,
  slippage: 0.0005,
  marginRequirement: 1,
  maxPositionSize: 0.1,
  stopLossEnabled: true,
  takeProfitEnabled: true,
};

interface Position {
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  entryTime: number;
  stopLoss?: number;
  takeProfit?: number;
}

type SignalGenerator = (bars: OHLCVBar[], index: number) => Signal | null;

export class BacktestEngine {
  private config: BacktestConfig;
  private cash: number;
  private positions: Map<string, Position> = new Map();
  private trades: TradeRecord[] = [];
  private equity: EquityPoint[] = [];
  private peakEquity: number;
  private tradeIdCounter: number = 0;

  constructor(config: Partial<BacktestConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cash = this.config.initialCapital;
    this.peakEquity = this.config.initialCapital;
  }

  /**
   * Run backtest with a signal generator
   */
  run(bars: OHLCVBar[], generateSignal: SignalGenerator): ExperimentResult {
    const startTime = Date.now();

    // Reset state
    this.cash = this.config.initialCapital;
    this.positions.clear();
    this.trades = [];
    this.equity = [];
    this.peakEquity = this.config.initialCapital;

    // Process each bar
    for (let i = 1; i < bars.length; i++) {
      const bar = bars[i];

      // Check stop loss / take profit
      this.checkExits(bar);

      // Generate signal
      const signal = generateSignal(bars, i);

      // Execute signal
      if (signal) {
        this.executeSignal(signal, bar);
      }

      // Record equity
      this.recordEquity(bar);
    }

    // Close all positions at end
    if (bars.length > 0) {
      this.closeAllPositions(bars[bars.length - 1]);
    }

    // Calculate metrics
    const metrics = this.calculateMetrics();

    return {
      experimentId: `exp_${Date.now()}`,
      status: 'completed',
      startTime,
      endTime: Date.now(),
      metrics,
      trades: this.trades,
      equity: this.equity,
      errors: [],
    };
  }

  private executeSignal(signal: Signal, bar: OHLCVBar): void {
    const position = this.positions.get(signal.symbol);

    if (signal.type === 'exit' && position) {
      this.closePosition(signal.symbol, bar, 'signal_exit');
    } else if (signal.type === 'entry' && !position) {
      this.openPosition(signal, bar);
    } else if (signal.type === 'adjust' && position) {
      // For now, close and re-open
      this.closePosition(signal.symbol, bar, 'signal_adjust');
      this.openPosition(signal, bar);
    }
  }

  private openPosition(signal: Signal, bar: OHLCVBar): void {
    const maxValue = this.cash * this.config.maxPositionSize;
    const price = this.applySlippage(bar.close, signal.direction === 'long');
    const quantity = Math.floor(maxValue / price);

    if (quantity <= 0) return;

    const cost = quantity * price * (1 + this.config.commission);
    if (cost > this.cash) return;

    this.cash -= cost;

    const position: Position = {
      symbol: signal.symbol,
      side: signal.direction === 'long' ? 'long' : 'short',
      quantity,
      entryPrice: price,
      entryTime: bar.timestamp,
    };

    // Set stop loss and take profit
    if (this.config.stopLossEnabled) {
      position.stopLoss = signal.direction === 'long'
        ? price * 0.98
        : price * 1.02;
    }

    if (this.config.takeProfitEnabled) {
      position.takeProfit = signal.direction === 'long'
        ? price * 1.06
        : price * 0.94;
    }

    this.positions.set(signal.symbol, position);
  }

  private closePosition(symbol: string, bar: OHLCVBar, reason: string): void {
    const position = this.positions.get(symbol);
    if (!position) return;

    const price = this.applySlippage(bar.close, position.side !== 'long');
    const proceeds = position.quantity * price * (1 - this.config.commission);

    const pnl = position.side === 'long'
      ? proceeds - position.quantity * position.entryPrice
      : position.quantity * position.entryPrice - proceeds;

    this.cash += proceeds;

    const trade: TradeRecord = {
      id: `trade_${++this.tradeIdCounter}`,
      symbol,
      side: position.side,
      entryTime: position.entryTime,
      entryPrice: position.entryPrice,
      exitTime: bar.timestamp,
      exitPrice: price,
      quantity: position.quantity,
      pnl,
      pnlPct: pnl / (position.quantity * position.entryPrice),
      commission: position.quantity * (position.entryPrice + price) * this.config.commission,
      slippage: position.quantity * bar.close * this.config.slippage,
      reason,
    };

    this.trades.push(trade);
    this.positions.delete(symbol);
  }

  private checkExits(bar: OHLCVBar): void {
    for (const [symbol, position] of this.positions) {
      if (bar.symbol && bar.symbol !== symbol) continue;

      // Check stop loss
      if (position.stopLoss) {
        const triggered = position.side === 'long'
          ? bar.low <= position.stopLoss
          : bar.high >= position.stopLoss;

        if (triggered) {
          this.closePosition(symbol, { ...bar, close: position.stopLoss }, 'stop_loss');
          continue;
        }
      }

      // Check take profit
      if (position.takeProfit) {
        const triggered = position.side === 'long'
          ? bar.high >= position.takeProfit
          : bar.low <= position.takeProfit;

        if (triggered) {
          this.closePosition(symbol, { ...bar, close: position.takeProfit }, 'take_profit');
        }
      }
    }
  }

  private closeAllPositions(bar: OHLCVBar): void {
    for (const symbol of this.positions.keys()) {
      this.closePosition(symbol, bar, 'end_of_backtest');
    }
  }

  private recordEquity(bar: OHLCVBar): void {
    let positionValue = 0;
    for (const position of this.positions.values()) {
      positionValue += position.quantity * bar.close;
    }

    const equity = this.cash + positionValue;
    this.peakEquity = Math.max(this.peakEquity, equity);
    const drawdown = (this.peakEquity - equity) / this.peakEquity;

    this.equity.push({
      timestamp: bar.timestamp,
      equity,
      cash: this.cash,
      positions: this.positions.size,
      drawdown,
    });
  }

  private applySlippage(price: number, isBuy: boolean): number {
    const slip = price * this.config.slippage;
    return isBuy ? price + slip : price - slip;
  }

  private calculateMetrics(): PerformanceMetrics {
    const initialEquity = this.config.initialCapital;
    const finalEquity = this.equity.length > 0
      ? this.equity[this.equity.length - 1].equity
      : initialEquity;

    const totalReturn = (finalEquity - initialEquity) / initialEquity;

    // Calculate daily returns for Sharpe/Sortino
    const dailyReturns: number[] = [];
    for (let i = 1; i < this.equity.length; i++) {
      const ret = (this.equity[i].equity - this.equity[i - 1].equity) / this.equity[i - 1].equity;
      dailyReturns.push(ret);
    }

    const avgReturn = dailyReturns.length > 0
      ? dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length
      : 0;

    const stdReturn = dailyReturns.length > 1
      ? Math.sqrt(
          dailyReturns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) /
            (dailyReturns.length - 1)
        )
      : 0;

    const downsideReturns = dailyReturns.filter((r) => r < 0);
    const downsideStd = downsideReturns.length > 1
      ? Math.sqrt(
          downsideReturns.reduce((s, r) => s + Math.pow(r, 2), 0) /
            downsideReturns.length
        )
      : 0;

    const sharpeRatio = stdReturn > 0 ? (avgReturn * 252) / (stdReturn * Math.sqrt(252)) : 0;
    const sortinoRatio = downsideStd > 0 ? (avgReturn * 252) / (downsideStd * Math.sqrt(252)) : 0;

    const maxDrawdown = this.equity.length > 0
      ? Math.max(...this.equity.map((e) => e.drawdown))
      : 0;

    const wins = this.trades.filter((t) => (t.pnl || 0) > 0);
    const losses = this.trades.filter((t) => (t.pnl || 0) < 0);

    const winRate = this.trades.length > 0 ? wins.length / this.trades.length : 0;

    const totalWins = wins.reduce((s, t) => s + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

    const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
    const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;

    const holdingPeriods = this.trades
      .filter((t) => t.exitTime && t.entryTime)
      .map((t) => (t.exitTime! - t.entryTime) / (1000 * 60 * 60)); // hours
    const avgHoldingPeriod = holdingPeriods.length > 0
      ? holdingPeriods.reduce((s, p) => s + p, 0) / holdingPeriods.length
      : 0;

    const annualizedReturn = Math.pow(1 + totalReturn, 252 / Math.max(this.equity.length, 1)) - 1;
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

    return {
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      winRate,
      profitFactor,
      totalTrades: this.trades.length,
      avgWin,
      avgLoss,
      avgHoldingPeriod,
      calmarRatio,
    };
  }
}
