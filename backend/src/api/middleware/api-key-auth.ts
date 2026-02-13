/**
 * API Key Authentication Middleware
 *
 * Validates API keys from request headers and enforces permissions.
 * Supports both Bearer token and X-API-Key header formats.
 */

import { IncomingMessage, ServerResponse } from 'http';
import {
  ALL_PERMISSIONS,
  apiKeyManager,
  type ApiKeyPermission,
  type ApiKeyRecord,
} from '../../auth/index.js';

export type ApiAuthMode = 'required' | 'off';

/** Authentication result */
export interface AuthResult {
  authenticated: boolean;
  apiKey?: ApiKeyRecord;
  error?: string;
}

/** Route protection options */
export interface ProtectedRouteOptions {
  /** Required permission for the route */
  permission?: ApiKeyPermission;
  /** Allow unauthenticated access (for public routes) */
  allowPublic?: boolean;
  /** Custom error handler */
  onError?: (res: ServerResponse, error: string) => void;
}

/**
 * Resolve API auth mode from environment.
 * - required: enforce API key auth
 * - off: disable auth checks (local/offline troubleshooting only)
 */
export function getApiAuthMode(): ApiAuthMode {
  const raw = (process.env.API_AUTH_MODE || 'required').trim().toLowerCase();
  return raw === 'off' ? 'off' : 'required';
}

/**
 * Optional static API key injected via environment.
 * Useful for non-production bootstrap and deterministic local testing.
 */
export function getStaticApiKey(): string | null {
  const key = process.env.API_STATIC_KEY?.trim();
  return key ? key : null;
}

function createStaticApiKeyRecord(): ApiKeyRecord {
  return {
    id: 'static_env_key',
    name: 'Static Environment API Key',
    keyPrefix: 'static_env_key',
    keyHash: 'env:static',
    permissions: [...ALL_PERMISSIONS],
    createdAt: 0,
    lastUsedAt: Date.now(),
    expiresAt: null,
    isActive: true,
    ipWhitelist: null,
    rateLimit: Number.MAX_SAFE_INTEGER,
    usageCount: 0,
  };
}

/**
 * Extract API key from request headers
 *
 * Supports:
 * - Authorization: Bearer <key>
 * - X-API-Key: <key>
 */
export function extractApiKey(req: IncomingMessage): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Check if an API key record has required permission.
 */
export function hasPermission(
  apiKey: ApiKeyRecord,
  requiredPermission?: ApiKeyPermission
): boolean {
  if (!requiredPermission) {
    return true;
  }
  if (apiKey.permissions.includes('admin')) {
    return true;
  }
  return apiKey.permissions.includes(requiredPermission);
}

/**
 * Authenticate a raw API key.
 */
export function authenticateApiKey(
  key: string,
  requiredPermission?: ApiKeyPermission
): AuthResult {
  if (getApiAuthMode() === 'off') {
    return { authenticated: true };
  }

  const normalizedKey = key.trim();
  const staticKey = getStaticApiKey();
  if (staticKey && normalizedKey === staticKey) {
    const apiKey = createStaticApiKeyRecord();
    if (!hasPermission(apiKey, requiredPermission)) {
      return {
        authenticated: false,
        error: `Missing permission: ${requiredPermission}`,
      };
    }
    return { authenticated: true, apiKey };
  }

  const validation = apiKeyManager.validate(normalizedKey, requiredPermission);
  if (!validation.valid) {
    return {
      authenticated: false,
      error: validation.error || 'Invalid API key',
    };
  }

  if (!validation.record) {
    return {
      authenticated: false,
      error: 'API key validation returned no record',
    };
  }

  if (!hasPermission(validation.record, requiredPermission)) {
    return {
      authenticated: false,
      error: `Missing permission: ${requiredPermission}`,
    };
  }

  return {
    authenticated: true,
    apiKey: validation.record,
  };
}

/**
 * Authenticate a request using API key headers.
 */
export function authenticateRequest(
  req: IncomingMessage,
  requiredPermission?: ApiKeyPermission
): AuthResult {
  const key = extractApiKey(req);

  if (!key) {
    if (getApiAuthMode() === 'off') {
      return { authenticated: true };
    }
    return {
      authenticated: false,
      error: 'API key required. Use Authorization: Bearer <key> or X-API-Key header.',
    };
  }

  return authenticateApiKey(key, requiredPermission);
}

/**
 * Check if client IP is whitelisted for the API key
 */
export function checkIpWhitelist(
  apiKey: ApiKeyRecord,
  clientIp: string
): boolean {
  // No whitelist means all IPs allowed
  if (!apiKey.ipWhitelist || apiKey.ipWhitelist.length === 0) {
    return true;
  }

  // Check if IP is in whitelist
  return apiKey.ipWhitelist.includes(clientIp);
}

