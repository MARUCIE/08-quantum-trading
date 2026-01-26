/**
 * Data Pipeline
 *
 * Core data ingestion and standardization pipeline.
 * Implements quality gates and data validation.
 */

import type { OHLCVBar, Ticker, Trade, KlineInterval, DataQualityMetrics } from '../types/market';

/** Data quality gate thresholds */
interface QualityGateConfig {
  maxLatencyMs: number;
  maxLatencyWarnMs: number;
  maxMissingPct: number;
  maxDuplicatePct: number;
  maxPriceChangePct: number;
}

const DEFAULT_QUALITY_GATES: QualityGateConfig = {
  maxLatencyMs: 5000,
  maxLatencyWarnMs: 1000,
  maxMissingPct: 0.01,
  maxDuplicatePct: 0.001,
  maxPriceChangePct: 0.1,
};

/** Quality check result */
interface QualityCheckResult {
  passed: boolean;
  latencyMs: number;
  missingPct: number;
  duplicatePct: number;
  outlierCount: number;
  warnings: string[];
  errors: string[];
}

/** Data buffer for quality tracking */
interface DataBuffer<T> {
  data: T[];
  lastUpdate: number;
  windowMs: number;
}

export class DataPipeline {
  private config: QualityGateConfig;
  private klineBuffers: Map<string, DataBuffer<OHLCVBar>> = new Map();
  private tickerBuffers: Map<string, DataBuffer<Ticker>> = new Map();
  private tradeBuffers: Map<string, DataBuffer<Trade>> = new Map();
  private qualityMetrics: Map<string, DataQualityMetrics> = new Map();

  constructor(config: Partial<QualityGateConfig> = {}) {
    this.config = { ...DEFAULT_QUALITY_GATES, ...config };
  }

  /**
   * Process incoming kline data
   */
  processKline(bar: OHLCVBar): QualityCheckResult {
    const key = `${bar.symbol}:${bar.interval}`;
    const buffer = this.getOrCreateBuffer(this.klineBuffers, key, 3600000); // 1 hour window

    // Quality checks
    const result = this.checkKlineQuality(bar, buffer);

    // Add to buffer if passed
    if (result.passed) {
      buffer.data.push(bar);
      buffer.lastUpdate = Date.now();

      // Trim buffer to window
      const cutoff = Date.now() - buffer.windowMs;
      buffer.data = buffer.data.filter((b) => b.timestamp > cutoff);
    }

    // Update metrics
    this.updateMetrics(key, result);

    return result;
  }

  /**
   * Process incoming ticker data
   */
  processTicker(ticker: Ticker): QualityCheckResult {
    const key = ticker.symbol;
    const buffer = this.getOrCreateBuffer(this.tickerBuffers, key, 60000); // 1 minute window

    const result = this.checkTickerQuality(ticker, buffer);

    if (result.passed) {
      buffer.data.push(ticker);
      buffer.lastUpdate = Date.now();

      // Keep last 100 tickers
      if (buffer.data.length > 100) {
        buffer.data = buffer.data.slice(-100);
      }
    }

    this.updateMetrics(key, result);

    return result;
  }

  /**
   * Process incoming trade data
   */
  processTrade(trade: Trade): QualityCheckResult {
    const key = trade.symbol;
    const buffer = this.getOrCreateBuffer(this.tradeBuffers, key, 60000);

    const result = this.checkTradeQuality(trade, buffer);

    if (result.passed) {
      buffer.data.push(trade);
      buffer.lastUpdate = Date.now();

      // Keep last 1000 trades
      if (buffer.data.length > 1000) {
        buffer.data = buffer.data.slice(-1000);
      }
    }

    this.updateMetrics(key, result);

    return result;
  }

  /**
   * Get quality metrics for a symbol
   */
  getMetrics(symbol: string): DataQualityMetrics | undefined {
    return this.qualityMetrics.get(symbol);
  }

  /**
   * Get all quality metrics
   */
  getAllMetrics(): Map<string, DataQualityMetrics> {
    return new Map(this.qualityMetrics);
  }

  /**
   * Get buffered klines
   */
  getKlines(symbol: string, interval: KlineInterval): OHLCVBar[] {
    const key = `${symbol}:${interval}`;
    return this.klineBuffers.get(key)?.data || [];
  }

  /**
   * Get latest ticker
   */
  getLatestTicker(symbol: string): Ticker | undefined {
    const buffer = this.tickerBuffers.get(symbol);
    return buffer?.data[buffer.data.length - 1];
  }

  /**
   * Get recent trades
   */
  getRecentTrades(symbol: string, limit: number = 100): Trade[] {
    const buffer = this.tradeBuffers.get(symbol);
    if (!buffer) return [];
    return buffer.data.slice(-limit);
  }

  private getOrCreateBuffer<T>(
    buffers: Map<string, DataBuffer<T>>,
    key: string,
    windowMs: number
  ): DataBuffer<T> {
    let buffer = buffers.get(key);
    if (!buffer) {
      buffer = { data: [], lastUpdate: 0, windowMs };
      buffers.set(key, buffer);
    }
    return buffer;
  }

  private checkKlineQuality(bar: OHLCVBar, buffer: DataBuffer<OHLCVBar>): QualityCheckResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    let outlierCount = 0;

    // Latency check
    const latencyMs = Date.now() - bar.timestamp;
    if (latencyMs > this.config.maxLatencyMs) {
      errors.push(`Latency ${latencyMs}ms exceeds ${this.config.maxLatencyMs}ms limit`);
    } else if (latencyMs > this.config.maxLatencyWarnMs) {
      warnings.push(`Latency ${latencyMs}ms above ${this.config.maxLatencyWarnMs}ms threshold`);
    }

