/**
 * Shared class strings for the title-deed visual system.
 *
 * Everything here styles against the semantic tokens declared in
 * `src/styles.css` (layer 2) and never against a raw palette value or a
 * Tailwind palette colour. There is exactly one corner radius (`rounded-card`)
 * and exactly one elevation treatment: a hard, zero-blur offset. Nothing
 * lifts on hover — these are touch devices, so interaction is expressed as a
 * real press-down instead.
 */

/** A hairline rule that thickens to 2px in high-contrast mode. */
const ruleClass = "border-solid border-rule [border-width:var(--rule-weight)]"

/** A single top hairline: separates sections without boxing them. */
const topRuleClass =
  "border-solid border-rule [border-top-width:var(--rule-weight)]"

/** The one focus treatment, sized and coloured per contrast mode. */
const focusClass =
  "focus-visible:[outline:var(--focus-weight)_solid_var(--color-focus)] focus-visible:[outline-offset:2px]"

/** The one elevation tier: hard offset, zero blur, reads as printed stock. */
const hardShadowClass =
  "[box-shadow:var(--btn-offset)_var(--btn-offset)_0_0_var(--color-btn-shadow)]"

/** Press-down: the button travels into its own shadow. No hover lift. */
const pressClass =
  "[touch-action:manipulation] transition-[transform,box-shadow] duration-75 ease-linear active:translate-x-[var(--btn-offset)] active:translate-y-[var(--btn-offset)] active:shadow-none"

/* --------------------------------------------------------------------------
   Shell
   -------------------------------------------------------------------------- */

export const appShellClass =
  "mx-auto flex h-dvh w-full max-w-7xl flex-col overflow-hidden bg-surface font-sans text-ink antialiased"
export const mastheadClass = "flex shrink-0 items-center justify-end px-3 py-1"
export const activeScreenClass = "animate-[app-enter_260ms_ease-out]"
/** Ordinary screens scroll inside the shell and carry their own gutter. */
export const scrollingScreenClass =
  "min-h-0 flex-1 overflow-y-auto px-[18px] pb-6"
/** The bidding screen owns its full region: it pins its own header and dock. */
export const fullBleedScreenClass = "min-h-0 flex-1 overflow-hidden"

export const themeToggleClass = `inline-grid min-h-11 min-w-11 place-items-center rounded-card text-ink ${focusClass}`

/* --------------------------------------------------------------------------
   Sections. No nested chrome: these are rule-and-whitespace zones, never
   bordered boxes containing further bordered boxes.
   -------------------------------------------------------------------------- */

export const kickerClass =
  "mb-1 mt-0 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted"
export const panelClass = `grid content-start gap-1.5 pt-4 pb-1 ${topRuleClass}`
export const setupGridClass = "grid gap-4 md:grid-cols-3"
export const startBandClass = `col-span-full flex flex-col items-stretch justify-between gap-3 pt-4 md:flex-row md:items-center ${topRuleClass}`
export const actionRowClass = "flex flex-wrap gap-2.5"
export const sectionHeadClass =
  "text-[0.66rem] font-bold uppercase tracking-[0.2em] text-ink-muted"

/* --------------------------------------------------------------------------
   Controls
   -------------------------------------------------------------------------- */

const buttonBaseClass = `inline-flex min-h-11 items-center justify-center gap-2 rounded-card px-4 py-2.5 font-bold uppercase tracking-[0.06em] ${ruleClass} ${focusClass} ${pressClass} disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none`
export const primaryActionClass = `${buttonBaseClass} bg-btn-face-alt text-btn-ink-alt ${hardShadowClass}`
export const secondaryActionClass = `${buttonBaseClass} bg-btn-face text-btn-ink ${hardShadowClass}`

export const fieldClass = "my-2 grid gap-1 font-semibold"
export const checkRowClass =
  "my-2 grid min-h-11 grid-cols-[auto_1fr] items-center gap-2 font-semibold"
export const inputClass = `min-h-11 w-full rounded-card bg-surface-raised px-2.5 py-2 font-normal text-ink ${ruleClass} ${focusClass}`
export const checkboxClass = "size-5 accent-[var(--color-ink)]"
export const finePrintClass = "mt-1 font-normal text-ink-muted"

/** The join code is a value, not a panel: no border, no shadow, just type. */
export const joinCodeClass =
  "py-2 text-4xl font-bold tabular-nums tracking-[0.18em] text-ink"

/* --------------------------------------------------------------------------
   Title deed card
   -------------------------------------------------------------------------- */

