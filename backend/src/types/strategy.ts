/**
 * Strategy Types
 *
 * Defines contracts for trading strategies.
 */

import type { OHLCVBar } from './market';
import type { Signal } from './research';
import type { FeatureVector } from './feature';

/** Strategy interface - all strategies must implement this */
export interface Strategy {
  id: string;
  name: string;
  version: string;
  parameters: StrategyParameters;
  initialize(): Promise<void>;
  onBar(bar: OHLCVBar, features: FeatureVector): Signal | null;
  onTick?(ticker: { bid: number; ask: number; timestamp: number }): Signal | null;
  getState(): StrategyState;
  setState(state: StrategyState): void;
}

/** Strategy parameters */
export interface StrategyParameters {
  symbols: string[];
  interval: string;
  features: string[];
  [key: string]: unknown;
}

/** Strategy state for persistence */
export interface StrategyState {
  lastSignal: Signal | null;
  position: StrategyPosition | null;
  indicators: Record<string, number>;
  custom: Record<string, unknown>;
}

/** Strategy position tracking */
export interface StrategyPosition {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  entryTime: number;
  unrealizedPnl: number;
}

/** Strategy factory type */
export type StrategyFactory = (params: StrategyParameters) => Strategy;

/** Strategy registration entry */
export interface StrategyRegistryEntry {
  id: string;
  name: string;
  description: string;
  factory: StrategyFactory;
  defaultParams: StrategyParameters;
  requiredFeatures: string[];
}
