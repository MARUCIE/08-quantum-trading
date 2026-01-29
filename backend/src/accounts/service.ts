import type { AccountRecord, AccountMode } from './types.js';
import { accountStore } from './store.js';
import { getProviderConfig } from './env.js';

export type EnvironmentGuardResult = {
  allowed: boolean;
  reason?: string;
};

export function listAccounts(): AccountRecord[] {
  return accountStore.list();
}

export function getActiveAccount(): AccountRecord | undefined {
  return accountStore.getActive();
}

export function getAccountById(id: string): AccountRecord | undefined {
  return accountStore.get(id);
}

export function setActiveAccount(id: string): AccountRecord | null {
  return accountStore.setActive(id);
}

export function getProviderConfigForAccount(account: AccountRecord): ReturnType<typeof getProviderConfig> | null {
  if (account.mode !== 'real' || !account.provider) return null;
  return getProviderConfig(account.provider);
}

export function guardAccountMode(requested: AccountMode, active?: AccountRecord): EnvironmentGuardResult {
  if (!active) {
    return { allowed: false, reason: 'No active account selected' };
  }
  if (active.mode !== requested) {
    return {
      allowed: false,
      reason: `Account mode mismatch (active=${active.mode}, requested=${requested})`,
    };
  }
  if (active.status !== 'active') {
    return {
      allowed: false,
      reason: `Account is not active (status=${active.status})`,
    };
  }
  return { allowed: true };
}
