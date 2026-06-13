## MODIFIED Requirements

### Requirement: Host-created bidding session
The system MUST allow a host to create a multiplayer bidding session with a join code.

#### Scenario: Create session code
- **WHEN** the host creates a multiplayer bidding session
- **THEN** the system SHALL create a host-owned active session in the host browser and display a join code for players

#### Scenario: Join code uniqueness
- **WHEN** a join code is generated
- **THEN** the signaling server SHALL ensure the code does not collide with another active signaling session

### Requirement: Player join flow
The system MUST allow players to join an active session with a join code and player name.

#### Scenario: Join valid session
- **WHEN** a player enters a valid join code and non-empty name
- **THEN** the system SHALL establish a WebRTC DataChannel to the host, send a join intent to the host browser, add that player to the host-owned session, and show their player bidding view

#### Scenario: Reject invalid join
- **WHEN** a player enters an unknown join code or empty name
- **THEN** the system SHALL reject the join attempt and show an error

### Requirement: Private player state
The system MUST send each player only the session state they are allowed to see.

#### Scenario: Player-visible state
- **WHEN** a player is connected to a session
- **THEN** the system SHALL show the current property, current bid, remaining property count, that player's remaining cash, that player's won properties, and bid or skip controls from host-sent player state

#### Scenario: Hide other-player state
- **WHEN** a player receives session state from the host
- **THEN** the state SHALL NOT include other players' remaining cash, won properties, or bid submissions

### Requirement: Host session state
The system MUST provide the host with controls and status needed to run the multiplayer bidding session.

#### Scenario: Host sees joined players
- **WHEN** players join a waiting session
- **THEN** the host-owned session SHALL show the host the joined player names and session readiness

#### Scenario: Host starts bidding
- **WHEN** the host starts bidding
- **THEN** the host browser SHALL generate the hidden randomized property deck and reveal the first property

### Requirement: Synchronized bidding countdown
The system MUST run each revealed property through a host-controlled 30-second countdown.

#### Scenario: Start property countdown
- **WHEN** a property is revealed for bidding
- **THEN** the host browser SHALL start a 30-second countdown shared with all connected clients

#### Scenario: Countdown tick updates
- **WHEN** the countdown is active
- **THEN** the host browser SHALL update host and player views with the remaining time

#### Scenario: Countdown expiry
- **WHEN** the 30-second countdown expires
- **THEN** the host browser SHALL close bid submission for that property and resolve the bidding result

### Requirement: Player bid and skip actions
The system MUST let each player bid or skip during the active countdown.

#### Scenario: Submit valid bid
- **WHEN** a player submits a bid during the active countdown that does not exceed their remaining cash
- **THEN** the player browser SHALL send the bid intent to the host browser and the host browser SHALL record that player's latest bid for the current property

#### Scenario: Skip current property
- **WHEN** a player skips during the active countdown
- **THEN** the player browser SHALL send the skip intent to the host browser and the host browser SHALL record that player as skipped for the current property

#### Scenario: Reject late action
- **WHEN** a player submits a bid or skip after the countdown has expired
- **THEN** the host browser SHALL reject the action

### Requirement: Server-side property resolution
The system MUST resolve each multiplayer bidding round in the host browser.

#### Scenario: Assign winning property
- **WHEN** at least one valid bid exists when the countdown expires
- **THEN** the host browser SHALL assign the property to the winning bidder and deduct the winning price from that player's remaining cash

#### Scenario: Skip property with no bids
- **WHEN** no valid bids exist when the countdown expires
- **THEN** the host browser SHALL leave the property unowned and advance the session

### Requirement: Multiplayer completion
The system MUST complete the session after all selected properties are resolved.

#### Scenario: Complete multiplayer session
- **WHEN** the final selected property is resolved
- **THEN** the host browser SHALL send completion state so each player sees their final remaining cash and won properties and the host sees the session summary

### Requirement: Automated multiplayer verification
The system MUST include automated browser verification for the multiplayer bidding session flow.

#### Scenario: Browser verification replaces manual proof
- **WHEN** automated Playwright verification completes successfully for the host plus two-player flow
- **THEN** the multiplayer bidding session change SHALL have browser-level evidence that the session can be completed through the UI

#### Scenario: Browser verification covers realtime integration
- **WHEN** the Playwright multiplayer test executes
- **THEN** the system SHALL verify browser UI updates are driven by WebRTC DataChannel session messages across host and player pages

## ADDED Requirements

### Requirement: Host-authoritative session continuity
The system MUST treat the host browser as required authority for an active multiplayer session.

#### Scenario: Host disconnects
- **WHEN** the host browser disconnects, closes, or loses its peer connection
- **THEN** connected player browsers SHALL show that the host is unavailable and SHALL NOT continue accepting bids or resolving properties

#### Scenario: Player reconnects
- **WHEN** a previously joined player reconnects during an active host-owned session
- **THEN** the host browser SHALL reconcile the player by stable player identity and send the latest player-safe session snapshot
