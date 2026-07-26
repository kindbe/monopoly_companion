import { expect, test, type Locator } from "@playwright/test"

test("host and two players complete a multiplayer bidding session", async ({
  browser
}) => {
  const host = await browser.newPage()
  const playerOne = await browser.newPage()
  const playerTwo = await browser.newPage()

  await host.goto("/")
  await expect(
    host.getByRole("button", { name: /host multiplayer/i })
  ).toBeVisible()
  await expect(
    host.getByRole("button", { name: /join session/i })
  ).toBeVisible()
  await expect(
    host.getByRole("button", { name: /ascending/i })
  ).not.toBeVisible()

  await host.getByRole("button", { name: /host multiplayer/i }).click()
  await host.getByLabel(/host name/i).fill("Host")
  await host.getByLabel(/property count/i).fill("1")
  await host.getByLabel(/max bids per property/i).fill("1")
  await host.getByRole("button", { name: /create session/i }).click()

  await expect(host.getByRole("heading", { name: /host lobby/i })).toBeVisible()
  const joinCode = (await host.getByTestId("join-code").textContent())?.trim()
  expect(joinCode).toBeTruthy()
  await expect(host.getByText(/Host connected/i)).toBeVisible()

  await joinPlayer(playerOne, joinCode!, "Joelle")
  await joinPlayer(playerTwo, joinCode!, "Isaac")

  await expect(host.getByText(/Joelle connected/i)).toBeVisible()
  await expect(host.getByText(/Isaac connected/i)).toBeVisible()

  await host.getByRole("button", { name: /start multiplayer bidding/i }).click()

  await expect(
    host.getByRole("heading", { name: /host lobby/i })
  ).not.toBeVisible()
  await expect(host.getByTestId("join-code")).toHaveCount(0)
  await expect(host.getByText(/your cash: \$1500 \/ \$1500/i)).toBeVisible()
  await expect(
    playerOne.getByRole("heading", { name: /player bidding/i })
  ).not.toBeVisible()
  await expect(
    playerTwo.getByRole("heading", { name: /player bidding/i })
  ).not.toBeVisible()
  await expect(host.getByText(/title deed/i)).toBeVisible()
  await expect(host.getByText(/price: \$/i)).toBeVisible()
  await expect(host.getByText(/mortgage: \$/i)).toBeVisible()
  await expect(host.getByText(/remaining properties: 1/i)).toBeVisible()
  await expect(host.getByText(/^5s$/i)).toBeVisible()
  await expect(host.getByText(/bids remaining: 1/i)).toBeVisible()
  await expect(playerOne.getByText(/bids remaining: 1/i)).toBeVisible()

  const openingBid = await visibleDollarAmount(host, /current bid: \$(\d+)/i)
  await host.getByRole("button", { name: /^\+\$10$/i }).click()
  await expect(
    host.getByText(
      new RegExp(`current bid: \\$${openingBid + 10} by Host`, "i")
    )
  ).toBeVisible()
  await expect(host.getByText(/bids remaining: 0/i)).toBeVisible()
  await expect(host.getByRole("button", { name: /^\+\$10$/i })).toBeDisabled()
  await expect(
    playerOne.getByText(
      new RegExp(`current bid: \\$${openingBid + 10} by Host`, "i")
    )
  ).toBeVisible()

  await playerOne.getByRole("button", { name: /^\+\$10$/i }).click()
  await expect(
    playerOne.getByText(
      new RegExp(`current bid: \\$${openingBid + 20} by Joelle`, "i")
    )
  ).toBeVisible()
  await expect(playerOne.getByText(/bids remaining: 0/i)).toBeVisible()
  await expect(
    playerOne.getByRole("button", { name: /^\+\$10$/i })
  ).toBeDisabled()
  await expect(
    playerTwo.getByText(
      new RegExp(`current bid: \\$${openingBid + 20} by Joelle`, "i")
    )
  ).toBeVisible()

  await playerTwo.getByRole("button", { name: /^skip$/i }).click()
  await expect(
    playerTwo.getByRole("button", { name: /^\+\$10$/i })
  ).toBeDisabled()
  await expect(
    playerTwo.getByRole("button", { name: /skipped this round/i })
  ).toBeDisabled()

  await expect(host.getByText(/your cash: \$1500 \/ \$1500/i)).toBeVisible()
  await expect(
    playerOne.getByText(
      new RegExp(`your cash: \\$${1500 - openingBid - 20} / \\$1500`, "i")
    )
  ).toBeVisible()
  await expect(playerOne.getByText(/no properties won/i)).not.toBeVisible()
  await expect(host.getByText(/completed bids:/i)).not.toBeVisible()
  await expect(
    playerTwo.getByText(/your cash: \$1500 \/ \$1500/i)
  ).toBeVisible()

  // Gate on completion before asserting completion behavior. Without this the
  // assertions below run mid-round, where they pass for the wrong reasons: the
  // bid buttons are still disabled by the exhausted per-round bid count rather
  // than by the completed session.
  await expect(host.getByText(/remaining properties: 0/i)).toBeVisible()

  await expect(
    host.getByRole("heading", { name: /host lobby/i })
  ).not.toBeVisible()
  await expect(host.getByTestId("join-code")).toHaveCount(0)
  await expect(
    host.getByRole("heading", { name: /your properties/i })
  ).toBeVisible()
  await expect(host.getByText(/no properties won/i)).toBeVisible()
  // Load-bearing only after the completion gate above: revealNextRound resets
  // the per-round bid count at completion, so these re-enable without the fix.
  await expect(host.getByRole("button", { name: /^\+\$10$/i })).toBeDisabled()
  await expect(host.getByRole("button", { name: /^skip$/i })).toBeDisabled()
})

