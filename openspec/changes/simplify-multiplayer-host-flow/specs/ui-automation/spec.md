## MODIFIED Requirements

### Requirement: Multiplayer browser flow automation
The system MUST automate the simplified multiplayer bidding browser flow with one host and at least one joined player.

#### Scenario: Verify simplified landing
- **WHEN** the Playwright multiplayer test opens the app
- **THEN** the page SHALL show `Host Multiplayer` and `Join Session` without local/hot-seat setup controls

#### Scenario: Complete host-as-player browser session
- **WHEN** the Playwright multiplayer test runs
- **THEN** the system SHALL create a session with a host name, join another player by code, show both names in the lobby, start bidding from the host, let the host participate as a bidder, and verify session completion

#### Scenario: Verify host player summary
- **WHEN** the multiplayer browser session completes
- **THEN** the host page SHALL show the same player summary style as other participants rather than a host-only session summary

#### Scenario: Verify player browser privacy
- **WHEN** a player page receives multiplayer session state during the Playwright test
- **THEN** the page SHALL show that player's own cash and won properties without showing other players' private cash or won properties
