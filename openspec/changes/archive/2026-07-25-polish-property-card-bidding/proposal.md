## Why

The current bidding screens are functional, but they do not yet feel like a Monopoly table experience and they underrepresent the information players use when valuing a property. A polished card-style property display, dark mode, and faster bid controls will make bidding clearer, faster, and closer to the physical game.

## What Changes

- Add dark mode that defaults from `prefers-color-scheme` and can be overridden with an in-app toggle.
- Expand the Monopoly property catalog with retail value and card stats needed for street, railroad, and utility cards.
- Show the active property as a card inspired by the physical Monopoly deed/card layout, including the correct color group and relevant stats.
- Start bidding for each property at 25% of the property's retail value, rounded to a practical Monopoly cash increment.
- Replace single-step bidding controls with quick bid increment buttons for `+$10`, `+$20`, `+$50`, and `+$100`.
- Apply the improved property card and bidding controls to local bidding views and multiplayer player/host bidding views where relevant.
- Update tests and Playwright automation for the new starting bid, card display, dark mode, and quick increment behavior.

## Capabilities

### New Capabilities

- `property-display`: Visual presentation of Monopoly properties as card-like UI elements with category-specific colors and stats.

### Modified Capabilities

- `property-bidding`: Change bidding start values and bid controls to use property retail values and quick increment actions.
- `multiplayer-bidding`: Reflect card display, starting bid, and quick increment behavior in multiplayer bidding sessions.
- `ui-automation`: Extend browser automation to verify the polished bidding UI and theme behavior.

## Impact

- Update the property data model and catalog.
- Update domain bidding/session logic for property-based starting bids.
- Update React components and CSS variables for dark mode and property card presentation.
- Update local and multiplayer bidding controls.
- Update Vitest and Playwright expectations.
