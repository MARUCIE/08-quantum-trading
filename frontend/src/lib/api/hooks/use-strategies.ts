/**
 * Strategies API Hooks
 *
 * TanStack Query hooks for strategy management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Strategy, StrategyStatus, StrategySignal } from '../types';

// Query Keys
export const strategyKeys = {
  all: ['strategies'] as const,
  lists: () => [...strategyKeys.all, 'list'] as const,
  list: (filters: string) => [...strategyKeys.lists(), filters] as const,
  details: () => [...strategyKeys.all, 'detail'] as const,
  detail: (id: string) => [...strategyKeys.details(), id] as const,
  signals: (id: string) => [...strategyKeys.all, 'signals', id] as const,
};

// API Functions
async function fetchStrategies(): Promise<Strategy[]> {
  return apiClient.get<Strategy[]>('/api/strategies');
}

async function fetchStrategy(id: string): Promise<Strategy> {
  return apiClient.get<Strategy>(`/api/strategies/${id}`);
}

async function fetchSignals(strategyId: string): Promise<StrategySignal[]> {
  return apiClient.get<StrategySignal[]>(`/api/strategies/${strategyId}/signals`);
}

async function updateStrategyStatus(data: {
  id: string;
  status: StrategyStatus;
}): Promise<Strategy> {
  return apiClient.put<Strategy>(`/api/strategies/${data.id}/status`, {
    status: data.status,
  });
}

async function createStrategy(data: Partial<Strategy>): Promise<Strategy> {
  return apiClient.post<Strategy>('/api/strategies', data);
}

async function deleteStrategy(id: string): Promise<void> {
  return apiClient.delete(`/api/strategies/${id}`);
}

// Hooks
export function useStrategies() {
  return useQuery({
    queryKey: strategyKeys.lists(),
    queryFn: fetchStrategies,
    staleTime: 30000, // 30 seconds
  });
}

export function useStrategy(id: string) {
  return useQuery({
    queryKey: strategyKeys.detail(id),
    queryFn: () => fetchStrategy(id),
    enabled: !!id,
    staleTime: 10000,
  });
}

export function useStrategySignals(strategyId: string) {
  return useQuery({
    queryKey: strategyKeys.signals(strategyId),
    queryFn: () => fetchSignals(strategyId),
    enabled: !!strategyId,
    refetchInterval: 5000,
  });
}

export function useUpdateStrategyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStrategyStatus,
    onSuccess: (data) => {
      queryClient.setQueryData(strategyKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: strategyKeys.lists() });
    },
  });
}

export function useCreateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStrategy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategyKeys.lists() });
    },
  });
}

export function useDeleteStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStrategy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategyKeys.lists() });
    },
  });
}
