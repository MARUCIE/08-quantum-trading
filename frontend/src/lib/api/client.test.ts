import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiClient,
  ApiClientError,
  buildApiUrl,
  getApiAuthHeaders,
  normalizeApiBaseUrl,
  normalizeApiEndpoint,
} from './client';

describe('api client contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('normalizes base URL and endpoint path', () => {
    expect(normalizeApiBaseUrl('http://localhost:3001/api/')).toBe('http://localhost:3001');
    expect(normalizeApiEndpoint('orders?symbol=BTCUSDT')).toBe('/api/orders?symbol=BTCUSDT');
    expect(buildApiUrl('orders', 'http://localhost:3001')).toBe('http://localhost:3001/api/orders');
  });

  it('maps backend error payload to ApiClientError shape', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid JSON body', code: 'INVALID_JSON' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient('http://localhost:3001');

    await expect(client.post('/orders', { bad: true })).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiClientError',
        message: 'Invalid JSON body',
        status: 400,
        code: 'INVALID_JSON',
      })
    );
  });

  it('returns status 0 ApiClientError on network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED'));
    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient('http://localhost:3001');

    await expect(client.get('/health')).rejects.toEqual(
      expect.objectContaining({
        name: 'ApiClientError',
        status: 0,
        message: expect.any(String),
      })
    );
  });

  it('returns parsed payload on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient('http://localhost:3001');
    const payload = await client.get<{ status: string }>('/health');

    expect(payload).toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3001/api/health', expect.any(Object));
  });

  it('injects Authorization header when NEXT_PUBLIC_API_KEY is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_KEY', 'qx_frontend_test_key');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ApiClient('http://localhost:3001');
    await client.get('/health');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer qx_frontend_test_key',
        }),
      })
    );
  });

  it('preserves explicit auth headers when building request headers', () => {
    vi.stubEnv('NEXT_PUBLIC_API_KEY', 'qx_frontend_test_key');
    const headers = getApiAuthHeaders({
      Authorization: 'Bearer explicit_override',
    });

    expect(headers).toMatchObject({
      Authorization: 'Bearer explicit_override',
    });
  });
});
