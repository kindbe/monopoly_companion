## MODIFIED Requirements

### Requirement: Host session state
The system MUST provide the host with controls and status needed to run the multiplayer bidding session.

#### Scenario: Host sees joined players
- **WHEN** players join a waiting session
- **THEN** the system SHALL show the host the joined player names and session readiness

#### Scenario: Host starts bidding
- **WHEN** the host starts bidding
- **THEN** the system SHALL generate the hidden randomized property deck and reveal the first property

#### Scenario: Start bidding without a connection
- **WHEN** the host attempts to start bidding while the multiplayer connection is not open
- **THEN** the system SHALL show the host an error message and keep the host in the lobby