/**
 * `sm:` growth matters for tablet portrait (~744px), which takes the dock
 * layout: without it the deed stays pinned at phone width in a column nearly
 * twice as wide, stranding the card in empty ground.
 */
export const propertyCardClass = `on-card mx-auto w-full max-w-105 sm:max-w-125 overflow-hidden rounded-card bg-surface-card [box-shadow:var(--shadow-deed)] ${ruleClass} animate-[property-reveal_360ms_ease-out]`
/** The deed grows once it owns a full column of the rail layout. */
export const propertyCardLargeClass = `${propertyCardClass} lg:max-w-140`
export const propertyBandClass =
  "deed-band grid min-h-16 place-items-center px-3 py-3.5 text-center"
/**
 * Padding matters in high-contrast: the stylesheet plates the label in the
 * band colour so the fill pattern reads around it rather than behind it.
 */
export const propertyBandLabelClass =
  "px-3 py-1 text-sm font-bold uppercase leading-none tracking-[0.22em]"
export const propertyBodyClass = "grid gap-1 px-5 pb-5 pt-4 text-center"
export const propertyKickerClass =
  "m-0 text-[0.66rem] font-bold uppercase tracking-[0.34em] text-ink-muted"
export const propertyTitleClass =
  "m-0 text-[clamp(1.5rem,7vw,1.9rem)] font-bold uppercase leading-none tracking-[-0.01em] text-ink"
export const propertyTitleLargeClass =
  "m-0 text-[clamp(1.5rem,7vw,1.9rem)] font-bold uppercase leading-none tracking-[-0.01em] text-ink lg:text-[clamp(2rem,3.6vw,3.1rem)]"
export const propertyPriceRowClass =
  "mt-1.5 grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
export const propertyRuleClass =
  "my-3 border-0 border-t border-t-[var(--rule-soft)]"
export const propertyRentListClass = "m-0 grid list-none gap-0 p-0 text-left"
export const propertyRentRowClass =
  "flex items-baseline gap-2 border-0 border-b border-b-[var(--rule-soft)] py-1 text-sm last:border-b-0"
export const propertyRentKeyClass =
  "text-xs uppercase tracking-[0.07em] text-ink"
export const propertyRentLeaderClass =
  "min-w-4 flex-1 translate-y-[-3px] border-0 border-b border-dotted border-b-[var(--rule-soft)]"
export const propertyRentValueClass = "font-bold tabular-nums text-ink"
export const propertyFootClass =
  "mt-2 text-[0.68rem] uppercase leading-snug tracking-[0.07em] text-ink-muted"

/* --------------------------------------------------------------------------
   Owned-property chips
   -------------------------------------------------------------------------- */

export const chipGridClass =
  "grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2"
export const chipClass = `on-card grid min-h-11 content-start overflow-hidden rounded-card bg-surface-card text-left ${ruleClass} ${focusClass} [touch-action:manipulation] transition-opacity duration-100 active:opacity-70`
export const chipBandClass = "deed-band block px-1.5 py-1 text-center"
export const chipBandLabelClass =
  "block truncate px-1.5 py-0.5 text-[0.56rem] font-bold uppercase leading-tight tracking-[0.16em]"
export const chipNameClass =
  "block px-2 pb-1.5 pt-1 text-[0.7rem] font-semibold uppercase leading-tight tracking-[0.05em] text-ink"

/* --------------------------------------------------------------------------
   Bidding layout
   -------------------------------------------------------------------------- */

/**
 * One grid for both device classes. The breakpoint is 1024px (`lg`): at or
 * above it the right rail appears and nothing is pinned; below it the header
 * and dock pin and the deed region scrolls between them. 1024px is chosen so
 * tablet portrait (~744px) takes the dock — a rail needs width portrait lacks.
 */
export const biddingLayoutClass =
  "grid h-full min-h-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]"

/** Phone: pinned header. Tablet: dissolves so its children join the grid. */
export const biddingHeaderClass =
  "row-start-1 flex items-center justify-between gap-3 border-solid border-rule px-4 py-2 [border-bottom-width:var(--rule-weight)] lg:contents"
export const lotCounterClass =
  "text-xs font-bold uppercase tracking-[0.16em] text-ink lg:col-start-1 lg:row-start-1 lg:flex lg:items-center lg:border-solid lg:border-rule lg:px-6 lg:py-4 lg:text-sm lg:[border-bottom-width:var(--rule-weight)]"
export const liveStateClass =
  "flex items-baseline justify-end gap-2 lg:col-start-2 lg:row-start-1 lg:flex-col lg:items-center lg:justify-center lg:gap-1 lg:border-solid lg:border-rule lg:px-6 lg:py-5 lg:[border-bottom-width:var(--rule-weight)]"
