## Why

The current player bidding view still carries setup-era copy and layout density that makes active bidding harder to scan. Skip behavior also needs clearer feedback so players understand that skipping opts them out for the current round, and everyone sees when a property advances because all players skipped.

## What Changes

- Make the multiplayer bid deadline host-configurable from 5 to 30 seconds, defaulting to 10 seconds.
- Move active countdown emphasis below the property card and remove redundant player-view headings/copy.
- Cap property card title size at 24pt/32px and remove redundant color-group text from the card stats.
- Display Mediterranean Avenue and Baltic Avenue as the purple group.
- Start property bidding at 25% of retail value.
- Keep bid increment buttons at $10, $20, $50, and $100.
- Make player skip disable that player's bid buttons for the current round.
- Advance immediately when all active players skip and show a `Skipped!` overlay while advancing.
- Render player-owned properties as miniature cards with only name and color header, sorted by color group from most valuable to least.

## Capabilities

### New Capabilities

### Modified Capabilities

- `property-bidding`: Configurable bid deadline defaults and opening bid behavior.
- `multiplayer-bidding`: Player skip semantics, countdown visibility, player-view fields, and all-skipped round feedback.
- `ui-automation`: Browser automation should cover the refined countdown, skip, and player-view behavior.

## Impact

- Affected code: React app layout/state, bidding domain data, multiplayer session server, shared multiplayer types, CSS, unit tests, and Playwright tests.
- No new runtime dependencies are expected.
