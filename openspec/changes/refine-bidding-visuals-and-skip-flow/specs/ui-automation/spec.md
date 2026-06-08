## MODIFIED Requirements

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

### Requirement: Fast E2E countdown
The system MUST support a test-safe countdown configuration for E2E automation.

#### Scenario: Use shortened countdown in E2E
- **WHEN** the Playwright multiplayer test creates a session
- **THEN** the system SHALL allow the session countdown to be configured within the supported 5-30 second range

#### Scenario: Preserve production countdown default
- **WHEN** users create normal multiplayer sessions outside E2E configuration
- **THEN** the system SHALL default to a 10-second bidding countdown
