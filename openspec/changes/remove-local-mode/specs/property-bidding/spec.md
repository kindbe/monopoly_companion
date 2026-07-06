## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Ascending auction mode
**Reason**: The single-device pass-until-one-remains ascending auction was part of the removed local mode. Multiplayer rounds resolve by a server-controlled countdown as specified in `multiplayer-bidding`.
**Migration**: Use a multiplayer bidding session; each property resolves when its countdown expires, awarding the highest recorded bid.

### Requirement: Silent auction mode
**Reason**: The silent auction (opening/maximum bids with sudden-death re-bid) was only reachable through the removed single-device local mode.
**Migration**: None. If silent auctions return, they will be proposed as a multiplayer-bidding capability.

### Requirement: Configurable bid increment
**Reason**: The multiplayer host setup has never exposed a bid increment control; players bid using the fixed quick-bid increments (+$10/$20/$50/$100). The session engine continues to validate bid amounts server-side.
**Migration**: None. Bids continue to use the fixed quick-bid increments.
