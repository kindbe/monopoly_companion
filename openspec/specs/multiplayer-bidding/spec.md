## Purpose

Define realtime host/player multiplayer bidding sessions for Monopoly property setup.
## Requirements
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

### Requirement: Private player state
The system MUST send each player only the session state they are allowed to see.

#### Scenario: Player-visible state
- **WHEN** a player is connected to a session
- **THEN** the system SHALL show the current property, current bid, remaining property count, that player's remaining cash, that player's won properties, and bid or skip controls

#### Scenario: Player-owned property cards
- **WHEN** a player has won properties
- **THEN** the system SHALL show miniature property cards carrying each property name and its colour band with the group name as text, and no other property detail, sorted by color group from most valuable to least

#### Scenario: Hide other-player state
- **WHEN** a player receives session state
- **THEN** the system SHALL NOT include other players' remaining cash, won properties, or bid submissions

### Requirement: Host session state
The system MUST give the host pre-game lobby controls only, and MUST NOT keep a host spectator view once bidding starts.

#### Scenario: Host sees joined players
- **WHEN** players join a waiting session
- **THEN** the system SHALL show the host the join code, the joined player names including the host, and each player's connection state

#### Scenario: Host starts bidding
- **WHEN** the host starts bidding
- **THEN** the system SHALL generate the hidden randomized property deck and reveal the first property

#### Scenario: Start bidding without a connection
- **WHEN** the host attempts to start bidding while the multiplayer connection is not open
- **THEN** the system SHALL show the host an error message and keep the host in the lobby

#### Scenario: Host lobby is hidden once bidding starts
- **WHEN** bidding has started
- **THEN** the system SHALL NOT show the host the lobby, the join code, or any host-only auction status view

#### Scenario: Host lobby is hidden at completion
- **WHEN** the session completes
- **THEN** the system SHALL NOT show the host the lobby, the join code, or any host-only auction status view

### Requirement: Synchronized bidding countdown
The system MUST run each revealed property through a configurable countdown controlled by the authoritative peer.

#### Scenario: Start property countdown
- **WHEN** a property is revealed for bidding
- **THEN** the system SHALL start the configured countdown shared by all connected clients

#### Scenario: Countdown tick updates
- **WHEN** the countdown is active
- **THEN** the system SHALL update host and player views with the remaining time

#### Scenario: Countdown is always visible during bidding
- **WHEN** a player views active bidding on any supported device
- **THEN** the countdown SHALL be visible without scrolling for the whole round, placed adjacent to the property card on wide viewports and pinned in view on narrow viewports where the property detail scrolls

#### Scenario: Countdown expiry
- **WHEN** the countdown expires
- **THEN** the system SHALL close bid submission for that property and resolve the bidding result

### Requirement: Player bid and skip actions
The system MUST let each player bid or skip during the active countdown using quick bid increment actions.

#### Scenario: Submit valid bid
- **WHEN** a player submits a bid during the active countdown that does not exceed their remaining cash
- **THEN** the system SHALL record that player's latest bid for the current property

#### Scenario: Use quick increment in multiplayer
- **WHEN** a player selects a quick bid increment during multiplayer bidding
- **THEN** the system SHALL raise the current bid by the selected amount if the resulting bid is affordable

#### Scenario: Skip current property
- **WHEN** a player skips during the active countdown
- **THEN** the system SHALL record that player as skipped for the current property and disable that player's bid controls until the next property is revealed

#### Scenario: All players skip
- **WHEN** every connected player skips the current property before the countdown expires and no bid has been submitted
- **THEN** the system SHALL leave the property unowned, show a `Skipped!` overlay, and advance to the next property

#### Scenario: Reject late action
- **WHEN** a player submits a bid or skip after the countdown has expired
- **THEN** the system SHALL reject the action

### Requirement: Server-side property resolution
The system MUST resolve each multiplayer bidding round in the session's authoritative peer — the session server by default, or the host browser when the host-authoritative transport is in use — using the property's opening bid and submitted quick-increment bids.

#### Scenario: Assign winning property
- **WHEN** at least one valid bid exists when the countdown expires
- **THEN** the system SHALL assign the property to the winning bidder and deduct the winning price from that player's remaining cash

#### Scenario: Skip property with no bids
- **WHEN** no valid bids exist when the countdown expires
- **THEN** the system SHALL leave the property unowned and advance the session

#### Scenario: Start multiplayer property at opening bid
- **WHEN** a property is revealed in a multiplayer bidding session
- **THEN** the system SHALL expose the current bid as 25% of the property's retail value rounded up to the nearest $10

