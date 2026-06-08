## MODIFIED Requirements

### Requirement: Synchronized bidding countdown
The system MUST run each revealed property through a server-controlled configurable countdown.

#### Scenario: Start property countdown
- **WHEN** a property is revealed for bidding
- **THEN** the system SHALL start the configured countdown shared by all connected clients

#### Scenario: Countdown tick updates
- **WHEN** the countdown is active
- **THEN** the system SHALL update host and player views with the remaining time

#### Scenario: Player countdown placement
- **WHEN** a player views active bidding
- **THEN** the system SHALL show the countdown below the current property card

#### Scenario: Countdown expiry
- **WHEN** the countdown expires
- **THEN** the system SHALL close bid submission for that property and resolve the bidding result

### Requirement: Player bid and skip actions
The system MUST let each player bid or skip during the active countdown.

#### Scenario: Submit valid bid
- **WHEN** a player submits a bid during the active countdown that does not exceed their remaining cash
- **THEN** the system SHALL record that player's latest bid for the current property

#### Scenario: Skip current property
- **WHEN** a player skips during the active countdown
- **THEN** the system SHALL record that player as skipped for the current property and disable that player's bid controls until the next property is revealed

#### Scenario: All players skip
- **WHEN** every active player skips the current property before the countdown expires
- **THEN** the system SHALL leave the property unowned, show a `Skipped!` overlay, and advance to the next property

#### Scenario: Reject late action
- **WHEN** a player submits a bid or skip after the countdown has expired
- **THEN** the system SHALL reject the action

### Requirement: Private player state
The system MUST send each player only the session state they are allowed to see.

#### Scenario: Player-visible state
- **WHEN** a player is connected to a session
- **THEN** the system SHALL show the current property, current bid, remaining property count, that player's remaining cash, that player's won properties, and bid or skip controls

#### Scenario: Player-owned property cards
- **WHEN** a player has won properties
- **THEN** the system SHALL show miniature property cards with only each property name and color header, sorted by color group from most valuable to least

#### Scenario: Hide other-player state
- **WHEN** a player receives session state
- **THEN** the system SHALL NOT include other players' remaining cash, won properties, or bid submissions

### Requirement: Player bidding visual presentation
The system MUST present active player bidding without setup-only labels or redundant card text.

#### Scenario: Remove player bidding heading
- **WHEN** a player views active bidding
- **THEN** the system SHALL NOT show the heading text `Player Bidding`

#### Scenario: Property card title cap
- **WHEN** a property card is displayed
- **THEN** the property name text SHALL NOT exceed 24pt

#### Scenario: Remove color group stat
- **WHEN** a property card is displayed
- **THEN** the card SHALL NOT include a separate `Color Group` stat
