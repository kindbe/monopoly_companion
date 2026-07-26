## MODIFIED Requirements

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
