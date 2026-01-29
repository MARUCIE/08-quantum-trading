/**
 * Accounts API Hooks
 *
 * TanStack Query hooks for simulated and real account management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type {
  AccountRecord,
  AccountListResponse,
  SimulatedAccountInput,
  RealAccountInput,
} from "../types";

export const accountKeys = {
  all: ["accounts"] as const,
  list: () => [...accountKeys.all, "list"] as const,
};

async function fetchAccounts(): Promise<AccountListResponse> {
  return apiClient.get<AccountListResponse>("/api/accounts");
}

async function createSimulatedAccount(
  input: SimulatedAccountInput
): Promise<AccountRecord> {
  return apiClient.post<AccountRecord>("/api/accounts/simulated", input);
}

async function createRealAccount(
  input: RealAccountInput
): Promise<AccountRecord> {
  return apiClient.post<AccountRecord>("/api/accounts/real", input);
}

async function activateAccount(id: string): Promise<AccountRecord> {
  return apiClient.post<AccountRecord>(`/api/accounts/${id}/activate`, {});
}

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.list(),
    queryFn: fetchAccounts,
    staleTime: 5000,
    retry: 1,
  });
}

export function useCreateSimulatedAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSimulatedAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useCreateRealAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRealAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useActivateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
