import { test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

/**
 * Evidence Screenshots for UI/UX Verification
 * Round 2: USER_EXPERIENCE_MAP simulation testing
 *
 * Notes:
 * - Store evidence under project docs (tracked), not `.mcp/`.
 * - Capture once on chromium to avoid races across projects overwriting the same files.
 */

const evidenceDir =
  process.env.EVIDENCE_SCREENSHOTS_DIR ||
  path.resolve(
    process.cwd(),
    "../doc/00_project/initiative_quantum_x/evidence/2026-01-28"
  );

function ensureEvidenceDir() {
  mkdirSync(evidenceDir, { recursive: true });
}

async function capture(
  page: Page,
  filename: string,
  options: { fullPage?: boolean } = {}
) {
  ensureEvidenceDir();
  await page.screenshot({
    path: path.join(evidenceDir, filename),
    fullPage: options.fullPage ?? false,
  });
}

test.describe("Evidence Screenshots", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium", "capture once on chromium");
  });

  test("capture dashboard with collapsible sidebar", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await capture(page, "dashboard-sidebar.png");
  });

  test("capture expanded sidebar group", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Locale-agnostic: try to expand the Analysis group if present.
    const analysisToggle = page.getByRole("button", { name: /analysis|\u5206\u6790/i });
    if (await analysisToggle.count()) {
      await analysisToggle.first().click();
      await page.waitForTimeout(300);
    }

    await capture(page, "sidebar-expanded-group.png");
  });

  test("capture trading page", async ({ page }) => {
    await page.goto("/trading");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await capture(page, "trading-page.png");
  });

  test("capture accounts page", async ({ page }) => {
    await page.goto("/accounts");
    await page.waitForLoadState("networkidle");
    await capture(page, "accounts-page.png");
  });

  test("capture mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const menuButton = page.getByRole("button", {
      name: /toggle navigation menu|menu/i,
    });
    if (await menuButton.count()) {
      await menuButton.first().click();
      await page.waitForTimeout(300);
    }

    await capture(page, "mobile-nav.png");
  });

  test("capture accounts page with forms", async ({ page }) => {
    await page.goto("/accounts");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await capture(page, "accounts-full.png", { fullPage: true });
  });

  test("capture accounts create simulated form", async ({ page }) => {
    await page.goto("/accounts");
    await page.waitForLoadState("networkidle");

    const simName = page.locator("#sim-name");
    if (await simName.count()) {
      await simName.fill("Test Simulated Account");
      await page.waitForTimeout(300);
    }

    await capture(page, "accounts-sim-form.png");
  });

  test("capture accounts link real form", async ({ page }) => {
    await page.goto("/accounts");
    await page.waitForLoadState("networkidle");

    const realName = page.locator("#real-name");
    if (await realName.count()) {
      await realName.fill("My Binance");
    }

    const realApiKey = page.locator("#real-api-key");
    if (await realApiKey.count()) {
      await realApiKey.fill("test-api-key");
    }

    await page.waitForTimeout(300);
    await capture(page, "accounts-real-form.png");
  });
});
