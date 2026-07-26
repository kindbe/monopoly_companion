# property-display Specification

## Purpose
TBD - created by archiving change polish-property-card-bidding. Update Purpose after archive.
## Requirements
### Requirement: Property card data
The system MUST store card-display data for each Monopoly property used in bidding.

#### Scenario: Street property stats
- **WHEN** a street property is available for bidding
- **THEN** the system SHALL have its retail value, color group, rent schedule, mortgage value, house cost, and hotel cost available for display

#### Scenario: Railroad and utility stats
- **WHEN** a railroad or utility is available for bidding
- **THEN** the system SHALL have its retail value, mortgage value, and category-specific rent rules available for display

### Requirement: Monopoly-inspired property card
The system MUST show the active property as a card-like UI element inspired by a physical Monopoly property card.

#### Scenario: Street property card
- **WHEN** the active property is a street property
- **THEN** the system SHALL show a card with the property's name, color group treatment, retail value, rent schedule, mortgage value, and building costs

#### Scenario: Railroad or utility card
- **WHEN** the active property is a railroad or utility
- **THEN** the system SHALL show a card with the property's name, category treatment, retail value, mortgage value, and category-specific rent rules

### Requirement: Theme support
The system MUST support light and dark visual themes.

#### Scenario: Default theme follows system preference
- **WHEN** a user has not selected a theme override
- **THEN** the system SHALL default to the user's `prefers-color-scheme` setting

#### Scenario: Toggle theme
- **WHEN** the user toggles the theme
- **THEN** the system SHALL switch between light and dark mode without requiring a page reload

#### Scenario: Preserve readable property colors
- **WHEN** dark mode is active
- **THEN** the system SHALL keep property card color groups and text readable

