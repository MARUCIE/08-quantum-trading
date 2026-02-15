/**
 * API Routes
 *
 * Register all REST API endpoints.
 */

import { ApiServer } from './server.js';
import { createApiRequestGuard } from './auth-policy.js';
import { BinanceClient } from '../data/binance-client.js';
import { BlockchainInfoClient } from '../data/blockchain-info-client.js';
import type { OHLCVBar, Ticker, Trade, KlineInterval } from '../types/market.js';
import { RiskMonitor } from '../risk/monitor.js';
import { RiskChecker } from '../risk/checker.js';
import { AuditLogger } from '../risk/audit.js';
import { MVP_RISK_CONFIG } from '../risk/config.js';
import { metrics } from '../metrics/index.js';
import { runBacktest, type BacktestConfig } from '../backtest/index.js';
import {
  apiKeyManager,
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  type ApiKeyPermission,
} from '../auth/index.js';
import { strategyStore } from '../strategy/store.js';
import {
  cancelPaperOrder,
  getPaperAccountState,
  getPaperPositions,
  listPaperOrders,
  listPaperTrades,
  submitPaperOrder,
  ensurePaperAccount,
  UpstreamUnavailableError,
} from '../execution/paper-service.js';
import {
  listAccounts,
  getActiveAccount,
  setActiveAccount,
  guardAccountMode,
  accountStore,
} from '../accounts/index.js';
import type {
  AccountConnectionInput,
  SimulatedAccountInput,
} from '../accounts/types.js';

// Initialize services
const binanceClient = new BinanceClient({
  testnet: process.env.BINANCE_TESTNET === 'true',
});

const blockchainInfoClient = new BlockchainInfoClient();

type MarketDataProvider = 'binance' | 'blockchain_info';

function getMarketDataProvider(): MarketDataProvider {
  const raw = (process.env.MARKET_DATA_PROVIDER || 'binance').trim().toLowerCase();
  return raw === 'blockchain_info' ? 'blockchain_info' : 'binance';
}

// Server start time for uptime calculation
const serverStartTime = Date.now();

// Package version (read from package.json at build time)
const VERSION = process.env.npm_package_version || '0.1.0';

/**
 * Format uptime in human-readable format
 */
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

const riskMonitor = new RiskMonitor(MVP_RISK_CONFIG);
const riskChecker = new RiskChecker(MVP_RISK_CONFIG);
const auditLogger = new AuditLogger('./audit');

const marketCache = {
  ticker: new Map<string, Ticker>(),
  klines: new Map<string, OHLCVBar[]>(),
  trades: new Map<string, Trade[]>(),
};

function createFallbackTicker(symbol: string): Ticker {
  return {
    timestamp: Date.now(),
    symbol: symbol.toUpperCase(),
    exchange: 'binance',
    bid: 0,
    ask: 0,
    bidSize: 0,
    askSize: 0,
    last: 0,
    lastSize: 0,
  };
}


