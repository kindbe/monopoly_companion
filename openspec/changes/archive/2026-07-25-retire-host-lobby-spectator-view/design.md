## Context

This change started from a report that the host is registered as a player on the server but is never routed into the bidding experience, and that the host lobby persists as a spectator view through the auction. The event flow was traced end to end for both transports before writing any requirement, because the answer determines whether this is a client-only fix, a client plus server fix, or mostly a cleanup.

### The host already receives player state on both transports

WebSocket path:

- `src/server/transport.ts:38-56` registers the host client with `role: "host"` and the host `playerId`, then sends `joined` plus `host-state`.
- `src/server/transport.ts:132-150` is the decisive branch. In `broadcastSession`, a client with `role === "host"` that has a `playerId` receives `player-state` rather than `host-state` as soon as `store.getHostState(joinCode).phase !== "lobby"`. So from the moment `start-bidding` flips the session out of the lobby, the host client is fed player state exclusively.
- `src/server/index.ts:47-50` ticks `store.resolveExpiredRounds()` every second, and `resolveExpiredRounds` notifies subscribers (`src/shared/sessionEngine.ts:211-223`), which re-enters `broadcastSession`. The host keeps receiving player state for the rest of the session.

The host is not fed player state *exclusively*: `src/server/transport.ts:122-130` calls `sendHostState` on any player disconnect regardless of phase, so the host does receive `host-state` with a non-lobby phase mid-auction. This is harmless only because `src/App.tsx:219-222` never changes the app phase on `host-state`, which is also why the lobby markup below stays unreachable.

WebRTC host-authoritative path:

- `src/shared/hostAuthoritativeSession.ts:117-128` broadcasts only to remote peers, so the host does not learn about its own state through the peer fan-out.
- `src/shared/browserWebRtcMultiplayerTransport.ts:107-119` closes that gap in the transport instead: `startBidding` emits a synthetic `player-state` for the host player id, and `src/shared/browserWebRtcMultiplayerTransport.ts:172-194` re-emits it on every host timer tick until the session completes.

Client side, `handleMultiplayerEvent` in `src/App.tsx:218-233` calls `setPhase("playerBidding")` on any `player-state`, and no code path ever sets the phase back to `"hostLobby"`. The end-to-end test already pins the result: `e2e/multiplayer-session.spec.ts:38-66` asserts that after `Start multiplayer bidding` the host lobby heading disappears, the host sees their own cash, remaining bids and property card, clicks `+$10`, and becomes the named current bidder. `pnpm test:e2e` passes on the current tree.

Conclusion: routing the host into the bidding experience needs no client change and no server change. It ships. What remains is the cleanup that the original work left behind and one settlement defect found while tracing.

### The host lobby spectator view is unreachable

`src/components/HostLobbyScreen/HostLobbyScreen.tsx:54-68` renders a bidding summary when `phase === "bidding"` and a completed-bid count when `phase === "complete"`. The `phase` prop is fed from `hostState?.phase` (`src/App.tsx:288-302`), but the whole screen only renders while the app phase is `"hostLobby"`, and the app phase leaves `"hostLobby"` on the first `player-state`. A `host-state` event updates `hostState` without touching the app phase, so there is no ordering in which a non-lobby `hostState` is rendered by this screen. Both branches, and the `phase`, `currentProperty`, `currentBid`, `currentBidderName`, `countdownRemaining` and `completedBidCount` props that feed them, are dead.

No unit test renders `HostLobbyScreen` directly, so removing the branches removes untested dead code rather than covered behavior.

### The real settlement finding

`allPlayersSkipped` at `src/shared/sessionEngine.ts:460-468` has three conditions: no bid has been recorded this round (`roundActions.size === 0`), the roster is non-empty, and every entry in `session.players` has skipped. `session.players` never shrinks: `markDisconnected` (`src/shared/sessionEngine.ts:243-247`) only removes the id from `connectedPlayerIds`. So a disconnected player permanently withholds the early advance for every remaining round, and the connected players who all pressed `Skip` sit and watch the countdown run out.

Only the third condition is wrong. **The `roundActions.size === 0` guard MUST be preserved.** Without it, a round in which a since-disconnected player holds the leading bid would advance early and display `Skipped!` while the property actually sells to that bidder — `resolveCurrentRound` (`src/shared/sessionEngine.ts:344-357`) derives the winner from `roundActions` regardless of the round message, so ownership would survive but the message and the timing would both be wrong.

That contradicts the requirement wording already in flight in `openspec/changes/refine-bidding-visuals-and-skip-flow/specs/multiplayer-bidding/spec.md:33-35`, which scopes the early advance to "every active player".

The consequence is mis-settlement of timing, not a stall or a wrong owner. When the countdown expires, `resolveExpiredRounds` resolves the round with no bids, leaves the property unowned and advances, which is the same outcome the early advance would have produced, minus the `Skipped!` message and minus the time saved. Both transports drive that fallback: the WebSocket server tick at `src/server/index.ts:47-50` and the host browser interval at `src/shared/browserWebRtcMultiplayerTransport.ts:172-194`.

