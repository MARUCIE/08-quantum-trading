import {
  expect,
  test,
  type ConsoleMessage,
  type Page,
  type Request,
  type Response,
} from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type RouteReport = {
  route: string;
  status: number | null;
  durationMs: number;
  navigationTiming: {
    domContentLoadedMs: number;
    loadMs: number;
    responseEndMs: number;
  } | null;
  screenshot: string;
  consoleErrorCount: number;
  pageErrorCount: number;
  requestFailureCount: number;
  notFoundCount: number;
};

type ErrorRecord = {
  route: string;
  text: string;
};

type NotFoundRecord = {
  route: string;
  url: string;
  method: string;
  resourceType: string;
};

const evidenceRoot =
  process.env.FRONTEND_QUALITY_EVIDENCE_DIR ||
  path.resolve(
    process.cwd(),
    "../outputs/sop-frontend-quality/local-default/screenshots"
  );

const reportPath =
  process.env.FRONTEND_QUALITY_REPORT ||
  path.resolve(
    process.cwd(),
    "../outputs/sop-frontend-quality/local-default/network_console_performance_visual.json"
  );

const routes = ["/", "/trading", "/strategies", "/accounts", "/api-keys", "/audit"];

function routeToFileName(route: string): string {
  return route === "/" ? "home" : route.slice(1).replace(/\//g, "_");
}

function shouldIgnoreRequestFailure(request: Request): boolean {
  const url = request.url();
  if (request.resourceType() === "websocket") return true;
  if (url.startsWith("ws:") || url.startsWith("wss:")) return true;

  const failure = request.failure();
  if (failure?.errorText?.includes("net::ERR_ABORTED")) {
    if (url.includes("webpack-hmr")) {
      return true;
    }

    // Next.js RSC prefetch requests are frequently aborted by design.
    if (url.includes("_rsc=")) {
      return true;
    }
  }

  return false;
}

async function getNavigationTiming(page: Page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;

    if (!nav) {
      return null;
    }

    return {
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
      loadMs: Math.round(nav.loadEventEnd),
      responseEndMs: Math.round(nav.responseEnd),
    };
  });
}

test.describe("Frontend Quality Scan", () => {
  test("network console performance and visual regression smoke", async ({ page }) => {
    mkdirSync(evidenceRoot, { recursive: true });
    mkdirSync(path.dirname(reportPath), { recursive: true });

    const routeReports: RouteReport[] = [];
    const consoleErrors: ErrorRecord[] = [];
    const pageErrors: ErrorRecord[] = [];
    const requestFailures: ErrorRecord[] = [];
    const notFoundResponses: NotFoundRecord[] = [];

    for (const route of routes) {
      const routeConsoleErrors: ErrorRecord[] = [];
      const routePageErrors: ErrorRecord[] = [];
      const routeRequestFailures: ErrorRecord[] = [];
      const routeNotFoundResponses: NotFoundRecord[] = [];

      const handleConsole = (message: ConsoleMessage) => {
        if (message.type() === "error") {
          routeConsoleErrors.push({
            route,
            text: message.text(),
          });
        }
      };

      const handlePageError = (error: Error) => {
        routePageErrors.push({
          route,
          text: String(error.message || error),
        });
      };

      const handleRequestFailed = (request: Request) => {
        if (shouldIgnoreRequestFailure(request)) {
          return;
        }

        const failure = request.failure();
        routeRequestFailures.push({
          route,
          text: `${request.method()} ${request.url()} :: ${
            failure?.errorText || "unknown failure"
          }`,
        });
      };

      const handleResponse = (response: Response) => {
        if (response.status() !== 404) return;

        const request = response.request();
        const url = request.url();

        // Ignore websocket noise; 404s for document/assets are actionable.
        if (url.startsWith("ws:") || url.startsWith("wss:")) return;

        routeNotFoundResponses.push({
          route,
          url,
          method: request.method(),
          resourceType: request.resourceType(),
        });
      };

      page.on("console", handleConsole);
      page.on("pageerror", handlePageError);
      page.on("requestfailed", handleRequestFailed);
      page.on("response", handleResponse);

      const started = Date.now();
      const response = await page.goto(route, { waitUntil: "networkidle" });
      const durationMs = Date.now() - started;

      await expect(page.locator("main")).toBeVisible();

      const navigationTiming = await getNavigationTiming(page);
      const screenshotFile = path.join(evidenceRoot, `${routeToFileName(route)}.png`);
      await page.screenshot({
        path: screenshotFile,
        fullPage: true,
      });

      routeReports.push({
        route,
        status: response?.status() ?? null,
        durationMs,
        navigationTiming,
        screenshot: screenshotFile,
        consoleErrorCount: routeConsoleErrors.length,
        pageErrorCount: routePageErrors.length,
        requestFailureCount: routeRequestFailures.length,
        notFoundCount: routeNotFoundResponses.length,
      });

      consoleErrors.push(...routeConsoleErrors);
      pageErrors.push(...routePageErrors);
      requestFailures.push(...routeRequestFailures);

      notFoundResponses.push(...routeNotFoundResponses);

      page.off("console", handleConsole);
      page.off("pageerror", handlePageError);
      page.off("requestfailed", handleRequestFailed);
      page.off("response", handleResponse);
    }

    writeFileSync(
      reportPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          routeReports,
          consoleErrors,
          pageErrors,
          requestFailures,
          notFoundResponses,
          summary: {
            routeCount: routeReports.length,
            consoleErrorCount: consoleErrors.length,
            pageErrorCount: pageErrors.length,
            requestFailureCount: requestFailures.length,
            notFoundCount: notFoundResponses.length,
          },
        },
        null,
        2
      )
    );

    const unavailableRoutes = routeReports.filter(
      (item) => item.status === null || item.status >= 500
    );

    expect(routeReports).toHaveLength(routes.length);
    expect(
      unavailableRoutes,
      `One or more critical routes returned null/5xx. See ${reportPath}`
    ).toHaveLength(0);
  });
});