test("a phone-sized session keeps controls and layout inside a 375x667 viewport", async ({
  browser
}) => {
  // A 5s bidding round plus a skipped round run inside this test.
  test.setTimeout(90_000)
  const host = await browser.newPage({ viewport: { width: 375, height: 667 } })
  const player = await browser.newPage({
    viewport: { width: 375, height: 667 }
  })

  await host.goto("/")
  await expect(host.getByTestId("active-screen")).toBeVisible()
  expect(
    await host.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    ),
    "landing screen horizontal overflow"
  ).toBeLessThanOrEqual(0)

  await host.getByRole("button", { name: /host multiplayer/i }).click()
  await host.getByLabel(/host name/i).fill("Host")
  await host.getByLabel(/property count/i).fill("4")
  await host.getByLabel(/max bids per property/i).fill("1")
  expect(
    await host.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    ),
    "host setup screen horizontal overflow"
  ).toBeLessThanOrEqual(0)
  await host.getByRole("button", { name: /create session/i }).click()

  await expect(host.getByRole("heading", { name: /host lobby/i })).toBeVisible()
  const joinCode = (await host.getByTestId("join-code").textContent())?.trim()
  expect(joinCode).toBeTruthy()
  expect(
    await host.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    ),
    "host lobby screen horizontal overflow"
  ).toBeLessThanOrEqual(0)

  await player.goto("/")
  await player.getByRole("button", { name: /join session/i }).click()
  await player.getByLabel(/join code/i).fill(joinCode!)
  await player.getByLabel(/player name/i).fill("Joelle")
  expect(
    await player.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    ),
    "player join screen horizontal overflow"
  ).toBeLessThanOrEqual(0)
  await player.getByRole("button", { name: /^join$/i }).click()

  await expect(host.getByText(/Joelle connected/i)).toBeVisible()
  await host.getByRole("button", { name: /start multiplayer bidding/i }).click()

  // --- Round one: no owned properties yet. ---
  await expect(player.getByText(/remaining properties: 4/i)).toBeVisible()
  const deed = player.getByRole("article", { name: /^Title deed, / })
  await expect(deed).toBeVisible()
  const firstDeedLabel = await deed.getAttribute("aria-label")
  const firstDeed = firstDeedLabel?.match(/^Title deed, (.+), (.+) group$/)
  if (!firstDeed) {
    throw new Error(`Unreadable deed label ${firstDeedLabel ?? "(missing)"}`)
  }
  const [, firstPropertyName, firstGroupLabel] = firstDeed

  expect(
    await player.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    ),
    "bidding screen horizontal overflow, no owned properties"
  ).toBeLessThanOrEqual(0)

  const countdown = player.getByText(/^\d+s$/)
  await expectWithinViewport(countdown, "countdown")

  const quickBids = player.getByTestId("player-quick-bids")
  await expectWithinViewport(quickBids, "quick bids")

  const pass = player.getByRole("button", { name: /^skip$/i })
  await expectWithinViewport(pass, "pass")

  await player.getByRole("button", { name: /^\+\$10$/i }).click()

  // The deed region scrolls; the countdown and the dock do not move with it.
  await player.mouse.move(187, 380)
  await player.mouse.wheel(0, 800)
  await expectWithinViewport(countdown, "countdown after scrolling")
  await expectWithinViewport(quickBids, "quick bids after scrolling")
  await expectWithinViewport(pass, "pass after scrolling")

  // Late in the same round the countdown is still in view without scrolling:
  // it is visible for the whole round, not only when the property reveals.
  await expect(player.getByText(/^[12]s$/)).toBeVisible()
  await expectWithinViewport(countdown, "countdown late in round")

  // --- Round two onwards: exactly one owned property, which is where the old
  // fixed four-track grid forced 69px of page-wide overflow. Nobody bids
  // again, so the holding stays at one however the later rounds resolve. ---
  await expect(player.getByText(/your properties · 1/i)).toBeVisible()

  // Skipped first, and immediately, so the two clicks land inside the same
  // round: every participant skipping resolves it and raises the overlay over
  // the next property.
  await host.getByRole("button", { name: /^skip$/i }).click()
  await player.getByRole("button", { name: /^skip$/i }).click()
  await expect(player.getByTestId("skipped-overlay")).toBeVisible()

  const ownedCard = player.getByTestId("mini-property-card")
  await expect(ownedCard).toHaveCount(1)
  await expect(ownedCard).toHaveAttribute(
    "aria-label",
    `View ${firstPropertyName}`
  )
  await expect(
    player.getByRole("heading", {
      name: new RegExp(`${firstGroupLabel} color group`, "i")
    })
  ).toBeVisible()
  // The group name as text, the property name, and no other property detail.
  expect(
    (await ownedCard.innerText()).replace(/\s+/g, " ").trim().toLowerCase()
  ).toBe(`${firstGroupLabel} ${firstPropertyName}`.toLowerCase())

  expect(
    await player.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    ),
    "bidding screen horizontal overflow, one owned property"
  ).toBeLessThanOrEqual(0)

  await expectWithinViewport(countdown, "countdown with an owned property")
  await expectWithinViewport(quickBids, "quick bids with an owned property")
  await expectWithinViewport(pass, "pass with an owned property")

  // --- The deed title is the card's dominant text: largest on the card, it
  // wraps rather than truncating, and it grows with the available width. ---
  const titleFontSize = await deed
    .locator("h2")
    .evaluate((title) => Number.parseFloat(getComputedStyle(title).fontSize))
  const largestOtherFontSize = await deed.evaluate((card) =>
    Math.max(
      ...[...card.querySelectorAll("*")]
        .filter(
          (element) =>
            element.tagName !== "H2" && (element.textContent ?? "").trim()
        )
        .map((element) => Number.parseFloat(getComputedStyle(element).fontSize))
    )
  )
  expect(titleFontSize).toBeGreaterThan(largestOtherFontSize)
  const titleFlow = await deed.locator("h2").evaluate((title) => ({
    textOverflow: getComputedStyle(title).textOverflow,
    whiteSpace: getComputedStyle(title).whiteSpace,
    scrollWidth: title.scrollWidth,
    clientWidth: title.clientWidth
  }))
  expect(titleFlow.textOverflow, "property name truncation").toBe("clip")
  expect(titleFlow.whiteSpace, "property name wrapping").toBe("normal")
  expect(titleFlow.scrollWidth).toBeLessThanOrEqual(titleFlow.clientWidth + 1)

  await player.setViewportSize({ width: 1280, height: 800 })
  const wideTitleFontSize = await deed
    .locator("h2")
    .evaluate((title) => Number.parseFloat(getComputedStyle(title).fontSize))
  expect(wideTitleFontSize).toBeGreaterThan(titleFontSize)
})

