## Purpose

Define the app-wide visual polish expectations for the Monopoly companion experience.

## Requirements

### Requirement: Accessible color contrast
The system MUST meet WCAG 2.1 AA contrast minimums in both light and dark themes: text and text-on-control pairings SHALL reach at least 4.5:1, and non-text indicators (focus rings, meaningful control boundaries) SHALL reach at least 3:1 against their adjacent colors.

#### Scenario: Action controls meet text contrast
- **WHEN** a primary or secondary action button is rendered in any theme and interactive state (default, hover, disabled)
- **THEN** the button label SHALL have at least a 4.5:1 contrast ratio against the button fill

#### Scenario: Focus indication meets non-text contrast
- **WHEN** an interactive control receives keyboard focus in either theme
- **THEN** the focus indicator SHALL have at least a 3:1 contrast ratio against the surrounding surface

#### Scenario: Contrast is verified by automated test
- **WHEN** the unit test suite runs
- **THEN** a test SHALL compute contrast ratios for the defined theme token pairings and fail if any pairing drops below its WCAG AA minimum

### Requirement: Visible typographic hierarchy
The system MUST present a visible typographic hierarchy in which headings, labels, and body text are distinguishable by size and weight.

#### Scenario: Section headings are distinct
- **WHEN** any screen renders a section heading (h1–h3)
- **THEN** the heading SHALL be visually distinct from body text through a defined size and weight scale rather than rendering at body size

#### Scenario: Weight carries meaning
- **WHEN** body copy, form labels, and fine print are rendered
- **THEN** body copy and fine print SHALL use normal weight and labels SHALL use a medium-to-semibold weight, reserving bold weights for headings and emphasis

### Requirement: Minimum touch target size
The system MUST give interactive controls a touch target of at least 44x44 CSS pixels on supported mobile resolutions.

#### Scenario: Compact controls keep full-size hit areas
- **WHEN** a visually compact control such as the theme toggle is rendered
- **THEN** its interactive hit area SHALL measure at least 44x44 CSS pixels even if the visible glyph is smaller

### Requirement: Modern visual palette
The system MUST present the app with a modern visual palette centered on violet and emerald accents while preserving readable light and dark themes.

#### Scenario: Light theme uses modern app colors
- **WHEN** the app is viewed in light mode
- **THEN** the UI SHALL use cool neutral or light lavender surfaces with violet and emerald accents instead of the previous tan and mustard-dominant palette

#### Scenario: Dark theme uses matching modern colors
- **WHEN** the app is viewed in dark mode
- **THEN** the UI SHALL use dark neutral or deep plum surfaces with violet and emerald accents that match the light theme identity

### Requirement: Refined surfaces and lines
The system MUST use thinner lines and softer depth treatment for primary UI surfaces, applied through a single restrained elevation scale.

#### Scenario: Panels use soft elevation
- **WHEN** setup, bidding, lobby, join, and summary panels are displayed
- **THEN** the panels SHALL use thin borders with a single soft shadow tier instead of thick outlines, stacked shadow-and-ring treatments, or hard offset shadows

#### Scenario: Property cards retain semantic identity
- **WHEN** a property card or mini property card is displayed
- **THEN** the card SHALL retain the property's semantic color-group accent while using the refreshed surface, border, and shadow treatment, and any text rendered on the color-group band SHALL use a luminance-appropriate text color meeting at least a 4.5:1 contrast ratio against that accent

#### Scenario: Key surfaces are intentionally restyled
- **WHEN** the landing/start call-to-action, player rows, join-code tile, property stage, countdown, skipped overlay, dialog, or completion banner is displayed
- **THEN** the surface SHALL use the refreshed visual system rather than only inheriting a color-token swap

### Requirement: Responsive interactive motion
The system MUST add purposeful transitions and animations to make user interactions and state changes feel responsive without changing bidding behavior.

#### Scenario: Controls respond to interaction
- **WHEN** a user hovers, focuses, presses, disables, or activates a button, input, checkbox, or property-card affordance
- **THEN** the control SHALL transition visual states smoothly while preserving accessible focus indication and disabled clarity

#### Scenario: Auction state changes have motion cues
- **WHEN** a property is revealed, a bid is placed, a countdown becomes urgent, a round is skipped, a dialog opens, or setup completes
- **THEN** the UI SHALL provide a restrained motion cue tied to that state change

#### Scenario: Reduced motion preference is respected
- **WHEN** the browser indicates a reduced-motion preference
- **THEN** non-essential animations SHALL be disabled or reduced while preserving the final visual states

### Requirement: Workflow and automation stability
The visual refresh MUST preserve existing auction workflows and automation-critical semantics.

#### Scenario: Bidding behavior remains unchanged
- **WHEN** users run multiplayer setup, host lobby, player join, player bidding, skipping, and completion flows
- **THEN** the flows SHALL keep their existing behavior and required controls while using the refreshed styling

#### Scenario: Mobile layouts remain usable
- **WHEN** the app is viewed on supported mobile portrait or landscape resolutions
- **THEN** required controls and information SHALL remain visible and free of incoherent overlap

#### Scenario: Automation selectors remain stable
- **WHEN** existing browser automation targets current accessible labels or test identifiers
- **THEN** the visual refresh SHALL preserve those semantics unless tests are intentionally updated for equivalent user-facing behavior
