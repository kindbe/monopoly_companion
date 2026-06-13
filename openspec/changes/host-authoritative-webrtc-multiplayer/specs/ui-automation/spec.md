## MODIFIED Requirements

### Requirement: Playwright E2E test runner
The system MUST provide a Playwright-based end-to-end test runner for browser automation.

#### Scenario: Run E2E tests
- **WHEN** the developer runs the E2E test command
- **THEN** the system SHALL execute Playwright browser tests against the app

#### Scenario: Start required servers
- **WHEN** Playwright E2E tests run
- **THEN** the system SHALL start or connect to the Vite app server and signaling server required by the tests

### Requirement: Multiplayer browser flow automation
The system MUST automate the multiplayer bidding browser flow with one host and at least two player pages.

#### Scenario: Complete multiplayer browser session
- **WHEN** the Playwright multiplayer test runs
- **THEN** the system SHALL create a host session, connect two players by join code and WebRTC DataChannel, start bidding, submit one bid, submit one skip, resolve the property, and verify session completion

#### Scenario: Verify player browser privacy
- **WHEN** a player page receives multiplayer session state during the Playwright test
- **THEN** the page SHALL show that player's own cash and won properties without showing other players' private cash or won properties

### Requirement: Fast E2E countdown
The system MUST support a test-safe countdown configuration for E2E automation.

#### Scenario: Use shortened countdown in E2E
- **WHEN** the Playwright multiplayer test creates a session
- **THEN** the host-owned session SHALL allow the session countdown to be shorter than the production 30-second countdown

#### Scenario: Preserve production countdown
- **WHEN** users create normal multiplayer sessions outside E2E configuration
- **THEN** the system SHALL preserve the 30-second bidding countdown
