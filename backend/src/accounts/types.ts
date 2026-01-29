export type AccountMode = 'simulated' | 'real';

export type AccountStatus = 'active' | 'inactive' | 'pending' | 'error';

export type RealAccountProvider = 'binance' | 'okx' | 'bybit';

export interface AccountRecord {
  id: string;
  name: string;
  mode: AccountMode;
  provider?: RealAccountProvider;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
  lastConnectedAt?: string;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

export interface AccountCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
}

export interface AccountConnectionInput {
  name: string;
  provider: RealAccountProvider;
  credentials: AccountCredentials;
  permissions?: string[];
  setActive?: boolean;
}

export interface SimulatedAccountInput {
  name: string;
  initialCapital?: number;
  setActive?: boolean;
}

export interface AccountStoreFile {
  accounts: AccountRecord[];
  activeAccountId: string | null;
}