test("contrast control cycles standard, high contrast and dark modes", async ({
  page
}) => {
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/")

  await expect(page.locator("html")).toHaveAttribute("data-contrast", "dark")
  await expect(
    page.getByRole("button", {
      name: /contrast: dark\. switch to standard mode/i
    })
  ).toBeVisible()
  const darkGround = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor
  )

  await page.getByRole("button", { name: /switch to standard mode/i }).click()
  await expect(page.locator("html")).toHaveAttribute(
    "data-contrast",
    "standard"
  )
  await expect(
    page.getByRole("button", {
      name: /contrast: standard\. switch to high contrast mode/i
    })
  ).toBeVisible()
  const standardGround = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor
  )

  await page
    .getByRole("button", { name: /switch to high contrast mode/i })
    .click()
  await expect(page.locator("html")).toHaveAttribute(
    "data-contrast",
    "high-contrast"
  )
  await expect(
    page.getByRole("button", {
      name: /contrast: high contrast\. switch to dark mode/i
    })
  ).toBeVisible()
  const highContrastGround = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor
  )

  // Each mode paints a distinct ground, so the attribute is not the only proof.
  expect(new Set([darkGround, standardGround, highContrastGround]).size).toBe(3)

  await page.getByRole("button", { name: /switch to dark mode/i }).click()
  await expect(page.locator("html")).toHaveAttribute("data-contrast", "dark")
})

async function joinPlayer(
  page: import("@playwright/test").Page,
  joinCode: string,
  name: string
) {
  await page.goto("/")
  await page.getByRole("button", { name: /join session/i }).click()
  await page.getByLabel(/join code/i).fill(joinCode)
  await page.getByLabel(/player name/i).fill(name)
  await page.getByRole("button", { name: /^join$/i }).click()
}

async function visibleDollarAmount(
  page: import("@playwright/test").Page,
  pattern: RegExp
) {
  const text = await page.getByText(pattern).first().textContent()
  const match = text?.match(pattern)
  if (!match) {
    throw new Error(`Could not read dollar amount from ${text ?? "empty text"}`)
  }
  return Number(match[1])
}

/**
 * Assert an element sits inside the 375x667 viewport. `boundingBox()` returns
 * null for an element that is not rendered, so the null check is the point: a
 * bounds-only assertion passes vacuously when the control is missing entirely.
 */
async function expectWithinViewport(locator: Locator, label: string) {
  const box = await locator.boundingBox()
  expect(box, `${label} is rendered`).not.toBeNull()
  expect(box!.y, `${label} top edge`).toBeGreaterThanOrEqual(0)
  expect(box!.y + box!.height, `${label} bottom edge`).toBeLessThanOrEqual(667)
}
