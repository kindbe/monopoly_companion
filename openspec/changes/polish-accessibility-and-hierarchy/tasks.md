## 1. Design tokens and base styles

- [x] 1.1 Define `@theme` color tokens in `src/styles.css` (`--color-surface`, `--color-surface-raised`, `--color-ink`, `--color-ink-muted`, `--color-accent`, `--color-action`, `--color-focus`) with dark-theme overrides under `[data-theme="dark"]`, covering the hexes currently hard-coded in `uiClasses.ts`
- [x] 1.2 Add a `@layer base` heading scale (h1–h3 size/weight) to `src/styles.css` so section headings render distinct from body text app-wide
- [x] 1.3 Add a contrast unit test (shared WCAG luminance helper) that computes ratios for the token pairings — body/surface, action label/action fill (default, hover, disabled), focus/surface — and fails below AA minimums; update `src/styles.test.ts` for the new base layer and tokens

## 2. Contrast fixes

- [x] 2.1 Rework `primaryActionClass`/`compactPrimaryActionClass` in `src/common/uiClasses.ts`: light theme emerald-700 fill with white text, hover emerald-800; keep the dark theme's passing dark-text-on-emerald pairing; confirm disabled state still passes
- [x] 2.2 Point all `focus-visible:ring-*` sites at the `--color-focus` token (emerald-600 light, emerald-300 dark), keeping the 2px ring + offset pattern
- [x] 2.3 Add `propertyBandText(property)` to `src/common/propertyDisplay.ts` returning a luminance-appropriate text color for the color-group accent; apply it in `PropertyCard` and `MiniPropertyCards` band rendering and remove the white `text-shadow` crutch; unit-test the helper across all eight color groups plus railroad/utility
- [x] 2.4 Give the theme toggle in `src/App.tsx` a ≥44px hit area (padded button around the compact glyph); audit remaining controls for sub-44px targets and fix any found

## 3. Typographic hierarchy

- [x] 3.1 Apply the weight scale in `src/common/uiClasses.ts`: labels (`fieldClass`, `checkRowClass`) to semibold, `finePrintClass` to normal weight, buttons to bold; remove blanket `font-extrabold`
- [x] 3.2 Restyle `kickerClass` to convention: small size, `tracking-widest`, uppercase, semibold, accent color
- [x] 3.3 Sweep components for ad-hoc `font-black`/`font-extrabold` outside the property deed card and align them to the scale (the deed card's poster treatment stays)

## 4. Elevation and surface consolidation

- [x] 4.1 Replace stacked shadow+ring treatments in `panelClass`, `startBandClass`, `propertyStageClass`, `countdownClassBase`, `propertyCardClass`, and the join-code tile with the two-tier scale: thin border + soft shadow (panels), single larger shadow (floating surfaces)
- [x] 4.2 Replace the multi-stop violet→emerald gradients on `startBandClass` and `propertyStageClass` with single-hue tinted surfaces; keep emerald reserved for money/positive action surfaces
- [x] 4.3 Migrate remaining hard-coded hexes in `uiClasses.ts` to the theme tokens in both themes

## 5. Verify

- [x] 5.1 Run `pnpm lint`, `pnpm build`, and `pnpm test:coverage`; coverage thresholds must pass without lowering
- [x] 5.2 Run `pnpm test:e2e`; update any assertions that referenced changed styling semantics (labels/testids should be unchanged per spec)
- [x] 5.3 Capture light and dark screenshots of landing, host setup, host lobby, player join, player bidding, and the property dialog; visually confirm hierarchy, the deep-emerald primary, and band text legibility (Yellow and Light Blue groups especially), and refresh `docs/images/` if the shots are materially stale
- [x] 5.4 Spot-check keyboard focus visibility on both themes across buttons, inputs, and checkboxes
