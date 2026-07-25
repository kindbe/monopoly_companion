## MODIFIED Requirements

### Requirement: Automated multiplayer verification
The system MUST include automated browser verification for the multiplayer bidding session flow.

#### Scenario: Browser verification replaces manual proof
- **WHEN** automated Playwright verification completes successfully for the host plus two-player flow
- **THEN** the multiplayer bidding session change SHALL have browser-level evidence that the session can be completed through the UI

#### Scenario: Browser verification covers realtime integration
- **WHEN** the Playwright multiplayer test executes
- **THEN** the system SHALL verify browser UI updates are driven by WebRTC DataChannel session messages across host and player pages

## ADDED Requirements

### Requirement: Host-authoritative session continuity
The system MUST treat the host browser as required authority for an active multiplayer session.

#### Scenario: Host disconnects
- **WHEN** the host browser disconnects, closes, or loses its peer connection
- **THEN** connected player browsers SHALL show that the host is unavailable and SHALL NOT continue accepting bids or resolving properties

#### Scenario: Player reconnects
- **WHEN** a previously joined player reconnects during an active host-owned session
- **THEN** the host browser SHALL reconcile the player by stable player identity and send the latest player-safe session snapshot
