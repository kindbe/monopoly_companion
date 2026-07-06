## Purpose

Define realtime host/player multiplayer bidding sessions for Monopoly property setup.

## Requirements

### Requirement: Host-created bidding session
The system MUST allow a host to create a multiplayer bidding session with a join code.

#### Scenario: Create session code
- **WHEN** the host creates a multiplayer bidding session
- **THEN** the system SHALL create an active session and display a join code for players

#### Scenario: Join code uniqueness
- **WHEN** a join code is generated
- **THEN** the system SHALL ensure the code does not collide with another active session

### Requirement: Player join flow
The system MUST allow players to join an active session with a join code and player name.

#### Scenario: Join valid session
- **WHEN** a player enters a valid join code and non-empty name
- **THEN** the system SHALL add that player to the session and show their player bidding view

#### Scenario: Reject invalid join
- **WHEN** a player enters an unknown join code or empty name
- **THEN** the system SHALL reject the join attempt and show an error

### Requirement: Private player state
The system MUST send each player only the session state they are allowed to see.

#### Scenario: Player-visible state
- **WHEN** a player is connected to a session
- **THEN** the system SHALL show the current property, current bid, remaining property count, that player's remaining cash, that player's won properties, and bid or skip controls

#### Scenario: Hide other-player state
- **WHEN** a player receives session state
- **THEN** the system SHALL NOT include other players' remaining cash, won properties, or bid submissions

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

### Requirement: Synchronized bidding countdown
The system MUST run each revealed property through a server-controlled 30-second countdown.

#### Scenario: Start property countdown
- **WHEN** a property is revealed for bidding
- **THEN** the system SHALL start a 30-second countdown shared by all connected clients

#### Scenario: Countdown tick updates
- **WHEN** the countdown is active
- **THEN** the system SHALL update host and player views with the remaining time

#### Scenario: Countdown expiry
- **WHEN** the 30-second countdown expires
- **THEN** the system SHALL close bid submission for that property and resolve the bidding result

### Requirement: Player bid and skip actions
The system MUST let each player bid or skip during the active countdown.

#### Scenario: Submit valid bid
- **WHEN** a player submits a bid during the active countdown that does not exceed their remaining cash
- **THEN** the system SHALL record that player's latest bid for the current property

#### Scenario: Skip current property
- **WHEN** a player skips during the active countdown
- **THEN** the system SHALL record that player as skipped for the current property

#### Scenario: Reject late action
- **WHEN** a player submits a bid or skip after the countdown has expired
- **THEN** the system SHALL reject the action

### Requirement: Server-side property resolution
The system MUST resolve each multiplayer bidding round on the server.

#### Scenario: Assign winning property
- **WHEN** at least one valid bid exists when the countdown expires
- **THEN** the system SHALL assign the property to the winning bidder and deduct the winning price from that player's remaining cash

#### Scenario: Skip property with no bids
- **WHEN** no valid bids exist when the countdown expires
- **THEN** the system SHALL leave the property unowned and advance the session

### Requirement: Multiplayer completion
The system MUST complete the session after all selected properties are resolved.

#### Scenario: Complete multiplayer session
- **WHEN** the final selected property is resolved
- **THEN** the system SHALL show each player their final remaining cash and won properties and show the host the session summary

### Requirement: Automated multiplayer verification
The system MUST include automated browser verification for the multiplayer bidding session flow.

#### Scenario: Browser verification replaces manual proof
- **WHEN** automated Playwright verification completes successfully for the host plus two-player flow
- **THEN** the multiplayer bidding session change SHALL have browser-level evidence that the session can be completed through the UI

#### Scenario: Browser verification covers realtime integration
- **WHEN** the Playwright multiplayer test executes
- **THEN** the system SHALL verify browser UI updates are driven by WebSocket session events across host and player pages
