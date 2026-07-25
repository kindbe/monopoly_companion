## MODIFIED Requirements

### Requirement: Playwright E2E test runner
The system MUST provide a Playwright-based end-to-end test runner for browser automation and theme behavior.

#### Scenario: Run E2E tests
- **WHEN** the developer runs the E2E test command
- **THEN** the system SHALL execute Playwright browser tests against the app

#### Scenario: Start required servers
- **WHEN** Playwright E2E tests run
- **THEN** the system SHALL start or connect to the Vite app server and the Node session or signaling server required by the tests

#### Scenario: Verify theme toggle
- **WHEN** the Playwright UI test toggles dark mode
- **THEN** the system SHALL show the app in dark mode without requiring a page reload
