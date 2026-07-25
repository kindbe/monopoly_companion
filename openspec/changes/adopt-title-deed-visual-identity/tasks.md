## Implementation

### 1. Correct existing defects

- [ ] Add a failing test asserting no horizontal overflow at 375px wide with at least one owned property.
- [ ] Fix the owned-property grid so its track count follows the number of properties held rather than a fixed `repeat(4, ...)`, and confirm the property card is no longer clipped at 375px and 393px.

### 2. Token layer

- [ ] Rewrite `src/styles.css` into three layers: raw palette, semantic roles, and per-mode overrides keyed on `data-contrast`.
- [ ] Define `standard`, `high-contrast`, and `dark` modes, with card ink tokens scoped to the card rather than inherited from page ink.
- [ ] Add the `high-contrast` group ramp and confirm every group reaches 7:1 against its band text in that mode.
- [ ] Add a `@media (forced-colors: active)` block; ensure the color band is a real bordered element and not a `background-image`.
- [ ] Preserve the existing `prefers-reduced-motion` handling.

### 3. Contrast test

- [ ] Rewrite `src/styles.test.ts` for the new token architecture, replacing the `light`/`dark` assumption with the three modes.
- [ ] Extend it to assert contrast for all ten property group band pairings via `propertyAccent()` and `propertyBandText()`, at 4.5:1 in `standard` and `dark` and 7:1 in `high-contrast`.
- [ ] Confirm the parser handles whatever nesting and color syntax the rewritten stylesheet actually uses.

### 4. Typography

- [ ] Add the self-hosted subset geometric display font with `font-display` set so a network failure degrades predictably.
- [ ] Apply the heading and label scale, all-caps treatment, and tabular numerals for the countdown and money values.

### 5. Three-way contrast control

- [ ] Replace the boolean `Theme` type in `src/common/auctionTypes.ts` with the three-mode union.
- [ ] Update the control in `src/App.tsx` to cycle or select three modes, with an accessible label reflecting the current mode.
- [ ] Migrate persisted `localStorage` values: `light` to `standard`, `dark` to `dark`; fall back to `prefers-contrast` and `prefers-color-scheme` when unset.
- [ ] Add tests for the migration and for the default-selection logic.

### 6. Component restyle

- [ ] Rewrite `src/common/uiClasses.ts` against the new tokens: remove violet borders, emerald actions, per-element colored shadows, and the hover-lift treatment; add the single hard-offset shadow tier and one corner radius.
- [ ] Restyle the deed card, and render the color group as text on the band for streets as well as railroads and utilities.
- [ ] Restyle the owned-property chips, keeping the existing group heading text.
- [ ] Restyle landing, host setup, host lobby, and player join against the new tokens, removing nested panel chrome.
- [ ] Style pass as the quietest control in the bid group.
- [ ] Collapse the duplicated lot and round counters, and render the countdown as seconds.

### 7. Bidding layout

- [ ] Implement the phone layout: pinned header with lot counter and countdown, scrolling deed region with a fade or opaque dock edge, pinned bottom dock with stat line, quick bids, and pass, respecting `env(safe-area-inset-bottom)`.
- [ ] Implement the tablet landscape layout: deed left, right rail split by rules into live state, bid controls as a 2x2 grid with resulting totals, and the owned-property collection.
- [ ] Provide access to owned properties on phones without leaving the bidding view.
- [ ] Choose the width-driven breakpoint between dock and rail, and record the value chosen.

### 8. Verification

- [ ] Add Playwright coverage asserting quick-bid and pass controls are within the viewport without scrolling at 375x667 during a live round.
- [ ] Add Playwright coverage asserting the countdown is visible without scrolling at 375x667 for the whole round, since this change frees it from its fixed position below the property card.
- [ ] Confirm the three amended `multiplayer-bidding` requirements match what was built: countdown always visible, property name the card's dominant scaling text, and owned-property cards carrying the group name as text and no other property detail.
- [ ] Add Playwright coverage asserting no horizontal overflow at 375px on every screen, including with owned properties.
- [ ] Add Playwright coverage for the three-way contrast control.
- [ ] Confirm the five existing `data-testid` hooks and all accessible labels still resolve.
- [ ] Run `pnpm test`, and confirm coverage remains at or above the configured thresholds.
- [ ] Run `pnpm build` for type checking and `pnpm lint`.
- [ ] Run `pnpm test:e2e`.
- [ ] Validate the tablet-portrait-at-744px decision and the dark-mode white card brightness on physical devices; report findings against the open questions in `design.md`.
