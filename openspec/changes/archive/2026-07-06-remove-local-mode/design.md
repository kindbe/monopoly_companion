## Context

The landing screen offers only "Host Multiplayer" and "Join Session". The single-device local flow — `SetupScreen` (players, auction mode, increment), `BiddingScreen` (ascending pass-based and silent auctions), and `CompleteScreen` (summary) — is reachable only through `startMultiplayerBidding` in `src/App.tsx`, which silently falls back to `setPhase("setup")` when the multiplayer transport is not open. The `property-bidding` spec still mandates silent auctions, pass-based ascending auctions, and a host-configurable bid increment, none of which the multiplayer flow provides (the host setup screen has never exposed an increment control).

The multiplayer path has its own authoritative rules in `src/shared/sessionEngine.ts` and consumes only a subset of `src/domain/bidding.ts`: `MONOPOLY_PROPERTIES`, `STARTING_CASH`, `QUICK_BID_INCREMENTS`, property types, `buildEligiblePropertyPool`, `createPropertyDeck`, `revealNextProperty`, `createPlayers`, `calculateOpeningBid`, `validateBidAmount`, and `assignProperty`.

## Goals / Non-Goals

**Goals:**

- Delete the local bidding flow (UI, app state, domain logic, tests) so multiplayer is the single product path.
- Replace the silent lobby→local-setup fallback with an explicit error that keeps the host in the lobby.
- Bring the `property-bidding` spec in line with shipped behavior via delta specs.
- Shrink `src/App.tsx` as a side effect of removing local-flow state and handlers.

**Non-Goals:**

- No restructuring of surviving multiplayer code (no `useMultiplayerSession` extraction, no reducer refactor) — that is a follow-up change.
- No new multiplayer features (e.g., porting silent auctions to multiplayer, adding an increment control to host setup).
- No changes to the session engine, transports, signaling server, or wire protocol.
- No changes to multiplayer completion display; players continue to see completion in `PlayerBiddingScreen` as today.

## Decisions

1. **Error instead of fallback when the transport is not open.** `startMultiplayerBidding` sets `multiplayerMessage` (rendered via the existing `role="alert"` paragraph in `HostLobbyScreen`) and returns. Alternative considered: disable the start button until connected — rejected for this change because connection state is not currently tracked reactively (`isOpen()` is polled, not evented), and the alert reuses existing plumbing with zero new state.
2. **Remove, don't deprecate, the local domain logic.** `createAscendingAuction`, `placeAscendingBid`, `passAscendingBidder`, `skipCurrentProperty`, `resolveSilentAuction`, and the `AscendingAuction`/`SilentBid`/`SilentAuctionResult` types are deleted along with their tests. Everything is in git history; keeping dead exports "just in case" recreates the problem this change removes. `AuctionResult` stays because `assignProperty` uses it.
3. **Drop the "Configurable bid increment" requirement rather than build the control.** The multiplayer host setup never exposed increment; players bid via fixed `QUICK_BID_INCREMENTS` (+$10/20/50/100). The engine's internal `increment` config and `validateBidAmount` remain untouched (server-side validation is unchanged); only the spec-level promise of host configurability is removed. Alternative: add an increment field to `HostSetupScreen` — rejected as scope creep; can be proposed separately if wanted.
4. **Prune `Phase` and `Theme` types in place.** `Phase` loses `setup`, `bidding`, and `complete`; `BiddingMode` and `CompletedBid` move out of `src/common/auctionTypes.ts` if no multiplayer consumer remains (`CompletedBid` is also defined in `src/shared/multiplayer.ts`, which is the copy the multiplayer path uses). The `increment` and `mode` `useState` hooks in `App.tsx` go away; `increment` is replaced by the literal default in the session config since nothing can change it.
5. **Keep `restart()` as the lobby "Back" action** but drop its local-game resets (players, deck, completedBids) that no longer have state to reset.

## Risks / Trade-offs

- [Losing the only UI for silent auctions] → Accepted deliberately; the logic is preserved in git history and the exploration notes identify "port silent auction to multiplayer" as the higher-value future change. This removal does not foreclose it — the engine, not the deleted UI, is where that feature would live.
- [Coverage thresholds may shift] → Deleting well-covered local code and its tests changes the coverage mix; `vite.config.ts` thresholds (80/79/75/80) must still pass. Verify with `pnpm test:coverage` during implementation; adjust only test selection, not thresholds.
- [Host stuck with no path forward if the signaling server is down] → Previously the silent fallback "worked" by accident. The error message is honest but offers no recovery beyond Back. Acceptable for a local demo app; a reconnect affordance is out of scope.
- [Orphaned styles] → Classes in `src/common/uiClasses.ts` used only by removed screens (e.g., `modeButtonClass`) become dead. Sweep for zero-reference exports after component deletion; leave shared classes untouched.

## Migration Plan

Single PR, no data or protocol migration. Rollback is a revert. E2e suite already asserts the multiplayer-only landing screen (`ascending` button not visible) and passes unchanged.

## Open Questions

None blocking. If the family wants silent auctions back, that is a new multiplayer-bidding change, not a revert of this one.
