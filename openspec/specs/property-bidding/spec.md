## Purpose

Define the setup-phase property bidding flow for assigning Monopoly properties before normal gameplay begins.

## Requirements

### Requirement: Pre-game property bidding flow
The system MUST provide a pre-game bidding flow that allows players to compete for Monopoly properties before the main game starts. The multiplayer session flow, where each player bids from their own device, is the sole bidding flow.

#### Scenario: Start bidding setup
- **WHEN** a host begins a new setup session
- **THEN** the system SHALL create a join-code-based multiplayer bidding flow where each player participates from their own device

#### Scenario: Resolve property ownership
- **WHEN** the bidding flow completes
- **THEN** the system SHALL have assigned each won property to a player according to the bidding results

#### Scenario: Complete bidding summary
- **WHEN** the bidding flow completes
- **THEN** the system SHALL show each player their assigned properties and remaining starting cash

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

### Requirement: Mobile-first setup experience
The system MUST present the setup and bidding experience in a layout that remains usable on supported phone screen sizes in both portrait and landscape orientations.

#### Scenario: Portrait layout
- **WHEN** the app is viewed in portrait mode on a supported mobile resolution
- **THEN** the UI SHALL keep all required controls and information visible without requiring unsupported screen sizes

#### Scenario: Landscape layout
- **WHEN** the app is viewed in landscape mode on a supported mobile resolution
- **THEN** the UI SHALL keep all required controls and information visible without requiring unsupported screen sizes
