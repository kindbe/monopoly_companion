## Overview

This change restyles the existing app. It does not alter bidding rules, session coordination, or server state. The React client keeps its current component boundaries; the work concentrates in the stylesheet token layer, the shared class module, and the internal layout of the bidding screen.

The organizing idea is that the app is a prop that belongs on the table next to the board, not an app that happens to be about Monopoly. The property color group is the only chroma in the interface; everything else is ink, paper, and rules.

A visual prototype exploring this direction was built and reviewed before writing this change. Its conclusions are recorded below as decisions.

## Spec conflicts

Two requirements in the existing `visual-design-polish` capability directly contradict this change. They are amended in the delta rather than worked around.

1. **Requirement: Modern visual palette** mandates "violet and emerald accents" in both themes and names the previous tan palette as the thing being replaced. This change removes that requirement and replaces it with a title-deed identity requirement. The board cream adopted here is deliberately closer to the tan palette that requirement was written to move away from; that earlier direction is being reversed on purpose.

2. **Requirement: Refined surfaces and lines** requires "a single soft shadow tier" and explicitly forbids "hard offset shadows." This change uses a hard offset shadow as the primary depth signal on the deed card and on buttons, because a zero-blur offset reads as printed card stock while a soft blur reads as a web surface. The requirement is amended to permit a single intentional hard-offset tier rather than deleted, so the underlying intent — one restrained elevation scale, not stacked treatments — is preserved.

A third requirement, **Workflow and automation stability**, already states that mobile layouts SHALL remain "free of incoherent overlap." The owned-property grid overflow described in the proposal violates this today. That fix is therefore a correction of existing behavior, not a new requirement.

## Decisions

### Identity

- Ground is board cream. Card stock is pure white in all three modes, including dark, where a white deed on a near-black ground reads as a real card on a dark table.
- The property group color is the only chroma. No violet chrome, no emerald actions, no rose urgency tint.
- Separation is carried by 1px rules and whitespace. Exactly one shadow tier exists, hard-offset with zero blur, applied to the deed card and to buttons.
- One small corner radius throughout. Deed cards are not pillowy.
- No nested panel chrome: a bordered surface never contains another bordered surface.

### Typography

- A geometric sans with tall caps carries the identity; Josefin Sans is the closest freely licensed substitute for Kabel, which the physical game uses.
- The font is self-hosted and subset rather than loaded from a third-party CDN. The app is used around a table where connectivity is unreliable, and the typography is the single largest contributor to the prop identity — a network failure must not silently degrade it. Self-hosting also avoids a third-party request at load.
- Headings and labels are all-caps with tight tracking. Numerals in the countdown and money values are tabular so digits do not shift as they change.

### Contrast modes

- The `light`/`dark` theme becomes a three-way control: `standard`, `high-contrast`, `dark`. This replaces the boolean toggle and its `localStorage` value; existing persisted values of `light` and `dark` migrate to `standard` and `dark` respectively.
- Token architecture is three layers: raw palette, semantic roles (`--surface`, `--surface-card`, `--text`, `--text-muted`, `--rule`, `--focus`, `--band-bg`, `--band-text`), and per-mode overrides keyed on a `data-contrast` attribute.
- Card ink is scoped to the card and does not inherit from page ink. Once card stock and ground belong to different color families — which white-on-dark makes true — a single shared `--text`/`--rule` pair cannot serve both. The prototype surfaced this by breaking when the tokens were shared.
- `high-contrast` targets 7:1 for text. Six of the ten authentic group hues cannot reach 7:1 against either black or white band text, so this mode uses a separate luminance-shifted ramp that holds hue. **High contrast is therefore not board-accurate.** This is an accepted trade: a player who needs 7:1 needs it more than they need the authentic color.
- A `@media (forced-colors: active)` block is included. The color band is a real element with a real border, not a `background-image`, because forced-colors strips background images.
- The existing `prefers-reduced-motion` handling is preserved.

### Non-color group identity

- The color group determines monopolies, which is the entire strategic basis for bidding, so it is load-bearing information rather than decoration.
- The group name is rendered as text on the band in every mode, on both the full deed card and the owned-property chips. Today the full card renders `property.category`, which is the empty string for streets, so a street's band is currently an unlabeled hue swatch.
- In `high-contrast`, each group additionally carries a distinct fill pattern. The pattern is a secondary channel only; the text is the guarantee, because patterns disappear under forced colors.

### Layout by device class

- Phones: a pinned header carries the lot counter and the countdown; the deed and collection scroll between; a pinned bottom dock carries the compressed stat line, four quick-bid buttons, and pass. Bid controls must never require scrolling. Dock padding respects `env(safe-area-inset-bottom)`.
- Tablets in landscape: no pinned regions. The deed sits large on the left; a right rail is divided by hairline rules into live state, bid controls, and the owned-property collection. A tablet propped or lying flat puts its bottom edge at the far side from a seated player and often behind the board, which makes a bottom dock the worst position for controls on that form factor.
- On tablet the quick bids are a 2x2 grid rather than a 4-across row, and each button carries its resulting total ("+$50 / BID $190"), removing mental arithmetic under time pressure. The phone shows a compressed version of the same information.
- **Tablet portrait at roughly 744px resolves to the phone treatment.** The rail needs width, which portrait lacks, while portrait has vertical room that suits a dock. The breakpoint is therefore driven by available width rather than by device class. This is the least-validated decision in the change and should be checked on a physical iPad Mini before the layout work is considered done.

### Visual weight

- Pass is styled as the quietest control in the bid group, lighter than the quick-bid buttons. It is the least consequential action, it cannot be undone for that lot, and in a pinned dock it sits in the thumb zone during a countdown as short as 5 seconds. The prototype rendered it as the heaviest element on screen in all three modes, which inverts both hierarchy and misclick risk.
- The scrolling deed region ends in a fade or an opaque dock edge so that truncated content reads as scrollable rather than as a rendering fault.
- Owned properties remain reachable on phones without leaving the bidding view, since "do I already hold two oranges" is the bid decision itself. A compact group-progress indicator in the header or a pull-up sheet both satisfy this; the specific affordance is left to implementation.

## Notes

- Copy cleanup rides along where it is already being touched: the lot counter and round counter currently express the same fact and should collapse to one, and the countdown should render as seconds rather than `m:ss` for a timer capped at 30 seconds.
- `src/styles.test.ts` parses `styles.css` with a non-nested `[^}]*` block matcher and a six-digit-hex token pattern. Both constrain the rewrite: themed token blocks cannot contain nested rules, and themed tokens cannot use `oklch()`, `color-mix()`, or three-digit hex. The test is being rewritten regardless, so either constraint may be lifted deliberately, but not accidentally.
- `propertyBandText()` in `src/common/propertyDisplay.ts` already selects band text by measured WCAG ratio and is the correct precedent to generalize. Its output is currently untested for contrast quality.
- No component-level tests exist today; coverage is carried entirely by domain, server, and session tests, and `src/shared/**` is excluded from coverage. A pure restyle therefore has little effect on the 80% line threshold in either direction.

## Open questions

- Does tablet portrait at 744px genuinely resolve to the phone dock, or does it need a third treatment? Flagged above as needing physical-device validation.
- In `dark`, is a pure white card uncomfortably bright in a dim room? A warm off-white (approximately `#F2EFE6`) is the fallback if testing says yes.
