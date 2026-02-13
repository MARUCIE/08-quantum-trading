import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const evidenceRoot =
  process.env.PERSONA_EVIDENCE_DIR ||
  path.resolve(
    process.cwd(),
    "../outputs/sop-persona-real-flow/local-default/screenshots"
  );

async function waitForHydration(page: Page) {
  await page.waitForLoadState("networkidle");
  // Give React time to hydrate controlled inputs before interacting with forms.
  await page.waitForTimeout(1000);
}

function normalizeProjectName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

async function fillStable(
  selector: ReturnType<Page["locator"]>,
  value: string,
  label: string
) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await selector.fill(value);
    try {
      await expect(
        selector,
        `${label} fill did not stick (attempt ${attempt}/3)`
      ).toHaveValue(value, { timeout: 1500 });
      return;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}

async function capture(
  page: Page,
  persona: string,
  step: string,
  projectName: string
) {
  const dir = path.join(evidenceRoot, persona, normalizeProjectName(projectName));
  mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: path.join(dir, `${step}.png`),
    fullPage: true,
  });
}

test.describe.serial("Persona Real Flow", () => {
  test.setTimeout(60000);
  test("persona_quant_researcher_journey", async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    await page.goto("/strategies");
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/strategies$/);
    await expect(page.locator("main")).toBeVisible();
    await capture(
      page,
      "persona_quant_researcher",
      "01-strategies-entry",
      projectName
    );

    await expect(
      page.locator("table tbody tr, [data-slot='card']").first()
    ).toBeVisible();
    await capture(
      page,
      "persona_quant_researcher",
      "02-strategies-task",
      projectName
    );

    await page.goto("/model-backtest");
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/model-backtest$/);
    await expect(page.locator("main")).toBeVisible();
    await capture(
      page,
      "persona_quant_researcher",
      "03-model-backtest-entry",
      projectName
    );

    await page.getByRole("button", { name: /Run Backtest|运行回测/i }).click();
    await expect(
      page.getByText(/Avg Test Accuracy|平均测试准确率/i).first()
    ).toBeVisible({ timeout: 10000 });
    await capture(
      page,
      "persona_quant_researcher",
      "04-model-backtest-result",
      projectName
    );
  });

  test("persona_execution_trader_journey", async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    const accountName = `Persona Sim ${Date.now()}`;

    await page.goto("/accounts");
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(page.locator("#sim-name")).toBeVisible();
    await capture(page, "persona_execution_trader", "01-accounts-entry", projectName);

    const createSimulatedButton = page.getByRole("button", {
      name: /Create simulated account|创建模拟账户/i,
    });

    const createAccountResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/accounts/simulated") &&
        response.request().method() === "POST"
    );

    await fillStable(page.locator("#sim-name"), accountName, "sim-name");
    await fillStable(page.locator("#sim-capital"), "50000", "sim-capital");
    await expect(createSimulatedButton).toBeEnabled({ timeout: 15000 });
    await createSimulatedButton.click();

    const createAccountResponse = await createAccountResponsePromise;
    const createAccountPayload = (await createAccountResponse.json()) as Record<
      string,
      unknown
    >;
    expect(
      createAccountResponse.status(),
      `Expected simulated account creation status 201, got ${createAccountResponse.status()} with payload ${JSON.stringify(
        createAccountPayload
      )}`
    ).toBe(201);
    expect(createAccountPayload.name).toBe(accountName);
    expect(typeof createAccountPayload.id).toBe("string");

    await capture(page, "persona_execution_trader", "02-account-created", projectName);

    await page.goto("/trading");
    await waitForHydration(page);
    await expect(page).toHaveURL("/trading");
    await expect(page.locator("main")).toBeVisible();
    await capture(page, "persona_execution_trader", "03-trading-entry", projectName);

    await page.goto("/risk");
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/risk$/);
    await expect(page.locator("main")).toBeVisible();
    await capture(page, "persona_execution_trader", "04-risk-result", projectName);
  });

  test("persona_ops_compliance_journey", async ({ page }, testInfo) => {
    const projectName = testInfo.project.name;
    const keyName = `OpsKey-${Date.now()}`;

    await page.goto("/api-keys");
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/api-keys$/);
    await expect(page.locator("main")).toBeVisible();
    await expect(
      page
        .locator("main")
        .getByRole("button", {
          name: /Create Key|创建密钥|创建 API 密钥|新建密钥/i,
        })
        .first()
    ).toBeVisible();
    await capture(page, "persona_ops_compliance", "01-api-keys-entry", projectName);

    const createKeyResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/keys") &&
        response.request().method() === "POST"
    );

    await page
      .locator("main")
      .getByRole("button", {
        name: /Create Key|Create API Key|创建密钥|创建 API 密钥/i,
      })
      .first()
      .click();

    await expect(page.locator("#keyName")).toBeVisible({ timeout: 15000 });
    await fillStable(page.locator("#keyName"), keyName, "keyName");

    const createKeyButton = page.getByRole("button", {
      name: /Create API Key|创建 API 密钥/i,
    });
    await expect(createKeyButton).toBeEnabled({ timeout: 15000 });
    await createKeyButton.click();

    const createKeyResponse = await createKeyResponsePromise;
    const createKeyPayload = (await createKeyResponse.json()) as Record<
      string,
      unknown
    >;
    expect(
      createKeyResponse.status(),
      `Expected API key creation status 201, got ${createKeyResponse.status()} with payload ${JSON.stringify(
        createKeyPayload
      )}`
    ).toBe(201);
    expect(createKeyPayload.name).toBe(keyName);
    expect(typeof createKeyPayload.keyPrefix).toBe("string");

    const closeCreatedBanner = page.getByRole("button", {
      name: /I've copied the key|我已复制密钥/i,
    });
    await expect(closeCreatedBanner).toBeVisible({ timeout: 15000 });
    await capture(page, "persona_ops_compliance", "02-api-key-created", projectName);
    if (await closeCreatedBanner.isVisible()) {
      await closeCreatedBanner.click();
    }

    await page.goto("/audit");
    await waitForHydration(page);
    await expect(page).toHaveURL(/\/audit$/);
    await expect(page.locator("main")).toBeVisible();
    await capture(page, "persona_ops_compliance", "03-audit-entry", projectName);
  });
});
