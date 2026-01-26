/**
 * API Routes
 *
 * Register all REST API endpoints.
 */

import { ApiServer } from './server.js';
import { BinanceClient } from '../data/binance-client.js';
import { RiskMonitor } from '../risk/monitor.js';
import { AuditLogger } from '../risk/audit.js';
import { MVP_RISK_CONFIG } from '../risk/config.js';
import type { AccountState } from '../types/risk.js';

// Initialize services
const binanceClient = new BinanceClient({
  testnet: process.env.BINANCE_TESTNET === 'true',
});

const riskMonitor = new RiskMonitor(MVP_RISK_CONFIG);
const auditLogger = new AuditLogger('./audit');

// Mock portfolio state (in production, this would come from a database)
const mockPortfolioState: AccountState = {
  totalEquity: 125847.32,
  equity: 125847.32,
  cash: 45234.12,
  margin: 15000,
  marginLevel: 8.39,
  unrealizedPnl: 878,
  realizedPnl: 14969.32,
  dailyPnl: 2341.56,
  weeklyPnl: 8432.21,
  peakEquity: 128000,
  drawdown: 2152.68,
  drawdownPct: 0.0168,
  openPositions: 3,
  positions: [
    {
      symbol: 'BTC/USDT',
      side: 'long',
      quantity: 0.5,
      entryPrice: 42500,
      markPrice: 43250,
      currentPrice: 43250,
      unrealizedPnl: 375,
      unrealizedPnlPct: 0.0176,
      leverage: 1,
      marginUsed: 21625,
    },
    {
      symbol: 'ETH/USDT',
      side: 'long',
      quantity: 5.2,
      entryPrice: 2280,
      markPrice: 2345,
      currentPrice: 2345,
      unrealizedPnl: 338,
      unrealizedPnlPct: 0.0285,
      leverage: 1,
      marginUsed: 12194,
    },
    {
      symbol: 'SOL/USDT',
      side: 'short',
      quantity: 50,
      entryPrice: 98.5,
      markPrice: 95.2,
      currentPrice: 95.2,
      unrealizedPnl: 165,
      unrealizedPnlPct: 0.0335,
      leverage: 2,
      marginUsed: 2380,
    },
  ],
  timestamp: Date.now(),
};

