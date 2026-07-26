## MODIFIED Requirements

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

## ADDED Requirements

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
