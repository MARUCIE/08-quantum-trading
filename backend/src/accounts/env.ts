import type { RealAccountProvider } from './types.js';

export interface ProviderConfig {
  provider: RealAccountProvider;
  baseUrl: string;
  recvWindow: number;
  accountType?: string;
  tradeMode?: string;
}

function readNumber(value: string | undefined, fallback: number): number {
  const parsed = value ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getProviderConfig(provider: RealAccountProvider): ProviderConfig {
  if (provider === 'binance') {
    return {
      provider,
      baseUrl: process.env.BINANCE_FUTURES_BASE_URL || 'https://fapi.binance.com',
      recvWindow: readNumber(process.env.BINANCE_RECV_WINDOW, 5000),
    };
  }

  if (provider === 'okx') {
    return {
      provider,
      baseUrl: process.env.OKX_BASE_URL || 'https://www.okx.com',
      recvWindow: readNumber(process.env.OKX_RECV_WINDOW, 5000),
      tradeMode: process.env.OKX_TRADE_MODE || 'cross',
    };
  }

  return {
    provider,
    baseUrl: process.env.BYBIT_BASE_URL || 'https://api.bybit.com',
    recvWindow: readNumber(process.env.BYBIT_RECV_WINDOW, 5000),
    accountType: process.env.BYBIT_ACCOUNT_TYPE || 'UNIFIED',
  };
}
