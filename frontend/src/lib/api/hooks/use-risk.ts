/**
 * Risk API Hooks
 *
 * TanStack Query hooks for risk monitoring.
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { RiskEvent, RiskMetrics } from '../types';

// Query Keys
export const riskKeys = {
  all: ['risk'] as const,
  metrics: () => [...riskKeys.all, 'metrics'] as const,
  events: () => [...riskKeys.all, 'events'] as const,
  eventsByLevel: (level: string) => [...riskKeys.all, 'events', level] as const,
};

// API Functions
async function fetchRiskMetrics(): Promise<RiskMetrics> {
  return apiClient.get<RiskMetrics>('/api/risk/metrics');
}

async function fetchRiskEvents(limit: number = 100): Promise<RiskEvent[]> {
  return apiClient.get<RiskEvent[]>(`/api/risk/events?limit=${limit}`);
}

async function fetchRiskEventsByLevel(
  level: 'info' | 'warning' | 'critical'
): Promise<RiskEvent[]> {
  return apiClient.get<RiskEvent[]>(`/api/risk/events?level=${level}`);
}

// Hooks
export function useRiskMetrics() {
  return useQuery({
    queryKey: riskKeys.metrics(),
    queryFn: fetchRiskMetrics,
    staleTime: 5000,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

export function useRiskEvents(limit: number = 100) {
  return useQuery({
    queryKey: riskKeys.events(),
    queryFn: () => fetchRiskEvents(limit),
    staleTime: 5000,
    refetchInterval: 10000,
  });
}

export function useRiskEventsByLevel(level: 'info' | 'warning' | 'critical') {
  return useQuery({
    queryKey: riskKeys.eventsByLevel(level),
    queryFn: () => fetchRiskEventsByLevel(level),
    staleTime: 5000,
    refetchInterval: 10000,
  });
}
