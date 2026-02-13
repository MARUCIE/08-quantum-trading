import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration
 *
 * E2E testing for critical user flows.
 * @see https://playwright.dev/docs/test-configuration
 */

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || "npm run dev";
const playwrightApiKey =
  process.env.PLAYWRIGHT_API_KEY || process.env.NEXT_PUBLIC_API_KEY || "";
const authHeaderValue = playwrightApiKey.startsWith("Bearer ")
  ? playwrightApiKey
  : playwrightApiKey
    ? `Bearer ${playwrightApiKey}`
    : null;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    extraHTTPHeaders: authHeaderValue
      ? {
          Authorization: authHeaderValue,
        }
      : undefined,
    // Force English locale for consistent test results across machines
    locale: "en-US",
    // Set NEXT_LOCALE cookie for next-intl (defaults to zh without this)
    storageState: {
      cookies: [
        {
          name: "NEXT_LOCALE",
          value: "en",
          domain: "localhost",
          path: "/",
          expires: -1,
          httpOnly: false,
          secure: false,
          sameSite: "Lax" as const,
        },
      ],
      origins: [],
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile viewports
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
