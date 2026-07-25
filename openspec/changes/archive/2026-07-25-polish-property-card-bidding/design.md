## Context

The app currently uses a compact tabletop-inspired interface with minimal property metadata. Property entries only include name, category, and color group, so bidding screens cannot show deed-style cards or calculate property-specific starting bids. The bidding controls also use one configured increment rather than fast bid actions, and theme styling is light-only.

## Goals / Non-Goals

**Goals:**
- Add dark mode that defaults to the user's `prefers-color-scheme` setting and can be overridden in the app.
- Expand property data with retail value and Monopoly card stats.
- Render the active property as a card-like UI with correct color group/category treatment and stats.
- Start property bidding at 25% of retail value, rounded to a clean cash increment.
- Add quick bid buttons for `+$10`, `+$20`, `+$50`, and `+$100`.
- Apply the improved display and controls to local and multiplayer bidding views.

**Non-Goals:**
- Recreating exact copyrighted card artwork, logos, typography, or board illustrations.
- Adding house/hotel purchase gameplay beyond displaying card stats.
- Changing the property selection, hidden reveal, player join, or session completion rules.
- Adding persistence for theme preferences beyond a lightweight local browser preference.

## Decisions

- Extend `Property` into category-aware card data.
  - Street properties should include retail value, rent schedule, mortgage value, house cost, and hotel cost.
  - Railroads and utilities should include retail value, mortgage value, and category-specific rent text.
  - This keeps all card display and starting-bid logic data-driven instead of hard-coded in components.
- Use a Monopoly-inspired card component, not a literal reproduction.
  - The UI should evoke a deed card with a colored header, title, price, and stat rows while avoiding exact board-game artwork.
  - Alternative considered: plain stat panels. Rejected because the request specifically asks for a physical-card-like representation.
- Calculate starting bid from retail value.
  - Use `ceil(retailValue * 0.25 / 10) * 10` so starting bids are practical cash values and align with the smallest quick increment.
  - Apply this starting bid when a property round begins in local and multiplayer bidding.
- Replace single-increment bid action in bidding views with quick increments.
  - Buttons `+$10`, `+$20`, `+$50`, and `+$100` update the current bid by that amount while still validating against remaining cash.
  - Silent auction numeric inputs can remain, but they should present the property starting bid as the minimum useful bid.
- Implement theme with CSS custom properties and a root `data-theme`.
  - Initial theme follows `prefers-color-scheme`.
  - User toggle overrides the detected preference for the current browser, preferably via localStorage.
  - Alternative considered: CSS media query only. Rejected because the user explicitly requested a toggle option.

## Risks / Trade-offs

- Monopoly property stats are easy to mistype -> Add tests for representative property values and starting bids.
- Card layout can become cramped on mobile landscape -> Use responsive card dimensions, compact stat rows, and avoid nested cards.
- Dark mode can reduce color-group readability -> Keep property color strips saturated and choose theme tokens with sufficient contrast.
- Quick bid buttons can bypass validation if implemented only in UI -> Keep validation in domain/session logic and test unaffordable increments.
- Existing Playwright expectations depend on a `$10` first bid -> Update E2E to assert new starting bid and quick increment behavior.
