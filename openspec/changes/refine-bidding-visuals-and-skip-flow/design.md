## Overview

This change refines the already-implemented bidding companion rather than replacing its architecture. The server remains authoritative for multiplayer session state, while the React client presents host-only setup controls and player-only bidding views.

## Decisions

- The bid deadline control is host setup-only. Players never see the setup control or explanatory text during active bidding.
- Multiplayer sessions default to a 10-second countdown and clamp configured values to the 5-30 second range.
- The countdown appears visually under the current property card in player bidding views.
- A player skip marks only that player skipped for the current round and disables their bid controls until the next property is revealed.
- If every active player has skipped, the server resolves the property as unowned and sends a short skipped-round message that the client displays as a `Skipped!` overlay.
- Owned properties in the player view use compact property-card styling and are sorted by street color value descending, followed by railroads and utilities.
- Mediterranean Avenue and Baltic Avenue use `Purple` as their display color group.

## Notes

- Local hot-seat bidding already supports player-level skip/pass controls; this change focuses on the multiplayer player view and server-backed skip semantics called out in the exploration.
- Opening bids should continue to be computed through the existing domain helper so local and multiplayer behavior remain consistent.
- E2E tests may configure a shorter countdown within the same 5-30 second supported range.
