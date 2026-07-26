## Implementation

### 1. Correct existing defects

- [x] Add a failing test asserting no horizontal overflow at 375px wide with at least one owned property.
- [x] Fix the owned-property grid so its track count follows the number of properties held rather than a fixed `repeat(4, ...)`, and confirm the property card is no longer clipped at 375px and 393px.

### 2. Token layer

- [x] Rewrite `src/styles.css` into three layers: raw palette, semantic roles, and per-mode overrides keyed on `data-contrast`.
- [x] Define `standard`, `high-contrast`, and `dark` modes, with card ink tokens scoped to the card rather than inherited from page ink.
- [x] Add the `high-contrast` group ramp and confirm every group reaches 7:1 against its band text in that mode.
- [x] Add a `@media (forced-colors: active)` block; ensure the color band is a real bordered element and not a `background-image`.
- [x] Preserve the existing `prefers-reduced-motion` handling.

### 3. Contrast test

- [x] Rewrite `src/styles.test.ts` for the new token architecture, replacing the `light`/`dark` assumption with the three modes.
- [x] Extend it to assert contrast for all ten property group band pairings via `propertyAccent()` and `propertyBandText()`, at 4.5:1 in `standard` and `dark` and 7:1 in `high-contrast`.
- [x] Confirm the parser handles whatever nesting and color syntax the rewritten stylesheet actually uses.

### 4. Typography

- [x] Add the self-hosted subset geometric display font with `font-display` set so a network failure degrades predictably.
- [x] Apply the heading and label scale, all-caps treatment, and tabular numerals for the countdown and money values.

### 5. Three-way contrast control

- [x] Replace the boolean `Theme` type in `src/common/auctionTypes.ts` with the three-mode union.
- [x] Update the control in `src/App.tsx` to cycle or select three modes, with an accessible label reflecting the current mode.
- [x] Migrate persisted `localStorage` values: `light` to `standard`, `dark` to `dark`; fall back to `prefers-contrast` and `prefers-color-scheme` when unset.
- [x] Add tests for the migration and for the default-selection logic.

### 6. Component restyle

- [x] Rewrite `src/common/uiClasses.ts` against the new tokens: remove violet borders, emerald actions, per-element colored shadows, and the hover-lift treatment; add the single hard-offset shadow tier and one corner radius.
- [x] Restyle the deed card, and render the color group as text on the band for streets as well as railroads and utilities.
- [x] Restyle the owned-property chips, keeping the existing group heading text.
- [x] Restyle landing, host setup, host lobby, and player join against the new tokens, removing nested panel chrome.
- [x] Style pass as the quietest control in the bid group.
- [x] Collapse the duplicated lot and round counters, and render the countdown as seconds.

### 7. Bidding layout

- [x] Implement the phone layout: pinned header with lot counter and countdown, scrolling deed region with a fade or opaque dock edge, pinned bottom dock with stat line, quick bids, and pass, respecting `env(safe-area-inset-bottom)`.
- [x] Implement the tablet landscape layout: deed left, right rail split by rules into live state, bid controls as a 2x2 grid with resulting totals, and the owned-property collection.
- [x] Provide access to owned properties on phones without leaving the bidding view.
- [x] Choose the width-driven breakpoint between dock and rail, and record the value chosen.
      **Decision: 1024px** (Tailwind `lg`). At or above 1024px the right rail
      appears and nothing is pinned; below it the header and dock pin and the
      deed region scrolls between them. Tablet portrait (~744px) therefore
      resolves to the dock, per `design.md`: a rail needs width that portrait
      lacks, while portrait has the vertical room a dock wants. The value is
      recorded in `biddingLayoutClass` in `src/common/uiClasses.ts`.

### 8. Verification

- [x] Add Playwright coverage asserting quick-bid and pass controls are within the viewport without scrolling at 375x667 during a live round.
- [x] Add Playwright coverage asserting the countdown is visible without scrolling at 375x667 for the whole round, since this change frees it from its fixed position below the property card.
- [x] Confirm the three amended `multiplayer-bidding` requirements match what was built: countdown always visible, property name the card's dominant scaling text, and owned-property cards carrying the group name as text and no other property detail.
- [x] Add Playwright coverage asserting no horizontal overflow at 375px on every screen, including with owned properties.
- [x] Add Playwright coverage for the three-way contrast control.
- [x] Confirm the five existing `data-testid` hooks and all accessible labels still resolve.
- [x] Run `pnpm test`, and confirm coverage remains at or above the configured thresholds.
- [x] Run `pnpm build` for type checking and `pnpm lint`.
- [x] Run `pnpm test:e2e`.
- [x] Validate the tablet-portrait-at-744px decision and the dark-mode white card brightness on physical devices; report findings against the open questions in `design.md`. **Done.** An adversarial review rendered 744x1133 and found the dock layout genuinely poor: the deed stranded at phone width (420px) in a 712px column, `Skip` stretched to a 712px hairline strip, and ~550px of dead ground. Fixed by growing the deed at `sm:` (500px at 744), capping dock controls at 560px, and centring the scroll region with `align-content: safe center` — which falls back to start alignment when content overflows, so 375px still scrolls from the top of the card. Re-measured at 744: deed 500px wide and vertically centred, controls 560px, zero overflow. The dock-vs-rail decision therefore stands. Dark-mode white-card brightness was reviewed and accepted, so the card stock stays `#ffffff` in every mode and the `#F2EFE6` fallback is not needed. Both open questions in `design.md` are now resolved.