    // Price sanity check
    if (bar.high < bar.low) {
      errors.push(`Invalid OHLC: high ${bar.high} < low ${bar.low}`);
    }
    if (bar.open > bar.high || bar.open < bar.low) {
      errors.push(`Invalid OHLC: open ${bar.open} outside high/low range`);
    }
    if (bar.close > bar.high || bar.close < bar.low) {
      errors.push(`Invalid OHLC: close ${bar.close} outside high/low range`);
    }

    // Price change check (compared to last bar)
    const lastBar = buffer.data[buffer.data.length - 1];
    if (lastBar) {
      const priceChange = Math.abs(bar.close - lastBar.close) / lastBar.close;
      if (priceChange > this.config.maxPriceChangePct) {
        warnings.push(`Price change ${(priceChange * 100).toFixed(2)}% exceeds threshold`);
        outlierCount++;
      }
    }

    // Duplicate check
    const duplicate = buffer.data.some((b) => b.timestamp === bar.timestamp);
    if (duplicate) {
      errors.push(`Duplicate timestamp ${bar.timestamp}`);
    }

    // Calculate missing percentage (gaps in timestamp)
    let missingPct = 0;
    if (buffer.data.length > 1) {
      const expectedInterval = this.getIntervalMs(bar.interval);
      const gaps = buffer.data.slice(1).filter((b, i) => {
        const expected = buffer.data[i].timestamp + expectedInterval;
        return b.timestamp > expected + expectedInterval;
      });
      missingPct = gaps.length / buffer.data.length;
    }

    return {
      passed: errors.length === 0,
      latencyMs,
      missingPct,
      duplicatePct: duplicate ? 1 : 0,
      outlierCount,
      warnings,
      errors,
    };
  }

  private checkTickerQuality(ticker: Ticker, buffer: DataBuffer<Ticker>): QualityCheckResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    let outlierCount = 0;

    const latencyMs = Date.now() - ticker.timestamp;
    if (latencyMs > this.config.maxLatencyMs) {
      errors.push(`Latency ${latencyMs}ms exceeds limit`);
    }

    // Bid/ask sanity
    if (ticker.bid > ticker.ask) {
      errors.push(`Invalid ticker: bid ${ticker.bid} > ask ${ticker.ask}`);
    }

    // Price change check
    const lastTicker = buffer.data[buffer.data.length - 1];
    if (lastTicker) {
      const priceChange = Math.abs(ticker.last - lastTicker.last) / lastTicker.last;
      if (priceChange > this.config.maxPriceChangePct) {
        warnings.push(`Price jump ${(priceChange * 100).toFixed(2)}%`);
        outlierCount++;
      }
    }

    return {
      passed: errors.length === 0,
      latencyMs,
      missingPct: 0,
      duplicatePct: 0,
      outlierCount,
      warnings,
      errors,
    };
  }

  private checkTradeQuality(trade: Trade, buffer: DataBuffer<Trade>): QualityCheckResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    let outlierCount = 0;

    const latencyMs = Date.now() - trade.timestamp;
    if (latencyMs > this.config.maxLatencyMs) {
      errors.push(`Latency ${latencyMs}ms exceeds limit`);
    }

    // Duplicate check
    const duplicate = buffer.data.some((t) => t.tradeId === trade.tradeId);
    if (duplicate) {
      errors.push(`Duplicate trade ID ${trade.tradeId}`);
    }

    // Price sanity
    if (trade.price <= 0 || trade.quantity <= 0) {
      errors.push(`Invalid trade: price=${trade.price}, qty=${trade.quantity}`);
    }

    // Price change check
    const lastTrade = buffer.data[buffer.data.length - 1];
    if (lastTrade) {
      const priceChange = Math.abs(trade.price - lastTrade.price) / lastTrade.price;
      if (priceChange > this.config.maxPriceChangePct) {
        warnings.push(`Price jump ${(priceChange * 100).toFixed(2)}%`);
        outlierCount++;
      }
    }

    return {
      passed: errors.length === 0,
      latencyMs,
      missingPct: 0,
      duplicatePct: duplicate ? 1 : 0,
      outlierCount,
      warnings,
      errors,
    };
  }

  private updateMetrics(key: string, result: QualityCheckResult): void {
    const existing = this.qualityMetrics.get(key) || {
      latencyMs: 0,
      missingCount: 0,
      duplicateCount: 0,
      outlierCount: 0,
      lastUpdate: 0,
    };

    // Exponential moving average for latency
    existing.latencyMs = existing.latencyMs * 0.9 + result.latencyMs * 0.1;
    existing.missingCount += result.missingPct > 0 ? 1 : 0;
    existing.duplicateCount += result.duplicatePct > 0 ? 1 : 0;
    existing.outlierCount += result.outlierCount;
    existing.lastUpdate = Date.now();

    this.qualityMetrics.set(key, existing);
  }

  private getIntervalMs(interval: KlineInterval): number {
    const map: Record<string, number> = {
      '1m': 60000,
      '3m': 180000,
      '5m': 300000,
      '15m': 900000,
      '30m': 1800000,
      '1h': 3600000,
      '2h': 7200000,
      '4h': 14400000,
      '6h': 21600000,
      '8h': 28800000,
      '12h': 43200000,
      '1d': 86400000,
      '3d': 259200000,
      '1w': 604800000,
      '1M': 2592000000,
    };
    return map[interval] || 60000;
  }
}
