import { test } from "@playwright/test";

/**
 * Evidence Screenshots for UI/UX Verification
 * Round 2: USER_EXPERIENCE_MAP simulation testing
 */

test.describe("Evidence Screenshots", () => {
  test("capture dashboard with collapsible sidebar", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ".mcp/screenshots/2026-01-28/dashboard-sidebar.png", fullPage: false });
  });

  test("capture expanded sidebar group", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Expand Analysis group
    await page.getByRole("button", { name: /分析/i }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: ".mcp/screenshots/2026-01-28/sidebar-expanded-group.png", fullPage: false });
  });

  test("capture trading page", async ({ page }) => {
    await page.goto("/trading");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await page.screenshot({ path: ".mcp/screenshots/2026-01-28/trading-page.png", fullPage: false });
  });

  test("capture accounts page", async ({ page }) => {
    await page.goto("/accounts");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: ".mcp/screenshots/2026-01-28/accounts-page.png", fullPage: false });
  });

  test("capture mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /menu/i }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: ".mcp/screenshots/2026-01-28/mobile-nav.png", fullPage: false });
  });

  test("capture accounts page with forms", async ({ page }) => {
    await page.goto("/accounts");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await page.screenshot({ path: ".mcp/screenshots/2026-01-28/accounts-full.png", fullPage: true });
  });

  test("capture accounts create simulated form", async ({ page }) => {
    await page.goto("/accounts");
    await page.waitForLoadState("networkidle");
    // Fill simulated account form to show validation
    await page.locator("#sim-name").fill("Test Simulated Account");
    await page.waitForTimeout(300);
    await page.screenshot({ path: ".mcp/screenshots/2026-01-28/accounts-sim-form.png", fullPage: false });
  });

  test("capture accounts link real form", async ({ page }) => {
    await page.goto("/accounts");
    await page.waitForLoadState("networkidle");
    // Fill real account form to show validation
    await page.locator("#real-name").fill("My Binance");
    await page.locator("#real-api-key").fill("test-api-key");
    await page.waitForTimeout(300);
    await page.screenshot({ path: ".mcp/screenshots/2026-01-28/accounts-real-form.png", fullPage: false });
  });
});
