## 1. Playwright Setup

- [x] 1.1 Add Playwright dependencies and browser automation scripts to package.json
- [x] 1.2 Add Playwright configuration that starts the Vite app and Node/WebSocket server
- [x] 1.3 Add E2E directory structure and any shared Playwright helpers

## 2. Testability Hooks

- [x] 2.1 Add a test-safe countdown configuration path for multiplayer session creation
- [x] 2.2 Ensure host and player UI elements expose stable accessible names for Playwright selectors
- [x] 2.3 Ensure E2E server ports and WebSocket URLs are configurable and deterministic

## 3. Multiplayer E2E Coverage

- [x] 3.1 Write a Playwright test that opens one host page and two player pages
- [x] 3.2 Automate session creation, join-code capture, player joins, and host start-bidding
- [x] 3.3 Automate one player bid and one player skip during the countdown
- [x] 3.4 Assert countdown resolution, session completion, cash deduction, property ownership, and player privacy

## 4. Verification

- [x] 4.1 Run Playwright E2E tests and fix failures
- [x] 4.2 Run Vitest, production build, and OpenSpec validation
- [x] 4.3 Use passing Playwright evidence to close the remaining multiplayer browser verification task if appropriate
