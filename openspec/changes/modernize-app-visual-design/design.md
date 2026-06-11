## Context

The current UI is concentrated in `src/App.tsx` as shared Tailwind class constants plus screen-specific class strings. The existing treatment uses cream/tan backgrounds, mustard action bands, thick dark borders, and hard offset shadows. That made sense for an early tabletop-inspired version, but it now makes the app feel heavy, dated, and static.

The agreed direction is "Crisp App Polish": a modern violet/emerald visual system with light lavender surfaces, deep ink text, thinner lines, soft elevation, and restrained motion. The refresh should make the main experience feel intentionally redesigned while preserving the current local bidding, multiplayer, property-card data, mobile layout, dark-mode toggle, and E2E-covered flows.

## Goals / Non-Goals

**Goals:**
- Replace the tan/mustard-heavy look with a coherent violet/emerald palette in light and dark mode.
- Reduce borders from heavy outlines to thin borders, rings, and subtle dividers.
- Replace hard offset shadows with soft elevation and focused hover/focus states.
- Restyle the shared primitives and key surfaces enough that the app feels redesigned, not merely recolored.
- Add purposeful transitions and animations to interactions and state changes without distracting from bidding.
- Keep the implementation scoped to the current React/Tailwind structure unless small extraction improves clarity.

**Non-Goals:**
- Changing bidding rules, multiplayer protocol, domain data, server behavior, or persistence.
- Rebuilding the full component architecture.
- Adding decorative background animation that competes with active bidding.
- Introducing a large design-system or animation dependency.
- Recreating exact Monopoly artwork, logos, typography, or board visuals.

## Decisions

- Use shared style tokens through existing class constants first.
  - The current app already centralizes many repeated styles in constants such as `panelClass`, `buttonBaseClass`, `inputClass`, `propertyStageClass`, and `propertyCardClass`.
  - Updating these shared constants gives broad coverage with less risk than rewriting each screen.
  - Alternative considered: extract a full component library before restyling. Rejected because the visual refresh can be done safely in place, and a larger extraction would expand scope.

- Restyle key surfaces directly where shared constants are not enough.
  - The landing/start band, join-code tile, player/bidder rows, complete-state banner, skipped overlay, countdown, modal, and mini property cards each need specific treatment.
  - These areas are user-facing focal points and would look unfinished if only global colors changed.
  - Alternative considered: only changing tokens. Rejected because the user explicitly prefers a more composed redesign of important surfaces.

- Keep motion restrained and state-driven.
  - Buttons and inputs should transition color, border, shadow, and transform on hover/focus/active.
  - Property cards and stage surfaces should animate on reveal/entry with subtle fade/translate/scale.
  - Bid feedback, countdown urgency, skipped overlays, completion banners, dialogs, and mini property cards should get focused motion tied to user action or state changes.
  - Alternative considered: constant ambient animation. Rejected because it would make active auction information harder to scan.

- Preserve native Tailwind and CSS rather than adding an animation library.
  - Tailwind transitions and a few local keyframes in `src/styles.css` are enough for the desired polish.
  - This avoids dependency churn and keeps E2E timing predictable.
  - Alternative considered: adding a motion library. Rejected unless implementation discovers a transition that is too awkward to express cleanly with CSS.

- Maintain accessibility and mobile-first behavior as design constraints.
  - Thin borders must still have sufficient contrast.
  - Focus-visible states should become clearer, not weaker.
  - Motion should respect `prefers-reduced-motion`.
  - Text must continue to fit on supported mobile portrait and landscape layouts.

## Risks / Trade-offs

- Thin lines could reduce contrast -> Use contrast-checked border and focus-ring colors for light and dark themes.
- More transitions could make tests flaky -> Keep motion CSS-only, avoid delaying state changes, and preserve existing selectors/labels.
- Restyling inline class strings could miss a surface -> Audit all hard-coded colors, borders, shadows, and animation classes in `src/App.tsx`.
- Property card color groups can clash with the new palette -> Keep property group colors as semantic accents while updating card surfaces around them.
- Dark mode can become too saturated -> Use violet/emerald primarily for accents and keep base surfaces neutral enough for readability.
