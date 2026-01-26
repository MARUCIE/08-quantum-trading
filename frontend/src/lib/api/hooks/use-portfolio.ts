/**
 * Portfolio API Hooks
 *
 * TanStack Query hooks for portfolio data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { AccountState, Position, PortfolioStats } from '../types';

// Query Keys
export const portfolioKeys = {
  all: ['portfolio'] as const,
  account: () => [...portfolioKeys.all, 'account'] as const,
  positions: () => [...portfolioKeys.all, 'positions'] as const,
  stats: () => [...portfolioKeys.all, 'stats'] as const,
};

// API Functions
async function fetchAccount(): Promise<AccountState> {
  return apiClient.get<AccountState>('/api/portfolio/account');
}

async function fetchPositions(): Promise<Position[]> {
  return apiClient.get<Position[]>('/api/portfolio/positions');
}

async function fetchStats(): Promise<PortfolioStats> {
  return apiClient.get<PortfolioStats>('/api/portfolio/stats');
}

async function closePosition(symbol: string): Promise<void> {
  return apiClient.post('/api/portfolio/positions/close', { symbol });
}

// Hooks
export function useAccount() {
  return useQuery({
    queryKey: portfolioKeys.account(),
    queryFn: fetchAccount,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 2000,
  });
}

export function usePositions() {
  return useQuery({
    queryKey: portfolioKeys.positions(),
    queryFn: fetchPositions,
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

export function usePortfolioStats() {
  return useQuery({
    queryKey: portfolioKeys.stats(),
    queryFn: fetchStats,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
}

export function useClosePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closePosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
    },
  });
}
