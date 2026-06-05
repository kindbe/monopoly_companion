## Context

The product is a React and TypeScript web app built with Vite and pnpm. The new feature introduces a setup-only bidding mini-game that sits before standard Monopoly play. The main constraint is mobile usability across common phone resolutions in both portrait and landscape.

## Goals / Non-Goals

**Goals:**
- Define a setup flow for bidding on Monopoly properties before gameplay starts.
- Support ascending auction and silent auction bidding modes.
- Let hosts configure bid increment, property count, and optional railroad/utility inclusion.
- Keep the selected property list hidden before bidding and reveal properties one at a time in random order.
- Deduct winning bids from each player's Monopoly starting cash and report remaining cash for gameplay.
- Keep the interaction simple enough for casual or family use.
- Ensure the experience is practical on mobile devices in portrait and landscape.
- Preserve core Monopoly gameplay after setup is complete.

**Non-Goals:**
- Changing Monopoly’s core turn structure or board rules during gameplay.
- Adding account systems, persistence, or networked multiplayer.
- Building a full digital Monopoly engine beyond setup and assignment.

## Decisions

- Use a single-page, state-driven flow for setup and bidding.
  - This keeps the experience fast to load and easy to reason about for a short pre-game interaction.
  - Alternative considered: a multi-route wizard. Rejected because it adds navigation overhead without clear value for a short setup experience.
- Treat the bidding experience as a guided mini-game rather than a fully open market.
  - This reduces rule complexity and keeps the feature approachable for casual players.
  - Alternative considered: free-form auctioning with custom bidding rules. Rejected because it increases cognitive load and implementation complexity.
- Offer two bidding modes: ascending auction and silent auction.
  - Ascending auction reveals one property and lets players openly raise bids until everyone but one player passes.
  - Silent auction lets each player enter an opening bid and maximum bid for the revealed property.
  - This gives groups a choice between social table energy and faster private bidding without requiring a full auction engine.
- Use Monopoly starting cash as the setup budget.
  - Winning bids reduce the winning player's starting cash for the main game.
  - Bids above a player's remaining setup cash are invalid.
  - This keeps setup meaningful while preserving standard gameplay after property assignment.
- Use host-selected bid increments.
  - The increment applies to ascending raises, silent proxy pricing, and sudden-death re-bids.
  - This supports exact accounting or faster family-table pacing depending on host preference.
- Build a hidden randomized property deck.
  - The host chooses a property count, defaulting to 10, capped by the eligible pool size.
  - Street properties are always eligible; railroads and utilities can be enabled separately.
  - The app randomly selects and orders the requested property count from the eligible pool, but does not show the full list before bidding.
- Resolve silent auction pricing with proxy-style rules.
  - The winner pays their opening bid if no competing max bid requires more.
  - Otherwise, the winner pays enough to beat the next highest max bid by the selected increment, capped at the winner's max bid.
  - If top max bids tie, tied players enter a sudden-death re-bid for the same property.
- Skip properties that receive no bids.
  - A no-bid property remains unowned and the flow moves to the next revealed property.
  - This avoids forcing unwanted ownership and keeps the setup moving.
- Prioritize responsive layout constraints early in the component structure.
  - The spec requires usable layouts in portrait and landscape on several mobile resolutions, so layout behavior should be built into the core screens rather than patched later with ad hoc CSS.
  - Alternative considered: desktop-first layout with mobile overrides. Rejected because it risks cramped interaction patterns on small screens.

## Risks / Trade-offs

- Responsive complexity across multiple mobile aspect ratios -> Use layout primitives that can reflow content without hiding core actions.
- Rule ambiguity around bidding outcomes -> Keep deterministic assignment, pricing, tie, and no-bid rules in the state model and visible UI copy.
- Hidden property order may surprise players -> Show the current property clearly when revealed and summarize progress without exposing unrevealed properties.
- Cash deduction can create invalid later bids -> Validate every bid against remaining setup cash and keep remaining cash visible during bidding.
- Scope creep into full Monopoly gameplay -> Keep feature boundaries strict and limit state to setup and property allocation.
- Too much interaction density on small screens -> Prefer compact card layouts, clear primary actions, and minimal simultaneous controls.
