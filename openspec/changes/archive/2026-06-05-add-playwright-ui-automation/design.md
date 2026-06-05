## Context

The app currently uses Vitest for domain, server, transport, and React component tests. The multiplayer implementation also has a live WebSocket client verification, but the final browser-level host plus two-player workflow is still manual. Playwright should cover the real Vite UI and Node/WebSocket server together so multiplayer browser regressions are caught automatically.

## Goals / Non-Goals

**Goals:**
- Add Playwright for browser-level E2E testing.
- Start the Vite app and WebSocket server automatically for E2E tests.
- Verify one host browser page and two player browser pages can complete a short multiplayer bidding session.
- Assert player privacy from the browser UI: each player sees their own cash and properties, not other players' private state.
- Keep the E2E test fast by using a test-specific countdown shorter than the production 30-second countdown.

**Non-Goals:**
- Replacing Vitest unit or integration tests.
- Adding broad visual regression testing.
- Testing every Monopoly property or every bid edge case through Playwright.
- Adding cloud/browser-matrix coverage beyond the default local browser target.

## Decisions

- Use `@playwright/test` as a separate E2E test runner.
  - Playwright provides multi-page browser orchestration and web server lifecycle management, which matches the host plus player-device workflow.
  - Alternative considered: Testing Library only. Rejected because it cannot validate real WebSocket browser integration across multiple pages.
- Keep Playwright tests under an `e2e/` directory with a dedicated `playwright.config.ts`.
  - This separates slow browser tests from fast Vitest tests and keeps the normal `pnpm test` command focused on unit/integration coverage.
  - Add an explicit `pnpm test:e2e` script for browser automation.
- Use Playwright `webServer` entries to run both `pnpm dev:server` and `pnpm dev`.
  - This keeps the test command self-contained.
  - The Vite server should use a fixed E2E port, and the WebSocket server should use the default or configured E2E port.
- Add a test countdown override for E2E.
  - The production player experience remains 30 seconds.
  - The test flow should be able to create or request a 1-second countdown so the E2E suite remains practical.
- Treat one complete multiplayer session as the primary E2E proof.
  - The test should create a host session, read the join code, join two players, start bidding, submit a bid from one player, skip from the other, wait for resolution, and assert final host/player state.

## Risks / Trade-offs

- Playwright browser binaries may be missing locally -> Document the install step and make failure clear in verification output.
- E2E tests can become flaky around timers and WebSocket updates -> Use server-owned countdowns, accessible UI assertions, and expect polling rather than fixed sleeps where possible.
- Running two dev servers can leave ports occupied -> Use fixed E2E ports and configure Playwright to reuse existing servers only when appropriate.
- E2E coverage can grow too broad and slow -> Start with one high-value multiplayer flow and keep detailed rule coverage in Vitest.
