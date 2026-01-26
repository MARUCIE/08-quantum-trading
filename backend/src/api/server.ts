/**
 * HTTP API Server
 *
 * Lightweight REST API server using Node.js built-in http module.
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  query: URLSearchParams
) => Promise<void> | void;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

export class ApiServer {
  private routes: Route[] = [];
  private port: number;

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

    this.routes.push({ method, pattern, paramNames, handler });
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
   * Start the server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      const server = createServer(async (req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        try {
          await this.handleRequest(req, res);
        } catch (error) {
          console.error('[API] Request error:', error);
          this.sendJson(res, 500, { error: 'Internal server error' });
        }
      });

      server.listen(this.port, () => {
        console.log(`[API] Server running on http://localhost:${this.port}`);
        resolve();
      });
    });
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

      await route.handler(req, res, params, url.searchParams);
      return;
    }

    // 404 Not Found
    this.sendJson(res, 404, { error: 'Not found' });
  }

  /**
   * Send JSON response
   */
  sendJson(res: ServerResponse, status: number, data: unknown): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
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
