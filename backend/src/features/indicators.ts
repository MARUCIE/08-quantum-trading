/**
 * Technical Indicators
 *
 * Core technical analysis indicators for feature computation.
 */

import type { OHLCVBar } from '../types/market';

/**
 * Simple Moving Average
 */
export function sma(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

/**
 * Exponential Moving Average
 */
export function ema(data: number[], period: number): number | null {
  if (data.length < period) return null;

  const multiplier = 2 / (period + 1);
  let emaValue = sma(data.slice(0, period), period);
  if (emaValue === null) return null;

  for (let i = period; i < data.length; i++) {
    emaValue = (data[i] - emaValue) * multiplier + emaValue;
  }

  return emaValue;
}

/**
 * Relative Strength Index
 */
export function rsi(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;

  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? -c : 0));

  const recentGains = gains.slice(-period);
  const recentLosses = losses.slice(-period);

  const avgGain = recentGains.reduce((s, v) => s + v, 0) / period;
  const avgLoss = recentLosses.reduce((s, v) => s + v, 0) / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Moving Average Convergence Divergence
 */
export function macd(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number; signal: number; histogram: number } | null {
  if (closes.length < slowPeriod + signalPeriod) return null;

  const fastEma = ema(closes, fastPeriod);
  const slowEma = ema(closes, slowPeriod);

  if (fastEma === null || slowEma === null) return null;

  const macdLine = fastEma - slowEma;

  // Calculate MACD line history for signal
  const macdHistory: number[] = [];
  for (let i = slowPeriod; i <= closes.length; i++) {
    const fast = ema(closes.slice(0, i), fastPeriod);
    const slow = ema(closes.slice(0, i), slowPeriod);
    if (fast !== null && slow !== null) {
      macdHistory.push(fast - slow);
    }
  }

  const signalLine = ema(macdHistory, signalPeriod);
  if (signalLine === null) return null;

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine,
  };
}

/**
 * Bollinger Bands
 */
export function bollingerBands(
  closes: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number; middle: number; lower: number; width: number } | null {
  if (closes.length < period) return null;

  const slice = closes.slice(-period);
  const middle = slice.reduce((s, v) => s + v, 0) / period;

  const squaredDiffs = slice.map((v) => Math.pow(v - middle, 2));
  const variance = squaredDiffs.reduce((s, v) => s + v, 0) / period;
  const std = Math.sqrt(variance);

  const upper = middle + stdDev * std;
  const lower = middle - stdDev * std;

  return {
    upper,
    middle,
    lower,
    width: (upper - lower) / middle,
  };
}

/**
 * Average True Range
 */
export function atr(bars: OHLCVBar[], period: number = 14): number | null {
  if (bars.length < period + 1) return null;

  const trueRanges: number[] = [];

  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  const recentTr = trueRanges.slice(-period);
  return recentTr.reduce((s, v) => s + v, 0) / period;
}

/**
 * Volume Weighted Average Price
 */
export function vwap(bars: OHLCVBar[]): number | null {
  if (bars.length === 0) return null;

  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (const bar of bars) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    cumulativeTPV += typicalPrice * bar.volume;
    cumulativeVolume += bar.volume;
  }

  if (cumulativeVolume === 0) return null;

  return cumulativeTPV / cumulativeVolume;
}

/**
 * On-Balance Volume
 */
export function obv(bars: OHLCVBar[]): number | null {
  if (bars.length < 2) return null;

  let obvValue = 0;

  for (let i = 1; i < bars.length; i++) {
    if (bars[i].close > bars[i - 1].close) {
      obvValue += bars[i].volume;
    } else if (bars[i].close < bars[i - 1].close) {
      obvValue -= bars[i].volume;
    }
  }

  return obvValue;
}

/**
 * Price Rate of Change
 */
export function roc(closes: number[], period: number = 10): number | null {
  if (closes.length < period + 1) return null;

  const current = closes[closes.length - 1];
  const past = closes[closes.length - 1 - period];

  return ((current - past) / past) * 100;
}

/**
 * Standard Deviation
 */
export function stdDev(data: number[], period: number): number | null {
  if (data.length < period) return null;

  const slice = data.slice(-period);
  const mean = slice.reduce((s, v) => s + v, 0) / period;
  const squaredDiffs = slice.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((s, v) => s + v, 0) / period;

  return Math.sqrt(variance);
}

/**
 * Z-Score
 */
export function zScore(data: number[], period: number): number | null {
  if (data.length < period) return null;

  const slice = data.slice(-period);
  const mean = slice.reduce((s, v) => s + v, 0) / period;
  const std = stdDev(data, period);

  if (std === null || std === 0) return null;

  const current = data[data.length - 1];
  return (current - mean) / std;
}
