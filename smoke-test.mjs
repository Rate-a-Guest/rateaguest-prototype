import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome"
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Good morning, Adam." }).waitFor();
  await page.getByPlaceholder("Try jordan.m@example.com").fill("jordan.m@example.com");
  await page.getByRole("button", { name: "Search guest", exact: true }).click();
  await page.getByRole("heading", { name: "Jordan M." }).waitFor();
  assert.match(await page.locator("body").innerText(), /3 of 4 hosts would host again/);

  await page.getByRole("button", { name: "Review this guest" }).click();
  await page.getByRole("heading", { name: "Rate Jordan M." }).waitFor();
  await page.locator('[data-host-again="false"]').click();
  await page.locator('[data-rating="rules"] [data-star="3"]').click();
  await page.locator('[data-incident="Extra guests"]').click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("heading", { name: "Review and submit" }).waitFor();
  await page.getByPlaceholder("Describe only what happened during this stay.").fill("One unregistered overnight guest; otherwise respectful.");
  await page.locator('[data-draft="confirmed"]').check();
  await page.getByRole("button", { name: "Submit private review" }).click();
  await page.getByText("Private review published").waitFor();
  assert.match(await page.locator("#search-result").innerText(), /3 shown/);

  await page.locator('.sidebar [data-route="alerts"]').click();
  await page.getByRole("heading", { name: "Alerts" }).waitFor();
  await page.getByRole("button", { name: "Review dispute" }).click();
  await page.getByRole("heading", { name: "Guest correction request" }).waitFor();
  await page.getByRole("button", { name: "Save response" }).click();

  await page.screenshot({ path: "artifacts/rateaguest-prototype-desktop.png", fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await mobile.locator('.mobile-nav [data-route="search"]').click();
  await mobile.getByRole("heading", { name: "Search guests" }).waitFor();
  await mobile.locator('[data-demo-search="maya.r@example.com"]').click();
  await mobile.getByRole("heading", { name: "Maya R." }).waitFor();
  await mobile.screenshot({ path: "artifacts/rateaguest-prototype-mobile.png", fullPage: true });

  assert.deepEqual(consoleErrors, []);
  console.log("RateAGuest prototype smoke test passed: desktop review flow, dispute flow, and mobile search flow.");
} finally {
  await browser.close();
}
