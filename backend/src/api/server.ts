/**
 * HTTP API Server
 *
 * Lightweight REST API server using Node.js built-in http module.
 * Includes security middleware: rate limiting, CORS, and security headers.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { defaultRateLimiter } from './middleware/rate-limiter.js';
import { defaultCorsHandler } from './middleware/cors.js';
import { defaultSecurityHeaders } from './middleware/security-headers.js';
import { metrics } from '../metrics/index.js';

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  query: URLSearchParams
) => Promise<void> | void;

export interface RequestGuardContext {
  req: IncomingMessage;
  method: string;
  path: string;
  routePath: string;
}

export interface RequestGuardDecision {
  allowed: boolean;
  status?: number;
  body?: unknown;
}

export type RequestGuard = (
  context: RequestGuardContext
) => RequestGuardDecision | Promise<RequestGuardDecision>;

interface Route {
  method: string;
  path: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

export class ApiServer {
  private routes: Route[] = [];
  private port: number;
  private requestGuard: RequestGuard | null = null;

  constructor(port: number = 3001) {
    this.port = port;
  }

  /**
   * Register a route
   */
  route(method: string, path: string, handler: RouteHandler): void {
    const paramNames: string[] = [];
    const patternStr = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const pattern = new RegExp(`^${patternStr}$`);

    this.routes.push({ method, path, pattern, paramNames, handler });
  }

  get(path: string, handler: RouteHandler): void {
    this.route('GET', path, handler);
  }

  post(path: string, handler: RouteHandler): void {
    this.route('POST', path, handler);
  }

  put(path: string, handler: RouteHandler): void {
    this.route('PUT', path, handler);
  }

  delete(path: string, handler: RouteHandler): void {
    this.route('DELETE', path, handler);
  }

  /**
   * Register a centralized request guard (auth/contract checks).
   */
  setRequestGuard(guard: RequestGuard | null): void {
    this.requestGuard = guard;
  }

  /**
   * Start the server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      const server = createServer(async (req, res) => {
        // Get client IP for rate limiting
        const clientIp = this.getClientIp(req);
        const origin = req.headers.origin;

        // Apply security headers
        defaultSecurityHeaders.apply(res);

        // Apply CORS headers
        defaultCorsHandler.applyHeaders(res, origin);

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          defaultCorsHandler.handlePreflight(res, origin);
          return;
        }

        // Check rate limit
        const rateLimit = defaultRateLimiter.check(clientIp);
        const rateLimitHeaders = defaultRateLimiter.getHeaders(rateLimit);

        // Apply rate limit headers
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
          res.setHeader(key, value);
        }

        // Block if rate limited
        if (!rateLimit.allowed) {
          metrics.incCounter('http_requests_total', {
            method: req.method || 'GET',
            path: 'rate_limited',
            status: '429',
          });
          this.sendJson(res, 429, {
            error: defaultRateLimiter.getMessage(),
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
          });
          return;
        }

        // Track in-flight requests
        metrics.incGauge('http_requests_in_flight');
        const endTimer = metrics.startTimer('http_request_duration_ms', {
          method: req.method || 'GET',
          path: this.normalizePath(req.url || '/'),
        });

        try {
          await this.handleRequest(req, res);
          metrics.incCounter('http_requests_total', {
            method: req.method || 'GET',
            path: this.normalizePath(req.url || '/'),
            status: String(res.statusCode),
          });
        } catch (error) {
          console.error('[API] Request error:', error);
          metrics.incCounter('http_requests_total', {
            method: req.method || 'GET',
            path: this.normalizePath(req.url || '/'),
            status: '500',
          });
          this.sendJson(res, 500, { error: 'Internal server error' });
        } finally {
          endTimer();
          metrics.decGauge('http_requests_in_flight');
        }
      });

      server.listen(this.port, () => {
        console.log(`[API] Server running on http://localhost:${this.port}`);
        console.log(`[API] Rate limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per minute`);
        resolve();
      });
    });
  }

  /**
   * Normalize path for metrics (remove IDs to reduce cardinality)
   */
  private normalizePath(url: string): string {
    const path = url.split('?')[0];
    // Replace numeric IDs and UUIDs with :id placeholder
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id');
  }

  /**
   * Extract client IP from request
   */
  private getClientIp(req: IncomingMessage): string {
    // Check X-Forwarded-For header (for proxies)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    // Check X-Real-IP header
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fall back to socket remote address
    return req.socket.remoteAddress || 'unknown';
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://localhost:${this.port}`);
    const path = url.pathname;
    const method = req.method || 'GET';

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = path.match(route.pattern);
      if (!match) continue;

      // Extract params
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });

      if (this.requestGuard) {
        const decision = await this.requestGuard({
          req,
          method,
          path,
          routePath: route.path,
        });
        if (!decision.allowed) {
          this.sendJson(
            res,
            decision.status ?? 403,
            decision.body ?? {
              message: 'Forbidden',
              code: 'FORBIDDEN',
            }
          );
          return;
        }
      }

      try {
        await route.handler(req, res, params, url.searchParams);
      } catch (error) {
        if (error instanceof Error && error.message === 'Invalid JSON') {
          this.sendJson(res, 400, {
            message: 'Invalid JSON body',
            code: 'INVALID_JSON',
          });
          return;
        }
        throw error;
      }
      return;
    }

    // 404 Not Found
    this.sendJson(res, 404, { error: 'Not found' });
  }

  /**
   * Send JSON response
   */
  sendJson(res: ServerResponse, status: number, data: unknown): void {
    const payload = this.normalizeErrorPayload(status, data);
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
  }

  /**
   * Normalize error responses to a stable contract.
   * Canonical error shape:
   *   { message: string, code: string, status: number, ...extras }
   */
  private normalizeErrorPayload(status: number, data: unknown): unknown {
    if (status < 400 || typeof data !== 'object' || data === null || Array.isArray(data)) {
      return data;
    }

    const record = data as Record<string, unknown>;

    // Only normalize explicit error payloads.
    if (typeof record.message !== 'string' && typeof record.error !== 'string') {
      return data;
    }

    const message =
      typeof record.message === 'string'
        ? record.message
        : typeof record.error === 'string'
          ? record.error
          : `HTTP ${status}`;

    const next: Record<string, unknown> = { ...record };
    delete next.error;
    next.message = message;
    next.status = status;

    if (typeof next.code !== 'string' || !next.code) {
      next.code = `HTTP_${status}`;
    }

    return next;
  }

  /**
   * Parse JSON body
   */
  async parseBody<T>(req: IncomingMessage): Promise<T> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        if (!body.trim()) {
          resolve({} as T);
          return;
        }
        try {
          resolve(JSON.parse(body) as T);
        } catch {
          reject(new Error('Invalid JSON'));
        }
      });
      req.on('error', reject);
    });
  }
}
