/**
 * Market Data API Hooks
 *
 * TanStack Query hooks for market data.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { OHLCVBar, Ticker, Trade } from '../types';

// Query Keys
export const marketKeys = {
  all: ['market'] as const,
  klines: (symbol: string, interval: string) =>
    [...marketKeys.all, 'klines', symbol, interval] as const,
  ticker: (symbol: string) => [...marketKeys.all, 'ticker', symbol] as const,
  tickers: () => [...marketKeys.all, 'tickers'] as const,
  trades: (symbol: string) => [...marketKeys.all, 'trades', symbol] as const,
};

// API Functions
async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<OHLCVBar[]> {
  return apiClient.get<OHLCVBar[]>(
    `/api/market/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
}

async function fetchTicker(symbol: string): Promise<Ticker> {
  return apiClient.get<Ticker>(`/api/market/ticker?symbol=${symbol}`);
}

async function fetchAllTickers(): Promise<Ticker[]> {
  return apiClient.get<Ticker[]>('/api/market/tickers');
}

async function fetchRecentTrades(symbol: string, limit: number = 50): Promise<Trade[]> {
  return apiClient.get<Trade[]>(
    `/api/market/trades?symbol=${symbol}&limit=${limit}`
  );
}

// Hooks
export function useKlines(
  symbol: string,
  interval: string = '1h',
  limit: number = 100
) {
  return useQuery({
    queryKey: marketKeys.klines(symbol, interval),
    queryFn: () => fetchKlines(symbol, interval, limit),
    enabled: !!symbol,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useTicker(symbol: string) {
  return useQuery({
    queryKey: marketKeys.ticker(symbol),
    queryFn: () => fetchTicker(symbol),
    enabled: !!symbol,
    staleTime: 1000,
    refetchInterval: 2000, // Refresh every 2 seconds
  });
}

export function useAllTickers() {
  return useQuery({
    queryKey: marketKeys.tickers(),
    queryFn: fetchAllTickers,
    staleTime: 2000,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export function useRecentTrades(symbol: string, limit: number = 50) {
  return useQuery({
    queryKey: marketKeys.trades(symbol),
    queryFn: () => fetchRecentTrades(symbol, limit),
    enabled: !!symbol,
    staleTime: 5000,
    refetchInterval: 5000,
  });
}
