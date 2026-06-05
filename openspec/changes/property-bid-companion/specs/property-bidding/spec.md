## ADDED Requirements

### Requirement: Pre-game property bidding flow
The system MUST provide a pre-game bidding flow that allows players to compete for Monopoly properties before the main game starts.

#### Scenario: Start bidding setup
- **WHEN** players begin a new setup session
- **THEN** the system SHALL present a bidding flow for the available properties before gameplay begins

#### Scenario: Resolve property ownership
- **WHEN** the bidding flow completes
- **THEN** the system SHALL assign each available property to a player according to the bidding result

#### Scenario: Complete bidding summary
- **WHEN** the bidding flow completes
- **THEN** the system SHALL show each player's assigned properties and remaining starting cash

### Requirement: Configurable property pool
The system MUST let the host configure which properties can appear in the bidding flow.

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
The system MUST use each player's Monopoly starting cash as the budget for setup bidding.

#### Scenario: Reject unaffordable bid
- **WHEN** a player attempts to place a bid above their remaining setup cash
- **THEN** the system SHALL reject the bid

#### Scenario: Deduct winning bid
- **WHEN** a player wins a property
- **THEN** the system SHALL deduct the winning bid from that player's remaining starting cash

### Requirement: Configurable bid increment
The system MUST let the host choose the bid increment used during bidding.

#### Scenario: Apply bid increment
- **WHEN** a bid is placed or computed
- **THEN** the system SHALL validate or calculate it using the host-selected bid increment

### Requirement: Ascending auction mode
The system MUST support an ascending auction mode for each revealed property.

#### Scenario: Open ascending bids
- **WHEN** ascending auction mode is active for a revealed property
- **THEN** the system SHALL allow players to openly raise bids by the configured bid increment

#### Scenario: Pass until winner remains
- **WHEN** every active bidder except one has passed
- **THEN** the system SHALL assign the property to the remaining bidder at the current bid

### Requirement: Silent auction mode
The system MUST support a silent auction mode for each revealed property.

#### Scenario: Submit silent bids
- **WHEN** silent auction mode is active for a revealed property
- **THEN** the system SHALL collect an opening bid and maximum bid from each participating player

#### Scenario: Resolve silent winner price
- **WHEN** one player has the highest maximum bid
- **THEN** the system SHALL assign the property to that player at the greater of their opening bid or the amount needed to beat the next highest maximum bid by the configured bid increment, capped by their maximum bid

#### Scenario: Silent auction max-bid tie
- **WHEN** multiple players share the highest maximum bid
- **THEN** the system SHALL run a sudden-death re-bid among the tied players for the same property

### Requirement: Mobile-first setup experience
The system MUST present the setup and bidding experience in a layout that remains usable on supported phone screen sizes in both portrait and landscape orientations.

#### Scenario: Portrait layout
- **WHEN** the app is viewed in portrait mode on a supported mobile resolution
- **THEN** the UI SHALL keep all required controls and information visible without requiring unsupported screen sizes

#### Scenario: Landscape layout
- **WHEN** the app is viewed in landscape mode on a supported mobile resolution
- **THEN** the UI SHALL keep all required controls and information visible without requiring unsupported screen sizes
