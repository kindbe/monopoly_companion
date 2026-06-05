## ADDED Requirements

### Requirement: Automated multiplayer verification
The system MUST include automated browser verification for the multiplayer bidding session flow.

#### Scenario: Browser verification replaces manual proof
- **WHEN** automated Playwright verification completes successfully for the host plus two-player flow
- **THEN** the multiplayer bidding session change SHALL have browser-level evidence that the session can be completed through the UI

#### Scenario: Browser verification covers realtime integration
- **WHEN** the Playwright multiplayer test executes
- **THEN** the system SHALL verify browser UI updates are driven by WebSocket session events across host and player pages
