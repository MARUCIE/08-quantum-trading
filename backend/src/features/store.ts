/**
 * Feature Store
 *
 * Manages feature computation, caching, versioning, and serving.
 * Ensures online/offline consistency.
 */

import type { OHLCVBar } from '../types/market';
import type {
  FeatureValue,
  FeatureDefinition,
  FeatureResult,
  FeatureVector,
  FeatureMetadata,
  FeatureStats,
  DriftResult,
  FeatureStoreConfig,
  OnlineFeatureRequest,
  OnlineFeatureResponse,
  OfflineFeatureRequest,
  OfflineFeatureResponse,
} from '../types/feature';
import * as indicators from './indicators';

const DEFAULT_CONFIG: FeatureStoreConfig = {
  maxCacheSize: 10000,
  ttlMs: 60000,
  enableVersioning: true,
  enableDriftDetection: true,
  driftThreshold: 2.0, // Z-score threshold
};

type FeatureComputer = (bars: OHLCVBar[]) => FeatureValue;

export class FeatureStore {
  private config: FeatureStoreConfig;
  private definitions: Map<string, FeatureDefinition> = new Map();
  private computers: Map<string, FeatureComputer> = new Map();
  private cache: Map<string, { value: FeatureVector; timestamp: number }> = new Map();
  private metadata: Map<string, FeatureMetadata> = new Map();
  private baselineStats: Map<string, FeatureStats> = new Map();

  constructor(config: Partial<FeatureStoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registerBuiltinFeatures();
  }

  /**
   * Register a custom feature
   */
  registerFeature(definition: FeatureDefinition, computer: FeatureComputer): void {
    this.definitions.set(definition.name, definition);
    this.computers.set(definition.name, computer);

    this.metadata.set(definition.name, {
      name: definition.name,
      version: definition.version,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      description: definition.description,
      schema: definition,
      stats: this.createEmptyStats(),
    });
  }