The host is not a contributor to this defect. Because the host is a bidder with working bid and skip controls, the host's presence in `session.players` is correct and its skip is recorded like anyone else's, as `src/shared/sessionEngine.test.ts:200-235` already pins.

## Spec conflicts

Four completed-but-unarchived changes carry delta specs against the same capabilities as this one. `openspec validate --strict` passes for all of them, because validation does not check that a `MODIFIED` requirement exists in the main spec, nor that two changes modify the same requirement differently. The conflicts are therefore invisible until archive, where `MODIFIED` replaces the entire requirement body on a last-write-wins basis with no reported conflict.

Observed collisions:

- `Requirement: Multiplayer browser flow automation` (`ui-automation`) is modified in full by five changes: this one, `simplify-multiplayer-host-flow`, `refine-bidding-visuals-and-skip-flow`, `polish-property-card-bidding`, and `host-authoritative-webrtc-multiplayer`. Whichever archives last silently deletes the others' scenarios.
- `Requirement: Multiplayer completion` (`multiplayer-bidding`) is modified by this change, by `simplify-multiplayer-host-flow` with near-duplicate text, and by `host-authoritative-webrtc-multiplayer` with text stating the host "sees the session summary" — a direct contradiction of the `No host-only summary` scenario here.
- `Requirement: Host player participation` is ADDED here and also appears in `simplify-multiplayer-host-flow`, where it is declared under `MODIFIED` against a requirement that does not exist in the main spec. `simplify-multiplayer-host-flow` and several siblings therefore abort on `openspec archive` today.

Decisions taken here:

1. This change's `ui-automation` delta is expressed as a new `Requirement: Host participation browser automation` rather than as a modification of the contested shared requirement. That makes its scenarios durable through archive without editing any other change.
2. Its `multiplayer-bidding` deltas target `Host session state` and `Multiplayer completion`, both of which do exist in the main spec, so they are structurally valid.
3. Reconciling the contested requirement bodies across the other four changes, and repairing `simplify-multiplayer-host-flow`'s invalid `MODIFIED` headers, is **explicitly out of scope**. It is pre-existing, affects changes this one did not create, and would triple the size of a small cleanup. It should be its own change, and it must land before any of the affected changes are archived.

## Change ordering

This change MUST land before `adopt-title-deed-visual-identity`. Both edit `src/components/HostLobbyScreen/HostLobbyScreen.tsx` and `src/App.tsx`; this change deletes markup and six props that the visual change would otherwise restyle and then have to re-resolve. `adopt-title-deed-visual-identity` should assume `HostLobbyScreen` is join code, roster, and start control only.

## Goals / Non-Goals

**Goals:**

- Reduce the host lobby to a pre-game room and delete the unreachable spectator markup and props.
- Record host-as-participant behavior as an explicit requirement instead of an undocumented side effect.
- Add a client-level regression test so host routing is pinned somewhere cheaper than Playwright.
- Scope the all-skipped early advance to connected players.

**Non-Goals:**

- No visual redesign of any kind. The cream title-deed aesthetic, the pinned mobile bid bar and the three-way contrast theming belong to a separate change, and this change must not pre-empt them.
- No change to `HostState`, `PlayerState`, `ClientCommand` or `ServerEvent` shapes.
- No change to how the host is created, identified or authorized.
- No reconnect or host-migration work.

## Decisions

### Keep `HostState` intact while the host lobby stops rendering most of it

The lobby needs `joinCode` and `players` only. `currentProperty`, `currentBid`, `currentBidderName`, `countdownRemaining`, `completedBids` and `summary` stay on `HostState` because the engine builds them from session state, `src/shared/sessionEngine.test.ts` asserts them, and the WebRTC host session exposes `getHostState` for its own bookkeeping.

Alternative considered: trim `HostState` to the lobby fields. Rejected, because it would ripple into the engine, both transports and their tests for no user-visible gain, and it would collide with any future host console.

### Fix `allPlayersSkipped` in the engine rather than at the call site

`skipProperty` is the only caller, but the predicate is where "all players" is defined, and both transports share the engine. Filtering on `connectedPlayerIds` inside `allPlayersSkipped` keeps the WebSocket and WebRTC paths consistent at the code level.

The resulting predicate has three conditions, not two: no bid recorded this round, at least one connected player, and every connected player has skipped. The first is the existing `roundActions.size === 0` guard and is retained unchanged; dropping it is the failure mode described above.

Guard against the degenerate case: if no player is connected, the predicate must not report that everyone skipped, otherwise an empty session would advance the whole deck instantly. Note this state is not reachable in production today — `connectedPlayerIds` always contains the host, because `src/server/transport.ts:122-130` only calls `markDisconnected` for `role === "player"`. The guard is defensive.

### The settlement fix is WebSocket-only in practice

