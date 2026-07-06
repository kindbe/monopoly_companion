## Why

Measured against WCAG AA, the light theme's primary controls fail badly: white-on-emerald-500 buttons sit at 2.5:1 (minimum 4.5:1), the emerald-400 focus ring reads at 1.8:1 against the lavender background (minimum 3:1 for indicators), and property-band text is white-on-accent, which is illegible on light color groups (1.4:1 on Yellow). Separately, Tailwind's preflight strips all heading styles and the app never restores them, so every `<h2>`/`<h3>` renders as body text — combined with blanket `font-extrabold` on fields, labels, and fine print, the UI has no visual hierarchy: everything is equally bold, equally elevated, and equally loud.

## What Changes

- Fix light-theme action-color contrast: primary buttons move to a fill/text pairing that meets 4.5:1 in both themes and in hover/disabled states.
- Fix light-theme focus indication to meet the 3:1 non-text contrast minimum while keeping the emerald focus identity.
- Make property-card band text luminance-aware: dark text on light color groups (Yellow, Light Blue), white on dark groups, so railroad/utility labels are legible.
- Restore heading hierarchy: base heading styles (size/weight scale for h1–h3) so section titles are visually distinct from body text.
- Apply weight discipline: body text at normal weight, labels at medium/semibold, headings bold — removing blanket `font-extrabold` from fields, checkrows, and fine print.
- Normalize uppercase kicker/microcopy to convention (smaller size, wide letter-spacing).
- Consolidate elevation to a single restrained scale (thin border + one soft shadow tier per surface level), replacing stacked shadow+ring+gradient treatments while preserving the violet/emerald identity.
- Introduce Tailwind 4 `@theme` color tokens for the surface/accent hexes currently hard-coded across `uiClasses.ts`, and use them consistently in both themes.
- Enlarge sub-minimum touch targets (theme toggle is currently a 20px hit area) to at least 44px.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `visual-design-polish`: Add requirements for WCAG AA contrast (text 4.5:1, UI indicators 3:1, both themes), visible typographic hierarchy, and minimum touch-target size. Modify the "Property cards retain semantic identity" requirement to require legible band text on light color-group accents.

## Impact

- **Styling**: `src/common/uiClasses.ts` (most class constants), `src/styles.css` (heading base layer, `@theme` tokens), `src/common/propertyDisplay.ts` (band text-color helper).
- **Components**: class-level changes only in screens that consume the shared classes; `PropertyCard` band adopts the luminance-aware text color; `App.tsx` theme toggle sizing.
- **Tests**: unit tests for the band text-color helper and a token contrast check; `styles.test.ts` updated for new base layer; existing component/e2e tests updated only where class-based assertions change.
- **No behavior, protocol, dependency, or server changes.** Dark theme changes are minimal (it already passes contrast); its surfaces adopt the same tokens.
