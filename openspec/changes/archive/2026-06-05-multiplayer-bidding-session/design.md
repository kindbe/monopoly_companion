## Context

The current app is a Vite React single-page app with all bidding state held in the browser. That works for a shared-device table companion, but it cannot create join codes, synchronize a countdown across devices, or keep each player's bids and state private. This change introduces a local Node/WebSocket server that owns multiplayer session state while the React client renders either a host view or a player view.

## Goals / Non-Goals

**Goals:**
- Let a host create a bidding session and receive a short join code.
- Let players join from their own browsers by entering the join code and their name.
- Keep authoritative session state on a Node/WebSocket server.
- Show players only the current property, current bid, remaining property count, their own remaining cash, their own won properties, and bid/skip controls.
- Run each revealed property with a shared 30-second countdown.
- Preserve the existing property pool, hidden randomized reveal, cash deduction, and skipped no-bid property rules.

**Non-Goals:**
- Account systems, authentication, or persistent saved games.
- Hosted cloud deployment or cross-network discovery.
- Chat, player-to-player messaging, or full Monopoly gameplay.
- Long-term session recovery after server restart.
- Supporting both local single-device and multiplayer modes with identical UI; the multiplayer flow can introduce role-specific screens.

## Decisions

- Use a Node/WebSocket server as the authoritative session host.
  - The server creates join codes, stores sessions in memory, controls countdowns, validates bids, resolves properties, deducts cash, and broadcasts role-filtered state.
  - Alternative considered: keep state in the browser and use peer connections. Rejected because join-code coordination and authoritative timers become harder without adding a signaling layer anyway.
  - Alternative considered: Supabase or Firebase. Rejected for now because local table play does not need accounts or hosted infrastructure.
- Use in-memory sessions with short join codes.
  - This keeps the first multiplayer version small and easy to run locally.
  - Join codes should be unique among active sessions and expire when the server restarts or the host ends the session.
  - Alternative considered: database-backed sessions. Rejected because persistence is a non-goal.
- Split client state by role.
  - The host view can show joined players, setup controls, countdown state, and overall progress.
  - The player view receives only player-safe session state and never receives other players' cash, won properties, or bid submissions.
  - This privacy rule should be enforced by server payload shape, not only by hiding fields in React.
- Use timed private bidding as the initial multiplayer auction mode.
  - Each property runs a 30-second round where players can bid or skip.
  - The server resolves valid bids at countdown end using the existing silent/proxy-style resolution rules where applicable.
  - Timed ascending auction is intentionally out of scope for this change because it adds live bid-race and latency behavior.
- Model WebSocket messages as typed commands and events.
  - Client commands include create session, join session, start bidding, submit bid, skip property, and advance/end session.
  - Server events include host state, player state, countdown tick, bidding result, error, and session ended.
  - Shared TypeScript types should live in a module usable by both server and client.
- Keep countdown resolution server-side.
  - Client timers are display-only. The server determines when the round closes, rejects late submissions, and advances resolution.
  - This avoids device clock drift and prevents a client from extending or shortening bidding windows.

## Risks / Trade-offs

- Local server discoverability may be awkward on phones -> Show the local URL and join code clearly in the host view, and document that devices need to reach the server host.
- WebSocket disconnects during bidding can confuse players -> Keep joined players in session state, show connection status, and treat no submitted bid before timeout as skip.
- Privacy leaks through shared state payloads -> Create separate host and player state serializers and test that player payloads exclude other-player cash, winnings, and bids.
- Countdown and bid race edge cases can be subtle -> Make server time authoritative and cover late bid, duplicate bid, skip, and timeout behavior with tests.
- In-memory sessions disappear on restart -> Accept this for the first local multiplayer version and keep persistence out of scope.
