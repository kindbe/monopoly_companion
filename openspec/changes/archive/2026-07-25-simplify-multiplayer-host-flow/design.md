## Overview

The app becomes multiplayer-only from the user's perspective. Local bidding logic may remain in the codebase if needed during transition, but the main UI should not expose local/hot-seat setup or local-only bidding controls.

## Flow

```text
Landing
  - Host Multiplayer
  - Join Session

Host Multiplayer
  - Host name
  - Property pool controls
  - Property count
  - Bid deadline
  - Create Session

Lobby
  - Join code
  - Joined player names, including host
  - Start Bidding

Bidding
  - Host and joined players all see the same player bidding view

Completion
  - Host and joined players all see the same player final summary
```

## Design Decisions

- The landing screen should be intentionally minimal: only `Host Multiplayer` and `Join Session`.
- Host configuration should happen before session creation, not on the landing screen.
- Session creation requires a non-empty host name.
- The server should create a player record for the host when the session is created and return that host player id to the host client.
- The host client should keep both host control identity and player identity while in the lobby.
- `Start Bidding` remains host-only and available only from the lobby.
- After `Start Bidding`, the host client should switch to the same player bidding screen used by joined players.
- On session completion, the host should stay in the same player-centric experience and see their own final player summary.

## Protocol Notes

- `create-session` should include `hostName` and `config`.
- The server response/event should let the host know its `playerId`.
- Existing `player-state` events can drive the host's bidding and completion views once bidding starts.
- Host lobby state should include joined player names and connection status, including the host.

## Testing Strategy

- Unit tests should cover host session creation with host player registration and validation.
- UI tests should cover the simplified landing and host setup/lobby transition.
- E2E should cover one host plus at least one joined player, verify the host participates in bidding, and verify host completion uses the player summary view.
