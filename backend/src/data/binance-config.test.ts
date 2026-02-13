import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resolveBinanceSpotRestApiUrl,
  resolveBinanceSpotRestBaseUrl,
} from './binance-config.js';

describe('binance-config', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('BINANCE_SPOT_REST_BASE_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses default production base when no override is set', () => {
    expect(resolveBinanceSpotRestBaseUrl(false)).toBe('https://api.binance.com');
  });

  it('uses default testnet base when no override is set', () => {
    expect(resolveBinanceSpotRestBaseUrl(true)).toBe('https://testnet.binance.vision');
  });

  it('normalizes override by trimming trailing slashes', () => {
    vi.stubEnv('BINANCE_SPOT_REST_BASE_URL', 'https://data-api.binance.vision/');
    expect(resolveBinanceSpotRestBaseUrl(false)).toBe('https://data-api.binance.vision');
  });

  it('strips /api/v3 suffix from override to keep a stable base', () => {
    vi.stubEnv('BINANCE_SPOT_REST_BASE_URL', 'https://data-api.binance.vision/api/v3');
    expect(resolveBinanceSpotRestBaseUrl(false)).toBe('https://data-api.binance.vision');
  });

  it('builds REST API url from resolved base', () => {
    vi.stubEnv('BINANCE_SPOT_REST_BASE_URL', 'https://data-api.binance.vision');
    expect(resolveBinanceSpotRestApiUrl(false)).toBe('https://data-api.binance.vision/api/v3');
  });
});
