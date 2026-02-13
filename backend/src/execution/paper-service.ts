import type { OrderRequest, Order, Fill, Position } from '../types/execution';
import type { AccountState as RiskAccountState } from '../types/risk';
import { OrderManager } from './order-manager.js';
import { PaperTradingAdapter } from './paper-trading.js';
import { MVP_ACCOUNT_RISK } from '../risk/config.js';
import { binanceClient } from '../data/binance-client.js';

export class UpstreamUnavailableError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'UpstreamUnavailableError';
    this.cause = cause;
  }
}


interface TradeRecord {
  id: string;
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  commission: number;
  strategyId?: string;
  timestamp: number;
}

interface PaperContext {
  adapter: PaperTradingAdapter;
  orderManager: OrderManager;
  trades: TradeRecord[];
  peakEquity: number;
}

const contexts = new Map<string, PaperContext>();

function createContext(initialCapital: number): PaperContext {
  const adapter = new PaperTradingAdapter({
    initialCapital,
    commission: 0.001,
    slippage: 0.0005,
    latencyMs: 0,
    fillProbability: 1,
    rejectProbability: 0,
  });
  const orderManager = new OrderManager();
  orderManager.setAdapter(adapter);
  return {
    adapter,
    orderManager,
    trades: [],
    peakEquity: initialCapital,
  };
}

function getContext(accountId: string, initialCapital?: number): PaperContext {
  const existing = contexts.get(accountId);
  if (existing) return existing;
  const capital = initialCapital ?? MVP_ACCOUNT_RISK.initialCapital;
  const context = createContext(capital);
  contexts.set(accountId, context);
  return context;
}

function normalizeSymbol(symbol: string): string {
  return symbol.replace('/', '').toUpperCase();
}

async function refreshPrice(
  context: PaperContext,
  symbol: string,
  fallbackPrice?: number
): Promise<void> {
  const normalized = normalizeSymbol(symbol);

  if (typeof fallbackPrice === 'number' && fallbackPrice > 0) {
    context.adapter.setPrice(normalized, fallbackPrice);
    return;
  }

  try {
    const ticker = await binanceClient.getTicker(normalized);
    context.adapter.setPrice(normalized, ticker.last || ticker.bid);
    return;
  } catch (error) {
    // Fall back to last known price if available.
    const last = await context.adapter.getLatestPrice(normalized);
    if (last > 0) {
      return;
    }

    throw new UpstreamUnavailableError(
      `Market data unavailable for symbol ${normalized}`,
      error
    );
  }
}

function mapFillToTrade(fill: Fill, strategyId?: string): TradeRecord {
  return {
    id: fill.tradeId,
    orderId: fill.orderId,
    symbol: fill.symbol,
    side: fill.side,
    price: fill.price,
    quantity: fill.quantity,
    commission: fill.commission,
    strategyId,
    timestamp: fill.timestamp,
  };
}

function mapPosition(position: Position): RiskAccountState['positions'][number] {
  return {
    symbol: position.symbol.includes('/')
      ? position.symbol
      : position.symbol.replace(/(USDT|USD|BTC|ETH|BUSD)$/, '/$1'),
    side: position.side === 'flat' ? 'long' : position.side,
    quantity: position.quantity,
    entryPrice: position.entryPrice,
    markPrice: position.markPrice,
    currentPrice: position.markPrice,
    unrealizedPnl: position.unrealizedPnl,
    unrealizedPnlPct:
      position.entryPrice > 0 ? position.unrealizedPnl / (position.entryPrice * position.quantity) : 0,
    leverage: position.leverage,
    marginUsed: position.marginUsed,
  };
}

export async function submitPaperOrder(
  request: Omit<OrderRequest, 'clientOrderId'> & { clientOrderId?: string }
): Promise<Order> {
  const accountId = request.accountId || 'sim_default';
  const context = getContext(accountId);
  const clientOrderId = request.clientOrderId || `client_${Date.now()}`;
  const normalizedSymbol = normalizeSymbol(request.symbol);

  const existing = context.orderManager.getOrderByClientId(clientOrderId);
  if (existing) {
    return existing;
  }

  await refreshPrice(context, normalizedSymbol, request.price);

  const order = await context.orderManager.submitOrder({
    ...request,
    clientOrderId,
    symbol: normalizedSymbol,
  });

  if (order.fills.length > 0) {
    order.fills.forEach((fill) => {
      context.trades.unshift(mapFillToTrade(fill, order.strategyId));
    });
  }

  const account = await context.adapter.getAccountState();
  if (account.totalEquity > context.peakEquity) {
    context.peakEquity = account.totalEquity;
  }

  return order;
}

export async function cancelPaperOrder(accountId: string, orderId: string): Promise<boolean> {
  const context = getContext(accountId);
  return context.orderManager.cancelOrder(orderId);
}

export function listPaperOrders(accountId: string, symbol?: string): Order[] {
  const context = getContext(accountId);
  return context.orderManager.getAllOrders(symbol);
}

export function listPaperTrades(accountId: string, limit: number = 100): TradeRecord[] {
  const context = getContext(accountId);
  return context.trades.slice(0, limit);
}

export async function getPaperPositions(accountId: string): Promise<RiskAccountState['positions']> {
  const context = getContext(accountId);
  const positions = await context.adapter.getPositions();
  return positions.filter((p) => p.quantity > 0).map(mapPosition);
}

export async function getPaperAccountState(accountId: string): Promise<RiskAccountState> {
  const context = getContext(accountId);
  const account = await context.adapter.getAccountState();
  const rawPositions = await context.adapter.getPositions();
  const positions = rawPositions.filter((p) => p.quantity > 0).map(mapPosition);
  const totalEquity = account.totalEquity;
  const cash = account.balances.find((b) => b.asset === 'USDT')?.free ?? totalEquity;
  const drawdown = Math.max(0, context.peakEquity - totalEquity);
  const drawdownPct = context.peakEquity > 0 ? drawdown / context.peakEquity : 0;
  const realizedPnl = rawPositions.reduce((sum, p) => sum + p.realizedPnl, 0);

  return {
    totalEquity,
    equity: totalEquity,
    cash,
    margin: account.usedMargin,
    marginLevel: account.marginLevel,
    unrealizedPnl: positions.reduce((sum, p) => sum + p.unrealizedPnl, 0),
    realizedPnl,
    dailyPnl: 0,
    weeklyPnl: 0,
    peakEquity: context.peakEquity,
    drawdown,
    drawdownPct,
    openPositions: positions.length,
    positions,
    timestamp: Date.now(),
  };
}

export function ensurePaperAccount(accountId: string, initialCapital?: number): void {
  getContext(accountId, initialCapital);
}