`markPeerDisconnected` (`src/shared/hostAuthoritativeSession.ts:95-101`) is called from exactly one place in the repository: `src/shared/hostAuthoritativeSession.test.ts:80`. Neither `browserWebRtcMultiplayerTransport.ts` nor `webrtcTransport.ts` calls it; `webrtcTransport.ts:245-252` only reports `onError` on ICE failure. So on the WebRTC path nothing ever leaves `connectedPlayerIds`, and this fix is a behavioral no-op there.

The engine change is still the right place for it, because it is correct for whichever transport does maintain the set. Wiring WebRTC disconnects into `markPeerDisconnected` is deliberately out of scope: it raises what an active session should do when its host peer drops, which is host-migration territory.

Alternative considered: drop disconnected players from `session.players` entirely. Rejected, because they still own properties and cash that the completed-bid history and the host roster refer to.

### Disable bidding controls at completion

`revealNextRound` (`src/shared/sessionEngine.ts:314-332`) resets `roundActions`, `roundSkippedPlayerIds` and `roundBidCounts` before setting `phase = "complete"`, so a completed session reports `remainingBidCount > 0` and `hasSkipped === false`. `PlayerBiddingScreen` disables its controls on those two fields alone (`src/components/PlayerBiddingScreen/PlayerBiddingScreen.tsx:74,86`), so the bid and skip controls render enabled on the completion screen; pressing one sends a command the engine rejects with `"Bidding is not active."` (`src/shared/sessionEngine.ts:271`), surfacing as an error alert.

`PlayerState.phase` (`src/shared/multiplayer.ts:43`) already carries `"complete"` over the wire, so the fix is client-only: pass the session phase into the screen and treat a non-bidding phase as disabling. No protocol, engine, or server change.

This is folded into this change rather than deferred because it sits inside the `Multiplayer completion` requirement being rewritten here, and because leaving it would mean this change asserts a completion experience it does not deliver.

### Delete rather than hide the lobby spectator branches

The branches are unreachable, not merely unused. Leaving them behind a flag or a comment preserves the impression that the host lobby is a session-long console, which is the thing this change is retiring.

## Risks / Trade-offs

- Removing props from `HostLobbyScreenProps` is a compile-time break for any other caller. `src/App.tsx` is the only caller today, and `pnpm build` plus type checking will catch a miss.
- The host no longer has any surface showing session-wide auction status. That is the intended end state, but it means a host who wants to see the join code after starting must restart the session. This is captured as an open question rather than designed around.
- Changing the all-skipped predicate changes observable timing in sessions with a disconnected player: the round now advances early with a `Skipped!` message instead of running the countdown out. That is the specified behavior, and the resulting property ownership is unchanged.
- The host is never marked disconnected on the WebSocket path, because `src/server/transport.ts:122-130` only calls `markDisconnected` for `role === "player"`. After this change a closed host tab still counts as connected and still suppresses the early advance. That gap is left alone here; see the open questions.

## Testing Strategy

- Unit: a pre-change test rendering `HostLobbyScreen` with `phase="bidding"` to prove the spectator branch is currently reachable by prop. This test is deleted together with the branch it pins; it exists only to make the removal a red-green step rather than an unverified deletion.
- Unit: a post-change test asserting that, given the reduced prop set, `HostLobbyScreen` renders the join code, the roster and the start control, and renders no current-property, current-bid, countdown or completed-bid text. This is the durable assertion, and it cannot reference `phase`, which no longer exists on the props.
- Unit: an `App` level test driving `joined` then `player-state` over the fake socket, asserting the host lobby heading is gone and the player bidding controls are present, so the routing is pinned outside Playwright.
- Unit: engine tests for the all-skipped predicate covering every connected player skipping while another player is disconnected, and the no-connected-player case.
- E2E: extend the existing multiplayer flow to assert the host lobby and its join code stay gone for the rest of the session after bidding starts. Multiplayer coordination is in scope, so `pnpm test:e2e` must run.
- Unit: an `App` level test driving a `player-state` with `phase: "complete"`, asserting the host sees their own player summary, no host-only summary, and disabled bid and skip controls.
- Unit: an engine test asserting a disconnected winner keeps their cash and won properties in the roster.
- Coverage must satisfy all four configured thresholds in `vite.config.ts` (lines 80, functions 79, branches 75, statements 80). Note that `src/shared/**` is excluded from coverage, so the `allPlayersSkipped` fix is verified by assertion rather than by coverage.

## Open Questions

- Should the host retain any host-only control during bidding, such as aborting or ending the session early? This change deliberately does not decide it. Today no such control exists, and adding one would reintroduce a host-only surface that the pre-game-only lobby is meant to remove.
- Should the join code stay visible somewhere after bidding starts, for a player who reloads mid-session? Reconnect is not supported on the WebSocket path today, so this is only worth answering alongside reconnect work.
- Should a host that closes its tab be marked disconnected on the WebSocket path? Doing so would make the all-skipped fix apply to abandoned host sessions too, but it also raises what an active session without its host should do, which is out of scope here.