// Mock strategies
const mockStrategies = [
  {
    id: '1',
    name: 'BTC Momentum Alpha',
    description: 'Trend-following strategy using momentum indicators',
    status: 'active' as const,
    type: 'Momentum',
    symbols: ['BTC/USDT'],
    pnl: 8245.67,
    pnlPercent: 12.34,
    sharpeRatio: 1.85,
    maxDrawdown: -8.2,
    winRate: 58.3,
    tradesCount: 142,
    createdAt: '2025-11-15T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'ETH Mean Reversion',
    description: 'Statistical arbitrage on ETH price deviations',
    status: 'active' as const,
    type: 'Mean Reversion',
    symbols: ['ETH/USDT', 'ETH/BTC'],
    pnl: 4521.89,
    pnlPercent: 8.67,
    sharpeRatio: 2.12,
    maxDrawdown: -5.4,
    winRate: 62.1,
    tradesCount: 89,
    createdAt: '2025-12-01T14:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Cross-Market Arbitrage',
    description: 'Exploiting price differences across exchanges',
    status: 'paused' as const,
    type: 'Arbitrage',
    symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    pnl: 2134.45,
    pnlPercent: 4.21,
    sharpeRatio: 3.45,
    maxDrawdown: -2.1,
    winRate: 78.5,
    tradesCount: 456,
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

export function registerRoutes(server: ApiServer): void {
  // Health check
  server.get('/api/health', (_req, res) => {
    server.sendJson(res, 200, { status: 'ok', timestamp: Date.now() });
  });

  // Portfolio endpoints
  server.get('/api/portfolio/account', (_req, res) => {
    server.sendJson(res, 200, mockPortfolioState);
  });

  server.get('/api/portfolio/positions', (_req, res) => {
    server.sendJson(res, 200, mockPortfolioState.positions);
  });

  server.get('/api/portfolio/stats', (_req, res) => {
    const stats = {
      totalValue: mockPortfolioState.totalEquity,
      totalPnl: mockPortfolioState.unrealizedPnl + mockPortfolioState.realizedPnl,
      totalPnlPercent:
        ((mockPortfolioState.unrealizedPnl + mockPortfolioState.realizedPnl) /
          (mockPortfolioState.totalEquity - mockPortfolioState.unrealizedPnl - mockPortfolioState.realizedPnl)) *
        100,
      dayPnl: mockPortfolioState.dailyPnl,
      dayPnlPercent: (mockPortfolioState.dailyPnl / mockPortfolioState.totalEquity) * 100,
      cashBalance: mockPortfolioState.cash,
    };
    server.sendJson(res, 200, stats);
  });

  server.post('/api/portfolio/positions/close', async (req, res) => {
    const body = await server.parseBody<{ symbol: string }>(req);
    auditLogger.logPositionClose(
      body.symbol,
      'long',
      1,
      43000,
      500,
      'manual_close'
    );
    server.sendJson(res, 200, { success: true, symbol: body.symbol });
  });

  // Strategy endpoints
  server.get('/api/strategies', (_req, res) => {
    server.sendJson(res, 200, mockStrategies);
  });

  server.get('/api/strategies/:id', (_req, res, params) => {
    const strategy = mockStrategies.find((s) => s.id === params.id);
    if (!strategy) {
      server.sendJson(res, 404, { error: 'Strategy not found' });
      return;
    }
    server.sendJson(res, 200, strategy);
  });

  server.get('/api/strategies/:id/signals', (_req, res, params) => {
    const signals = [
      {
        strategyId: params.id,
        symbol: 'BTC/USDT',
        type: 'momentum',
        direction: 'long',
        strength: 0.72,
        confidence: 0.85,
        timestamp: Date.now() - 300000,
      },
      {
        strategyId: params.id,
        symbol: 'BTC/USDT',
        type: 'momentum',
        direction: 'neutral',
        strength: 0.15,
        confidence: 0.60,
        timestamp: Date.now(),
      },
    ];
    server.sendJson(res, 200, signals);
  });

  server.put('/api/strategies/:id/status', async (req, res, params) => {
    const body = await server.parseBody<{ status: string }>(req);
    const strategy = mockStrategies.find((s) => s.id === params.id);
    if (!strategy) {
      server.sendJson(res, 404, { error: 'Strategy not found' });
      return;
    }
    (strategy as { status: string }).status = body.status;
    strategy.updatedAt = new Date().toISOString();
    auditLogger.logSystemEvent('strategy_status_change', {
      strategyId: params.id,
      newStatus: body.status,
    });
    server.sendJson(res, 200, strategy);
  });

  // Market data endpoints
  server.get('/api/market/klines', async (_req, res, _params, query) => {
    const symbol = query.get('symbol') || 'BTCUSDT';
    const interval = query.get('interval') || '1h';
    const limit = parseInt(query.get('limit') || '100', 10);

    try {
      const klines = await binanceClient.getKlines(
        symbol.replace('/', ''),
        interval as any,
        { limit }
      );
      server.sendJson(res, 200, klines);
    } catch (error) {
      console.error('[API] Klines error:', error);
      server.sendJson(res, 500, { error: 'Failed to fetch klines' });
    }
  });

  server.get('/api/market/ticker', async (_req, res, _params, query) => {
    const symbol = query.get('symbol') || 'BTCUSDT';

    try {
      const ticker = await binanceClient.getTicker(symbol.replace('/', ''));
      server.sendJson(res, 200, ticker);
    } catch (error) {
      console.error('[API] Ticker error:', error);
      server.sendJson(res, 500, { error: 'Failed to fetch ticker' });
    }
  });

  server.get('/api/market/tickers', async (_req, res) => {
    // Return mock tickers for MVP (Binance requires symbol parameter)
    const tickers = [
      {
        symbol: 'BTC/USDT',
        bid: 43200,
        ask: 43205,
        last: 43202,
        volume24h: 28543.21,
        change24h: 856.32,
        changePct24h: 2.02,
        timestamp: Date.now(),
      },
      {
        symbol: 'ETH/USDT',
        bid: 2342,
        ask: 2343,
        last: 2342.5,
        volume24h: 156432.87,
        change24h: 45.21,
        changePct24h: 1.96,
        timestamp: Date.now(),
      },
      {
        symbol: 'SOL/USDT',
        bid: 95.1,
        ask: 95.2,
        last: 95.15,
        volume24h: 2345678.12,
        change24h: -3.25,
        changePct24h: -3.3,
        timestamp: Date.now(),
      },
    ];
    server.sendJson(res, 200, tickers);
  });

  server.get('/api/market/trades', (_req, res, _params, query) => {
    const symbol = query.get('symbol') || 'BTC/USDT';
    const trades = [
      {
        id: 't1',
        orderId: 'o1',
        symbol,
        side: 'buy',
        price: 43245.5,
        quantity: 0.1,
        commission: 4.32,
        timestamp: Date.now() - 180000,
      },
      {
        id: 't2',
        orderId: 'o2',
        symbol,
        side: 'sell',
        price: 43198.2,
        quantity: 0.05,
        commission: 2.16,
        timestamp: Date.now() - 420000,
      },
    ];
    server.sendJson(res, 200, trades);
  });

  // Risk endpoints
  server.get('/api/risk/metrics', (_req, res) => {
    riskMonitor.update(mockPortfolioState);
    const metrics = {
      currentDrawdown: mockPortfolioState.drawdownPct * 100,
      maxDrawdown: MVP_RISK_CONFIG.account.maxDrawdownPct * 100,
      dailyVaR: 2500,
      sharpeRatio: 1.85,
      marginLevel: mockPortfolioState.marginLevel,
      riskEvents: riskMonitor.getRecentEvents(10),
    };
    server.sendJson(res, 200, metrics);
  });

  server.get('/api/risk/events', (_req, res, _params, query) => {
    const limit = parseInt(query.get('limit') || '100', 10);
    const level = query.get('level');

    let events = riskMonitor.getRecentEvents(limit);
    if (level) {
      events = events.filter((e) => e.level === level);
    }
    server.sendJson(res, 200, events);
  });
}
