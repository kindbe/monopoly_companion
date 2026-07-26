## 1. Property Data And Bidding Rules

- [x] 1.1 Expand the property model with retail value and category-specific card stats
- [x] 1.2 Populate street, railroad, and utility stats for the Monopoly property catalog
- [x] 1.3 Add starting-bid calculation at 25% of retail value rounded up to the nearest $10
- [x] 1.4 Add tests for representative property stats and starting-bid calculation

## 2. Local Bidding UI

- [x] 2.1 Build a reusable Monopoly-inspired property card component
- [x] 2.2 Replace the current bidding property display with the property card
- [x] 2.3 Replace single-step bid buttons with quick increment buttons for +$10, +$20, +$50, and +$100
- [x] 2.4 Start local bidding rounds at the property-specific opening bid
- [x] 2.5 Add or update component tests for card display, opening bid, quick increments, and affordability validation

## 3. Multiplayer Bidding UI

- [x] 3.1 Include opening bid and property card data in host/player multiplayer session state
- [x] 3.2 Start multiplayer bidding rounds at the property-specific opening bid
- [x] 3.3 Add quick increment bid commands and server validation for multiplayer bidding
- [x] 3.4 Update multiplayer player and host views to show the property card and quick increment controls
- [x] 3.5 Add or update server and transport tests for multiplayer opening bids and quick increments

## 4. Theme Polish

- [x] 4.1 Add theme state that defaults from prefers-color-scheme
- [x] 4.2 Add an in-app light/dark theme toggle
- [x] 4.3 Refactor CSS colors to theme custom properties
- [x] 4.4 Verify property card colors remain readable in dark mode
- [x] 4.5 Add or update tests for theme defaulting and toggle behavior

## 5. Automation And Verification

- [x] 5.1 Update Playwright multiplayer test for property card, opening bid, quick increment buttons, and final cash expectation
- [x] 5.2 Add Playwright coverage for the dark mode toggle
- [x] 5.3 Run Vitest, production build, Playwright E2E, and OpenSpec validation
