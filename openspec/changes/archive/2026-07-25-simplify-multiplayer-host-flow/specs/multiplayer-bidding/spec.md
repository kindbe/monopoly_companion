## MODIFIED Requirements

### Requirement: Host-created bidding session
The system MUST allow a host to create a multiplayer bidding session with a join code while also joining as a player.

#### Scenario: Host setup requires name
- **WHEN** the host creates a multiplayer bidding session
- **THEN** the system SHALL require a non-empty host player name

#### Scenario: Create session code
- **WHEN** the host creates a multiplayer bidding session with a valid name and configuration
- **THEN** the system SHALL create an active lobby, create the host as the first player, and display a join code for additional players

#### Scenario: Join code uniqueness
- **WHEN** a join code is generated
- **THEN** the system SHALL ensure the code does not collide with another active session, including any active signaling session when the host-authoritative transport is in use

### Requirement: Player join flow
The system MUST allow players to join an active lobby with a join code and player name.

#### Scenario: Join valid session
- **WHEN** a player enters a valid join code and non-empty name
- **THEN** the system SHALL add that player to the session and show their player bidding view placeholder until bidding starts

#### Scenario: Reject invalid join
- **WHEN** a player enters an unknown join code or empty name
- **THEN** the system SHALL reject the join attempt and show an error
