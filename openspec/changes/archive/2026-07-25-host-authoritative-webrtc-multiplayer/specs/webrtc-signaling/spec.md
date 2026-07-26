## ADDED Requirements

### Requirement: Signaling session registration
The system SHALL allow a host browser to register a temporary signaling session with a join code for WebRTC connection setup.

#### Scenario: Register host signaling session
- **WHEN** the host starts a multiplayer session
- **THEN** the signaling server SHALL register the host as the signaling owner for a join code without creating authoritative bidding state

#### Scenario: Expire abandoned signaling session
- **WHEN** a registered host disconnects or the signaling session exceeds its configured lifetime
- **THEN** the signaling server SHALL remove the join code so future players cannot join the abandoned session

### Requirement: Player signaling lookup
The system SHALL allow a player browser to locate a host signaling session by join code.

#### Scenario: Locate active host
- **WHEN** a player enters a valid join code
- **THEN** the signaling server SHALL connect that player to the host signaling exchange for that code

#### Scenario: Reject unknown join code
- **WHEN** a player enters an unknown or expired join code
- **THEN** the signaling server SHALL reject the lookup and return an error that the client can display

### Requirement: WebRTC negotiation relay
The system SHALL relay WebRTC negotiation messages needed to establish host/player DataChannels.

#### Scenario: Exchange offer and answer
- **WHEN** a host and player are matched by join code
- **THEN** the signaling server SHALL relay offer and answer messages between those two browsers

#### Scenario: Exchange ICE candidates
- **WHEN** either browser discovers an ICE candidate for a pending peer connection
- **THEN** the signaling server SHALL relay that candidate to the matched peer

### Requirement: No game-state relay through signaling
The signaling server MUST NOT carry authoritative multiplayer bidding state after a host/player DataChannel is established.

#### Scenario: DataChannel connected
- **WHEN** a host/player DataChannel reports open
- **THEN** bid intents, skip intents, countdown state, player cash, property ownership, and completed bid history SHALL flow through the peer connection rather than the signaling server

#### Scenario: Signaling payload boundary
- **WHEN** the signaling server receives a message
- **THEN** it SHALL accept only signaling message types and SHALL reject game-state messages such as bid submission, skip submission, state snapshots, countdown ticks, or property resolution

### Requirement: Signaling scale boundary
The signaling server SHALL keep only ephemeral peer-setup state so it can scale independently from bidding-session state.

#### Scenario: Store ephemeral signaling data
- **WHEN** a signaling session is active
- **THEN** the signaling server SHALL store only join-code ownership, connected signaling clients, pending negotiation metadata, and cleanup timestamps

#### Scenario: Support multi-instance deployment path
- **WHEN** the signaling service is deployed across multiple instances
- **THEN** the system SHALL support either sticky routing for a join code or a shared ephemeral signaling store for routing negotiation messages
