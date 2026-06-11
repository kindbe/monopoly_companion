## 1. Visual System Audit

- [x] 1.1 Audit `src/App.tsx` for hard-coded tan, mustard, border, shadow, dark-mode, and animation class usage.
- [x] 1.2 Identify shared class constants versus one-off key surfaces that need direct restyling.
- [x] 1.3 Confirm existing tests and E2E selectors that must remain stable through the visual refresh.

## 2. Shared Style Foundation

- [x] 2.1 Update app shell, typography accents, panels, buttons, inputs, checkboxes, fine print, and action rows to the violet/emerald visual system.
- [x] 2.2 Replace thick borders and hard offset shadows in shared constants with thin borders, rings, focus states, and soft elevation.
- [x] 2.3 Add reusable CSS keyframes and reduced-motion handling in `src/styles.css` for entry, reveal, feedback, and overlay motion.

## 3. Key Surface Polish

- [x] 3.1 Restyle the landing/start call-to-action and setup action bands as composed modern surfaces rather than mustard blocks.
- [x] 3.2 Restyle the property stage, full property card, hidden property chips, and mini property cards while preserving semantic property color accents.
- [x] 3.3 Restyle local bidder rows, silent auction rows, player cash display, and multiplayer player controls with softer dividers and responsive hover/focus/disabled states.
- [x] 3.4 Restyle the host lobby join-code tile, player lobby list, player join panel, countdown display, skipped overlay, property dialog, and setup-complete banner.

## 4. Motion And State Feedback

- [x] 4.1 Add smooth transitions for buttons, inputs, row state changes, property-card hover/focus, and disabled controls.
- [x] 4.2 Add restrained motion cues for property reveal, bid feedback, countdown urgency, skipped overlay, dialog entrance, and completion state.
- [x] 4.3 Verify motion does not delay state changes and respects reduced-motion preferences.

## 5. Verification

- [x] 5.1 Run unit tests and update only visual/semantic assertions that intentionally changed.
- [x] 5.2 Run Playwright E2E tests to confirm local server flow, multiplayer flow, accessible labels, and test identifiers remain stable.
- [x] 5.3 Review desktop and mobile screenshots for overlap, readable contrast, softened lines, modern palette, and expected animation end states.
- [x] 5.4 Run `openspec status --change modernize-app-visual-design` and confirm all artifacts remain complete.
