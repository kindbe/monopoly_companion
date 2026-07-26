## REMOVED Requirements

### Requirement: Modern visual palette
**Reason**: The violet and emerald accent identity is being replaced by the title-deed identity. The board-cream ground adopted here deliberately reverses the move away from tan surfaces that this requirement encoded.
**Migration**: Replaced by the `Title deed visual identity` requirement below.

## ADDED Requirements

### Requirement: Title deed visual identity
The system MUST present the app as a physical title-deed prop, using a board-cream ground, white card stock, hairline rules, and the property color group as the only chroma in the interface.

#### Scenario: Ground and card stock are distinct
- **WHEN** any screen is rendered in any contrast mode
- **THEN** the page ground SHALL use the board-cream or board-dark surface for that mode and card surfaces SHALL use white card stock, so a card reads as an object resting on the ground rather than as the same material

#### Scenario: Property color is the only chroma
- **WHEN** the bidding screen is rendered
- **THEN** the only saturated color present SHALL be the property color group accent, and controls, chrome, borders, and status text SHALL use neutral ink and paper tones

#### Scenario: Card ink does not inherit page ink
- **WHEN** a card is rendered in a mode whose ground and card stock belong to different color families
- **THEN** the text and rule colors used inside the card SHALL be scoped to the card and SHALL meet contrast minimums against the card stock rather than against the page ground

### Requirement: Non-color property group identification
The system MUST convey a property's color group through text in addition to color, because the color group determines monopolies and is therefore load-bearing information rather than decoration.

#### Scenario: Group name appears on the full property card
- **WHEN** a property card is displayed for a street, railroad, or utility in any contrast mode
- **THEN** the card SHALL render the property's color group or category name as text on the color band

#### Scenario: Group name appears on owned-property cards
- **WHEN** a player's owned properties are displayed
- **THEN** each owned property SHALL be identifiable by its group name as text and not by color alone

#### Scenario: High contrast adds a secondary pattern channel
- **WHEN** the app is in the high-contrast mode
- **THEN** each color group SHALL additionally carry a distinct fill pattern on its band, while the group name text remains legible at the required contrast ratio

#### Scenario: Group identity survives forced colors
- **WHEN** the browser reports `forced-colors: active`
- **THEN** the color band SHALL remain present as a bordered element rather than relying on a background image, and the group name SHALL remain rendered as text

### Requirement: Three-way contrast control
The system MUST offer a user-selectable contrast mode with three options — standard, high contrast, and dark — replacing the previous light and dark theme toggle.

#### Scenario: User selects a contrast mode
- **WHEN** a user activates the contrast control
- **THEN** the system SHALL apply the selected mode across every screen and SHALL expose the current mode through an accessible label

#### Scenario: Mode preference persists
- **WHEN** a user has previously selected a contrast mode
- **THEN** the system SHALL restore that mode on next load, migrating any previously persisted light or dark theme value to the equivalent new mode

#### Scenario: Default follows system preference
- **WHEN** no mode has been persisted
- **THEN** the system SHALL choose an initial mode from the browser's reported contrast and color-scheme preferences

#### Scenario: High contrast may depart from authentic group colors
- **WHEN** the app is in the high-contrast mode
- **THEN** the system SHALL prioritize the required contrast ratio over color fidelity to the physical game, using a luminance-shifted group ramp where an authentic hue cannot reach the required ratio

### Requirement: Device-appropriate bidding layout
The system MUST place bid controls according to available viewport width, so that a player can act within the countdown without scrolling on any supported device.

#### Scenario: Bid controls are reachable without scrolling on phones
- **WHEN** a bidding round is active on a viewport as small as 375x667
- **THEN** the quick-bid controls and the pass control SHALL be visible within the viewport without scrolling

#### Scenario: Narrow viewports pin the action region
- **WHEN** the viewport is too narrow for a side rail
- **THEN** the countdown SHALL be pinned in view, the bid controls SHALL be pinned in a bottom dock respecting the device safe-area inset, and the property detail SHALL scroll between them with a visual indication that content continues

#### Scenario: Wide viewports use a side rail
- **WHEN** the viewport is wide enough for a side rail
- **THEN** the property card SHALL be presented at large size alongside a rail carrying live bid state, bid controls, and the player's owned properties, with no pinned regions

#### Scenario: Owned properties remain available while bidding
- **WHEN** a bidding round is active on any supported device
- **THEN** the player SHALL be able to see which properties they already hold without leaving the bidding view

#### Scenario: No horizontal overflow at small viewports
- **WHEN** any screen is rendered at a viewport width of 375px, including a bidding screen with owned properties
- **THEN** the document SHALL NOT scroll horizontally and no card SHALL be clipped by the viewport edge

### Requirement: Action weight matches action consequence
The system MUST give interactive controls visual weight proportionate to their importance, so that the most prominent target in a timed region is not the least consequential action.

