## Why

The base Monopoly setup can be slow, repetitive, and easy to skew by turn order or luck. A pre-game property bidding companion adds a short, social setup phase that makes distribution feel more strategic without changing the core Monopoly rules.

## What Changes

- Add a browser-based pre-game bidding flow for Monopoly property assignment.
- Let players bid on randomly revealed properties before the main game begins.
- Support ascending auction and silent auction bidding modes.
- Let the host configure the bid increment, property count, and whether railroads or utilities are eligible.
- Deduct winning bids from each player's Monopoly starting cash.
- Support a mobile-first experience that works in portrait and landscape on common phone resolutions.
- Preserve standard Monopoly gameplay after setup is complete.
- Keep the rules simple enough for casual or family play.

## Capabilities

### New Capabilities
- `property-bidding`: A setup-phase mini-game for bidding on Monopoly properties before the main game starts, including player participation, configurable property selection, hidden randomized reveal order, ascending and silent auction modes, cash deduction, and final assignment.

### Modified Capabilities

## Impact

- New React and TypeScript UI for setup and bidding screens.
- Vite-based app structure and pnpm workflow remain the implementation baseline.
- Product behavior changes only at game setup; no changes to core Monopoly gameplay are intended.
