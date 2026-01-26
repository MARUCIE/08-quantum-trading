/**
 * Model Registry
 *
 * Manages model versioning, staging, and promotion.
 */

import type {
  ModelDefinition,
  ModelRegistryEntry,
  PerformanceMetrics,
  StrategyGateResult,
  StrategyValidation,
} from '../types/research';

/** Strategy gates configuration */
interface StrategyGates {
  minSharpeRatio: number;
  maxDrawdown: number;
  minWinRate: number;
  minTrades: number;
  minProfitFactor: number;
}

const DEFAULT_GATES: StrategyGates = {
  minSharpeRatio: 0.5,
  maxDrawdown: 0.2,
  minWinRate: 0.35,
  minTrades: 30,
  minProfitFactor: 1.2,
};

export class ModelRegistry {
  private models: Map<string, ModelRegistryEntry> = new Map();
  private gates: StrategyGates;

  constructor(gates: Partial<StrategyGates> = {}) {
    this.gates = { ...DEFAULT_GATES, ...gates };
  }

  /**
   * Register a new model
   */
  register(
    model: ModelDefinition,
    metrics: PerformanceMetrics,
    experimentId: string
  ): ModelRegistryEntry {
    const entry: ModelRegistryEntry = {
      model,
      status: 'draft',
      metrics,
      experimentId,
      notes: '',
    };

    this.models.set(model.id, entry);
    return entry;
  }

  /**
   * Get model by ID
   */
  get(modelId: string): ModelRegistryEntry | undefined {
    return this.models.get(modelId);
  }

  /**
   * List all models
   */
  list(status?: ModelRegistryEntry['status']): ModelRegistryEntry[] {
    const entries = Array.from(this.models.values());
    if (status) {
      return entries.filter((e) => e.status === status);
    }
    return entries;
  }

  /**
   * Validate model against strategy gates
   */
  validate(modelId: string): StrategyValidation {
    const entry = this.models.get(modelId);
    if (!entry) {
      return {
        strategyId: modelId,
        experimentId: '',
        timestamp: Date.now(),
        gates: [],
        allPassed: false,
        recommendations: ['Model not found'],
      };
    }

    const gates: StrategyGateResult[] = [];
    const { metrics } = entry;

    // Sharpe Ratio gate
    gates.push({
      passed: metrics.sharpeRatio >= this.gates.minSharpeRatio,
      gate: 'sharpe_ratio',
      threshold: this.gates.minSharpeRatio,
      actual: metrics.sharpeRatio,
      message: `Sharpe Ratio ${metrics.sharpeRatio.toFixed(2)} ${
        metrics.sharpeRatio >= this.gates.minSharpeRatio ? '>=' : '<'
      } ${this.gates.minSharpeRatio}`,
    });

    // Max Drawdown gate
    gates.push({
      passed: metrics.maxDrawdown <= this.gates.maxDrawdown,
      gate: 'max_drawdown',
      threshold: this.gates.maxDrawdown,
      actual: metrics.maxDrawdown,
      message: `Max Drawdown ${(metrics.maxDrawdown * 100).toFixed(1)}% ${
        metrics.maxDrawdown <= this.gates.maxDrawdown ? '<=' : '>'
      } ${this.gates.maxDrawdown * 100}%`,
    });

    // Win Rate gate
    gates.push({
      passed: metrics.winRate >= this.gates.minWinRate,
      gate: 'win_rate',
      threshold: this.gates.minWinRate,
      actual: metrics.winRate,
      message: `Win Rate ${(metrics.winRate * 100).toFixed(1)}% ${
        metrics.winRate >= this.gates.minWinRate ? '>=' : '<'
      } ${this.gates.minWinRate * 100}%`,
    });

    // Total Trades gate
    gates.push({
      passed: metrics.totalTrades >= this.gates.minTrades,
      gate: 'total_trades',
      threshold: this.gates.minTrades,
      actual: metrics.totalTrades,
      message: `Total Trades ${metrics.totalTrades} ${
        metrics.totalTrades >= this.gates.minTrades ? '>=' : '<'
      } ${this.gates.minTrades}`,
    });

    // Profit Factor gate
    gates.push({
      passed: metrics.profitFactor >= this.gates.minProfitFactor,
      gate: 'profit_factor',
      threshold: this.gates.minProfitFactor,
      actual: metrics.profitFactor,
      message: `Profit Factor ${metrics.profitFactor.toFixed(2)} ${
        metrics.profitFactor >= this.gates.minProfitFactor ? '>=' : '<'
      } ${this.gates.minProfitFactor}`,
    });

    const allPassed = gates.every((g) => g.passed);
    const failedGates = gates.filter((g) => !g.passed);

    const recommendations: string[] = [];
    for (const gate of failedGates) {
      switch (gate.gate) {
        case 'sharpe_ratio':
          recommendations.push('Consider reducing position size or improving signal quality');
          break;
        case 'max_drawdown':
          recommendations.push('Add tighter stop-loss or reduce leverage');
          break;
        case 'win_rate':
          recommendations.push('Review entry criteria or improve signal filtering');
          break;
        case 'total_trades':
          recommendations.push('Extend backtest period or relax entry conditions');
          break;
        case 'profit_factor':
          recommendations.push('Improve risk/reward ratio or cut losers faster');
          break;
      }
    }

    return {
      strategyId: modelId,
      experimentId: entry.experimentId,
      timestamp: Date.now(),
      gates,
      allPassed,
      recommendations,
    };
  }

