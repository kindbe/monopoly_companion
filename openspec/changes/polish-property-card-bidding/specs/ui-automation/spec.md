## MODIFIED Requirements

### Requirement: Multiplayer browser flow automation
The system MUST automate the multiplayer bidding browser flow with one host and at least two player pages, including the polished property card and quick bid behavior.

#### Scenario: Complete multiplayer browser session
- **WHEN** the Playwright multiplayer test runs
- **THEN** the system SHALL create a host session, join two players by code, start bidding, submit one quick-increment bid, submit one skip, resolve the property, and verify session completion

#### Scenario: Verify player browser privacy
- **WHEN** a player page receives multiplayer session state during the Playwright test
- **THEN** the page SHALL show that player's own cash and won properties without showing other players' private cash or won properties

#### Scenario: Verify polished bidding UI
- **WHEN** the Playwright multiplayer test reaches active bidding
- **THEN** the system SHALL verify that the property card, current bid, and quick bid increment controls are visible

### Requirement: Playwright E2E test runner
The system MUST provide a Playwright-based end-to-end test runner for browser automation and theme behavior.

#### Scenario: Run E2E tests
- **WHEN** the developer runs the E2E test command
- **THEN** the system SHALL execute Playwright browser tests against the app

#### Scenario: Start required servers
- **WHEN** Playwright E2E tests run
- **THEN** the system SHALL start or connect to the Vite app server and Node/WebSocket server required by the tests

#### Scenario: Verify theme toggle
- **WHEN** the Playwright UI test toggles dark mode
- **THEN** the system SHALL show the app in dark mode without requiring a page reload
