/**
 * Execution Types
 *
 * Defines contracts for order management and venue adapters.
 */

/** Order request */
export interface OrderRequest {
  clientOrderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  reduceOnly?: boolean;
  postOnly?: boolean;
  strategyId?: string;
  metadata?: Record<string, unknown>;
  accountId?: string;
  accountMode?: 'simulated' | 'real';
}

/** Order status */
export type OrderStatus =
  | 'pending'
  | 'submitted'
  | 'partial'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'expired';

/** Order response */
export interface Order extends OrderRequest {
  orderId: string;
  status: OrderStatus;
  filledQty: number;
  avgPrice: number;
  commission: number;
  createdAt: number;
  updatedAt: number;
  fills: Fill[];
  rejectReason?: string;
}

/** Fill (execution) */
export interface Fill {
  fillId: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  commission: number;
  commissionAsset: string;
  timestamp: number;
  tradeId: string;
}

/** Position */
export interface Position {
  symbol: string;
  side: 'long' | 'short' | 'flat';
  quantity: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  leverage: number;
  marginUsed: number;
  liquidationPrice?: number;
  updatedAt: number;
}

/** Account balance */
export interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

/** Account state */
export interface AccountState {
  balances: Balance[];
  positions: Position[];
  totalEquity: number;
  availableMargin: number;
  usedMargin: number;
  marginLevel: number;
  updatedAt: number;
}

/** Venue adapter interface */
export interface VenueAdapter {
  name: string;
  exchange: string;
  testnet: boolean;

  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Account
  getAccountState(): Promise<AccountState>;
  getBalances(): Promise<Balance[]>;
  getPositions(): Promise<Position[]>;

  // Orders
  submitOrder(request: OrderRequest): Promise<Order>;
  cancelOrder(orderId: string): Promise<boolean>;
  cancelAllOrders(symbol?: string): Promise<number>;
  getOrder(orderId: string): Promise<Order | null>;
  getOpenOrders(symbol?: string): Promise<Order[]>;

  // Market data (optional, for execution)
  getLatestPrice?(symbol: string): Promise<number>;
}

/** Execution router interface */
export interface ExecutionRouter {
  registerAdapter(adapter: VenueAdapter): void;
  getAdapter(exchange: string): VenueAdapter | undefined;
  route(request: OrderRequest, exchange?: string): Promise<Order>;
}

/** Paper trading configuration */
export interface PaperTradingConfig {
  initialCapital: number;
  commission: number;
  slippage: number;
  latencyMs: number;
  fillProbability: number;
  rejectProbability: number;
}