#### Scenario: Pass is quieter than bidding
- **WHEN** the bid controls are displayed in any contrast mode
- **THEN** the pass control SHALL carry less visual weight than the quick-bid controls, while still meeting contrast and touch-target minimums

## MODIFIED Requirements

### Requirement: Accessible color contrast
The system MUST meet WCAG 2.1 AA contrast minimums in every contrast mode: text and text-on-control pairings SHALL reach at least 4.5:1, and non-text indicators (focus rings, meaningful control boundaries) SHALL reach at least 3:1 against their adjacent colors. In the high-contrast mode, text pairings SHALL reach at least 7:1.

#### Scenario: Action controls meet text contrast
- **WHEN** a primary or secondary action button is rendered in any contrast mode and interactive state (default, pressed, disabled)
- **THEN** the button label SHALL have at least a 4.5:1 contrast ratio against the button fill, or 7:1 in the high-contrast mode

#### Scenario: Focus indication meets non-text contrast
- **WHEN** an interactive control receives keyboard focus in any contrast mode
- **THEN** the focus indicator SHALL have at least a 3:1 contrast ratio against the surrounding surface

#### Scenario: Contrast is verified by automated test
- **WHEN** the unit test suite runs
- **THEN** a test SHALL compute contrast ratios for the defined token pairings in all three contrast modes and fail if any pairing drops below its minimum

#### Scenario: Property band contrast is verified by automated test
- **WHEN** the unit test suite runs
- **THEN** a test SHALL compute the contrast ratio between every property color group accent and its selected band text color in every contrast mode, and fail if any pairing drops below its minimum

### Requirement: Visible typographic hierarchy
The system MUST present a visible typographic hierarchy in which headings, labels, and body text are distinguishable by size and weight, using a geometric display typeface that carries the title-deed identity.

#### Scenario: Section headings are distinct
- **WHEN** any screen renders a section heading (h1–h3)
- **THEN** the heading SHALL be visually distinct from body text through a defined size and weight scale rather than rendering at body size

#### Scenario: Weight carries meaning
- **WHEN** body copy, form labels, and fine print are rendered
- **THEN** body copy and fine print SHALL use normal weight and labels SHALL use a medium-to-semibold weight, reserving bold weights for headings and emphasis

#### Scenario: Display typeface is locally available
- **WHEN** the app loads without network access to a third-party font host
- **THEN** the display typeface SHALL still render, being served by the application itself rather than requested from a third-party host

#### Scenario: Changing values do not shift layout
- **WHEN** the countdown or a money value updates
- **THEN** the digits SHALL be rendered with tabular figures so that surrounding layout does not shift

### Requirement: Refined surfaces and lines
The system MUST use hairline rules and a single intentional elevation tier for primary UI surfaces, without stacking multiple depth treatments on one element.

#### Scenario: Surfaces use one elevation tier
- **WHEN** setup, bidding, lobby, join, and summary surfaces are displayed
- **THEN** separation SHALL be carried by hairline rules and whitespace, and no more than one shadow tier SHALL be applied, rendered as a hard offset with no blur to read as printed card stock

#### Scenario: Chrome is not nested
- **WHEN** any screen is rendered
- **THEN** a bordered or shadowed surface SHALL NOT contain another bordered or shadowed surface

#### Scenario: Property cards retain semantic identity
- **WHEN** a property card or owned-property card is displayed
- **THEN** the card SHALL retain the property's semantic color-group accent, and any text rendered on the color-group band SHALL use a luminance-appropriate text color meeting the contrast minimum for the active mode

#### Scenario: Key surfaces are intentionally restyled
- **WHEN** the landing/start call-to-action, player rows, join-code tile, property stage, countdown, skipped overlay, dialog, or completion banner is displayed
- **THEN** the surface SHALL use the title-deed visual system rather than only inheriting a color-token swap

### Requirement: Responsive interactive motion
The system MUST use restrained, purposeful motion for interactions and state changes, appropriate to touch input, without changing bidding behavior.

#### Scenario: Controls respond to interaction
- **WHEN** a user presses, focuses, disables, or activates a button, input, checkbox, or property-card affordance
- **THEN** the control SHALL transition visual states smoothly, using a press-down treatment rather than a pointer-hover lift, while preserving accessible focus indication and disabled clarity

#### Scenario: Auction state changes have motion cues
- **WHEN** a property is revealed, a bid is placed, a countdown becomes urgent, a round is skipped, a dialog opens, or setup completes
- **THEN** the UI SHALL provide a restrained motion cue tied to that state change

#### Scenario: Reduced motion preference is respected
- **WHEN** the browser indicates a reduced-motion preference
- **THEN** non-essential animations SHALL be disabled or reduced while preserving the final visual states
