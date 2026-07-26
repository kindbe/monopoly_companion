## ADDED Requirements

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
