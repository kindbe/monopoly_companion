## Purpose

Define browser-based end-to-end automation for critical app flows.
## Requirements
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

### Requirement: Multiplayer browser flow automation
The system MUST automate the multiplayer bidding browser flow with one host and at least two player pages.

#### Scenario: Complete multiplayer browser session
- **WHEN** the Playwright multiplayer test runs
- **THEN** the system SHALL create a host session, join two players by code, start bidding, submit bids or skips, resolve properties, and verify session completion

#### Scenario: Verify player browser privacy
- **WHEN** a player page receives multiplayer session state during the Playwright test
- **THEN** the page SHALL show that player's own cash and won properties without showing other players' private cash or won properties

#### Scenario: Verify skipped-round player feedback
- **WHEN** all players skip a property during the Playwright test
- **THEN** each player page SHALL show skipped feedback and move to the next property

#### Scenario: Verify simplified landing
- **WHEN** the Playwright multiplayer test opens the app
- **THEN** the page SHALL show `Host Multiplayer` and `Join Session` without local/hot-seat setup controls

#### Scenario: Verify polished bidding UI
- **WHEN** the Playwright multiplayer test reaches active bidding
- **THEN** the system SHALL verify that the property card, current bid, and quick bid increment controls are visible

### Requirement: Fast E2E countdown
The system MUST support a test-safe countdown configuration for E2E automation.

#### Scenario: Use shortened countdown in E2E
- **WHEN** the Playwright multiplayer test creates a session
- **THEN** the system SHALL allow the session countdown to be configured within the supported 5-30 second range

#### Scenario: Preserve production countdown default
- **WHEN** users create normal multiplayer sessions outside E2E configuration
- **THEN** the system SHALL default to a 10-second bidding countdown

### Requirement: Host participation browser automation
The system MUST automate verification that the host bids as a normal participant and that the host lobby does not reappear once bidding starts.

This is expressed as its own requirement rather than as a modification of `Multiplayer browser flow automation`, because that requirement is modified in full by several unarchived changes and a whole-body replacement would silently discard these scenarios on archive. See "Spec conflicts" in `design.md`.

#### Scenario: Verify host participates as a bidder
- **WHEN** the Playwright multiplayer test starts bidding from the host page
- **THEN** the host page SHALL show the player bidding view with the host's own cash and remaining bids, and the host SHALL be able to submit a bid that other player pages attribute to the host

#### Scenario: Verify the host lobby is hidden once bidding starts
- **WHEN** bidding has started during the Playwright multiplayer test
- **THEN** the host page SHALL NOT show the host lobby heading or the join code

#### Scenario: Verify the host lobby is hidden at completion
- **WHEN** the session completes during the Playwright multiplayer test
- **THEN** the host page SHALL NOT show the host lobby heading or the join code, and SHALL show the host their own player summary

