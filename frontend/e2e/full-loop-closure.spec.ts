import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceRoot =
  process.env.FULL_LOOP_EVIDENCE_DIR ||
  path.resolve(process.cwd(), "../outputs/sop-full-loop/local-default/screenshots");
const apiBase = process.env.FULL_LOOP_API_BASE || "http://127.0.0.1:3001";

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

async function capture(page: Page, name: string) {
  ensureDir(evidenceRoot);
  await page.screenshot({
    path: path.join(evidenceRoot, `${name}.png`),
    fullPage: true,
  });
}

test.describe("Full Loop Closure", () => {
  test("critical entrypoint routes are reachable", async ({ page }) => {
    const routes = ["/", "/trading", "/strategies", "/accounts", "/api-keys", "/audit"];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      expect(new URL(page.url()).pathname).toBe(route);
      await expect(page.locator("main")).toBeVisible();
      await capture(page, `entrypoint-${route === "/" ? "home" : route.slice(1)}`);
    }
  });

  test("system loop: api create -> persistence echo -> frontend entry", async ({ page, request }) => {
    await page.goto("/accounts");
    await expect(page.locator("#sim-name")).toBeVisible();

    const accountName = `SOP37-FullLoop-${Date.now()}`;
    const createResponse = await request.post(`${apiBase}/api/accounts/simulated`, {
      data: {
        name: accountName,
        initialCapital: 88000,
        setActive: true,
      },
    });

    expect(createResponse.status()).toBe(201);
    const created = (await createResponse.json()) as { id: string; name: string };
    expect(created.name).toBe(accountName);

    const activeResponse = await request.get(`${apiBase}/api/accounts/active`);
    expect(activeResponse.status()).toBe(200);
    const active = (await activeResponse.json()) as { id: string; name: string };
    expect(active.id).toBe(created.id);
    expect(active.name).toBe(accountName);

    const listResponse = await request.get(`${apiBase}/api/accounts`);
    expect(listResponse.status()).toBe(200);
    const listPayload = (await listResponse.json()) as
      | Array<{ id: string }>
      | { accounts?: Array<{ id: string }> };
    const accounts = Array.isArray(listPayload)
      ? listPayload
      : listPayload.accounts || [];
    expect(accounts.some((account) => account.id === created.id)).toBe(true);

    await capture(page, "system-loop-accounts-entry");
  });

  test("error contract loop: invalid json and not found are traceable", async ({ request }) => {
    const invalidJsonResponse = await request.fetch(`${apiBase}/api/accounts/simulated`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: {},
    });

    expect(invalidJsonResponse.status()).toBe(400);
    const invalidJsonPayload = (await invalidJsonResponse.json()) as {
      message: string;
      code: string;
      status: number;
    };
    expect(typeof invalidJsonPayload.message).toBe("string");
    expect(invalidJsonPayload.code).toBe("HTTP_400");
    expect(invalidJsonPayload.status).toBe(400);

    const notFoundResponse = await request.get(`${apiBase}/api/not-found-route`);
    expect(notFoundResponse.status()).toBe(404);
    const notFoundPayload = (await notFoundResponse.json()) as {
      message: string;
      code: string;
      status: number;
    };
    expect(notFoundPayload.message).toBe("Not found");
    expect(notFoundPayload.code).toBe("HTTP_404");
    expect(notFoundPayload.status).toBe(404);
  });
});
