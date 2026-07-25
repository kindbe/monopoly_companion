## 1. Pin Current Behavior

- [x] 1.1 Add an `App` test that drives `joined` then `player-state` on the host connection and asserts the host lobby heading is gone and the player bidding controls are visible, so host-as-participant routing is pinned outside Playwright.
- [x] 1.2 Add a `src/components/HostLobbyScreen/HostLobbyScreen.test.tsx` test asserting the pre-game lobby renders the join code, the roster including the host, and the start control.
- [ ] 1.3 Add a temporary `HostLobbyScreen` test that renders with `phase="bidding"` and asserts the spectator text IS present, proving the branch is currently reachable by prop. This test is deleted by task 2.1; it exists only to make the removal a red-green step. **Left unticked: the implementing agent reported performing this step, but it leaves no artifact and a review confirmed the surviving test in 2.4 passes against the pre-change component, so the deletion is correct by inspection but not test-verified.**
- [x] 1.4 Add a failing `src/shared/sessionEngine.test.ts` case asserting that when no bid has been placed, every connected player skips, and another player is disconnected, the round advances immediately with the `Skipped!` message.
- [x] 1.5 Add a `src/shared/sessionEngine.test.ts` case asserting that a round does not advance early when no player is connected.
- [x] 1.6 Add a failing `src/shared/sessionEngine.test.ts` case asserting that when a bid HAS been placed and every connected player then skips, the round does NOT advance early, and at countdown expiry the property is awarded to the highest bidder even if that bidder is disconnected. This pins the `roundActions.size === 0` guard against being dropped.
- [x] 1.7 Add a failing `App` test driving a `player-state` with `phase: "complete"`, asserting the bid and skip controls are disabled.

## 2. Retire The Host Lobby Spectator View

- [x] 2.1 Remove the `phase === "bidding"` and `phase === "complete"` branches from `src/components/HostLobbyScreen/HostLobbyScreen.tsx`, and delete the temporary test from task 1.3.
- [x] 2.2 Remove `phase`, `currentProperty`, `currentBid`, `currentBidderName`, `countdownRemaining` and `completedBidCount` from `HostLobbyScreenProps` in `src/components/HostLobbyScreen/types.ts`.
- [x] 2.3 Stop passing the removed props from `src/App.tsx` and leave `HostState` and the multiplayer event types unchanged.
- [x] 2.4 Add a durable `HostLobbyScreen` test asserting that, given the reduced prop set, no current-property, current-bid, countdown or completed-bid text is rendered.
- [x] 2.5 Confirm `git diff src/styles.css src/common/uiClasses.ts` is empty and that the `HostLobbyScreen.tsx` diff contains only deletions plus prop-signature edits, so the separate visual overhaul change is not pre-empted.

## 3. Correct Round Settlement

- [x] 3.1 Update `allPlayersSkipped` in `src/shared/sessionEngine.ts` to consider only players in `connectedPlayerIds`, keeping the existing `roundActions.size === 0` guard intact.
- [x] 3.2 Require at least one connected player so a session with no connected players cannot advance the deck.
- [x] 3.3 Add a `src/shared/hostAuthoritativeSession.test.ts` case that marks a peer disconnected via `markPeerDisconnected` and has the remaining connected players skip, asserting the early advance fires on the host-authoritative path too.
- [x] 3.4 Add a `src/shared/sessionEngine.test.ts` case asserting a disconnected player who won a property keeps that property and their remaining cash in the roster.

## 4. Disable Bidding Controls At Completion

- [x] 4.1 Add the session phase to `PlayerBiddingScreenProps` in `src/components/PlayerBiddingScreen/types.ts`.
- [x] 4.2 Pass `playerState.phase` from `src/App.tsx`.
- [x] 4.3 Disable the quick-bid and skip controls in `src/components/PlayerBiddingScreen/PlayerBiddingScreen.tsx` when the phase is not `bidding`, without changing their styling treatment.

## 5. Specification Alignment

- [x] 5.1 Produce a scenario-to-test mapping: for every scenario in `specs/multiplayer-bidding/spec.md` and `specs/ui-automation/spec.md`, name the test that pins it. Any scenario without a test is a gap to close, not to tick.
- [x] 5.2 Run `openspec validate retire-host-lobby-spectator-view --strict` and resolve any reported issues.
- [x] 5.3 Confirm this change's `ui-automation` delta remains an `ADDED` requirement and does not modify `Multiplayer browser flow automation`, so its scenarios survive archive alongside the four other unarchived changes.

## 6. Browser Automation

- [x] 6.1 Extend `e2e/multiplayer-session.spec.ts` to assert the host lobby heading and the join code are absent immediately after bidding starts, and again after the session completes.
- [x] 6.2 Extend the e2e flow to assert the host's own player summary is shown at completion.
- [x] 6.3 Keep the existing host bidding assertions in place as the participation regression guard.

## 7. Verification

- [x] 7.1 Run `pnpm test` and fix failures.
- [x] 7.2 Run `pnpm test:coverage` and confirm all four configured thresholds pass (lines 80, functions 79, branches 75, statements 80).
- [x] 7.3 Run `pnpm build` for type checking and `pnpm lint`.
- [x] 7.4 Run `pnpm test:e2e`, since this change touches the multiplayer coordination flow.
- [x] 7.5 Report any test that could not be run and any remaining uncertainty, including the unresolved open questions in `design.md` and the out-of-scope archive-queue reconciliation.
