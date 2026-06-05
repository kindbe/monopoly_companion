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

### Requirement: Configurable bid increment
The system MUST support bid validation and calculation while presenting quick bid increment buttons for common bidding actions.

#### Scenario: Apply bid increment
- **WHEN** a bid is placed or computed
- **THEN** the system SHALL validate or calculate it using the applicable bid increment rules

#### Scenario: Show quick bid increments
- **WHEN** a player can bid on the active property
- **THEN** the system SHALL offer quick bid actions for `+$10`, `+$20`, `+$50`, and `+$100`

### Requirement: Ascending auction mode
The system MUST support an ascending auction mode for each revealed property, starting from a property-specific opening bid.

#### Scenario: Open ascending bids
- **WHEN** ascending auction mode is active for a revealed property
- **THEN** the system SHALL allow players to openly raise bids with quick increment actions

#### Scenario: Pass until winner remains
- **WHEN** every active bidder except one has passed
- **THEN** the system SHALL assign the property to the remaining bidder at the current bid

#### Scenario: Start at property opening bid
- **WHEN** a property is revealed for ascending bidding
- **THEN** the system SHALL set the current bid to 25% of the property's retail value rounded up to the nearest $10

### Requirement: Silent auction mode
The system MUST support a silent auction mode for each revealed property and MUST present the property-specific opening bid as the minimum useful bid.

#### Scenario: Submit silent bids
- **WHEN** silent auction mode is active for a revealed property
- **THEN** the system SHALL collect an opening bid and maximum bid from each participating player

#### Scenario: Resolve silent winner price
- **WHEN** one player has the highest maximum bid
- **THEN** the system SHALL assign the property to that player at the greater of their opening bid or the amount needed to beat the next highest maximum bid by the configured bid increment, capped by their maximum bid

#### Scenario: Silent auction max-bid tie
- **WHEN** multiple players share the highest maximum bid
- **THEN** the system SHALL run a sudden-death re-bid among the tied players for the same property

#### Scenario: Show silent opening minimum
- **WHEN** a property is revealed for silent bidding
- **THEN** the system SHALL show 25% of the property's retail value rounded up to the nearest $10 as the minimum useful opening bid
