## Purpose

Define the setup-phase property bidding flow for assigning Monopoly properties before normal gameplay begins.
## Requirements
### Requirement: Pre-game property bidding flow
The system MUST provide a multiplayer-only pre-game bidding flow that allows players to compete for Monopoly properties before the main game starts.

#### Scenario: Multiplayer-only landing
- **WHEN** the app first loads
- **THEN** the system SHALL show only `Host Multiplayer` and `Join Session` as primary flow choices

#### Scenario: No local hot-seat entry
- **WHEN** the app first loads
- **THEN** the system SHALL NOT show local/hot-seat bidding setup controls as a primary flow

#### Scenario: Start multiplayer setup
- **WHEN** the user chooses `Host Multiplayer`
- **THEN** the system SHALL present the host setup options for a multiplayer bidding session

#### Scenario: Resolve property ownership
- **WHEN** the bidding flow completes
- **THEN** the system SHALL assign each available property to a player according to the bidding result

#### Scenario: Complete bidding summary
- **WHEN** the bidding flow completes
- **THEN** the system SHALL show each player their own assigned properties and remaining starting cash

### Requirement: Configurable property pool
The system MUST let the host configure which properties can appear in the multiplayer bidding flow.

#### Scenario: Default property count
- **WHEN** the host starts setup without changing the property count
- **THEN** the system SHALL use 10 properties for the bidding flow

#### Scenario: Property count limit
- **WHEN** the host changes the property count
- **THEN** the system SHALL allow values up to the number of currently eligible properties

#### Scenario: Default eligible categories
- **WHEN** the property pool is configured with default settings
- **THEN** the system SHALL include street properties and exclude railroads and utilities

#### Scenario: Optional railroads and utilities
- **WHEN** the host enables railroads or utilities
- **THEN** the system SHALL include those enabled categories in the eligible property pool

### Requirement: Hidden randomized property reveal
The system MUST reveal selected properties one at a time in random order without showing the full selected list ahead of time.

#### Scenario: Begin randomized reveal
- **WHEN** bidding starts
- **THEN** the system SHALL randomly select and order the configured number of properties from the eligible property pool

#### Scenario: Hide unrevealed properties
- **WHEN** bidding is in progress
- **THEN** the system SHALL show the current revealed property without exposing the unrevealed property list

#### Scenario: No-bid property
- **WHEN** no player bids on the revealed property
- **THEN** the system SHALL leave the property unowned and proceed to the next property

### Requirement: Setup cash budget
The system MUST use each player's Monopoly starting cash as the budget for setup bidding and MUST reject bids created from quick increment actions when they exceed a player's remaining cash.

#### Scenario: Reject unaffordable bid
- **WHEN** a player attempts to place a bid above their remaining setup cash
- **THEN** the system SHALL reject the bid

#### Scenario: Deduct winning bid
- **WHEN** a player wins a property
- **THEN** the system SHALL deduct the winning bid from that player's remaining starting cash

#### Scenario: Reject unaffordable quick increment
- **WHEN** a player selects a quick bid increment that would raise the bid above their remaining cash
- **THEN** the system SHALL reject the bid

### Requirement: Mobile-first setup experience
The system MUST present the setup and bidding experience in a layout that remains usable on supported phone screen sizes in both portrait and landscape orientations.

#### Scenario: Portrait layout
- **WHEN** the app is viewed in portrait mode on a supported mobile resolution
- **THEN** the UI SHALL keep all required controls and information visible without requiring unsupported screen sizes

#### Scenario: Landscape layout
- **WHEN** the app is viewed in landscape mode on a supported mobile resolution
- **THEN** the UI SHALL keep all required controls and information visible without requiring unsupported screen sizes

### Requirement: Configurable bid increment
The system MUST support bid validation and calculation while presenting quick bid increment buttons for common bidding actions.

#### Scenario: Apply bid increment
- **WHEN** a bid is placed or computed
- **THEN** the system SHALL validate or calculate it using the applicable bid increment rules

#### Scenario: Show quick bid increments
- **WHEN** a player can bid on the active property
- **THEN** the system SHALL offer quick bid actions for `+$10`, `+$20`, `+$50`, and `+$100`

### Requirement: Configurable bid deadline
The system MUST let the host configure the multiplayer bid deadline during setup.

#### Scenario: Default bid deadline
- **WHEN** the host starts setup without changing the bid deadline
- **THEN** the system SHALL use a 10-second deadline

#### Scenario: Bid deadline range
- **WHEN** the host configures the bid deadline
- **THEN** the system SHALL allow values from 5 to 30 seconds

#### Scenario: Host-only deadline setup
- **WHEN** players are participating in active bidding
- **THEN** the system SHALL NOT show bid deadline setup controls or explanatory setup text to players

### Requirement: Property bid opening price
The system MUST start bidding from a discounted opening price based on retail value.

#### Scenario: Opening bid is quarter value
- **WHEN** a property is revealed for bidding
- **THEN** the system SHALL start bidding at 25% of the property's retail value

### Requirement: Property color presentation
The system MUST present Monopoly property colors consistently in cards and summaries.

#### Scenario: Purple low-value properties
- **WHEN** Mediterranean Avenue or Baltic Avenue is displayed
- **THEN** the system SHALL present the property as purple, not brown