  /**
   * Promote model to next stage
   */
  promote(modelId: string, promotedBy: string): boolean {
    const entry = this.models.get(modelId);
    if (!entry) return false;

    const validation = this.validate(modelId);
    if (!validation.allPassed && entry.status === 'draft') {
      return false; // Cannot promote from draft without passing gates
    }

    const statusOrder: ModelRegistryEntry['status'][] = [
      'draft',
      'staging',
      'production',
    ];
    const currentIndex = statusOrder.indexOf(entry.status);

    if (currentIndex < statusOrder.length - 1) {
      entry.status = statusOrder[currentIndex + 1];
      entry.promotedAt = Date.now();
      entry.promotedBy = promotedBy;
      return true;
    }

    return false;
  }

  /**
   * Demote model to previous stage
   */
  demote(modelId: string): boolean {
    const entry = this.models.get(modelId);
    if (!entry) return false;

    const statusOrder: ModelRegistryEntry['status'][] = [
      'draft',
      'staging',
      'production',
    ];
    const currentIndex = statusOrder.indexOf(entry.status);

    if (currentIndex > 0) {
      entry.status = statusOrder[currentIndex - 1];
      return true;
    }

    return false;
  }

  /**
   * Archive model
   */
  archive(modelId: string): boolean {
    const entry = this.models.get(modelId);
    if (!entry) return false;

    entry.status = 'archived';
    return true;
  }

  /**
   * Add notes to model
   */
  addNotes(modelId: string, notes: string): boolean {
    const entry = this.models.get(modelId);
    if (!entry) return false;

    entry.notes = notes;
    return true;
  }

  /**
   * Get production models
   */
  getProductionModels(): ModelRegistryEntry[] {
    return this.list('production');
  }

  /**
   * Compare two models
   */
  compare(modelId1: string, modelId2: string): ModelComparison | null {
    const entry1 = this.models.get(modelId1);
    const entry2 = this.models.get(modelId2);

    if (!entry1 || !entry2) return null;

    const m1 = entry1.metrics;
    const m2 = entry2.metrics;

    return {
      model1: modelId1,
      model2: modelId2,
      comparison: {
        sharpeRatio: { model1: m1.sharpeRatio, model2: m2.sharpeRatio, better: m1.sharpeRatio > m2.sharpeRatio ? 1 : 2 },
        maxDrawdown: { model1: m1.maxDrawdown, model2: m2.maxDrawdown, better: m1.maxDrawdown < m2.maxDrawdown ? 1 : 2 },
        winRate: { model1: m1.winRate, model2: m2.winRate, better: m1.winRate > m2.winRate ? 1 : 2 },
        profitFactor: { model1: m1.profitFactor, model2: m2.profitFactor, better: m1.profitFactor > m2.profitFactor ? 1 : 2 },
        totalReturn: { model1: m1.totalReturn, model2: m2.totalReturn, better: m1.totalReturn > m2.totalReturn ? 1 : 2 },
      },
      recommendation: this.getComparisonRecommendation(m1, m2, modelId1, modelId2),
    };
  }

  private getComparisonRecommendation(
    m1: PerformanceMetrics,
    m2: PerformanceMetrics,
    id1: string,
    id2: string
  ): string {
    // Simple scoring: Sharpe (30%), Drawdown (25%), Win Rate (20%), Profit Factor (25%)
    const score1 =
      m1.sharpeRatio * 0.3 +
      (1 - m1.maxDrawdown) * 0.25 +
      m1.winRate * 0.2 +
      Math.min(m1.profitFactor / 3, 1) * 0.25;

    const score2 =
      m2.sharpeRatio * 0.3 +
      (1 - m2.maxDrawdown) * 0.25 +
      m2.winRate * 0.2 +
      Math.min(m2.profitFactor / 3, 1) * 0.25;

    if (Math.abs(score1 - score2) < 0.05) {
      return `Models are comparable. Consider ensemble or A/B testing.`;
    }

    const better = score1 > score2 ? id1 : id2;
    return `${better} performs better overall. Consider promoting to staging.`;
  }
}

interface ModelComparison {
  model1: string;
  model2: string;
  comparison: Record<
    string,
    { model1: number; model2: number; better: 1 | 2 }
  >;
  recommendation: string;
}
