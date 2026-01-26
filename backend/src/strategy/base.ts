/**
 * Base Strategy
 *
 * Abstract base class for all trading strategies.
 */

import type { OHLCVBar } from '../types/market';
import type { Signal } from '../types/research';
import type { FeatureVector } from '../types/feature';
import type {
  Strategy,
  StrategyParameters,
  StrategyState,
  StrategyPosition,
} from '../types/strategy';

export abstract class BaseStrategy implements Strategy {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  parameters: StrategyParameters;

  protected state: StrategyState = {
    lastSignal: null,
    position: null,
    indicators: {},
    custom: {},
  };

  constructor(parameters: StrategyParameters) {
    this.parameters = parameters;
  }

  async initialize(): Promise<void> {
    // Override in subclass if needed
  }

  abstract onBar(bar: OHLCVBar, features: FeatureVector): Signal | null;

  getState(): StrategyState {
    return { ...this.state };
  }

  setState(state: StrategyState): void {
    this.state = { ...state };
  }

  protected createSignal(
    symbol: string,
    type: 'entry' | 'exit' | 'adjust',
    direction: 'long' | 'short' | 'flat',
    strength: number,
    confidence: number,
    metadata: Record<string, unknown> = {}
  ): Signal {
    return {
      timestamp: Date.now(),
      symbol,
      type,
      direction,
      strength: Math.max(-1, Math.min(1, strength)),
      confidence: Math.max(0, Math.min(1, confidence)),
      source: this.id,
      metadata: {
        strategyVersion: this.version,
        ...metadata,
      },
    };
  }

  protected updatePosition(position: StrategyPosition | null): void {
    this.state.position = position;
  }

  protected getPosition(): StrategyPosition | null {
    return this.state.position;
  }

  protected setIndicator(name: string, value: number): void {
    this.state.indicators[name] = value;
  }

  protected getIndicator(name: string): number | undefined {
    return this.state.indicators[name];
  }

  protected setCustom(key: string, value: unknown): void {
    this.state.custom[key] = value;
  }

  protected getCustom<T>(key: string): T | undefined {
    return this.state.custom[key] as T | undefined;
  }
}
