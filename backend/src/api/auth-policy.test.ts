import { IncomingMessage } from 'http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiKeyManager } from '../auth/index.js';
import { createApiRequestGuard } from './auth-policy.js';

function createRequest(headers: Record<string, string> = {}): IncomingMessage {
  return { headers } as IncomingMessage;
}

describe('API auth policy guard', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('API_AUTH_MODE', 'required');
    vi.stubEnv('API_STATIC_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows public health endpoint without key', () => {
    const guard = createApiRequestGuard();
    const decision = guard({
      req: createRequest(),
      method: 'GET',
      path: '/api/health',
      routePath: '/api/health',
    });

    expect(decision).toEqual({ allowed: true });
  });

  it('rejects protected route without key', () => {
    const guard = createApiRequestGuard();
    const decision = guard({
      req: createRequest(),
      method: 'GET',
      path: '/api/orders',
      routePath: '/api/orders',
    });

    expect(decision).toMatchObject({
      allowed: false,
      status: 401,
      body: {
        code: 'AUTH_REQUIRED',
      },
    });
  });

  it('accepts static key for protected routes', () => {
    vi.stubEnv('API_STATIC_KEY', 'qx_static_dev_key');
    const guard = createApiRequestGuard();
    const decision = guard({
      req: createRequest({
        authorization: 'Bearer qx_static_dev_key',
      }),
      method: 'POST',
      path: '/api/orders',
      routePath: '/api/orders',
    });

    expect(decision).toEqual({ allowed: true });
  });

  it('enforces route-specific permissions', () => {
    const key = apiKeyManager.create({
      name: 'Read Orders Key',
      permissions: ['read:orders'],
    });
    const guard = createApiRequestGuard();
    const authHeader = { authorization: `Bearer ${key.key}` };

    const readDecision = guard({
      req: createRequest(authHeader),
      method: 'GET',
      path: '/api/orders',
      routePath: '/api/orders',
    });
    expect(readDecision).toEqual({ allowed: true });

    const writeDecision = guard({
      req: createRequest(authHeader),
      method: 'POST',
      path: '/api/orders',
      routePath: '/api/orders',
    });
    expect(writeDecision).toMatchObject({
      allowed: false,
      status: 403,
      body: {
        code: 'AUTH_FORBIDDEN',
        requiredPermission: 'write:orders',
      },
    });
  });

  it('fails closed for undocumented /api routes (admin fallback)', () => {
    const key = apiKeyManager.create({
      name: 'Non Admin Key',
      permissions: ['read:orders'],
    });
    const guard = createApiRequestGuard();
    const decision = guard({
      req: createRequest({ authorization: `Bearer ${key.key}` }),
      method: 'POST',
      path: '/api/custom/internal',
      routePath: '/api/custom/internal',
    });

    expect(decision).toMatchObject({
      allowed: false,
      status: 403,
      body: {
        requiredPermission: 'admin',
      },
    });
  });

  it('bypasses auth when API_AUTH_MODE=off', () => {
    vi.stubEnv('API_AUTH_MODE', 'off');
    const guard = createApiRequestGuard();
    const decision = guard({
      req: createRequest(),
      method: 'GET',
      path: '/api/orders',
      routePath: '/api/orders',
    });

    expect(decision).toEqual({ allowed: true });
  });
});
