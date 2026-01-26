/**
 * Mean Reversion Strategy
 *
 * Statistical mean reversion using Bollinger Bands and Z-score.
 */

import type { OHLCVBar } from '../types/market';
import type { Signal } from '../types/research';
import type { FeatureVector, FeatureValue } from '../types/feature';
import type { StrategyParameters } from '../types/strategy';
import { BaseStrategy } from './base';

interface MeanReversionParams extends StrategyParameters {
  zscoreEntry: number;
  zscoreExit: number;
  bbWidthMin: number;
  minConfidence: number;
  maxHoldingBars: number;
}

const DEFAULT_PARAMS: MeanReversionParams = {
  symbols: ['BTCUSDT'],
  interval: '1h',
  features: ['zscore_20', 'bb_width', 'close', 'sma_20'],
  zscoreEntry: 2.0,
  zscoreExit: 0.5,
  bbWidthMin: 0.02,
  minConfidence: 0.6,
  maxHoldingBars: 24,
};

export class MeanReversionStrategy extends BaseStrategy {
  id = 'mean_reversion_v1';
  name = 'Mean Reversion BB Strategy';
  version = '1.0.0';

  private params: MeanReversionParams;
  private holdingBars: number = 0;

  constructor(parameters: Partial<MeanReversionParams> = {}) {
    const params = { ...DEFAULT_PARAMS, ...parameters };
    super(params);
    this.params = params;
  }

  onBar(bar: OHLCVBar, features: FeatureVector): Signal | null {
    const zscore = this.getFeatureValue(features, 'zscore_20');
    const bbWidth = this.getFeatureValue(features, 'bb_width');
    const sma = this.getFeatureValue(features, 'sma_20');

    if (zscore === null || bbWidth === null || sma === null) {
      return null;
    }

    // Update indicators
    this.setIndicator('zscore', zscore);
    this.setIndicator('bb_width', bbWidth);
    this.setIndicator('sma', sma);

    const position = this.getPosition();

    // Update holding counter
    if (position) {
      this.holdingBars++;
    }

    // Check exit conditions first
    if (position) {
      const exitSignal = this.checkExit(position.side, zscore, bar.symbol);
      if (exitSignal) {
        this.holdingBars = 0;
        return exitSignal;
      }
      return null;
    }

    // Check entry conditions
    return this.checkEntry(zscore, bbWidth, bar.symbol);
  }

  private checkEntry(
    zscore: number,
    bbWidth: number,
    symbol: string
  ): Signal | null {
    // Skip if volatility too low (no mean reversion opportunity)
    if (bbWidth < this.params.bbWidthMin) {
      return null;
    }

    // Long entry: Z-score significantly negative (price below mean)
    if (zscore < -this.params.zscoreEntry) {
      const confidence = this.calculateConfidence(zscore, bbWidth);
      if (confidence >= this.params.minConfidence) {
        return this.createSignal(
          symbol,
          'entry',
          'long',
          Math.abs(zscore) / 4, // Normalize to 0-1
          confidence,
          { zscore, bbWidth, reason: 'Price significantly below mean' }
        );
      }
    }

    // Short entry: Z-score significantly positive (price above mean)
    if (zscore > this.params.zscoreEntry) {
      const confidence = this.calculateConfidence(zscore, bbWidth);
      if (confidence >= this.params.minConfidence) {
        return this.createSignal(
          symbol,
          'entry',
          'short',
          Math.abs(zscore) / 4,
          confidence,
          { zscore, bbWidth, reason: 'Price significantly above mean' }
        );
      }
    }

    return null;
  }

  private checkExit(
    side: 'long' | 'short',
    zscore: number,
    symbol: string
  ): Signal | null {
    // Time-based exit
    if (this.holdingBars >= this.params.maxHoldingBars) {
      return this.createSignal(
        symbol,
        'exit',
        'flat',
        1,
        0.7,
        { zscore, reason: 'Max holding period reached' }
      );
    }

    // Mean reversion exit: Z-score returns to normal range
    if (side === 'long' && zscore > -this.params.zscoreExit) {
      return this.createSignal(
        symbol,
        'exit',
        'flat',
        1,
        0.8,
        { zscore, reason: 'Price returned to mean' }
      );
    }

    if (side === 'short' && zscore < this.params.zscoreExit) {
      return this.createSignal(
        symbol,
        'exit',
        'flat',
        1,
        0.8,
        { zscore, reason: 'Price returned to mean' }
      );
    }

    // Stop loss: Z-score moves further against position
    if (side === 'long' && zscore < -3.5) {
      return this.createSignal(
        symbol,
        'exit',
        'flat',
        1,
        0.9,
        { zscore, reason: 'Stop loss - extreme deviation' }
      );
    }

    if (side === 'short' && zscore > 3.5) {
      return this.createSignal(
        symbol,
        'exit',
        'flat',
        1,
        0.9,
        { zscore, reason: 'Stop loss - extreme deviation' }
      );
    }

    return null;
  }

  private calculateConfidence(zscore: number, bbWidth: number): number {
    let confidence = 0.5;

    // Higher Z-score deviation = higher confidence
    confidence += (Math.abs(zscore) - this.params.zscoreEntry) / 4 * 0.3;

    // Wider bands = better mean reversion opportunity
    confidence += Math.min(bbWidth / 0.1, 1) * 0.2;

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
