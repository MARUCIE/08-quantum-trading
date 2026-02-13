import { describe, expect, it, vi } from 'vitest';

import {
  fetchWithTimeout,
  isAIError,
  toProviderHttpError,
  toProviderNetworkError,
} from './http';

describe('ai provider http helpers', () => {
  describe('toProviderHttpError', () => {
    it('reads nested error.message from payload', async () => {
      const response = new Response(
        JSON.stringify({
          error: { message: 'Provider says no' },
        }),
        { status: 429 }
      );

      await expect(
        toProviderHttpError('google', response, 'Google AI error')
      ).resolves.toMatchObject({
        code: 'google_429',
        message: 'Provider says no',
        provider: 'google',
        status: 429,
        retryable: true,
      });
    });

    it('falls back to default message when payload is not json', async () => {
      const response = new Response('oops', { status: 403 });

      await expect(
        toProviderHttpError('poe', response, 'Poe API error')
      ).resolves.toMatchObject({
        code: 'poe_403',
        message: 'Poe API error: 403',
        provider: 'poe',
        status: 403,
        retryable: false,
      });
    });
  });

  describe('toProviderNetworkError / isAIError', () => {
    it('normalizes network errors', () => {
      const error = toProviderNetworkError('google', new Error('network down'));
      expect(error).toMatchObject({
        code: 'google_network_error',
        message: 'network down',
        provider: 'google',
        retryable: true,
      });
      expect(isAIError(error)).toBe(true);
    });
  });

  describe('fetchWithTimeout', () => {
    it('throws timeout error when request exceeds timeout', async () => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockImplementation((_input, init) => {
          return new Promise((_resolve, reject) => {
            const signal = init?.signal as AbortSignal | undefined;
            signal?.addEventListener(
              'abort',
              () => reject(new DOMException('aborted', 'AbortError')),
              { once: true }
            );
          });
        });

      await expect(
        fetchWithTimeout('google', 'https://example.com', {}, 1)
      ).rejects.toMatchObject({
        code: 'google_timeout',
        provider: 'google',
        retryable: true,
      });

      fetchMock.mockRestore();
    });
  });
});
