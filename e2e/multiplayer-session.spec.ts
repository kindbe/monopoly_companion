import { expect, test } from "@playwright/test";

test("host and two players complete a multiplayer bidding session", async ({ browser }) => {
  const host = await browser.newPage();
  const playerOne = await browser.newPage();
  const playerTwo = await browser.newPage();

  await host.goto("/");
  await expect(host.getByRole("button", { name: /host multiplayer/i })).toBeVisible();
  await expect(host.getByRole("button", { name: /join session/i })).toBeVisible();
  await expect(host.getByRole("button", { name: /ascending/i })).not.toBeVisible();

  await host.getByRole("button", { name: /host multiplayer/i }).click();
  await host.getByLabel(/host name/i).fill("Host");
  await host.getByLabel(/property count/i).fill("1");
  await host.getByRole("button", { name: /create session/i }).click();

  await expect(host.getByRole("heading", { name: /host lobby/i })).toBeVisible();
  const joinCode = (await host.getByTestId("join-code").textContent())?.trim();
  expect(joinCode).toBeTruthy();
  await expect(host.getByText(/Host connected/i)).toBeVisible();

  await joinPlayer(playerOne, joinCode!, "Joelle");
  await joinPlayer(playerTwo, joinCode!, "Isaac");

  await expect(host.getByText(/Joelle connected/i)).toBeVisible();
  await expect(host.getByText(/Isaac connected/i)).toBeVisible();

  await host.getByRole("button", { name: /start multiplayer bidding/i }).click();

  await expect(host.getByRole("heading", { name: /host lobby/i })).not.toBeVisible();
  await expect(host.getByText(/your cash: \$1500 \/ \$1500/i)).toBeVisible();
  await expect(playerOne.getByRole("heading", { name: /player bidding/i })).not.toBeVisible();
  await expect(playerTwo.getByRole("heading", { name: /player bidding/i })).not.toBeVisible();
  await expect(host.getByText(/title deed/i)).toBeVisible();
  await expect(host.getByText(/price: \$/i)).toBeVisible();
  await expect(host.getByText(/mortgage: \$/i)).toBeVisible();
  await expect(host.getByText(/remaining properties: 1/i)).toBeVisible();
  await expect(host.getByText(/^5s$/i)).toBeVisible();

  const openingBid = await visibleDollarAmount(host, /current bid: \$(\d+)/i);
  await host.getByRole("button", { name: /^\+\$10$/i }).click();
  await playerOne.getByRole("button", { name: /^skip$/i }).click();
  await playerTwo.getByRole("button", { name: /^skip$/i }).click();
  await expect(playerTwo.getByRole("button", { name: /^\+\$10$/i })).toBeDisabled();
  await expect(playerTwo.getByRole("button", { name: /skipped this round/i })).toBeDisabled();

  await expect(host.getByText(new RegExp(`your cash: \\$${1500 - openingBid - 10} / \\$1500`, "i"))).toBeVisible();
  await expect(host.getByText(/no properties won/i)).not.toBeVisible();
  await expect(host.getByText(/completed bids:/i)).not.toBeVisible();
  await expect(playerTwo.getByText(/your cash: \$1500 \/ \$1500/i)).toBeVisible();
  await expect(playerTwo.getByText(/Host/i)).not.toBeVisible();
});

test("theme toggle switches between preferred dark mode and light mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /switch to light mode/i }).click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

async function joinPlayer(page: import("@playwright/test").Page, joinCode: string, name: string) {
  await page.goto("/");
  await page.getByRole("button", { name: /join session/i }).click();
  await page.getByLabel(/join code/i).fill(joinCode);
  await page.getByLabel(/player name/i).fill(name);
  await page.getByRole("button", { name: /^join$/i }).click();
}

async function visibleDollarAmount(page: import("@playwright/test").Page, pattern: RegExp) {
  const text = await page.getByText(pattern).first().textContent();
  const match = text?.match(pattern);
  if (!match) {
    throw new Error(`Could not read dollar amount from ${text ?? "empty text"}`);
  }
  return Number(match[1]);
}
