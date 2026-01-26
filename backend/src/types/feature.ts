/**
 * Feature Store Types
 *
 * Defines contracts for feature computation, versioning, and serving.
 */

/** Feature value type */
export type FeatureValue = number | boolean | string | number[] | null;

/** Single feature definition */
export interface FeatureDefinition {
  name: string;
  description: string;
  dtype: 'float' | 'int' | 'bool' | 'string' | 'array';
  category: 'price' | 'volume' | 'volatility' | 'momentum' | 'trend' | 'custom';
  dependencies: string[]; // Other features this depends on
  lookback: number; // Required historical bars
  version: string;
}

/** Feature computation result */
export interface FeatureResult {
  name: string;
  value: FeatureValue;
  timestamp: number;
  version: string;
  computeTimeMs: number;
}

/** Feature vector (multiple features at a point in time) */
export interface FeatureVector {
  symbol: string;
  timestamp: number;
  features: Record<string, FeatureValue>;
  version: string;
}

/** Feature metadata for versioning */
export interface FeatureMetadata {
  name: string;
  version: string;
  createdAt: number;
  updatedAt: number;
  description: string;
  schema: FeatureDefinition;
  stats: FeatureStats;
}

/** Feature statistics */
export interface FeatureStats {
  count: number;
  nullCount: number;
  min: number;
  max: number;
  mean: number;
  std: number;
  lastValue: FeatureValue;
  lastUpdate: number;
}

/** Feature drift detection result */
export interface DriftResult {
  featureName: string;
  driftDetected: boolean;
  driftScore: number;
  threshold: number;
  baselineStats: FeatureStats;
  currentStats: FeatureStats;
  message: string;
}

/** Feature store configuration */
export interface FeatureStoreConfig {
  maxCacheSize: number;
  ttlMs: number;
  enableVersioning: boolean;
  enableDriftDetection: boolean;
  driftThreshold: number;
}

/** Online feature request */
export interface OnlineFeatureRequest {
  symbol: string;
  features: string[];
  timestamp?: number; // If not provided, use latest
}

/** Online feature response */
export interface OnlineFeatureResponse {
  symbol: string;
  timestamp: number;
  features: Record<string, FeatureValue>;
  latencyMs: number;
  cacheHit: boolean;
}

/** Offline feature request (batch) */
export interface OfflineFeatureRequest {
  symbol: string;
  features: string[];
  startTime: number;
  endTime: number;
  interval?: string;
}

/** Offline feature response */
export interface OfflineFeatureResponse {
  symbol: string;
  features: string[];
  data: FeatureVector[];
  computeTimeMs: number;
}