#### Scenario: Resolution authority follows the transport
- **WHEN** the host-authoritative transport is in use
- **THEN** the host browser SHALL perform the resolution described above, and player browsers SHALL NOT resolve rounds independently

### Requirement: Multiplayer completion
The system MUST complete the session after all selected properties are resolved.

#### Scenario: Complete multiplayer session
- **WHEN** the final selected property is resolved
- **THEN** the system SHALL show each participant, including the host, their own final remaining cash and won properties in the player summary view

#### Scenario: No host-only summary
- **WHEN** the session completes
- **THEN** the system SHALL NOT show the host a separate host-only session summary in place of their player summary

#### Scenario: Bidding controls are inactive at completion
- **WHEN** the session has completed
- **THEN** the system SHALL disable the bid and skip controls for every participant, so that no participant can submit an action the session would reject

### Requirement: Automated multiplayer verification
The system MUST include automated browser verification for the multiplayer bidding session flow.

#### Scenario: Browser verification replaces manual proof
- **WHEN** automated Playwright verification completes successfully for the host plus two-player flow
- **THEN** the multiplayer bidding session change SHALL have browser-level evidence that the session can be completed through the UI

#### Scenario: Browser verification covers realtime integration
- **WHEN** the Playwright multiplayer test executes
- **THEN** the system SHALL verify browser UI updates are driven by WebRTC DataChannel session messages across host and player pages

### Requirement: Host-authoritative session continuity
The system MUST treat the host browser as required authority for an active multiplayer session.

#### Scenario: Host disconnects
- **WHEN** the host browser disconnects, closes, or loses its peer connection
- **THEN** connected player browsers SHALL show that the host is unavailable and SHALL NOT continue accepting bids or resolving properties

#### Scenario: Player reconnects
- **WHEN** a previously joined player reconnects during an active host-owned session
- **THEN** the host browser SHALL reconcile the player by stable player identity and send the latest player-safe session snapshot

### Requirement: Player bidding visual presentation
The system MUST present active player bidding without setup-only labels or redundant card text.

#### Scenario: Remove player bidding heading
- **WHEN** a player views active bidding
- **THEN** the system SHALL NOT show the heading text `Player Bidding`

#### Scenario: Property name is the card's dominant text
- **WHEN** a property card is displayed
- **THEN** the property name SHALL be the largest text on the card and SHALL scale with the available card width, wrapping rather than truncating

#### Scenario: Colour group is named on the band, not as a stat row
- **WHEN** a property card is displayed
- **THEN** the card SHALL NOT include a separate `Color Group` stat among its price and rent values, and SHALL instead render the group name as text on the colour band

### Requirement: Host player participation
The system MUST treat the host as a normal bidder for the whole auction once bidding starts.

#### Scenario: Host enters the bidding view
- **WHEN** the host starts bidding
- **THEN** the system SHALL move the host to the same player bidding view that joined players see, with the host's own remaining cash and won properties

#### Scenario: Host bids and skips
- **WHEN** a property is active and the host has not skipped or exhausted their bids
- **THEN** the host SHALL be able to bid and skip through the same controls, limits, and validation as any joined player

#### Scenario: Host wins a property
- **WHEN** the host holds the winning bid at settlement
- **THEN** the system SHALL assign the property to the host player and deduct the winning price from the host player's remaining cash

### Requirement: Connected-player round settlement
The system MUST settle the all-skipped early advance from the connected players only, where a connected player is one present in the session's connected-player set.

#### Scenario: Disconnected player does not block the early advance
- **WHEN** no bid has been submitted for the current property, every connected player has skipped it before the countdown expires, and at least one registered player is disconnected
- **THEN** the system SHALL leave the property unowned, show the `Skipped!` message, and advance to the next property without waiting for the countdown

#### Scenario: An existing bid prevents the early advance
- **WHEN** a bid has been submitted for the current property and every connected player has since skipped it
- **THEN** the system SHALL NOT advance early, and SHALL resolve the property at countdown expiry in favour of the highest bidder, including when that bidder has disconnected

#### Scenario: No connected players
- **WHEN** no player in the session is connected
- **THEN** the system SHALL NOT advance the current property early and SHALL leave settlement to countdown expiry

#### Scenario: Disconnected player keeps their winnings
- **WHEN** a player disconnects after winning a property
- **THEN** the system SHALL keep that player in the session roster with their remaining cash and won properties intact

