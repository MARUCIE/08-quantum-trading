/**
 * Binance API Configuration
 *
 * Centralized configuration for Binance API endpoints.
 * Supports both production and testnet environments.
 *
 * Notes:
 * - Some environments cannot reach `api.binance.com` directly (geo/DNS restrictions).
 *   Use `BINANCE_SPOT_REST_BASE_URL` to override the REST base, e.g. `https://data-api.binance.vision`.
 */

export interface BinanceConfig {
  isTestnet: boolean;
  rest: {
    base: string;
    api: string;
  };
  ws: {
    stream: string;
  };
  apiKey?: string;
  apiSecret?: string;
}

const DEFAULT_PRODUCTION_REST_BASE = 'https://api.binance.com';
const DEFAULT_TESTNET_REST_BASE = 'https://testnet.binance.vision';
const DEFAULT_PRODUCTION_WS_STREAM = 'wss://stream.binance.com:9443';
const DEFAULT_TESTNET_WS_STREAM = 'wss://testnet.binance.vision';

function normalizeBaseUrl(input: string): string {
  return input.trim().replace(/\/+$/, '');
}

function stripApiV3Suffix(input: string): string {
  return input.replace(/\/api\/v3\/?$/, '');
}

/**
 * Resolve Binance Spot REST base URL.
 *
 * Override with `BINANCE_SPOT_REST_BASE_URL`.
 * If an override includes `/api/v3`, it will be stripped to keep a stable base.
 */
export function resolveBinanceSpotRestBaseUrl(isTestnet: boolean): string {
  const override = process.env.BINANCE_SPOT_REST_BASE_URL?.trim();
  if (override) {
    return stripApiV3Suffix(normalizeBaseUrl(override));
  }
  return isTestnet ? DEFAULT_TESTNET_REST_BASE : DEFAULT_PRODUCTION_REST_BASE;
}

export function resolveBinanceSpotRestApiUrl(isTestnet: boolean): string {
  return `${resolveBinanceSpotRestBaseUrl(isTestnet)}/api/v3`;
}

/**
 * Get Binance configuration based on environment.
 */
export function getBinanceConfig(): BinanceConfig {
  const isTestnet = process.env.BINANCE_TESTNET === 'true';
  const restBase = resolveBinanceSpotRestBaseUrl(isTestnet);
  const restApi = resolveBinanceSpotRestApiUrl(isTestnet);
  const wsStream = isTestnet ? DEFAULT_TESTNET_WS_STREAM : DEFAULT_PRODUCTION_WS_STREAM;

  return {
    isTestnet,
    rest: {
      base: restBase,
      api: restApi,
    },
    ws: {
      stream: wsStream,
    },
    apiKey: process.env.BINANCE_API_KEY,
    apiSecret: process.env.BINANCE_API_SECRET,
  };
}

/**
 * Log current Binance configuration (without secrets).
 */
export function logBinanceConfig(): void {
  const config = getBinanceConfig();
  const override = process.env.BINANCE_SPOT_REST_BASE_URL?.trim();

  console.log('[Binance] Configuration:');
  console.log(`  Environment: ${config.isTestnet ? 'TESTNET' : 'PRODUCTION'}`);
  if (override) {
    console.log(`  REST Base Override: ${override}`);
  }
  console.log(`  REST API: ${config.rest.api}`);
  console.log(`  WebSocket: ${config.ws.stream}`);
  console.log(`  API Key: ${config.apiKey ? '[SET]' : '[NOT SET]'}`);
  console.log(`  API Secret: ${config.apiSecret ? '[SET]' : '[NOT SET]'}`);
}

// Export singleton config
export const binanceConfig = getBinanceConfig();
