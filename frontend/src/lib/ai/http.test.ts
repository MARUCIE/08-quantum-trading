import { describe, expect, it, vi } from 'vitest';

import {
  buildAiApiUrl,
  extractAiErrorMessage,
  requestAiJson,
} from './http';

describe('ai http helpers', () => {
  describe('buildAiApiUrl', () => {
    it('adds /api/ai prefix for relative paths', () => {
      expect(buildAiApiUrl('chat')).toBe('/api/ai/chat');
      expect(buildAiApiUrl('/chat')).toBe('/api/ai/chat');
    });

    it('keeps already-prefixed urls unchanged', () => {
      expect(buildAiApiUrl('/api/ai/chat')).toBe('/api/ai/chat');
      expect(buildAiApiUrl('/api/ai/status')).toBe('/api/ai/status');
    });
  });

  describe('extractAiErrorMessage', () => {
    it('prefers error field from json body', async () => {
      const response = new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
      });
      await expect(extractAiErrorMessage(response)).resolves.toBe('Bad request');
    });

    it('falls back to message field then status text', async () => {
      const withMessage = new Response(JSON.stringify({ message: 'Unavailable' }), {
        status: 503,
      });
      await expect(extractAiErrorMessage(withMessage)).resolves.toBe('Unavailable');

      const plain = new Response('oops', { status: 500 });
      await expect(extractAiErrorMessage(plain)).resolves.toBe('Request failed: 500');
    });
  });

  describe('requestAiJson', () => {
    it('throws normalized error on non-ok response', async () => {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify({ error: 'Denied' }), { status: 403 }));

      await expect(requestAiJson('status')).rejects.toThrow('Denied');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('/api/ai/status');
      expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({}));

      fetchMock.mockRestore();
    });
  });
});
