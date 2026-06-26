## Why

The app currently reads as static and dated because its tan/mustard palette, thick outlines, and hard offset shadows dominate the interface. A modernized visual system will make the bidding experience feel more polished and responsive while preserving the existing mobile-first auction workflow.

## What Changes

- Replace the current tan/mustard visual treatment with a crisp modern palette centered on violet and emerald accents.
- Reduce heavy borders and hard drop shadows across panels, buttons, inputs, property cards, player rows, join-code displays, overlays, and summary surfaces.
- Add purposeful transitions and animations for interactive controls, phase/state changes, property reveal surfaces, bidding feedback, countdown urgency, skipped/won overlays, dialogs, and property-card affordances.
- Restyle key surfaces beyond simple recoloring, including the landing/start call-to-action band, player rows, join code tile, complete-state banner, property stage, mini property cards, and action controls.
- Preserve the current bidding flows, data model, multiplayer behavior, mobile-first layout, dark-mode toggle, and E2E-critical semantics.

## Capabilities

### New Capabilities
- `visual-design-polish`: Defines modern palette, surface, border, shadow, and motion requirements for the app UI.

### Modified Capabilities

## Impact

- Affected code: `src/App.tsx`, `src/styles.css`, and focused tests or E2E assertions where visual affordances or stable selectors need coverage.
- No API, domain model, server, or multiplayer protocol changes are expected.
- No new runtime dependency is expected unless implementation discovers a clear need for a small animation/helper utility.
