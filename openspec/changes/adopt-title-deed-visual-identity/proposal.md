## Why

The current UI reads as a generic modern web app rather than a companion prop for a board game. Violet chrome competes with emerald actions and rose urgency, every element is a bordered and shadowed panel nested inside another panel, and the property color band — the only authentic Monopoly identity in the app — is buried under three layers of container.

Two measured defects make this more than a taste question. On an iPhone SE (375x667) during a live round, the quick-bid buttons render 164px below the fold and the skip button 276px below it, so every player must scroll roughly 320px each round while a countdown as short as 5 seconds runs. Separately, the owned-property grid uses `repeat(4, minmax(92px, 1fr))`, which reserves 392px of min-content regardless of how many properties are held; a single won property therefore forces 69px of page-wide horizontal overflow at 375px and clips the property card itself.

All players are on phones and tablets, and after setup the host bids exactly like everyone else, so the bidding screen is the app's primary surface on a touch device with a hard time limit.

## What Changes

- Replace the violet/emerald palette with a board-cream ground, white card stock, and hairline black rules; the property color group becomes the only chroma in the interface.
- Reduce shadow use to a single hard-offset shadow on the deed card, and remove nested panel chrome so one card is on screen at a time.
- Adopt a geometric display typeface with all-caps headings to carry the title-deed identity.
- Replace the light/dark toggle with a three-way contrast control: `standard`, `high-contrast`, and `dark`.
- Restructure the bidding screen per device class: phones pin the countdown to a header and bid controls to a bottom dock; tablets in landscape use a right rail carrying live state, bid controls, and the owned-property collection.
- Always render the property color group as text, in every mode, so group identity never depends on hue alone.
- Fix the owned-property grid overflow so the grid tracks the number of properties held.
- Rewrite the stylesheet token layer into raw palette, semantic roles, and per-mode overrides, and extend the automated contrast test to cover three modes and all ten property group band pairings.

## Capabilities

### New Capabilities

### Modified Capabilities

- `visual-design-polish`: Replaces the violet/emerald palette requirement with the title-deed identity, permits the intentional hard-offset shadow treatment, extends contrast verification to three modes and property band pairings, adds non-color group identification, and adds device-appropriate bidding layout requirements.
- `ui-automation`: Browser automation should cover the pinned bid controls, the absence of horizontal overflow at small viewports, and the three-way contrast control.

## Impact

- Affected code: `src/styles.css`, `src/common/uiClasses.ts`, `src/common/auctionTypes.ts`, all six screen components, `src/App.tsx` theme state and persistence, `src/styles.test.ts`, and Playwright tests.
- One new runtime dependency: a self-hosted geometric display webfont. AGENTS.md requires clear value for new dependencies; the rationale and the self-hosting decision are recorded in `design.md`.
- Two existing requirements in `visual-design-polish` are directly contradicted by this change and are amended rather than silently overridden. See "Spec conflicts" in `design.md`.
- The five existing `data-testid` hooks and all accessible labels are preserved, so the current Playwright suite should continue to pass unmodified except where it asserts on layout that intentionally changes.
