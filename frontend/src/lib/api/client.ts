/**
 * API Client
 *
 * Centralized HTTP client for backend communication.
 */

const DEFAULT_API_BASE_URL = "http://localhost:3001";

/**
 * Normalize API base URL to origin-only form:
 * - strips trailing slash
 * - strips trailing /api if provided by env
 */
export function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
}

/**
 * Normalize endpoint path to canonical backend route form:
 * - ensures leading slash
 * - ensures /api prefix for backend routes
 */
export function normalizeApiEndpoint(endpoint: string): string {
  const [rawPath, ...queryParts] = endpoint.split("?");
  let path = rawPath.trim();

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  path = path.replace(/\/{2,}/g, "/");
  if (!path.startsWith("/api")) {
    path = `/api${path}`;
  }

  const query = queryParts.join("?");
  return query ? `${path}?${query}` : path;
}

export function buildApiUrl(endpoint: string, baseUrl: string): string {
  return `${baseUrl}${normalizeApiEndpoint(endpoint)}`;
}

const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL
);

function headersToRecord(headers: HeadersInit = {}): Record<string, string> {
  const record: Record<string, string> = {};

  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      record[key] = value;
    }
    return record;
  }

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }

  return { ...(headers as Record<string, string>) };
}

export function getApiAuthToken(): string | null {
  const token = process.env.NEXT_PUBLIC_API_KEY?.trim();
  return token ? token : null;
}

export function getApiAuthHeaders(headers: HeadersInit = {}): HeadersInit {
  const record = headersToRecord(headers);
  const hasAuthHeader = Object.keys(record).some((key) => {
    const lower = key.toLowerCase();
    return lower === "authorization" || lower === "x-api-key";
  });

  const token = getApiAuthToken();
  if (token && !hasAuthHeader) {
    record.Authorization = `Bearer ${token}`;
  }

  return record;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

export class ApiClientError extends Error implements ApiError {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildApiUrl(endpoint, this.baseUrl);
    const headers = getApiAuthHeaders({
      "Content-Type": "application/json",
      ...headersToRecord(options.headers || {}),
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let message = `HTTP error ${response.status}`;
        let code: string | undefined;

        try {
          const errorData = (await response.json()) as {
            message?: string;
            code?: string;
          };
          if (typeof errorData.message === "string" && errorData.message) {
            message = errorData.message;
          }
          if (typeof errorData.code === "string" && errorData.code) {
            code = errorData.code;
          }
        } catch {
          // Response is not JSON
        }

        throw new ApiClientError(message, response.status, code);
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(
        error instanceof Error ? error.message : "Network error",
        0
      );
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
