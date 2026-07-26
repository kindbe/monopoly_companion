## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Configurable bid increment
The system MUST support bid validation and calculation while presenting quick bid increment buttons for common bidding actions.

#### Scenario: Apply bid increment
- **WHEN** a bid is placed or computed
- **THEN** the system SHALL validate or calculate it using the applicable bid increment rules

#### Scenario: Show quick bid increments
- **WHEN** a player can bid on the active property
- **THEN** the system SHALL offer quick bid actions for `+$10`, `+$20`, `+$50`, and `+$100`