export const countdownClassBase =
  "text-[2.2rem] font-bold leading-none tabular-nums tracking-[-0.02em] text-ink lg:text-[4rem]"
export const countdownUnitClass =
  "text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-muted"

/**
 * Phone: the scrolling middle, faded at its bottom edge so truncated deed
 * copy reads as "there is more" rather than as a rendering fault. Tablet:
 * dissolves, so the deed and the collection become separate rail regions.
 */
/**
 * `safe center` pulls the deed into the middle of a tall portrait tablet
 * instead of stranding it at the top above dead ground, and falls back to
 * start alignment the moment the content overflows — so a phone still scrolls
 * from the top of the card rather than from its clipped middle.
 */
export const biddingScrollClass =
  "row-start-2 grid min-h-0 [align-content:safe_center] overflow-y-auto px-4 py-4 [mask-image:linear-gradient(to_bottom,black_calc(100%_-_24px),transparent)] lg:contents"
export const biddingDeedRegionClass =
  "lg:col-start-1 lg:row-start-2 lg:row-span-2 lg:grid lg:min-h-0 lg:place-items-center lg:overflow-y-auto lg:border-solid lg:border-rule lg:[border-right-width:var(--rule-weight)] lg:p-6"
export const biddingCollectionClass =
  "mt-4 grid gap-2 border-solid border-rule pt-3 [border-top-width:var(--rule-weight)] lg:[border-top-width:0px] lg:col-start-2 lg:row-start-3 lg:mt-0 lg:max-h-56 lg:min-h-0 lg:content-start lg:overflow-y-auto lg:px-6 lg:pb-6 lg:pt-4"

/**
 * Phone: the pinned thumb zone; never scrolls, never moves, and keeps clear
 * of the home indicator. Tablet: the middle rail zone, at eye level.
 */
/**
 * The rule spans the full width, but the controls inside are capped so tablet
 * portrait does not stretch `Pass` into a 712px hairline strip. Released at
 * `lg`, where the dock becomes the rail zone and owns its own column.
 */
export const biddingDockClass =
  "row-start-3 grid gap-2 bg-surface px-4 pt-2 pb-[calc(0.5rem+max(env(safe-area-inset-bottom),0.75rem))] border-solid border-rule [border-top-width:var(--rule-weight)] [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-140 lg:[&>*]:max-w-none lg:col-start-2 lg:row-start-2 lg:content-center lg:gap-3 lg:px-6 lg:py-5 lg:pb-5 lg:[border-bottom-width:var(--rule-weight)]"
export const dockStatsClass =
  "flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-0 border-b border-b-[var(--rule-soft)] pb-2"
export const dockStatClass =
  "text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-ink-muted"
export const dockStatLeadClass =
  "text-[0.78rem] font-bold uppercase tracking-[0.08em] text-ink"

export const quickBidGridClass =
  "grid grid-cols-4 gap-2 [&>button]:min-w-0 lg:grid-cols-2 lg:gap-2.5"
export const quickBidButtonClass = `grid min-h-14 min-w-0 place-items-center gap-0.5 rounded-card bg-btn-face px-2 py-1 text-center font-bold uppercase text-btn-ink ${ruleClass} ${hardShadowClass} ${focusClass} ${pressClass} disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none lg:min-h-16`
export const quickBidAmountClass =
  "text-base leading-none tabular-nums lg:text-2xl"
export const quickBidCaptionClass =
  "text-[0.55rem] font-semibold uppercase leading-none tracking-[0.12em] opacity-70 lg:text-[0.65rem]"

/**
 * Pass is the quietest control in the group: no fill, no shadow, a 1px rule
 * that never thickens, lighter type and a shorter box than the quick bids —
 * while still clearing 44px and carrying full-strength ink.
 */
export const passButtonClass = `inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-card border border-solid border-rule bg-transparent px-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink ${focusClass} [touch-action:manipulation] transition-opacity duration-100 active:opacity-60 disabled:pointer-events-none disabled:opacity-45`

export const skippedOverlayClass =
  "absolute inset-0 z-1 grid animate-[overlay-in_220ms_ease-out] rotate-[-7deg] place-items-center rounded-card bg-ink/80 text-[clamp(2.4rem,9vw,5.4rem)] font-bold uppercase tracking-[0.06em] text-surface"

export const dialogBackdropClass =
  "fixed inset-0 z-10 grid place-items-center overflow-y-auto bg-ink/70 p-5"
