import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome"
});

try {
  const baseUrl = process.env.BASE_URL || "http://127.0.0.1:4173";
  const sampleProfile = "https://www.airbnb.com/users/profile/900000000000010001";
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  page.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Check an Airbnb guest" }).waitFor();
  await page.screenshot({ path: "artifacts/rateaguest-prototype-home.png", fullPage: true });
  await page.getByRole("button", { name: "Use fictional sample link" }).click();
  await page.getByText("Exact Airbnb account match").waitFor();
  await page.getByRole("heading", { name: "Jordan M." }).waitFor();
  assert.match(await page.locator("body").innerText(), /3 of 4\s+hosts would host again/);

  await page.getByLabel("Airbnb guest profile link or ID").fill("not a profile");
  await page.getByRole("button", { name: "Check guest", exact: true }).click();
  await page.getByRole("heading", { name: "That doesn’t look like an Airbnb profile link" }).waitFor();

  await page.getByLabel("Airbnb guest profile link or ID").fill("900000000000019999");
  await page.getByRole("button", { name: "Check guest", exact: true }).click();
  await page.getByRole("heading", { name: "No host reports yet" }).waitFor();

  await page.getByLabel("Airbnb guest profile link or ID").fill(sampleProfile);
  await page.getByRole("button", { name: "Check guest", exact: true }).click();
  await page.getByRole("heading", { name: "Jordan M." }).waitFor();

  await page.getByRole("button", { name: "Add a stay review" }).click();
  await page.getByRole("heading", { name: "Match account & stay" }).waitFor();
  await page.getByPlaceholder("Example: HM12AB34CD").fill("HM12AB34CD");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Rate Jordan M." }).waitFor();
  await page.locator('[data-host-again="false"]').click();
  await page.locator('[data-rating="rules"] [data-star="3"]').click();
  await page.locator('[data-incident="Damage"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Review and submit" }).waitFor();
  await page.getByPlaceholder("Describe only what happened during this stay.").fill("A damaged lamp was documented after checkout.");
  await page.locator('[data-draft="confirmed"]').check();
  await page.getByRole("button", { name: "Submit private review" }).click();
  await page.getByText("Add supporting evidence for this high-severity report.").waitFor();
  await page.getByRole("button", { name: /Add photos or documents/ }).click();
  await page.getByRole("button", { name: "Submit private review" }).click();
  await page.getByText("Private review published").waitFor();
  assert.match(await page.locator("#search-result").innerText(), /3 shown/);
  await page.locator(".toast").last().waitFor({ state: "detached" });
  await page.screenshot({ path: "artifacts/rateaguest-prototype-desktop.png", fullPage: true });

  await page.locator('.sidebar [data-route="alerts"]').click();
  await page.getByRole("heading", { name: "Alerts" }).waitFor();
  await page.getByRole("button", { name: "Review dispute" }).click();
  await page.getByRole("heading", { name: "Guest correction request" }).waitFor();
  await page.getByRole("button", { name: "Save response" }).click();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on("console", message => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await mobile.goto(baseUrl, { waitUntil: "networkidle" });
  await mobile.locator('.mobile-nav [data-route="search"]').click();
  await mobile.getByRole("heading", { name: "Guest history" }).waitFor();
  await mobile.getByRole("button", { name: "Use fictional sample link" }).click();
  await mobile.getByRole("heading", { name: "Jordan M." }).waitFor();
  await mobile.screenshot({ path: "artifacts/rateaguest-prototype-mobile.png", fullPage: true });

  assert.deepEqual(consoleErrors, []);
  console.log("RateAGuest prototype smoke test passed: exact-ID lookup, invalid/no-match states, high-severity review, dispute, and mobile flow.");
} finally {
  await browser.close();
}