  /**
   * Compute features online (single point)
   */
  computeOnline(request: OnlineFeatureRequest, bars: OHLCVBar[]): OnlineFeatureResponse {
    const startTime = Date.now();
    const cacheKey = `${request.symbol}:${request.features.join(',')}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.config.ttlMs) {
      return {
        symbol: request.symbol,
        timestamp: cached.value.timestamp,
        features: cached.value.features,
        latencyMs: Date.now() - startTime,
        cacheHit: true,
      };
    }

    // Compute features
    const features: Record<string, FeatureValue> = {};
    for (const featureName of request.features) {
      const computer = this.computers.get(featureName);
      if (computer) {
        const result = this.computeFeature(featureName, bars);
        features[featureName] = result.value;
        this.updateStats(featureName, result.value);
      }
    }

    const timestamp = bars.length > 0 ? bars[bars.length - 1].timestamp : Date.now();
    const vector: FeatureVector = {
      symbol: request.symbol,
      timestamp,
      features,
      version: '1.0.0',
    };

    // Update cache
    this.cache.set(cacheKey, { value: vector, timestamp: Date.now() });
    this.trimCache();

    return {
      symbol: request.symbol,
      timestamp,
      features,
      latencyMs: Date.now() - startTime,
      cacheHit: false,
    };
  }

  /**
   * Compute features offline (batch)
   */
  computeOffline(request: OfflineFeatureRequest, allBars: OHLCVBar[]): OfflineFeatureResponse {
    const startTime = Date.now();

    // Filter bars to time range
    const bars = allBars.filter(
      (b) => b.timestamp >= request.startTime && b.timestamp <= request.endTime
    );

    const data: FeatureVector[] = [];
    const maxLookback = this.getMaxLookback(request.features);

    // Compute features for each timestamp
    for (let i = maxLookback; i < bars.length; i++) {
      const windowBars = bars.slice(0, i + 1);
      const features: Record<string, FeatureValue> = {};

      for (const featureName of request.features) {
        const result = this.computeFeature(featureName, windowBars);
        features[featureName] = result.value;
      }

      data.push({
        symbol: request.symbol,
        timestamp: bars[i].timestamp,
        features,
        version: '1.0.0',
      });
    }

    return {
      symbol: request.symbol,
      features: request.features,
      data,
      computeTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Detect feature drift
   */
  detectDrift(featureName: string, currentValue: FeatureValue): DriftResult {
    const baseline = this.baselineStats.get(featureName);
    const current = this.metadata.get(featureName)?.stats;

    if (!baseline || !current || typeof currentValue !== 'number') {
      return {
        featureName,
        driftDetected: false,
        driftScore: 0,
        threshold: this.config.driftThreshold,
        baselineStats: baseline || this.createEmptyStats(),
        currentStats: current || this.createEmptyStats(),
        message: 'Insufficient data for drift detection',
      };
    }

    // Calculate Z-score against baseline
    const zScore = baseline.std > 0
      ? Math.abs((currentValue - baseline.mean) / baseline.std)
      : 0;

    const driftDetected = zScore > this.config.driftThreshold;

    return {
      featureName,
      driftDetected,
      driftScore: zScore,
      threshold: this.config.driftThreshold,
      baselineStats: baseline,
      currentStats: current,
      message: driftDetected
        ? `Feature drift detected: z-score ${zScore.toFixed(2)} > ${this.config.driftThreshold}`
        : `Feature stable: z-score ${zScore.toFixed(2)}`,
    };
  }

  /**
   * Set baseline statistics for drift detection
   */
  setBaseline(featureName: string, stats: FeatureStats): void {
    this.baselineStats.set(featureName, stats);
  }

  /**
   * Get feature metadata
   */
  getMetadata(featureName: string): FeatureMetadata | undefined {
    return this.metadata.get(featureName);
  }

  /**
   * List all registered features
   */
  listFeatures(): FeatureDefinition[] {
    return Array.from(this.definitions.values());
  }

  private computeFeature(name: string, bars: OHLCVBar[]): FeatureResult {
    const startTime = Date.now();
    const computer = this.computers.get(name);
    const definition = this.definitions.get(name);

    if (!computer || !definition) {
      return {
        name,
        value: null,
        timestamp: Date.now(),
        version: 'unknown',
        computeTimeMs: 0,
      };
    }

    const value = computer(bars);

    return {
      name,
      value,
      timestamp: bars.length > 0 ? bars[bars.length - 1].timestamp : Date.now(),
      version: definition.version,
      computeTimeMs: Date.now() - startTime,
    };
  }

  private updateStats(featureName: string, value: FeatureValue): void {
    if (typeof value !== 'number') return;

    const meta = this.metadata.get(featureName);
    if (!meta) return;

    const stats = meta.stats;
    stats.count++;
    stats.lastValue = value;
    stats.lastUpdate = Date.now();

    if (stats.count === 1) {
      stats.min = value;
      stats.max = value;
      stats.mean = value;
      stats.std = 0;
    } else {
      stats.min = Math.min(stats.min, value);
      stats.max = Math.max(stats.max, value);

      // Welford's online algorithm for mean and variance
      const delta = value - stats.mean;
      stats.mean += delta / stats.count;
      const delta2 = value - stats.mean;
      const m2 = stats.std * stats.std * (stats.count - 1) + delta * delta2;
      stats.std = Math.sqrt(m2 / stats.count);
    }
  }

  private getMaxLookback(features: string[]): number {
    return features.reduce((max, name) => {
      const def = this.definitions.get(name);
      return def ? Math.max(max, def.lookback) : max;
    }, 0);
  }

  private trimCache(): void {
    if (this.cache.size > this.config.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - this.config.maxCacheSize);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  private createEmptyStats(): FeatureStats {
    return {
      count: 0,
      nullCount: 0,
      min: 0,
      max: 0,
      mean: 0,
      std: 0,
      lastValue: null,
      lastUpdate: 0,
    };
  }

  private registerBuiltinFeatures(): void {
    // Price features
    this.registerFeature(
      {
        name: 'close',
        description: 'Close price',
        dtype: 'float',
        category: 'price',
        dependencies: [],
        lookback: 1,
        version: '1.0.0',
      },
      (bars) => bars.length > 0 ? bars[bars.length - 1].close : null
    );

    this.registerFeature(
      {
        name: 'returns',
        description: 'Simple returns',
        dtype: 'float',
        category: 'price',
        dependencies: ['close'],
        lookback: 2,
        version: '1.0.0',
      },
      (bars) => {
        if (bars.length < 2) return null;
        const curr = bars[bars.length - 1].close;
        const prev = bars[bars.length - 2].close;
        return (curr - prev) / prev;
      }
    );

    // Moving averages
    this.registerFeature(
      {
        name: 'sma_20',
        description: '20-period Simple Moving Average',
        dtype: 'float',
        category: 'trend',
        dependencies: ['close'],
        lookback: 20,
        version: '1.0.0',
      },
      (bars) => indicators.sma(bars.map((b) => b.close), 20)
    );

    this.registerFeature(
      {
        name: 'ema_12',
        description: '12-period Exponential Moving Average',
        dtype: 'float',
        category: 'trend',
        dependencies: ['close'],
        lookback: 12,
        version: '1.0.0',
      },
      (bars) => indicators.ema(bars.map((b) => b.close), 12)
    );

    // Momentum
    this.registerFeature(
      {
        name: 'rsi_14',
        description: '14-period Relative Strength Index',
        dtype: 'float',
        category: 'momentum',
        dependencies: ['close'],
        lookback: 15,
        version: '1.0.0',
      },
      (bars) => indicators.rsi(bars.map((b) => b.close), 14)
    );

    this.registerFeature(
      {
        name: 'roc_10',
        description: '10-period Rate of Change',
        dtype: 'float',
        category: 'momentum',
        dependencies: ['close'],
        lookback: 11,
        version: '1.0.0',
      },
      (bars) => indicators.roc(bars.map((b) => b.close), 10)
    );

    // Volatility
    this.registerFeature(
      {
        name: 'atr_14',
        description: '14-period Average True Range',
        dtype: 'float',
        category: 'volatility',
        dependencies: [],
        lookback: 15,
        version: '1.0.0',
      },
      (bars) => indicators.atr(bars, 14)
    );

    this.registerFeature(
      {
        name: 'bb_width',
        description: 'Bollinger Bands Width',
        dtype: 'float',
        category: 'volatility',
        dependencies: ['close'],
        lookback: 20,
        version: '1.0.0',
      },
      (bars) => {
        const bb = indicators.bollingerBands(bars.map((b) => b.close), 20, 2);
        return bb ? bb.width : null;
      }
    );

    // Volume
    this.registerFeature(
      {
        name: 'vwap',
        description: 'Volume Weighted Average Price',
        dtype: 'float',
        category: 'volume',
        dependencies: [],
        lookback: 1,
        version: '1.0.0',
      },
      (bars) => indicators.vwap(bars)
    );

    this.registerFeature(
      {
        name: 'obv',
        description: 'On-Balance Volume',
        dtype: 'float',
        category: 'volume',
        dependencies: [],
        lookback: 2,
        version: '1.0.0',
      },
      (bars) => indicators.obv(bars)
    );

    // Z-score
    this.registerFeature(
      {
        name: 'zscore_20',
        description: '20-period Z-Score',
        dtype: 'float',
        category: 'custom',
        dependencies: ['close'],
        lookback: 20,
        version: '1.0.0',
      },
      (bars) => indicators.zScore(bars.map((b) => b.close), 20)
    );
  }
}
