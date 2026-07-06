## Context

Styling is centralized in `src/common/uiClasses.ts` as exported Tailwind class strings, plus keyframes and a dark-mode variant in `src/styles.css` (Tailwind 4, `@custom-variant dark` keyed off `data-theme`). Colors are a mix of Tailwind palette steps (violet/emerald/slate/rose) and ~15 hard-coded hexes (`#f7f4ff`, `#121020`, `#1a1730`, `#211c3c`, `#12182a`, …). The dark theme already meets WCAG AA nearly everywhere; the light theme fails on primary buttons (2.5:1), focus rings (1.8:1), and property band text (down to 1.4:1 on Yellow). Headings are unstyled because Tailwind preflight resets h1–h6 and no class or base layer restores them. The `visual-design-polish` spec mandates the violet+emerald identity, thin borders, and soft elevation — this change works inside that identity.

Measured reference ratios (WCAG relative luminance): white on emerald-500 = 2.5, white on emerald-600 = 3.8, white on emerald-700 = 5.5, near-black `#07130f` on emerald-500 = 7.5, emerald-600 on `#f7f4ff` ≈ 3.6.

## Goals / Non-Goals

**Goals:**

- Every text/background pairing in both themes meets 4.5:1; every focus indicator and meaningful UI boundary meets 3:1.
- Section headings are visually distinct from body text on every screen; weight carries meaning (400 body / 600 labels / 700+ headings).
- One elevation scale; color values flow from named tokens, not scattered hexes.
- Touch targets ≥ 44px for all interactive controls.
- Keep the violet+emerald identity, the property-card deed aesthetic, and all existing motion.

**Non-Goals:**

- No landing-page hero, app title, or brand identity work (thread C — separate change).
- No font-family change (Avenir Next/Trebuchet stack stays for now).
- No layout restructuring of screens; grid structures and component boundaries are untouched.
- No dark-theme redesign — it adopts tokens but keeps its current look.

## Decisions

1. **Primary buttons: emerald-700 fill with white text in light mode (5.5:1); hover emerald-800.** Dark mode keeps its passing dark-text-on-emerald-500 pairing. Alternative considered: mirror dark mode with dark text on emerald-400 in light mode — rejected because a light-green button with dark text reads as secondary/toggle on light surfaces; a saturated deep-emerald fill keeps the primary action unmistakable. Hover must also pass 4.5:1, which emerald-800 does; emerald-600 hover would not (3.8:1).
2. **Focus ring: theme-dependent token.** Light theme moves to emerald-600 (≈3.6:1 vs the lavender app background); dark theme keeps emerald-300. Encode as a `--color-focus` token consumed by all `focus-visible:ring-*` sites so the fix is one definition, not twenty edits. Keep the existing 2px ring + offset pattern.
3. **Property band text via a luminance helper, not per-group overrides.** Add `propertyBandText(property)` beside `propertyAccent` in `src/common/propertyDisplay.ts`: compute WCAG relative luminance of the accent hex and return near-black text for light accents, white for dark, choosing whichever contrast is higher (both options always clear 4.5:1 against the eight group colors). Drop the text-shadow crutch. Unit-test the helper against every color group and category. Alternative: hand-pick per group — rejected; the helper is self-maintaining if accents change.
4. **Headings restored in a `@layer base` block in `styles.css`,** not by adding classes to every `<h2>`/`<h3>`: an h1–h3 size/weight scale (e.g., h2 ≈ 1.25rem/700, h3 ≈ 1.05rem/650-equivalent) that applies app-wide. Alternative: utility classes per heading — rejected as it re-litigates the same decision at every call site and is exactly what was forgotten the first time.
5. **Weight scale enforced by editing the shared class constants.** `fieldClass`/`checkRowClass` drop `font-extrabold` in favor of `font-semibold` on the label element only; `finePrintClass` becomes normal weight; buttons go `font-bold`. Screens that add ad-hoc `font-black`/`font-extrabold` outside the deed card get swept to the scale. The deed card keeps its `font-black` title treatment — it is intentionally poster-like and passes contrast (17:1).
6. **Kicker convention:** `text-xs`–`text-sm`, `tracking-widest`, `uppercase`, semibold, accent color. (Recent history shows the kicker size was nudged up because it felt weak — the fix for "weak" is letter-spacing and color, not size.)
7. **Elevation scale: two tiers.** Tier 1 (panels, inputs): thin border + `shadow-sm`-class soft shadow. Tier 2 (floating: property card, dialog, countdown): slightly larger single shadow. Remove the `ring-1 ring-white/80` stacking and the multi-stop violet→emerald gradients on `startBandClass`/`propertyStageClass`, replacing them with a single-hue tint per surface (violet-tinted neutrals for chrome, emerald reserved for money/actions). This satisfies the existing spec's "soft elevation, thin borders" requirement more faithfully than the current double-shadow treatment.
8. **Tokens via Tailwind 4 `@theme`:** `--color-surface`, `--color-surface-raised`, `--color-ink`, `--color-ink-muted`, `--color-accent` (violet), `--color-action` (emerald), `--color-focus`, plus dark-theme overrides under `[data-theme="dark"]`. `uiClasses.ts` consumes tokens (`bg-surface`, `text-ink-muted`, …) instead of arbitrary hexes. A small unit test computes contrast ratios over the token pairs (body-on-surface, action text pairs, focus vs surface) so AA compliance is executable, not aspirational.
9. **Touch targets:** theme toggle gets a 44px hit area (padding around the small icon; visual size can stay compact). Checkboxes keep their 16px glyph but the whole labeled row is already the click target via `<label>`; verify and leave as-is if the row is ≥44px tall.

## Risks / Trade-offs

- [Deep-emerald primary may read heavier than the current bright emerald] → It is the standard trade for AA compliance; hover/active motion and the emerald identity are preserved. Screenshot comparison during implementation.
- [Class-string churn touches nearly every component render] → No logic changes; existing component tests assert on roles/labels, not classes, so breakage should be limited to `styles.test.ts` and any class-based assertions (audit before merging).
- [Contrast unit test can drift from real rendered colors] → Test reads the same token definitions the CSS uses (single source in `styles.css`); acceptable proxy given no browser-based contrast tooling in the repo. E2e remains the rendered-truth check.
- [Removing gradients changes the "personality" surfaces the spec calls out as intentionally restyled] → The spec requires refreshed, intentional surfaces, not gradients specifically; the single-tint treatment is still deliberate. Get a visual sign-off on the start band before finalizing.

## Migration Plan

Single PR, styling only. Rollback is a revert. Verify with unit tests (helper + token contrast + styles base layer), `pnpm test:e2e`, and manual light/dark screenshots of landing, host setup, lobby, player bidding, and the property dialog.

## Open Questions

- None blocking. If the deep-emerald primary looks too somber in screenshots, the fallback pairing is emerald-400 fill with `#07130f` text (7.5:1), matching dark mode's construction.
