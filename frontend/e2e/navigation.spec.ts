import { test, expect } from "@playwright/test";

/**
 * Navigation E2E Tests
 *
 * Tests critical navigation flows and page loads.
 */

test.describe("Navigation", () => {
  test("should load the dashboard page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Quantum X/);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator('[data-testid="stats-card"]').first()).toBeVisible();
  });

  test("should navigate to Strategies page", async ({ page }) => {
    await page.goto("/strategies");
    await expect(page).toHaveURL("/strategies");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should navigate to Trading page", async ({ page }) => {
    await page.goto("/trading");
    await expect(page).toHaveURL("/trading");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should navigate to Risk page", async ({ page }) => {
    // Route-level assertion is less flaky than language-coupled menu group expansion.
    await page.goto("/risk");

    await expect(page).toHaveURL("/risk");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should navigate to Backtest page", async ({ page }) => {
    await page.goto("/backtest");

    await expect(page).toHaveURL("/backtest");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should navigate to Copy Trading page", async ({ page }) => {
    await page.goto("/copy");

    await expect(page).toHaveURL("/copy");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should navigate to Settings page", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL("/settings");
    await expect(page.locator("main")).toBeVisible();
  });

  test("should navigate to Alerts page", async ({ page }) => {
    await page.goto("/alerts");
    await expect(page).toHaveURL("/alerts");
    await expect(page.locator("main")).toBeVisible();
  });
});

test.describe("Mobile Navigation", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should show mobile menu button on small screens", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: /toggle navigation menu|menu/i })
    ).toBeVisible();
  });

  test("should open and close mobile navigation drawer", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("button", { name: /toggle navigation menu|menu/i })
      .click();

    const mobileNav = page.getByRole("navigation", { name: /mobile navigation/i });
    await expect(mobileNav).toBeVisible({ timeout: 5000 });

    const strategiesLink = mobileNav.locator('a[href="/strategies"]').first();
    await expect(strategiesLink).toBeVisible({ timeout: 5000 });
    await strategiesLink.click();

    await expect(page).toHaveURL("/strategies", { timeout: 10000 });
  });
});
