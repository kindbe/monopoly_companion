## MODIFIED Requirements

### Requirement: Server-side property resolution
The system MUST resolve each multiplayer bidding round in the session's authoritative peer — the session server by default, or the host browser when the host-authoritative transport is in use — using the property's opening bid and submitted quick-increment bids.

#### Scenario: Assign winning property
- **WHEN** at least one valid bid exists when the countdown expires
- **THEN** the system SHALL assign the property to the winning bidder and deduct the winning price from that player's remaining cash

#### Scenario: Skip property with no bids
- **WHEN** no valid bids exist when the countdown expires
- **THEN** the system SHALL leave the property unowned and advance the session

#### Scenario: Start multiplayer property at opening bid
- **WHEN** a property is revealed in a multiplayer bidding session
- **THEN** the system SHALL expose the current bid as 25% of the property's retail value rounded up to the nearest $10

#### Scenario: Resolution authority follows the transport
- **WHEN** the host-authoritative transport is in use
- **THEN** the host browser SHALL perform the resolution described above, and player browsers SHALL NOT resolve rounds independently