/**
 * Default error handler for authentication failures
 */
function defaultErrorHandler(res: ServerResponse, error: string): void {
  const forbidden = error.includes('Missing permission');
  const status = forbidden ? 403 : 401;
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'WWW-Authenticate': 'Bearer realm="api"',
  });
  res.end(
    JSON.stringify({
      message: error,
      code: forbidden ? 'AUTH_FORBIDDEN' : 'AUTH_REQUIRED',
      status,
    })
  );
}

/**
 * Create authentication middleware for a protected route
 *
 * Usage:
 * ```typescript
 * const auth = createAuthMiddleware({ permission: 'write:orders' });
 *
 * server.post('/api/orders', async (req, res, params, query) => {
 *   const authResult = auth(req, res);
 *   if (!authResult.authenticated) return;
 *
 *   // Proceed with authenticated request
 *   // authResult.apiKey contains the validated API key record
 * });
 * ```
 */
export function createAuthMiddleware(options: ProtectedRouteOptions = {}) {
  const { permission, allowPublic = false, onError = defaultErrorHandler } = options;

  return (
    req: IncomingMessage,
    res: ServerResponse,
    clientIp?: string
  ): AuthResult => {
    // Allow public access if configured
    if (allowPublic && !extractApiKey(req)) {
      return { authenticated: true };
    }

    // Authenticate the request
    const result = authenticateRequest(req, permission);

    if (!result.authenticated) {
      onError(res, result.error || 'Authentication failed');
      return result;
    }

    // Check IP whitelist if API key has restrictions
    if (result.apiKey && clientIp) {
      if (!checkIpWhitelist(result.apiKey, clientIp)) {
        const error = 'IP address not in whitelist';
        onError(res, error);
        return { authenticated: false, error };
      }
    }

    return result;
  };
}

/**
 * Middleware factory for common permission levels
 */
export const authMiddleware = {
  /** Require any valid API key */
  requireAuth: createAuthMiddleware(),

  /** Require read:account permission */
  requireReadAccount: createAuthMiddleware({ permission: 'read:account' }),

  /** Require read:positions permission */
  requireReadPositions: createAuthMiddleware({ permission: 'read:positions' }),

  /** Require read:orders permission */
  requireReadOrders: createAuthMiddleware({ permission: 'read:orders' }),

  /** Require write:orders permission */
  requireWriteOrders: createAuthMiddleware({ permission: 'write:orders' }),

  /** Require read:strategies permission */
  requireReadStrategies: createAuthMiddleware({ permission: 'read:strategies' }),

  /** Require write:strategies permission */
  requireWriteStrategies: createAuthMiddleware({ permission: 'write:strategies' }),

  /** Require read:backtest permission */
  requireReadBacktest: createAuthMiddleware({ permission: 'read:backtest' }),

  /** Require write:backtest permission */
  requireWriteBacktest: createAuthMiddleware({ permission: 'write:backtest' }),

  /** Require admin permission */
  requireAdmin: createAuthMiddleware({ permission: 'admin' }),

  /** Allow public access but authenticate if key provided */
  optionalAuth: createAuthMiddleware({ allowPublic: true }),
};

/**
 * Wrap a route handler with authentication
 *
 * This is a higher-order function that wraps a route handler
 * with authentication logic.
 *
 * Usage:
 * ```typescript
 * server.get('/api/account', withAuth(
 *   { permission: 'read:account' },
 *   async (req, res, params, query, apiKey) => {
 *     // apiKey is the validated API key record
 *   }
 * ));
 * ```
 */
export function withAuth<T extends (...args: unknown[]) => unknown>(
  options: ProtectedRouteOptions,
  handler: (
    req: IncomingMessage,
    res: ServerResponse,
    params: Record<string, string>,
    query: URLSearchParams,
    apiKey?: ApiKeyRecord
  ) => ReturnType<T>
) {
  const auth = createAuthMiddleware(options);

  return async (
    req: IncomingMessage,
    res: ServerResponse,
    params: Record<string, string>,
    query: URLSearchParams
  ) => {
    const result = auth(req, res);
    if (!result.authenticated) {
      return;
    }

    return handler(req, res, params, query, result.apiKey);
  };
}

// Export default instance
export const apiKeyAuth = {
  getApiAuthMode,
  getStaticApiKey,
  extractApiKey,
  hasPermission,
  authenticateApiKey,
  authenticateRequest,
  checkIpWhitelist,
  createAuthMiddleware,
  authMiddleware,
  withAuth,
};
