/**
 * Strategy Module Exports
 */

export { BaseStrategy } from './base';
export { MomentumStrategy } from './momentum';
export { MeanReversionStrategy } from './mean-reversion';

import type { StrategyRegistryEntry } from '../types/strategy';
import { MomentumStrategy } from './momentum';
import { MeanReversionStrategy } from './mean-reversion';

/** Strategy registry */
export const strategyRegistry: Map<string, StrategyRegistryEntry> = new Map([
  [
    'momentum_v1',
    {
      id: 'momentum_v1',
      name: 'Momentum RSI Strategy',
      description: 'Momentum-based trading using RSI and price action',
      factory: (params) => new MomentumStrategy(params),
      defaultParams: {
        symbols: ['BTCUSDT'],
        interval: '1h',
        features: ['rsi_14', 'sma_20', 'close', 'returns'],
        rsiOverbought: 70,
        rsiOversold: 30,
        minConfidence: 0.6,
        cooldownBars: 3,
      },
      requiredFeatures: ['rsi_14', 'sma_20', 'close'],
    },
  ],
  [
    'mean_reversion_v1',
    {
      id: 'mean_reversion_v1',
      name: 'Mean Reversion BB Strategy',
      description: 'Statistical mean reversion using Bollinger Bands and Z-score',
      factory: (params) => new MeanReversionStrategy(params),
      defaultParams: {
        symbols: ['BTCUSDT'],
        interval: '1h',
        features: ['zscore_20', 'bb_width', 'close', 'sma_20'],
        zscoreEntry: 2.0,
        zscoreExit: 0.5,
        bbWidthMin: 0.02,
        minConfidence: 0.6,
        maxHoldingBars: 24,
      },
      requiredFeatures: ['zscore_20', 'bb_width', 'sma_20'],
    },
  ],
]);

/**
 * Create strategy instance from registry
 */
export function createStrategy(
  id: string,
  overrides?: Record<string, unknown>
): ReturnType<StrategyRegistryEntry['factory']> | null {
  const entry = strategyRegistry.get(id);
  if (!entry) return null;

  const params = { ...entry.defaultParams, ...overrides };
  return entry.factory(params);
}

/**
 * List available strategies
 */
export function listStrategies(): StrategyRegistryEntry[] {
  return Array.from(strategyRegistry.values());
}
