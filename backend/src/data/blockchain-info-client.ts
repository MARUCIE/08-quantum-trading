/**
 * Blockchain.info Market Data Client
 *
 * Provides a real (non-mocked) BTC ticker fallback when major exchange APIs are
 * blocked in certain environments.
 *
 * Endpoint: https://blockchain.info/ticker
 */

import type { Ticker } from '../types/market';

type BlockchainTickerEntry = {
  '15m': number;
  last: number;
  buy: number;
  sell: number;
  symbol: string;
};

type BlockchainTickerResponse = Record<string, BlockchainTickerEntry>;

const DEFAULT_BASE_URL = 'https://blockchain.info';

function normalizeSymbol(symbol: string): string {
  return symbol.replace('/', '').trim().toUpperCase();
}

export class BlockchainInfoClient {
  private baseUrl: string;

  constructor(options: { baseUrl?: string } = {}) {
    this.baseUrl = options.baseUrl?.trim() || DEFAULT_BASE_URL;
  }

  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker`, {
        headers: {
          // Some networks require a UA; keep it stable for reproducible captures.
          'User-Agent': 'quantum-x-backend',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getTicker(symbol: string): Promise<Ticker> {
    const normalized = normalizeSymbol(symbol);

    // blockchain.info provides BTC prices only.
    if (!normalized.startsWith('BTC')) {
      throw new Error(`Unsupported symbol for blockchain.info: ${symbol}`);
    }

    const response = await fetch(`${this.baseUrl}/ticker`, {
      headers: {
        'User-Agent': 'quantum-x-backend',
      },
    });

    if (!response.ok) {
      throw new Error(`Blockchain.info API error: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as BlockchainTickerResponse;
    const usd = payload.USD;
    if (!usd) {
      throw new Error('Blockchain.info response missing USD entry');
    }

    return {
      timestamp: Date.now(),
      symbol: normalized,
      exchange: 'blockchain_info',
      // Map buy/sell/last into bid/ask/last. Sizes are not provided.
      bid: usd.buy,
      ask: usd.sell,
      bidSize: 0,
      askSize: 0,
      last: usd.last,
      lastSize: 0,
    };
  }
}
