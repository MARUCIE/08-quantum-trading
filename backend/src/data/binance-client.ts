/**
 * Binance Data Client
 *
 * Handles connection to Binance API for market data retrieval.
 * Implements the canonical data contracts defined in types/market.ts.
 */

import type { OHLCVBar, Ticker, Trade, KlineInterval, DataQualityMetrics } from '../types/market';

import { resolveBinanceSpotRestBaseUrl } from './binance-config.js';
import { metrics } from '../metrics/index.js';


async function instrumentedFetch(url: string, endpoint: string): Promise<Response> {
  const endTimer = metrics.startTimer('binance_api_latency_ms', { endpoint });
  try {
    const response = await fetch(url);
    metrics.incCounter('binance_api_requests_total', {
      endpoint,
      status: String(response.status),
    });
    return response;
  } catch (error) {
    metrics.incCounter('binance_api_requests_total', {
      endpoint,
      status: 'fetch_error',
    });
    throw error;
  } finally {
    endTimer();
  }
}

// Response types
interface BinanceKline extends Array<number | string> {
  0: number;   // Open time
  1: string;   // Open
  2: string;   // High
  3: string;   // Low
  4: string;   // Close
  5: string;   // Volume
  6: number;   // Close time
  7: string;   // Quote asset volume
  8: number;   // Number of trades
  9: string;   // Taker buy base asset volume
  10: string;  // Taker buy quote asset volume
  11: string;  // Ignore
}

interface BinanceBookTicker {
  symbol: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
}

interface BinanceTrade {
  id: number;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
}

interface BinanceServerTime {
  serverTime: number;
}

export class BinanceClient {
  private baseUrl: string;
  private testnet: boolean;
  private qualityMetrics: Map<string, DataQualityMetrics> = new Map();

  constructor(options: {
    testnet?: boolean;
  } = {}) {
    this.testnet = options.testnet ?? true;
    this.baseUrl = resolveBinanceSpotRestBaseUrl(this.testnet);
  }

  /**
   * Fetch historical klines from Binance REST API
   */
  async getKlines(
    symbol: string,
    interval: KlineInterval,
    options: {
      startTime?: number;
      endTime?: number;
      limit?: number;
    } = {}
  ): Promise<OHLCVBar[]> {
    const { startTime, endTime, limit = 1000 } = options;

    const params = new URLSearchParams({
      symbol: symbol.toUpperCase(),
      interval,
      limit: String(Math.min(limit, 1000)),
    });

    if (startTime) params.set('startTime', String(startTime));
    if (endTime) params.set('endTime', String(endTime));

    const url = `${this.baseUrl}/api/v3/klines?${params}`;
    const response = await instrumentedFetch(url, '/api/v3/klines');

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as BinanceKline[];

    return data.map((k) => this.transformKline(k, symbol, interval));
  }

  /**
   * Transform Binance kline to canonical OHLCV format
   */
  private transformKline(
    raw: BinanceKline,
    symbol: string,
    interval: KlineInterval
  ): OHLCVBar {
    return {
      timestamp: raw[0] as number,
      open: parseFloat(raw[1] as string),
      high: parseFloat(raw[2] as string),
      low: parseFloat(raw[3] as string),
      close: parseFloat(raw[4] as string),
      volume: parseFloat(raw[5] as string),
      symbol: symbol.toUpperCase(),
      exchange: 'binance',
      interval,
    };
  }

  /**
   * Get current ticker for a symbol
   */
  async getTicker(symbol: string): Promise<Ticker> {
    const url = `${this.baseUrl}/api/v3/ticker/bookTicker?symbol=${symbol.toUpperCase()}`;
    const response = await instrumentedFetch(url, '/api/v3/ticker/bookTicker');

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json() as BinanceBookTicker;

    return {
      timestamp: Date.now(),
      symbol: data.symbol,
      exchange: 'binance',
      bid: parseFloat(data.bidPrice),
      ask: parseFloat(data.askPrice),
      bidSize: parseFloat(data.bidQty),
      askSize: parseFloat(data.askQty),
      last: parseFloat(data.bidPrice),
      lastSize: 0,
    };
  }

  /**
   * Get recent trades for a symbol
   */
  async getTrades(symbol: string, limit: number = 100): Promise<Trade[]> {
    const url = `${this.baseUrl}/api/v3/trades?symbol=${symbol.toUpperCase()}&limit=${limit}`;
    const response = await instrumentedFetch(url, '/api/v3/trades');

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json() as BinanceTrade[];

    return data.map((t) => ({
      timestamp: t.time,
      symbol: symbol.toUpperCase(),
      exchange: 'binance' as const,
      price: parseFloat(t.price),
      quantity: parseFloat(t.qty),
      side: t.isBuyerMaker ? 'sell' as const : 'buy' as const,
      tradeId: String(t.id),
    }));
  }

  /**
   * Get data quality metrics for a symbol
   */
  getQualityMetrics(symbol: string): DataQualityMetrics | undefined {
    return this.qualityMetrics.get(symbol.toUpperCase());
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      const response = await instrumentedFetch(`${this.baseUrl}/api/v3/ping`, '/api/v3/ping');
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get server time
   */
  async getServerTime(): Promise<number> {
    const response = await instrumentedFetch(`${this.baseUrl}/api/v3/time`, '/api/v3/time');
    const data = await response.json() as BinanceServerTime;
    return data.serverTime;
  }

  /**
   * Check if using testnet
   */
  isTestnet(): boolean {
    return this.testnet;
  }
}

// Export singleton for convenience
export const binanceClient = new BinanceClient({
  testnet: process.env.BINANCE_TESTNET === 'true',
});
