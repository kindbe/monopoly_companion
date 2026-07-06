## 1. Replace the lobby fallback

- [x] 1.1 Change `startMultiplayerBidding` in `src/App.tsx` to set `multiplayerMessage` with a connection error and return (no `setPhase("setup")`) when the transport is not open or there is no host state
- [x] 1.2 Rewrite the `App.test.tsx` fallback test ("falls back from host lobby to local setup...") to assert the error message is shown and the host lobby remains visible

## 2. Remove local-mode UI and app state

- [x] 2.1 Delete `src/components/SetupScreen/`, `src/components/BiddingScreen/`, and `src/components/CompleteScreen/` (components, types, tests)
- [x] 2.2 Remove the `setup`, `bidding`, and `complete` phase rendering blocks and their imports from `src/App.tsx`
- [x] 2.3 Remove local-flow state and handlers from `src/App.tsx`: `mode`, `increment`, `playerNames`, `players`, `deck`, `currentProperty`, `ascendingAuction`, `silentBids`, `tiedPlayerIds`, `completedBids`, `bidFeedback`, `lastWinnerName`, and the functions `startBidding`, `revealFollowingProperty`, `recordResult`, `placeBid`, `passBidder`, `skipProperty`, `submitSilentAuction`, `updatePlayerName`, `addPlayer`, `removePlayer`; pass the increment default as a literal in the session config
- [x] 2.4 Trim `restart()` to only the resets that still have state; keep it as the lobby/join Back action
- [x] 2.5 Prune `src/common/auctionTypes.ts`: drop `BiddingMode`, remove `setup`/`bidding`/`complete` from `Phase`, and remove `CompletedBid` if no consumer remains (multiplayer uses the copy in `src/shared/multiplayer.ts`)
- [x] 2.6 Remove `src/common/uiClasses.ts` exports with zero remaining references (e.g., `modeButtonClass`) and any keyframes in `src/styles.css` used only by removed screens

## 3. Remove local-only domain logic

- [x] 3.1 Delete `createAscendingAuction`, `placeAscendingBid`, `passAscendingBidder`, `skipCurrentProperty`, `resolveSilentAuction`, `assertAuctionOpen`, `validateSetup` (if unused after UI removal), and the `AscendingAuction`, `SilentBid`, `SilentAuctionResult` types from `src/domain/bidding.ts`; keep `AuctionResult` and all functions the session engine imports
- [x] 3.2 Remove the corresponding cases from `src/domain/bidding.test.ts`
- [x] 3.3 Remove local-flow tests from `src/App.test.tsx` (ascending pass flow, silent auction, tie re-bid, local completion summary) while keeping multiplayer coverage

## 4. Update specs and verify

- [x] 4.1 Confirm delta specs for `property-bidding` and `multiplayer-bidding` match the implemented behavior; sync/archive per OpenSpec workflow when the change lands
- [x] 4.2 Run `pnpm lint`, `pnpm build`, and `pnpm test:coverage`; confirm coverage thresholds in `vite.config.ts` still pass without lowering them
- [x] 4.3 Run `pnpm test:e2e` to confirm the multiplayer flow and landing-screen assertions still pass
- [x] 4.4 Update `README.md` and `PROJECT_CONTEXT.md` if they reference the single-device flow or auction modes
