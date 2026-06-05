## Why

The multiplayer bidding session has server and unit-level coverage, but its final host-plus-two-player browser flow still depends on manual verification. Playwright automation will prove the real browser UI, Vite app, and WebSocket server work together before the multiplayer change is archived.

## What Changes

- Add Playwright as the browser automation framework for end-to-end UI tests.
- Add scripts for running Playwright tests locally and in verification.
- Configure Playwright to start the Vite app and Node/WebSocket server for tests.
- Add an automated multiplayer session test with one host browser page and two player browser pages.
- Add a fast test-mode countdown path so the end-to-end test does not wait 30 seconds per property.
- Capture browser-level assertions for join code creation, player joins, bidding, skipping, countdown resolution, privacy boundaries, and session completion.

## Capabilities

### New Capabilities

- `ui-automation`: Browser-based end-to-end verification for critical app flows using Playwright.

### Modified Capabilities

- `multiplayer-bidding`: Add automated browser verification for the host/player WebSocket session flow.

## Impact

- Add Playwright dependencies and configuration.
- Add E2E test files outside the unit test suite.
- Update package scripts for Playwright execution.
- Add test-friendly countdown configuration for multiplayer sessions.
- Extend verification guidance for the existing multiplayer bidding session.
