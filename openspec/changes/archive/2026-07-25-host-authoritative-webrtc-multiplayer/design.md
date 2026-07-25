## Context

The current multiplayer implementation uses a Node/WebSocket server as the authoritative owner of session state. `src/server/session.ts` creates sessions, validates bids, controls countdowns, resolves properties, and serializes host/player state. `src/server/transport.ts` receives typed client commands and broadcasts typed server events over WebSockets. The React app opens a WebSocket, sends multiplayer commands, and renders `host-state` or `player-state` events.

The target experience keeps the familiar host/player join-code flow, but changes where authority lives. The host browser should own the multiplayer session engine, while player browsers send bid/skip/join intents over WebRTC DataChannels. The backend remains useful as a lightweight signaling server: it creates or looks up join codes, tracks temporary host/player signaling sockets, and exchanges WebRTC offer/answer/ICE messages. It must not validate bids, resolve properties, run countdowns, or relay normal game state once peers connect.

## Goals / Non-Goals

**Goals:**

- Preserve the current multiplayer product flow: host creates a session, players join by code, host starts bidding, everyone completes the property auction.
- Move authoritative bidding state, countdown control, validation, and property resolution into the host browser.
- Use WebRTC DataChannels for bid/skip intents and role-filtered state snapshots between browsers.
- Keep a small signaling server for connection setup and reconnect coordination.
- Make the migration incremental by isolating session authority from transport details before switching the UI to WebRTC.
- Preserve the private player state boundary so each player receives only their own cash, won properties, skip status, and controls.

**Non-Goals:**

- No true zero-backend/manual QR pairing flow.
- No accounts, persisted sessions, matchmaking, rankings, or anti-cheat system.
- No host migration if the host leaves or closes the tab.
- No large-room optimization beyond normal Monopoly-scale sessions.
- No change to Monopoly property data, bid increments, property selection, or auction resolution rules.

## Decisions

### Extract a browser-safe authoritative session engine

Move the authoritative logic now embedded in `src/server/session.ts` into a shared module that can run in both Node tests and the host browser. The engine should expose methods for creating a host-owned session, accepting/rejecting player joins, starting bidding, applying bid/skip intents, resolving expired rounds, marking peer connectivity, and serializing host/player state.

Alternative considered: reimplement the session rules directly in React state. That would couple transport, UI, and domain rules too tightly and would risk drifting from the current tested server behavior.

### Introduce a transport boundary before replacing WebSockets

The client should interact with a small multiplayer transport interface rather than directly constructing `WebSocket` commands inside React handlers. The existing WebSocket flow can become one implementation of that interface, and the WebRTC host/player flow can become another.

Alternative considered: replace the WebSocket calls in-place. That would make the migration harder to test because UI changes, peer lifecycle, signaling, and session authority would all move at once.

### Use host-authoritative WebRTC star topology

Each player should establish a DataChannel connection to the host. Players send intents to the host; the host validates them through the shared session engine and broadcasts updated player-safe snapshots. Players do not need direct player-to-player channels because the host is the arbiter and only the host has full session state.

Alternative considered: full mesh peer-to-peer. That adds synchronization complexity without improving the product, because the game already has a natural authority: the host.

### Keep signaling intentionally small

The signaling server should own only ephemeral connection setup state:

- join-code registration for host-created sessions
- host/player signaling socket presence
- WebRTC offer/answer/ICE exchange
- cleanup after disconnects or TTL expiry

It should not store player cash, properties, bids, countdowns, or completed bid history. After DataChannels are open, normal bid/skip/state traffic should not flow through the signaling server.

Alternative considered: continue relaying game messages through WebSockets as a fallback inside the same session. That is useful during rollout, but the target behavior must prove that a connected WebRTC session can complete without central game-state relay.

### Keep existing message semantics where possible

The existing `ClientCommand` and `ServerEvent` shapes should be split or renamed only where needed. Game-level messages should stay close to today’s create/join/start/bid/skip/state concepts, while signaling messages should be separate from game messages. This keeps tests and UI behavior recognizable.

Alternative considered: design an entirely new protocol. That would increase churn and make it harder to verify that the user-facing flow stayed the same.

## Risks / Trade-offs

- WebRTC setup complexity → Isolate signaling, peer connection management, and game session state into separate modules with focused tests.
- NAT traversal failures → Support configurable STUN/TURN ICE servers and surface clear UI errors when peer connection fails.
- Host tab closes or sleeps → Treat the host as required infrastructure for the session; players should see a host-disconnected state and cannot continue without the host.
- Reconnects can duplicate players → Require stable player ids after join and let the host reconcile reconnect attempts by join code plus player identity.
- Signaling can become horizontally inconsistent → Keep the first version single-instance compatible, and document that multi-instance deploys need sticky routing or shared ephemeral signaling state such as Redis.
- Automated tests may be flaky around WebRTC timing → Unit-test the session engine and signaling protocol separately, then keep Playwright to one complete host plus two-player WebRTC flow with short countdowns.

## Migration Plan

1. Extract and test the browser-safe authoritative session engine while preserving current WebSocket behavior.
2. Add typed signaling messages and signaling-service tests without changing game flow.
3. Add WebRTC host/player transport modules behind the client transport boundary.
4. Wire the React multiplayer flow to the WebRTC transport while keeping WebSocket multiplayer available as a fallback during verification.
5. Update Playwright to prove the host plus two-player browser flow completes through WebRTC DataChannels.
6. Remove or de-emphasize the old authoritative WebSocket game transport after WebRTC passes unit, build, and E2E verification.

Rollback is straightforward while the WebSocket fallback remains: route the UI back to the existing WebSocket transport and leave the signaling/WebRTC modules unused.

## Open Questions

- Which public STUN/TURN configuration should be used by default for local development and deployed use?
- Should the host page expose a technical connection-status panel, or should connection problems stay as compact user-facing status messages?
- Should the WebSocket authoritative transport remain as a long-term fallback, or only during the migration?
