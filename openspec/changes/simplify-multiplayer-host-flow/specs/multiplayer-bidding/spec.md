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
- **THEN** the system SHALL ensure the code does not collide with another active session

### Requirement: Player join flow
The system MUST allow players to join an active lobby with a join code and player name.

#### Scenario: Join valid session
- **WHEN** a player enters a valid join code and non-empty name
- **THEN** the system SHALL add that player to the session and show their player bidding view placeholder until bidding starts

#### Scenario: Reject invalid join
- **WHEN** a player enters an unknown join code or empty name
- **THEN** the system SHALL reject the join attempt and show an error

### Requirement: Host lobby state
The system MUST provide the host with lobby controls and status before bidding starts.

#### Scenario: Host sees join code
- **WHEN** the host creates a session
- **THEN** the system SHALL show the join code on the host page

#### Scenario: Host sees joined players
- **WHEN** players join a waiting session
- **THEN** the system SHALL show the host the joined player names, including the host

#### Scenario: Host starts bidding
- **WHEN** the host presses `Start Bidding`
- **THEN** the system SHALL generate the hidden randomized property deck and reveal the first property

#### Scenario: Bidding waits for host
- **WHEN** players have joined but the host has not pressed `Start Bidding`
- **THEN** the system SHALL keep the session in the lobby and SHALL NOT reveal the first property

### Requirement: Host player participation
The system MUST make the host a normal bidder after bidding starts.

#### Scenario: Host sees player bidding view
- **WHEN** the host starts bidding
- **THEN** the host SHALL see the same player bidding view as other participants

#### Scenario: Host can bid or skip
- **WHEN** a property is active and the host has not skipped
- **THEN** the host SHALL be able to bid or skip using the same controls as other players

#### Scenario: Host can win property
- **WHEN** the host submits the winning bid
- **THEN** the system SHALL assign that property to the host player and deduct the winning price from the host player's cash

### Requirement: Multiplayer completion
The system MUST complete the session after all selected properties are resolved.

#### Scenario: Complete multiplayer session
- **WHEN** the final selected property is resolved
- **THEN** the system SHALL show each participant, including the host, their own final remaining cash and won properties in the player summary view
