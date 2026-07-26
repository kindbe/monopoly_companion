## ADDED Requirements

### Requirement: Host participation browser automation
The system MUST automate verification that the host bids as a normal participant and that the host lobby does not reappear once bidding starts.

This is expressed as its own requirement rather than as a modification of `Multiplayer browser flow automation`, because that requirement is modified in full by several unarchived changes and a whole-body replacement would silently discard these scenarios on archive. See "Spec conflicts" in `design.md`.

#### Scenario: Verify host participates as a bidder
- **WHEN** the Playwright multiplayer test starts bidding from the host page
- **THEN** the host page SHALL show the player bidding view with the host's own cash and remaining bids, and the host SHALL be able to submit a bid that other player pages attribute to the host

#### Scenario: Verify the host lobby is hidden once bidding starts
- **WHEN** bidding has started during the Playwright multiplayer test
- **THEN** the host page SHALL NOT show the host lobby heading or the join code

#### Scenario: Verify the host lobby is hidden at completion
- **WHEN** the session completes during the Playwright multiplayer test
- **THEN** the host page SHALL NOT show the host lobby heading or the join code, and SHALL show the host their own player summary
