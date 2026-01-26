/**
 * Momentum Strategy
 *
 * Simple momentum-based trading strategy using RSI and price action.
 */

import type { OHLCVBar } from '../types/market';
import type { Signal } from '../types/research';
import type { FeatureVector, FeatureValue } from '../types/feature';
import type { StrategyParameters } from '../types/strategy';
import { BaseStrategy } from './base';

interface MomentumParams extends StrategyParameters {
  rsiOverbought: number;
  rsiOversold: number;
  minConfidence: number;
  cooldownBars: number;
}

const DEFAULT_PARAMS: MomentumParams = {
  symbols: ['BTCUSDT'],
  interval: '1h',
  features: ['rsi_14', 'sma_20', 'close', 'returns'],
  rsiOverbought: 70,
  rsiOversold: 30,
  minConfidence: 0.6,
  cooldownBars: 3,
};

export class MomentumStrategy extends BaseStrategy {
  id = 'momentum_v1';
  name = 'Momentum RSI Strategy';
  version = '1.0.0';

  private params: MomentumParams;
  private barsSinceSignal: number = 0;

  constructor(parameters: Partial<MomentumParams> = {}) {
    const params = { ...DEFAULT_PARAMS, ...parameters };
    super(params);
    this.params = params;
  }

  onBar(bar: OHLCVBar, features: FeatureVector): Signal | null {
    this.barsSinceSignal++;

    const rsi = this.getFeatureValue(features, 'rsi_14');
    const sma = this.getFeatureValue(features, 'sma_20');
    const close = bar.close;

    if (rsi === null || sma === null) {
      return null;
    }

    // Update indicators
    this.setIndicator('rsi', rsi);
    this.setIndicator('sma', sma);
    this.setIndicator('close', close);

    const position = this.getPosition();

    // Check exit conditions first
    if (position) {
      const exitSignal = this.checkExit(position.side, rsi, close, sma);
      if (exitSignal) {
        this.barsSinceSignal = 0;
        return exitSignal;
      }
      return null;
    }

    // Check entry conditions (with cooldown)
    if (this.barsSinceSignal < this.params.cooldownBars) {
      return null;
    }

    const entrySignal = this.checkEntry(rsi, close, sma, bar.symbol);
    if (entrySignal) {
      this.barsSinceSignal = 0;
    }

    return entrySignal;
  }

  private checkEntry(
    rsi: number,
    close: number,
    sma: number,
    symbol: string
  ): Signal | null {
    // Long entry: RSI oversold + price above SMA
    if (rsi < this.params.rsiOversold && close > sma) {
      const confidence = this.calculateConfidence('long', rsi, close, sma);
      if (confidence >= this.params.minConfidence) {
        return this.createSignal(
          symbol,
          'entry',
          'long',
          (this.params.rsiOversold - rsi) / this.params.rsiOversold,
          confidence,
          { rsi, sma, reason: 'RSI oversold + price above SMA' }
        );
      }
    }

    // Short entry: RSI overbought + price below SMA
    if (rsi > this.params.rsiOverbought && close < sma) {
      const confidence = this.calculateConfidence('short', rsi, close, sma);
      if (confidence >= this.params.minConfidence) {
        return this.createSignal(
          symbol,
          'entry',
          'short',
          (rsi - this.params.rsiOverbought) / (100 - this.params.rsiOverbought),
          confidence,
          { rsi, sma, reason: 'RSI overbought + price below SMA' }
        );
      }
    }

    return null;
  }

  private checkExit(
    side: 'long' | 'short',
    rsi: number,
    close: number,
    sma: number
  ): Signal | null {
    const position = this.getPosition();
    if (!position) return null;

    // Long exit: RSI overbought or price crosses below SMA
    if (side === 'long') {
      if (rsi > this.params.rsiOverbought || close < sma * 0.99) {
        return this.createSignal(
          position.symbol,
          'exit',
          'flat',
          1,
          0.8,
          { rsi, sma, reason: side === 'long' ? 'RSI overbought' : 'Price below SMA' }
        );
      }
    }

    // Short exit: RSI oversold or price crosses above SMA
    if (side === 'short') {
      if (rsi < this.params.rsiOversold || close > sma * 1.01) {
        return this.createSignal(
          position.symbol,
          'exit',
          'flat',
          1,
          0.8,
          { rsi, sma, reason: side === 'short' ? 'RSI oversold' : 'Price above SMA' }
        );
      }
    }

    return null;
  }

  private calculateConfidence(
    direction: 'long' | 'short',
    rsi: number,
    close: number,
    sma: number
  ): number {
    let confidence = 0.5;

    // RSI extremity adds confidence
    if (direction === 'long') {
      confidence += (this.params.rsiOversold - rsi) / 100 * 0.3;
      confidence += (close > sma ? 0.2 : -0.1);
    } else {
      confidence += (rsi - this.params.rsiOverbought) / 100 * 0.3;
      confidence += (close < sma ? 0.2 : -0.1);
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private getFeatureValue(features: FeatureVector, name: string): number | null {
    const value: FeatureValue = features.features[name];
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    return null;
  }
}
