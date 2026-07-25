## Why

The host is registered as a full bidder when a session is created, and the host client already switches to the shared player bidding view once bidding starts. That participation behavior was delivered by `simplify-multiplayer-host-flow` and is proven by the passing Playwright flow, but two pieces of the intended end state were never finished.

First, `HostLobbyScreen` still renders an in-auction spectator summary (current property, current bid, current bidder, countdown, completed bid count) for `phase === "bidding"` and `phase === "complete"`. Nothing can reach that markup any more, because the host client leaves the lobby phase permanently as soon as the first `player-state` event arrives. The screen therefore carries dead branches and six dead props, and the host lobby still reads as a session-long spectator console rather than a pre-game room.

Second, `openspec/specs/multiplayer-bidding/spec.md` has not caught up with the shipped behavior. It still describes a host-only session summary at completion and contains no requirement that the host bids as a normal participant, so the authoritative spec disagrees with the code and with the automated tests that pin it.

The investigation also surfaced one real settlement defect. Round settlement treats every registered player as an active participant, including players who have disconnected, so the `Skipped!` early advance cannot fire while a disconnected player remains in the roster. The round is not lost, because both the WebSocket server tick and the host browser tick resolve expired rounds, but the round mis-settles by waiting out the full countdown instead of advancing.

## What Changes

- Make the host lobby pre-game only: it shows the join code, the player roster including the host, the start control, and errors, and nothing else.
- Remove the unreachable in-auction and completion branches from `HostLobbyScreen`, along with the props that only fed them.
- Pin the host-as-participant routing with a client regression test so the behavior stops depending solely on the end-to-end flow.
- Settle a round's `Skipped!` early advance on the connected players only, so a disconnected player no longer suppresses it, while preserving the existing guard that no bid has been placed this round.
- Disable the bid and skip controls once the session completes, so the completion screen no longer offers actions the engine rejects.
- Bring `multiplayer-bidding` requirements in line with the shipped host-as-participant experience.

## Non-Goals

- No visual redesign. The cream `title deed` aesthetic, the mobile-first pinned bid bar, and the three-way contrast theming are a separate change. Styling is touched here only where deleting dead markup makes it unavoidable.
- No change to the `HostState` payload or to the host/player protocol message shapes. The host client simply stops rendering fields it no longer needs.
- No change to bid validation, bid limits, opening bid calculation, countdown length, or property selection.

## Capabilities

### New Capabilities

### Modified Capabilities

- `multiplayer-bidding`: The host lobby becomes a pre-game room, host participation becomes an explicit requirement, session completion shows the host their own player summary with inactive bidding controls, and round settlement recognizes only connected players.
- `ui-automation`: Adds a host-participation automation requirement asserting the host bids as a participant and the host lobby does not reappear.

## Impact

- Affected code: `src/components/HostLobbyScreen/HostLobbyScreen.tsx`, `src/components/HostLobbyScreen/types.ts`, `src/components/PlayerBiddingScreen/PlayerBiddingScreen.tsx`, `src/components/PlayerBiddingScreen/types.ts`, the props passed from `src/App.tsx`, `allPlayersSkipped` in `src/shared/sessionEngine.ts`, and the associated unit and Playwright tests.
- No new runtime dependencies are expected.
- No server protocol or wire-format change is required.
- This change MUST land before `adopt-title-deed-visual-identity`; both edit `HostLobbyScreen.tsx` and `App.tsx`, and this one deletes markup the other would otherwise restyle. See "Change ordering" in `design.md`.
- Four unarchived changes carry conflicting delta specs against the same capabilities, and `openspec archive` resolves those silently by last-write-wins. This change routes around the collision rather than resolving it; reconciling the archive queue is called out as separate work in "Spec conflicts" in `design.md`.
