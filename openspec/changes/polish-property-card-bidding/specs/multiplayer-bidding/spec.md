## MODIFIED Requirements

### Requirement: Player bid and skip actions
The system MUST let each player bid or skip during the active countdown using quick bid increment actions.

#### Scenario: Submit valid bid
- **WHEN** a player submits a bid during the active countdown that does not exceed their remaining cash
- **THEN** the system SHALL record that player's latest bid for the current property

#### Scenario: Skip current property
- **WHEN** a player skips during the active countdown
- **THEN** the system SHALL record that player as skipped for the current property

#### Scenario: Reject late action
- **WHEN** a player submits a bid or skip after the countdown has expired
- **THEN** the system SHALL reject the action

#### Scenario: Use quick increment in multiplayer
- **WHEN** a player selects a quick bid increment during multiplayer bidding
- **THEN** the system SHALL raise the current bid by the selected amount if the resulting bid is affordable

### Requirement: Server-side property resolution
The system MUST resolve each multiplayer bidding round on the server using the property's opening bid and submitted quick-increment bids.

#### Scenario: Assign winning property
- **WHEN** at least one valid bid exists when the countdown expires
- **THEN** the system SHALL assign the property to the winning bidder and deduct the winning price from that player's remaining cash

#### Scenario: Skip property with no bids
- **WHEN** no valid bids exist when the countdown expires
- **THEN** the system SHALL leave the property unowned and advance the session

#### Scenario: Start multiplayer property at opening bid
- **WHEN** a property is revealed in a multiplayer bidding session
- **THEN** the system SHALL expose the current bid as 25% of the property's retail value rounded up to the nearest $10
