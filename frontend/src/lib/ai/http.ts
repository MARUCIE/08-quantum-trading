/**
 * Internal AI API HTTP helpers.
 *
 * These utilities are intentionally scoped to frontend internal routes
 * under `/api/ai/*` and are separate from backend `apiClient`.
 */

const AI_API_PREFIX = '/api/ai';

interface AIErrorPayload {
  error?: string;
  message?: string;
}

export function buildAiApiUrl(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return AI_API_PREFIX;
  }

  if (trimmed.startsWith(`${AI_API_PREFIX}/`) || trimmed === AI_API_PREFIX) {
    return trimmed;
  }

  return `${AI_API_PREFIX}/${trimmed.replace(/^\/+/, '')}`;
}

export async function extractAiErrorMessage(response: Response): Promise<string> {
  let payload: AIErrorPayload | null = null;

  try {
    payload = (await response.json()) as AIErrorPayload;
  } catch {
    // Ignore non-JSON responses
  }

  return (
    payload?.error ||
    payload?.message ||
    `Request failed: ${response.status}`
  );
}

export async function requestAi(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(buildAiApiUrl(path), init);
}

export async function requestAiJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const hasBody = init.body !== undefined && init.body !== null;
  const headers = new Headers(init.headers || {});

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await requestAi(path, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(await extractAiErrorMessage(response));
  }

  return (await response.json()) as T;
}
