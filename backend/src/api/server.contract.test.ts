import { describe, it, expect, vi } from 'vitest';
import type { ServerResponse } from 'http';
import { ApiServer } from './server.js';

function createMockResponse() {
  let body = '';
  const res = {
    writeHead: vi.fn(),
    end: vi.fn((payload: string) => {
      body = payload;
    }),
  } as unknown as ServerResponse;

  return {
    res,
    getBody: () => (body ? JSON.parse(body) : undefined),
  };
}

describe('API error contract', () => {
  it('normalizes generic error payloads to message/code/status', () => {
    const server = new ApiServer(0);
    const { res, getBody } = createMockResponse();

    server.sendJson(res, 404, { error: 'Not found' });

    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });
    expect(getBody()).toEqual({
      message: 'Not found',
      code: 'HTTP_404',
      status: 404,
    });
  });

  it('keeps explicit error code when provided', () => {
    const server = new ApiServer(0);
    const { res, getBody } = createMockResponse();

    server.sendJson(res, 400, { message: 'Invalid JSON body', code: 'INVALID_JSON' });

    expect(getBody()).toEqual({
      message: 'Invalid JSON body',
      code: 'INVALID_JSON',
      status: 400,
    });
  });

  it('does not alter successful payloads', () => {
    const server = new ApiServer(0);
    const { res, getBody } = createMockResponse();

    server.sendJson(res, 200, { ok: true });

    expect(getBody()).toEqual({ ok: true });
  });
});
