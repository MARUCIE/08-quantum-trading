/**
 * API request-guard policy.
 *
 * Centralizes authN/authZ decisions for all API routes so route handlers can stay focused
 * on business logic.
 */

import type { ApiKeyPermission } from '../auth/index.js';
import type { RequestGuard, RequestGuardDecision } from './server.js';
import { authenticateRequest, getApiAuthMode } from './middleware/api-key-auth.js';

type RoutePermissionMap = Record<string, ApiKeyPermission>;

function routeKey(method: string, routePath: string): string {
  return `${method.toUpperCase()} ${routePath}`;
}

const PUBLIC_ROUTES = new Set<string>([
  routeKey('GET', '/api/health'),
  routeKey('GET', '/api/ready'),
  routeKey('GET', '/metrics'),
]);

const ROUTE_PERMISSIONS: RoutePermissionMap = {
  // Portfolio & execution
  [routeKey('GET', '/api/portfolio/account')]: 'read:account',
  [routeKey('GET', '/api/portfolio/positions')]: 'read:positions',
  [routeKey('GET', '/api/portfolio/stats')]: 'read:account',
  [routeKey('POST', '/api/portfolio/positions/close')]: 'write:positions',
  [routeKey('GET', '/api/orders')]: 'read:orders',
  [routeKey('POST', '/api/orders')]: 'write:orders',
  [routeKey('POST', '/api/orders/:id/cancel')]: 'write:orders',
  [routeKey('GET', '/api/trades')]: 'read:trades',

  // Accounts
  [routeKey('GET', '/api/accounts')]: 'read:account',
  [routeKey('GET', '/api/accounts/active')]: 'read:account',
  [routeKey('POST', '/api/accounts/simulated')]: 'admin',
  [routeKey('POST', '/api/accounts/real')]: 'admin',
  [routeKey('POST', '/api/accounts/:id/activate')]: 'admin',

  // Strategies
  [routeKey('GET', '/api/strategies')]: 'read:strategies',
  [routeKey('GET', '/api/strategies/:id')]: 'read:strategies',
  [routeKey('GET', '/api/strategies/:id/signals')]: 'read:strategies',
  [routeKey('POST', '/api/strategies')]: 'write:strategies',
  [routeKey('PUT', '/api/strategies/:id/status')]: 'write:strategies',
  [routeKey('DELETE', '/api/strategies/:id')]: 'write:strategies',

  // Market data
  [routeKey('GET', '/api/market/klines')]: 'read:market',
  [routeKey('GET', '/api/market/ticker')]: 'read:market',
  [routeKey('GET', '/api/market/tickers')]: 'read:market',
  [routeKey('GET', '/api/market/trades')]: 'read:market',

  // Risk
  [routeKey('GET', '/api/risk/metrics')]: 'read:risk',
  [routeKey('GET', '/api/risk/events')]: 'read:risk',
  [routeKey('GET', '/api/risk/limits')]: 'read:risk',
  [routeKey('GET', '/api/risk/status')]: 'read:risk',

  // Audit
  [routeKey('GET', '/api/audit/logs')]: 'read:audit',
  [routeKey('GET', '/api/audit/stats')]: 'read:audit',
  [routeKey('GET', '/api/audit/verify')]: 'read:audit',

  // Backtest
  [routeKey('POST', '/api/backtest/run')]: 'write:backtest',
  [routeKey('GET', '/api/backtest/strategies')]: 'read:backtest',

  // API key management
  [routeKey('GET', '/api/keys')]: 'read:keys',
  [routeKey('GET', '/api/keys/permissions')]: 'read:keys',
  [routeKey('POST', '/api/keys')]: 'write:keys',
  [routeKey('GET', '/api/keys/:id')]: 'read:keys',
  [routeKey('PUT', '/api/keys/:id')]: 'write:keys',
  [routeKey('POST', '/api/keys/:id/toggle')]: 'write:keys',
  [routeKey('DELETE', '/api/keys/:id')]: 'write:keys',
};

function unauthorized(
  message: string,
  requiredPermission: ApiKeyPermission,
  route: string
): RequestGuardDecision {
  const forbidden = message.includes('Missing permission');
  return {
    allowed: false,
    status: forbidden ? 403 : 401,
    body: {
      message,
      code: forbidden ? 'AUTH_FORBIDDEN' : 'AUTH_REQUIRED',
      route,
      requiredPermission,
    },
  };
}

function resolvePermission(method: string, routePath: string): ApiKeyPermission | null {
  const key = routeKey(method, routePath);

  if (PUBLIC_ROUTES.has(key)) {
    return null;
  }

  if (ROUTE_PERMISSIONS[key]) {
    return ROUTE_PERMISSIONS[key];
  }

  // Fail closed for undocumented API routes.
  if (routePath.startsWith('/api/')) {
    return 'admin';
  }

  return null;
}

export function createApiRequestGuard(): RequestGuard {
  return ({ req, method, routePath }) => {
    if (getApiAuthMode() === 'off') {
      return { allowed: true };
    }

    const requiredPermission = resolvePermission(method, routePath);
    if (!requiredPermission) {
      return { allowed: true };
    }

    const auth = authenticateRequest(req, requiredPermission);
    if (!auth.authenticated) {
      return unauthorized(
        auth.error || 'Authentication failed',
        requiredPermission,
        routeKey(method, routePath)
      );
    }

    return { allowed: true };
  };
}
