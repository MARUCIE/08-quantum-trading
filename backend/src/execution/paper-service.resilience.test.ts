import { beforeEach, describe, expect, it, vi } from 'vitest';

const getTickerMock = vi.fn();

vi.mock('../data/binance-client.js', () => ({
  binanceClient: {
    getTicker: (...args: unknown[]) => getTickerMock(...args),
  },
}));

import { submitPaperOrder, UpstreamUnavailableError } from './paper-service.js';

function makeTicker(symbol: string, last: number) {
  return {
    timestamp: Date.now(),
    symbol,
    exchange: 'binance',
    bid: last,
    ask: last,
    bidSize: 1,
    askSize: 1,
    last,
    lastSize: 1,
  };
}

describe('paper-service resilience', () => {
  beforeEach(() => {
    getTickerMock.mockReset();
  });

  it('falls back to last cached price when upstream ticker fetch fails', async () => {
    getTickerMock
      .mockResolvedValueOnce(makeTicker('BTCUSDT', 100))
      .mockRejectedValueOnce(new Error('fetch failed'));

    const accountId = 'acct_cached_price';

    const first = await submitPaperOrder({
      accountId,
      clientOrderId: 'c1',
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'market',
      quantity: 0.01,
    });

    const second = await submitPaperOrder({
      accountId,
      clientOrderId: 'c2',
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'market',
      quantity: 0.01,
    });

    expect(first.orderId).not.toBe(second.orderId);
    expect(getTickerMock).toHaveBeenCalledTimes(2);
  });

  it('throws a structured upstream error when no cached price exists', async () => {
    getTickerMock.mockRejectedValue(new Error('fetch failed'));

    await expect(
      submitPaperOrder({
        accountId: 'acct_no_cache',
        clientOrderId: 'c1',
        symbol: 'BTCUSDT',
        side: 'buy',
        type: 'market',
        quantity: 0.01,
      })
    ).rejects.toBeInstanceOf(UpstreamUnavailableError);

    expect(getTickerMock).toHaveBeenCalledTimes(1);
  });

  it('is idempotent by clientOrderId (returns existing order without re-fetching price)', async () => {
    getTickerMock.mockResolvedValue(makeTicker('BTCUSDT', 100));

    const accountId = 'acct_idempotent';

    const first = await submitPaperOrder({
      accountId,
      clientOrderId: 'dup1',
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'market',
      quantity: 0.01,
    });

    const second = await submitPaperOrder({
      accountId,
      clientOrderId: 'dup1',
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'market',
      quantity: 0.01,
    });

    expect(second.orderId).toBe(first.orderId);
    expect(getTickerMock).toHaveBeenCalledTimes(1);
  });
});
