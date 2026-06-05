## MODIFIED Requirements

### Requirement: Pre-game property bidding flow
The system MUST provide a pre-game bidding flow that allows players to compete for Monopoly properties before the main game starts, including a multiplayer session flow where players bid from their own devices.

#### Scenario: Start bidding setup
- **WHEN** players begin a new setup session
- **THEN** the system SHALL present a bidding flow for the available properties before gameplay begins

#### Scenario: Resolve property ownership
- **WHEN** the bidding flow completes
- **THEN** the system SHALL assign each available property to a player according to the bidding result

#### Scenario: Complete bidding summary
- **WHEN** the bidding flow completes
- **THEN** the system SHALL show each player's assigned properties and remaining starting cash

#### Scenario: Multiplayer bidding setup
- **WHEN** the host starts a multiplayer setup session
- **THEN** the system SHALL create a join-code-based bidding flow where each player participates from their own device
