# Multiplayer Bidding Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve multiplayer bidding by adding host-configured per-property bid limits, remaining bid display, bidder attribution, and stable countdown timing.

**Architecture:** Enforce bid limits in the host-authoritative session engine, then expose derived remaining counts and current bidder names through multiplayer state. Keep local fallback bidding unchanged.

**Tech Stack:** React, TypeScript, Vitest, Playwright, existing WebRTC/WebSocket multiplayer transports.

---

### Task 1: Session Engine Contract

**Files:**
- Modify: `src/shared/multiplayer.ts`
- Modify: `src/shared/sessionEngine.ts`
- Test: `src/shared/sessionEngine.test.ts`

- [ ] Write failing tests proving `maxBidsPerPlayer` defaults to 3, clamps 1-5, rejects a fourth bid, exposes remaining bids, exposes the current bidder name, resets bid counts on the next property, and does not extend `roundEndsAt` when a bid is submitted.
- [ ] Implement the minimal session config, round bid counting, and state fields needed to pass.
- [ ] Run `pnpm test -- --run src/shared/sessionEngine.test.ts`.

### Task 2: Multiplayer App And UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/HostSetupScreen/HostSetupScreen.tsx`
- Modify: `src/components/HostSetupScreen/types.ts`
- Modify: `src/components/SetupScreen/SetupScreen.tsx`
- Modify: `src/components/SetupScreen/types.ts`
- Modify: `src/components/PlayerBiddingScreen/PlayerBiddingScreen.tsx`
- Modify: `src/components/PlayerBiddingScreen/types.ts`
- Modify: `src/components/HostLobbyScreen/HostLobbyScreen.tsx`
- Modify: `src/components/HostLobbyScreen/types.ts`
- Test: `src/App.test.tsx`

- [ ] Write failing tests for host max-bids default/clamp, remaining bid display, disabled bid buttons at zero, and current bid attribution.
- [ ] Add host setup control and pass `maxBidsPerPlayer` into multiplayer session creation.
- [ ] Render remaining bid count in the private player view and current bidder in player/host current bid display.
- [ ] Change local countdown ticking to 1000 ms per second while preserving urgency styling only.
- [ ] Run `pnpm test -- --run src/App.test.tsx`.

### Task 3: Verification

**Files:**
- Existing test and app files only.

- [ ] Run `pnpm test -- --run`.
- [ ] Run `pnpm build`.
- [ ] Run `pnpm test:e2e`.
- [ ] Browser-check multiplayer host/player flow: host sets max bids, player sees remaining bids, current bid names the bidder, and timer decrements once per second.