export function registerRoutes(server: ApiServer): void {
  server.setRequestGuard(createApiRequestGuard());

  // Health check (liveness probe)
  // Returns basic health status - fast response, no dependency checks
  server.get('/api/health', (_req, res) => {
    const uptime = Date.now() - serverStartTime;
    server.sendJson(res, 200, {
      status: 'ok',
      version: VERSION,
      uptime,
      uptimeHuman: formatUptime(uptime),
      timestamp: Date.now(),
    });
  });

  // Readiness check (readiness probe)
  // Checks if the service is ready to accept traffic - validates dependencies
  server.get('/api/ready', async (_req, res) => {
    const checks: Record<string, { status: 'ok' | 'error'; latency?: number; error?: string }> = {};
    let allHealthy = true;

    const provider = getMarketDataProvider();

    // Check market data provider connectivity
    const providerStart = Date.now();
    try {
      const isHealthy =
        provider === 'blockchain_info'
          ? await blockchainInfoClient.ping()
          : await binanceClient.ping();
      checks.marketData = {
        status: isHealthy ? 'ok' : 'error',
        latency: Date.now() - providerStart,
      };
      if (!isHealthy) {
        allHealthy = false;
        checks.marketData.error =
          provider === 'blockchain_info'
            ? 'Blockchain.info API not responding'
            : 'Binance API not responding';
      }
    } catch (error) {
      allHealthy = false;
      checks.marketData = {
        status: 'error',
        latency: Date.now() - providerStart,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    const response = {
      status: allHealthy ? 'ready' : 'not_ready',
      marketDataProvider: provider,
      version: VERSION,
      uptime: Date.now() - serverStartTime,
      checks,
      timestamp: Date.now(),
    };

    server.sendJson(res, allHealthy ? 200 : 503, response);
  });

  // Prometheus metrics endpoint
  // Exposes application metrics for Prometheus scraping
  server.get('/metrics', (_req, res) => {
    // Update process metrics before export
    const memUsage = process.memoryUsage();
    metrics.setGauge('process_uptime_seconds', metrics.getUptime());
    metrics.setGauge('nodejs_heap_size_bytes', memUsage.heapUsed, { type: 'used' });
    metrics.setGauge('nodejs_heap_size_bytes', memUsage.heapTotal, { type: 'total' });
    metrics.setGauge('nodejs_heap_size_bytes', memUsage.external, { type: 'external' });
    metrics.setGauge('nodejs_heap_size_bytes', memUsage.rss, { type: 'rss' });

    // Export metrics in Prometheus format
    const metricsOutput = metrics.export();
    res.writeHead(200, {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    });
    res.end(metricsOutput);
  });

  // Portfolio endpoints
  server.get('/api/portfolio/account', async (_req, res) => {
    const activeAccount = getActiveAccount();
    if (!activeAccount) {
      server.sendJson(res, 404, { error: 'No active account' });
      return;
    }
    if (activeAccount.mode !== 'simulated') {
      server.sendJson(res, 409, { error: 'Active account is not simulated' });
      return;
    }
    const account = await getPaperAccountState(activeAccount.id);
    server.sendJson(res, 200, account);
  });

  server.get('/api/portfolio/positions', async (_req, res) => {
    const activeAccount = getActiveAccount();
    if (!activeAccount) {
      server.sendJson(res, 404, { error: 'No active account' });
      return;
    }
    if (activeAccount.mode !== 'simulated') {
      server.sendJson(res, 409, { error: 'Active account is not simulated' });
      return;
    }
    const positions = await getPaperPositions(activeAccount.id);
    server.sendJson(res, 200, positions);
  });

  server.get('/api/portfolio/stats', async (_req, res) => {
    const activeAccount = getActiveAccount();
    if (!activeAccount) {
      server.sendJson(res, 404, { error: 'No active account' });
      return;
    }
    if (activeAccount.mode !== 'simulated') {
      server.sendJson(res, 409, { error: 'Active account is not simulated' });
      return;
    }
    const account = await getPaperAccountState(activeAccount.id);
    const totalPnl = account.unrealizedPnl + account.realizedPnl;
    const baseEquity = account.totalEquity - totalPnl;
    const totalPnlPercent = baseEquity > 0 ? (totalPnl / baseEquity) * 100 : 0;
    const stats = {
      totalValue: account.totalEquity,
      totalPnl,
      totalPnlPercent,
      dayPnl: account.dailyPnl,
      dayPnlPercent: account.totalEquity > 0 ? (account.dailyPnl / account.totalEquity) * 100 : 0,
      cashBalance: account.cash,
    };
    server.sendJson(res, 200, stats);
  });

  server.post('/api/portfolio/positions/close', async (req, res) => {
    const guard = guardAccountMode('simulated', getActiveAccount());
    if (!guard.allowed) {
      server.sendJson(res, 409, { error: guard.reason });
      return;
    }
    const activeAccount = getActiveAccount();
    const body = await server.parseBody<{ symbol: string }>(req);
    const positions = await getPaperPositions(activeAccount!.id);
    const position = positions.find(
      (p) =>
        p.symbol === body.symbol ||
        p.symbol.replace('/', '') === body.symbol.replace('/', '')
    );

    if (!position) {
      server.sendJson(res, 404, { error: 'Position not found' });
      return;
    }

    const order = await submitPaperOrder({
      symbol: body.symbol,
      side: position.side === 'long' ? 'sell' : 'buy',
      type: 'market',
      quantity: position.quantity,
      clientOrderId: `close_${Date.now()}`,
      accountId: activeAccount?.id,
      accountMode: 'simulated',
    });

    auditLogger.logPositionClose(
      position.symbol,
      position.side,
      position.quantity,
      position.entryPrice,
      position.unrealizedPnl,
      'manual_close'
    );

    server.sendJson(res, 200, { success: true, order });
  });

  // Order endpoints (paper trading)
  server.get('/api/orders', (_req, res, _params, query) => {
    const guard = guardAccountMode('simulated', getActiveAccount());
    if (!guard.allowed) {
      server.sendJson(res, 409, { error: guard.reason });
      return;
    }
    const activeAccount = getActiveAccount();
    const symbol = query.get('symbol');
    const normalized = symbol ? symbol.replace('/', '').toUpperCase() : undefined;
    const orders = listPaperOrders(activeAccount!.id, normalized);
    server.sendJson(res, 200, orders);
  });

  server.post('/api/orders', async (req, res) => {
    try {
      const guard = guardAccountMode('simulated', getActiveAccount());
      if (!guard.allowed) {
        server.sendJson(res, 409, { error: guard.reason });
        return;
      }
      const body = await server.parseBody<{
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
        clientOrderId?: string;
        skipRiskCheck?: boolean; // Allow skipping for paper trading
      }>(req);

      if (!body.symbol || !body.side || !body.type || !body.quantity) {
        server.sendJson(res, 400, { error: 'Missing required order fields' });
        return;
      }

      const activeAccount = getActiveAccount();

      // Perform risk check (can be skipped for paper trading)
      if (!body.skipRiskCheck) {
        const accountState = await getPaperAccountState(activeAccount?.id || '');
        if (accountState) {
          // Pass full account state to risk checker
          riskChecker.updateAccountState(accountState);
        }

        const orderPrice = body.price || 0;
        // Map stop_limit to stop for risk validation
        const riskOrderType = body.type === 'stop_limit' ? 'stop' : body.type;
        const riskResult = riskChecker.validateOrder({
          symbol: body.symbol,
          side: body.side,
          type: riskOrderType as 'market' | 'limit' | 'stop',
          quantity: body.quantity,
          price: orderPrice,
        });

        // Log risk check result
        auditLogger.logRiskCheck(
          body.clientOrderId || `ord_${Date.now()}`,
          riskResult.passed,
          riskResult.checks.map(c => ({ name: c.name, passed: c.passed, value: c.value }))
        );

        // Reject if risk check fails
        if (!riskResult.passed) {
          auditLogger.logOrderReject(
            body.clientOrderId || `ord_${Date.now()}`,
            `Risk check failed: ${riskResult.blockers.join(', ')}`
          );
          server.sendJson(res, 400, {
            error: 'Risk check failed',
            blockers: riskResult.blockers,
            warnings: riskResult.warnings,
          });
          return;
        }
      }

      const order = await submitPaperOrder({
        ...body,
        clientOrderId: body.clientOrderId,
        accountId: activeAccount?.id,
        accountMode: 'simulated',
      });

      auditLogger.logOrderSubmit(
        order.orderId,
        order.symbol,
        order.side,
        order.quantity,
        order.price,
        body.strategyId
      );

      auditLogger.logSystemEvent('order_submitted', {
        orderId: order.orderId,
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        status: order.status,
        accountId: activeAccount?.id,
        accountMode: 'simulated',
      });

      server.sendJson(res, 201, order);
    } catch (error) {
      if (error instanceof UpstreamUnavailableError) {
        console.error('[API] Order submit upstream unavailable:', error.cause ?? error);
        server.sendJson(res, 503, {
          message: error.message,
          code: 'UPSTREAM_UNAVAILABLE',
        });
        return;
      }

      console.error('[API] Order submit error:', error);
      server.sendJson(res, 500, { error: 'Failed to submit order' });
    }
  });

  server.post('/api/orders/:id/cancel', async (_req, res, params) => {
    const guard = guardAccountMode('simulated', getActiveAccount());
    if (!guard.allowed) {
      server.sendJson(res, 409, { error: guard.reason });
      return;
    }
    const activeAccount = getActiveAccount();
    const ok = await cancelPaperOrder(activeAccount!.id, params.id);
    if (!ok) {
      server.sendJson(res, 404, { error: 'Order not found or not cancellable' });
      return;
    }
    auditLogger.logSystemEvent('order_cancelled', { orderId: params.id });
    server.sendJson(res, 200, { success: true });
  });

  server.get('/api/trades', (_req, res, _params, query) => {
    const guard = guardAccountMode('simulated', getActiveAccount());
    if (!guard.allowed) {
      server.sendJson(res, 409, { error: guard.reason });
      return;
    }
    const activeAccount = getActiveAccount();
    const limit = parseInt(query.get('limit') || '100', 10);
    server.sendJson(res, 200, listPaperTrades(activeAccount!.id, limit));
  });

  // Account endpoints
  server.get('/api/accounts', (_req, res) => {
    const accounts = listAccounts();
    server.sendJson(res, 200, {
      accounts,
      activeAccountId: getActiveAccount()?.id || null,
    });
  });

  server.get('/api/accounts/active', (_req, res) => {
    const account = getActiveAccount();
    if (!account) {
      server.sendJson(res, 404, { error: 'No active account' });
      return;
    }
    server.sendJson(res, 200, account);
  });

  server.post('/api/accounts/simulated', async (req, res) => {
    const body = await server.parseBody<SimulatedAccountInput>(req);
    if (!body?.name) {
      server.sendJson(res, 400, { error: 'Name is required' });
      return;
    }
    const account = accountStore.createSimulated({
      name: body.name,
      initialCapital: body.initialCapital,
      setActive: body.setActive ?? true,
    });
    ensurePaperAccount(account.id, body.initialCapital);
    auditLogger.logAccountEvent('sim_account_created', account.id, {
      name: account.name,
      mode: account.mode,
    });
    server.sendJson(res, 201, account);
  });

  server.post('/api/accounts/real', async (req, res) => {
    try {
      const body = await server.parseBody<AccountConnectionInput>(req);
      if (!body?.name || !body?.provider || !body?.credentials?.apiKey || !body?.credentials?.apiSecret) {
        server.sendJson(res, 400, { error: 'Missing required fields' });
        return;
      }
      const account = accountStore.createReal({
        name: body.name,
        provider: body.provider,
        credentials: body.credentials,
        permissions: body.permissions,
        setActive: body.setActive ?? false,
      });
      auditLogger.logAccountEvent('real_account_linked', account.id, {
        name: account.name,
        provider: account.provider,
      });
      server.sendJson(res, 201, account);
    } catch (error) {
      server.sendJson(res, 500, {
        error: error instanceof Error ? error.message : 'Failed to link account',
      });
    }
  });

  server.post('/api/accounts/:id/activate', (_req, res, params) => {
    const account = setActiveAccount(params.id);
    if (!account) {
      server.sendJson(res, 404, { error: 'Account not found' });
      return;
    }
    auditLogger.logAccountEvent('account_activated', account.id, {
      mode: account.mode,
      provider: account.provider,
    });
    server.sendJson(res, 200, account);
  });

  // Strategy endpoints
  server.get('/api/strategies', (_req, res) => {
    server.sendJson(res, 200, strategyStore.list());
  });

  server.get('/api/strategies/:id', (_req, res, params) => {
    const strategy = strategyStore.get(params.id);
    if (!strategy) {
      server.sendJson(res, 404, { error: 'Strategy not found' });
      return;
    }
    server.sendJson(res, 200, strategy);
  });

  server.get('/api/strategies/:id/signals', (_req, res) => {
    server.sendJson(res, 200, []);
  });

  server.post('/api/strategies', async (req, res) => {
    try {
      const body = await server.parseBody<{
        name: string;
        description?: string;
        type?: string;
        symbols?: string[];
      }>(req);

      if (!body.name) {
        server.sendJson(res, 400, { error: 'Name is required' });
        return;
      }

      const strategy = strategyStore.create({
        name: body.name,
        description: body.description,
        type: body.type,
        symbols: body.symbols,
      });

      auditLogger.logSystemEvent('strategy_created', {
        strategyId: strategy.id,
        name: strategy.name,
      });

      server.sendJson(res, 201, strategy);
    } catch (error) {
      console.error('[API] Strategy create error:', error);
      server.sendJson(res, 500, { error: 'Failed to create strategy' });
    }
  });

  server.put('/api/strategies/:id/status', async (req, res, params) => {
    const body = await server.parseBody<{ status: string }>(req);
    const strategy = strategyStore.updateStatus(params.id, body.status as any);
    if (!strategy) {
      server.sendJson(res, 404, { error: 'Strategy not found' });
      return;
    }
    auditLogger.logSystemEvent('strategy_status_change', {
      strategyId: params.id,
      newStatus: body.status,
    });
    server.sendJson(res, 200, strategy);
  });

  server.delete('/api/strategies/:id', (_req, res, params) => {
    const removed = strategyStore.remove(params.id);
    if (!removed) {
      server.sendJson(res, 400, { error: 'Strategy cannot be removed' });
      return;
    }
    auditLogger.logSystemEvent('strategy_deleted', { strategyId: params.id });
    server.sendJson(res, 200, { success: true });
  });

  // Market data endpoints
  server.get('/api/market/klines', async (_req, res, _params, query) => {
    const symbol = query.get('symbol') || 'BTCUSDT';
    const interval = query.get('interval') || '1h';
    const limit = parseInt(query.get('limit') || '100', 10);
    const cacheKey = `${symbol}:${interval}`;

    try {
      const klines = await binanceClient.getKlines(
        symbol.replace('/', ''),
        interval as KlineInterval,
        { limit }
      );
      marketCache.klines.set(cacheKey, klines);
      server.sendJson(res, 200, klines);
    } catch (error) {
      console.error('[API] Klines error:', error);
      const cached = marketCache.klines.get(cacheKey);
      server.sendJson(res, 200, cached ? cached.slice(-limit) : []);
    }
  });

  server.get('/api/market/ticker', async (_req, res, _params, query) => {
    const symbol = query.get('symbol') || 'BTCUSDT';
    const cacheKey = symbol.toUpperCase();

    const provider = getMarketDataProvider();

    try {
      const ticker =
        provider === 'blockchain_info'
          ? await blockchainInfoClient.getTicker(symbol)
          : await binanceClient.getTicker(symbol.replace('/', ''));
      marketCache.ticker.set(cacheKey, ticker);
      server.sendJson(res, 200, ticker);
    } catch (error) {
      console.error('[API] Ticker error:', error);
      const cached = marketCache.ticker.get(cacheKey);
      server.sendJson(res, 200, cached ?? createFallbackTicker(symbol));
    }
  });

  server.get('/api/market/tickers', async (_req, res) => {
    const symbols = (process.env.MARKET_SYMBOLS || 'BTCUSDT,ETHUSDT,SOLUSDT')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const provider = getMarketDataProvider();

    try {
      const results: Ticker[] = [];
      for (const symbol of symbols) {
        try {
          const ticker =
            provider === 'blockchain_info'
              ? await blockchainInfoClient.getTicker(symbol)
              : await binanceClient.getTicker(symbol);
          marketCache.ticker.set(symbol.toUpperCase(), ticker);
          results.push(ticker);
        } catch (error) {
          console.error('[API] Tickers error:', symbol, error);
        }
      }
      server.sendJson(res, 200, results);
    } catch (error) {
      console.error('[API] Tickers error:', error);
      server.sendJson(res, 200, []);
    }
  });

  server.get('/api/market/trades', async (_req, res, _params, query) => {
    const symbol = (query.get('symbol') || 'BTCUSDT').replace('/', '');
    const limit = parseInt(query.get('limit') || '50', 10);
    const cacheKey = symbol.toUpperCase();

    try {
      const trades = await binanceClient.getTrades(symbol, limit);
      marketCache.trades.set(cacheKey, trades);
      server.sendJson(res, 200, trades);
    } catch (error) {
      console.error('[API] Trades error:', error);
      const cached = marketCache.trades.get(cacheKey);
      server.sendJson(res, 200, cached ? cached.slice(-limit) : []);
    }
  });

  // Risk endpoints
  server.get('/api/risk/metrics', async (_req, res) => {
    const guard = guardAccountMode('simulated', getActiveAccount());
    if (!guard.allowed) {
      server.sendJson(res, 409, { error: guard.reason });
      return;
    }
    const activeAccount = getActiveAccount();
    const account = await getPaperAccountState(activeAccount!.id);
    riskMonitor.update(account);
    const metrics = {
      currentDrawdown: account.drawdownPct * 100,
      maxDrawdown: MVP_RISK_CONFIG.account.maxDrawdownPct * 100,
      dailyVaR: 0,
      sharpeRatio: 0,
      marginLevel: account.marginLevel,
      riskEvents: riskMonitor.getRecentEvents(10),
    };
    server.sendJson(res, 200, metrics);
  });

  server.get('/api/risk/events', async (_req, res, _params, query) => {
    const guard = guardAccountMode('simulated', getActiveAccount());
    if (!guard.allowed) {
      server.sendJson(res, 409, { error: guard.reason });
      return;
    }
    const limit = parseInt(query.get('limit') || '100', 10);
    const level = query.get('level');

    const activeAccount = getActiveAccount();
    const account = await getPaperAccountState(activeAccount!.id);
    riskMonitor.update(account);

    let events = riskMonitor.getRecentEvents(limit);
    if (level) {
      events = events.filter((e) => e.level === level);
    }
    server.sendJson(res, 200, events);
  });

  server.delete('/api/risk/events', (_req, res) => {
    const guard = guardAccountMode('simulated', getActiveAccount());
    if (!guard.allowed) {
      server.sendJson(res, 409, { error: guard.reason });
      return;
    }
    riskMonitor.clearEvents();
    server.sendJson(res, 204, null);
  });

  server.get('/api/risk/limits', (_req, res) => {
    const guard = guardAccountMode('simulated', getActiveAccount());
    if (!guard.allowed) {
      server.sendJson(res, 409, { error: guard.reason });
      return;
    }
    server.sendJson(res, 200, MVP_RISK_CONFIG);
  });

  // Risk status - validate account against risk limits
  server.get('/api/risk/status', async (_req, res) => {
    const activeAccount = getActiveAccount();
    if (!activeAccount) {
      server.sendJson(res, 409, { error: 'No active account' });
      return;
    }

    const accountState = await getPaperAccountState(activeAccount.id);
    if (!accountState) {
      server.sendJson(res, 404, { error: 'Account state not found' });
      return;
    }

    // Use pre-calculated risk metrics from account state
    const equity = accountState.equity;
    const unrealizedPnl = accountState.unrealizedPnl;
    const realizedPnl = accountState.realizedPnl;
    const drawdownPct = accountState.drawdownPct;
    const dailyLossPct = realizedPnl < 0 ? Math.abs(realizedPnl / equity) : 0;

    // Check limits
    const checks = [
      {
        name: 'max_drawdown',
        passed: drawdownPct < MVP_RISK_CONFIG.account.maxDrawdownPct,
        current: drawdownPct,
        limit: MVP_RISK_CONFIG.account.maxDrawdownPct,
        severity: drawdownPct >= MVP_RISK_CONFIG.account.maxDrawdownPct ? 'blocker' : 'ok',
      },
      {
        name: 'daily_loss_limit',
        passed: dailyLossPct < MVP_RISK_CONFIG.account.dailyLossLimitPct,
        current: dailyLossPct,
        limit: MVP_RISK_CONFIG.account.dailyLossLimitPct,
        severity: dailyLossPct >= MVP_RISK_CONFIG.account.dailyLossLimitPct ? 'blocker' : 'ok',
      },
      {
        name: 'leverage',
        passed: true, // Paper trading doesn't track leverage explicitly
        current: 1.0,
        limit: MVP_RISK_CONFIG.account.maxLeverage,
        severity: 'ok',
      },
    ];

    const allPassed = checks.every(c => c.passed);
    const blockers = checks.filter(c => !c.passed);

    // Log risk status check
    auditLogger.logRiskCheck(
      `status_${activeAccount.id}`,
      allPassed,
      checks.map(c => ({ name: c.name, passed: c.passed, value: c.current }))
    );

    server.sendJson(res, 200, {
      accountId: activeAccount.id,
      accountMode: activeAccount.mode,
      tradingAllowed: allPassed,
      checks,
      blockers: blockers.map(b => `${b.name}: ${(b.current * 100).toFixed(2)}% exceeds ${(b.limit * 100).toFixed(0)}% limit`),
      metrics: {
        equity,
        unrealizedPnl,
        realizedPnl,
        drawdownPct,
        dailyLossPct,
      },
      timestamp: Date.now(),
    });
  });

  // Audit log endpoints
  server.get('/api/audit/logs', (_req, res, _params, query) => {
    const action = query.get('action') || undefined;
    const actor = query.get('actor') || undefined;
    const subject = query.get('subject') || undefined;
    const limit = parseInt(query.get('limit') || '100', 10);
    const startTime = query.get('startTime')
      ? parseInt(query.get('startTime')!, 10)
      : undefined;
    const endTime = query.get('endTime')
      ? parseInt(query.get('endTime')!, 10)
      : undefined;

    const logs = auditLogger.query({
      action: action as any,
      actor,
      subject,
      startTime,
      endTime,
      limit,
    });

    server.sendJson(res, 200, {
      logs,
      total: logs.length,
      timestamp: Date.now(),
    });
  });

  server.get('/api/audit/stats', (_req, res) => {
    const stats = auditLogger.getStats();
    const integrity = auditLogger.verifyIntegrity();

    server.sendJson(res, 200, {
      ...stats,
      integrityValid: integrity.valid,
      integrityErrors: integrity.errors.length,
      timestamp: Date.now(),
    });
  });

  server.get('/api/audit/verify', (_req, res) => {
    const integrity = auditLogger.verifyIntegrity();
    server.sendJson(res, 200, {
      valid: integrity.valid,
      errors: integrity.errors,
      timestamp: Date.now(),
    });
  });

  // Backtest endpoints
  server.post('/api/backtest/run', async (req, res) => {
    try {
      const config = await server.parseBody<BacktestConfig>(req);

      // Validate config
      if (!config.strategyId || !config.symbol || !config.startDate || !config.endDate) {
        server.sendJson(res, 400, { error: 'Missing required fields' });
        return;
      }

      // Log backtest start
      auditLogger.logSystemEvent('backtest_start', {
        strategyId: config.strategyId,
        symbol: config.symbol,
        startDate: config.startDate,
        endDate: config.endDate,
      });

      const result = await runBacktest(
        {
          ...config,
          initialCapital: config.initialCapital || 100000,
          commission: config.commission || 0.1,
          slippage: config.slippage || 0.05,
        },
        binanceClient
      );

      // Log backtest completion
      auditLogger.logSystemEvent('backtest_complete', {
        strategyId: config.strategyId,
        totalReturn: result.totalReturnPercent,
        sharpeRatio: result.sharpeRatio,
        totalTrades: result.totalTrades,
      });

      server.sendJson(res, 200, result);
    } catch (error) {
      console.error('[API] Backtest error:', error);
      server.sendJson(res, 500, { error: 'Backtest failed' });
    }
  });

  server.get('/api/backtest/strategies', (_req, res) => {
    const strategies = strategyStore.list().map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      symbols: s.symbols,
    }));
    server.sendJson(res, 200, strategies);
  });

  // ============================================
  // API Key Management Endpoints
  // ============================================

  // List all API keys
  server.get('/api/keys', (_req, res) => {
    const keys = apiKeyManager.list();
    const stats = apiKeyManager.getStats();
    server.sendJson(res, 200, { keys, stats });
  });

  // Get available permissions
  server.get('/api/keys/permissions', (_req, res) => {
    server.sendJson(res, 200, {
      all: ALL_PERMISSIONS,
      groups: PERMISSION_GROUPS,
    });
  });

  // Create a new API key
  server.post('/api/keys', async (req, res) => {
    try {
      const body = await server.parseBody<{
        name: string;
        permissions: ApiKeyPermission[];
        expiresIn?: number | null; // milliseconds from now
        ipWhitelist?: string[] | null;
        rateLimit?: number;
      }>(req);

      if (!body.name || !body.permissions || body.permissions.length === 0) {
        server.sendJson(res, 400, { error: 'Name and permissions are required' });
        return;
      }

      // Validate permissions
      const invalidPermissions = body.permissions.filter(
        (p) => !ALL_PERMISSIONS.includes(p)
      );
      if (invalidPermissions.length > 0) {
        server.sendJson(res, 400, {
          error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
        });
        return;
      }

      const expiresAt = body.expiresIn ? Date.now() + body.expiresIn : null;

      const result = apiKeyManager.create({
        name: body.name,
        permissions: body.permissions,
        expiresAt,
        ipWhitelist: body.ipWhitelist,
        rateLimit: body.rateLimit,
      });

      // Log key creation
      auditLogger.logSystemEvent('api_key_created', {
        keyId: result.id,
        name: result.name,
        permissions: result.permissions,
      });

      // Return full key (only time it's shown)
      server.sendJson(res, 201, result);
    } catch (error) {
      console.error('[API] Key creation error:', error);
      server.sendJson(res, 500, { error: 'Failed to create API key' });
    }
  });

  // Get a specific API key
  server.get('/api/keys/:id', (req, res) => {
    const id = req.url?.split('/api/keys/')[1]?.split('?')[0];
    if (!id) {
      server.sendJson(res, 400, { error: 'Key ID required' });
      return;
    }

    const key = apiKeyManager.get(id);
    if (!key) {
      server.sendJson(res, 404, { error: 'API key not found' });
      return;
    }

    server.sendJson(res, 200, key);
  });

  // Update an API key
  server.put('/api/keys/:id', async (req, res) => {
    try {
      const id = req.url?.split('/api/keys/')[1]?.split('?')[0];
      if (!id) {
        server.sendJson(res, 400, { error: 'Key ID required' });
        return;
      }

      const body = await server.parseBody<{
        name?: string;
        permissions?: ApiKeyPermission[];
        expiresAt?: number | null;
        ipWhitelist?: string[] | null;
        rateLimit?: number;
      }>(req);

      // Validate permissions if provided
      if (body.permissions) {
        const invalidPermissions = body.permissions.filter(
          (p) => !ALL_PERMISSIONS.includes(p)
        );
        if (invalidPermissions.length > 0) {
          server.sendJson(res, 400, {
            error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
          });
          return;
        }
      }

      const updated = apiKeyManager.update(id, body);
      if (!updated) {
        server.sendJson(res, 404, { error: 'API key not found' });
        return;
      }

      // Log update
      auditLogger.logSystemEvent('api_key_updated', {
        keyId: id,
        changes: Object.keys(body),
      });

      server.sendJson(res, 200, updated);
    } catch (error) {
      console.error('[API] Key update error:', error);
      server.sendJson(res, 500, { error: 'Failed to update API key' });
    }
  });

  // Activate/deactivate an API key
  server.post('/api/keys/:id/toggle', async (req, res) => {
    try {
      const id = req.url?.split('/api/keys/')[1]?.split('/toggle')[0];
      if (!id) {
        server.sendJson(res, 400, { error: 'Key ID required' });
        return;
      }

      const body = await server.parseBody<{ active: boolean }>(req);
      const updated = apiKeyManager.setActive(id, body.active);

      if (!updated) {
        server.sendJson(res, 404, { error: 'API key not found' });
        return;
      }

      // Log toggle
      auditLogger.logSystemEvent('api_key_toggled', {
        keyId: id,
        active: body.active,
      });

      server.sendJson(res, 200, updated);
    } catch (error) {
      console.error('[API] Key toggle error:', error);
      server.sendJson(res, 500, { error: 'Failed to toggle API key' });
    }
  });

  // Revoke (delete) an API key
  server.delete('/api/keys/:id', (req, res) => {
    const id = req.url?.split('/api/keys/')[1]?.split('?')[0];
    if (!id) {
      server.sendJson(res, 400, { error: 'Key ID required' });
      return;
    }

    const key = apiKeyManager.get(id);
    if (!key) {
      server.sendJson(res, 404, { error: 'API key not found' });
      return;
    }

    const revoked = apiKeyManager.revoke(id);
    if (!revoked) {
      server.sendJson(res, 500, { error: 'Failed to revoke API key' });
      return;
    }

    // Log revocation
    auditLogger.logSystemEvent('api_key_revoked', {
      keyId: id,
      name: key.name,
    });

    server.sendJson(res, 200, { success: true, message: 'API key revoked' });
  });
}
