## ADDED Requirements

### Requirement: Automated verification of small-viewport bidding usability
Browser automation MUST verify that a player can act within the countdown on the smallest supported viewport without scrolling, and that no screen scrolls horizontally there.

#### Scenario: Bid controls are in view during a live round
- **WHEN** automation runs a bidding round at a 375x667 viewport
- **THEN** it SHALL assert that the quick-bid controls and the pass control are within the viewport bounds without scrolling

#### Scenario: No horizontal overflow with owned properties
- **WHEN** automation reaches a bidding screen at a 375px-wide viewport with at least one owned property
- **THEN** it SHALL assert that the document scroll width does not exceed the client width

#### Scenario: Contrast modes are exercised
- **WHEN** automation activates the contrast control
- **THEN** it SHALL assert that each of the three modes applies and that the selected mode is exposed through an accessible label
