import { readJson, writeJson } from '../storage/json-store.js';
import { resolveStoragePath } from '../storage/paths.js';
import type {
  AccountRecord,
  AccountStoreFile,
  AccountConnectionInput,
  SimulatedAccountInput,
  AccountMode,
} from './types.js';
import { encryptPayload, decryptPayload, type EncryptedPayload } from './crypto.js';

interface CredentialStoreFile {
  credentials: Record<string, EncryptedPayload>;
}

const storePath = resolveStoragePath('accounts.json');
const credentialsPath = resolveStoragePath('account-credentials.json');

const defaultStore: AccountStoreFile = {
  accounts: [],
  activeAccountId: null,
};

const defaultCredentials: CredentialStoreFile = {
  credentials: {},
};

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}`;
}

class AccountStore {
  private store: AccountStoreFile;
  private credentials: CredentialStoreFile;

  constructor() {
    this.store = readJson(storePath, defaultStore);
    this.credentials = readJson(credentialsPath, defaultCredentials);
    if (!this.store.activeAccountId && this.store.accounts.length > 0) {
      const active = this.store.accounts.find((account) => account.status === 'active');
      if (active) {
        this.store.activeAccountId = active.id;
        this.persist();
      }
    }
  }

  list(): AccountRecord[] {
    return [...this.store.accounts].sort((a, b) => a.name.localeCompare(b.name));
  }

  get(id: string): AccountRecord | undefined {
    return this.store.accounts.find((account) => account.id === id);
  }

  getActive(): AccountRecord | undefined {
    if (!this.store.activeAccountId) return undefined;
    return this.get(this.store.activeAccountId);
  }

  setActive(id: string): AccountRecord | null {
    const account = this.get(id);
    if (!account) return null;
    if (this.store.activeAccountId && this.store.activeAccountId !== id) {
      const previous = this.get(this.store.activeAccountId);
      if (previous) {
        previous.status = 'inactive';
        previous.updatedAt = nowIso();
      }
    }
    this.store.accounts.forEach((item) => {
      if (item.id !== id && item.status === 'active') {
        item.status = 'inactive';
        item.updatedAt = nowIso();
      }
    });
    this.store.activeAccountId = id;
    account.status = 'active';
    account.updatedAt = nowIso();
    this.persist();
    return account;
  }

  createSimulated(input: SimulatedAccountInput): AccountRecord {
    const shouldActivate = input.setActive ?? false;
    const account: AccountRecord = {
      id: createId('sim'),
      name: input.name,
      mode: 'simulated',
      status: shouldActivate || !this.store.activeAccountId ? 'active' : 'inactive',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: {
        initialCapital: input.initialCapital ?? 100000,
      },
    };
    this.store.accounts.push(account);
    if (shouldActivate) {
      this.setActive(account.id);
      return account;
    }
    this.persist();
    return account;
  }

  createReal(input: AccountConnectionInput): AccountRecord {
    const shouldActivate = input.setActive ?? false;
    const account: AccountRecord = {
      id: createId('real'),
      name: input.name,
      mode: 'real',
      provider: input.provider,
      status: shouldActivate ? 'active' : 'pending',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      permissions: input.permissions,
    };

    const encrypted = encryptPayload(input.credentials);
    this.credentials.credentials[account.id] = encrypted;
    this.store.accounts.push(account);

    if (shouldActivate || !this.store.activeAccountId) {
      this.setActive(account.id);
      return account;
    }

    this.persist();
    return account;
  }

  updateStatus(id: string, status: AccountRecord['status']): AccountRecord | null {
    const account = this.get(id);
    if (!account) return null;
    account.status = status;
    account.updatedAt = nowIso();
    this.persist();
    return account;
  }

  updateMetadata(id: string, metadata: Record<string, unknown>): AccountRecord | null {
    const account = this.get(id);
    if (!account) return null;
    account.metadata = { ...(account.metadata || {}), ...metadata };
    account.updatedAt = nowIso();
    this.persist();
    return account;
  }

  getCredentials(id: string): AccountConnectionInput['credentials'] | null {
    const payload = this.credentials.credentials[id];
    if (!payload) return null;
    return decryptPayload(payload);
  }

  clearCredentials(id: string): boolean {
    if (!this.credentials.credentials[id]) return false;
    delete this.credentials.credentials[id];
    this.persist();
    return true;
  }

  filterByMode(mode: AccountMode): AccountRecord[] {
    return this.store.accounts.filter((account) => account.mode === mode);
  }

  private persist(): void {
    writeJson(storePath, this.store);
    writeJson(credentialsPath, this.credentials);
  }
}

export const accountStore = new AccountStore();
