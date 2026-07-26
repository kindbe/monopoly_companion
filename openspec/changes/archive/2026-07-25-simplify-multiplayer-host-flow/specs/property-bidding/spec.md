## MODIFIED Requirements

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
