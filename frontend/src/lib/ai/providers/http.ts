import { AIError, AIProvider } from '../types';

const DEFAULT_PROVIDER_TIMEOUT_MS = 30_000;

function getErrorMessageFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as {
    error?: unknown;
    message?: unknown;
  };

  if (typeof record.error === 'string' && record.error) {
    return record.error;
  }

  if (
    record.error &&
    typeof record.error === 'object' &&
    typeof (record.error as { message?: unknown }).message === 'string'
  ) {
    return (record.error as { message: string }).message;
  }

  if (typeof record.message === 'string' && record.message) {
    return record.message;
  }

  return null;
}

export function isAIError(error: unknown): error is AIError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as Partial<AIError>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string' &&
    (candidate.provider === 'google' || candidate.provider === 'poe') &&
    typeof candidate.retryable === 'boolean'
  );
}

export function toProviderNetworkError(
  provider: AIProvider,
  error: unknown
): AIError {
  return {
    code: `${provider}_network_error`,
    message: error instanceof Error ? error.message : 'Network error',
    provider,
    retryable: true,
  };
}

export async function toProviderHttpError(
  provider: AIProvider,
  response: Response,
  defaultMessagePrefix: string
): Promise<AIError> {
  const payload = await response.clone().json().catch(() => null);
  const message =
    getErrorMessageFromPayload(payload) || `${defaultMessagePrefix}: ${response.status}`;

  return {
    code: `${provider}_${response.status}`,
    message,
    provider,
    status: response.status,
    retryable: response.status >= 500 || response.status === 429,
  };
}

function composeAbortSignal(
  upstreamSignal: AbortSignal | null | undefined,
  controller: AbortController
): () => void {
  if (!upstreamSignal) {
    return () => {};
  }

  if (upstreamSignal.aborted) {
    controller.abort();
    return () => {};
  }

  const onAbort = () => controller.abort();
  upstreamSignal.addEventListener('abort', onAbort, { once: true });
  return () => upstreamSignal.removeEventListener('abort', onAbort);
}

export async function fetchWithTimeout(
  provider: AIProvider,
  url: string,
  init: RequestInit,
  timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS
): Promise<Response> {
  const timeoutController = new AbortController();
  const releaseUpstreamSignal = composeAbortSignal(init.signal, timeoutController);

  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: timeoutController.signal,
    });
  } catch (error) {
    if (timeoutController.signal.aborted && !init.signal?.aborted) {
      throw {
        code: `${provider}_timeout`,
        message: `Request timed out after ${timeoutMs}ms`,
        provider,
        retryable: true,
      } as AIError;
    }

    throw toProviderNetworkError(provider, error);
  } finally {
    clearTimeout(timeoutId);
    releaseUpstreamSignal();
  }
}
