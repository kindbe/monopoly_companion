## Why

The single-device local bidding flow (setup screen, pass-the-device ascending auction, and silent auction) is no longer reachable from the landing screen; it survives only as a silent fallback when the host starts multiplayer bidding without an open transport connection. This leaves ~800+ lines of UI, domain logic, and tests maintained for a path no user can intentionally reach, and leaves the `property-bidding` spec mandating auction modes the product no longer offers.

## What Changes

- **BREAKING** Remove the single-device local bidding flow: local player setup, local ascending (pass-until-one-remains) auction, silent auction with sudden-death re-bid, and the local completion summary screen.
- Remove the silent fallback from host lobby to local setup; starting multiplayer bidding without an open connection now surfaces an error message and keeps the host in the lobby.
- Remove local-only domain logic from `src/domain/bidding.ts` (ascending auction state machine, silent auction resolution) while keeping everything the multiplayer session engine uses (property data, deck, players, bid validation, property assignment).
- Remove local-only UI components (`SetupScreen`, `BiddingScreen`, `CompleteScreen`) and the now-unused phases (`setup`, `bidding`, `complete`) and `BiddingMode` type from the app shell.
- Update the `property-bidding` spec so its requirements describe the multiplayer session flow that actually ships.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `property-bidding`: Remove the "Ascending auction mode" and "Silent auction mode" requirements (multiplayer rounds resolve by countdown per `multiplayer-bidding`). Remove the "Configurable bid increment" requirement — the multiplayer host setup has never exposed an increment control; bidding uses the fixed quick-bid increments. Re-scope the pre-game bidding flow requirement to the multiplayer session flow as the sole flow.
- `multiplayer-bidding`: Add a requirement scenario that starting bidding without an open multiplayer connection shows an error and keeps the host in the lobby (replaces today's silent fallback into local setup).

## Impact

- **Removed code**: `src/components/SetupScreen/`, `src/components/BiddingScreen/`, `src/components/CompleteScreen/` (components, types, tests); ascending/silent auction functions and types in `src/domain/bidding.ts` plus their tests; local-flow state, handlers, and rendering in `src/App.tsx` (~40% of the file); `BiddingMode` and dead `Phase` members in `src/common/auctionTypes.ts`; any UI classes used only by removed screens (e.g., mode-toggle styling).
- **Retained**: everything the multiplayer engine consumes from `src/domain/bidding.ts`; `PropertyCard`, `MiniPropertyCards`, `PropertyDialog`; all of `src/shared/` and `src/server/`.
- **Tests**: local-flow cases in `src/App.test.tsx` (including the fallback test) are removed or rewritten to assert the new error behavior; removed components' test files deleted; e2e flow unaffected.
- **Specs**: delta files for `property-bidding` and `multiplayer-bidding`.
- **No dependency, server protocol, or persistence changes.**
