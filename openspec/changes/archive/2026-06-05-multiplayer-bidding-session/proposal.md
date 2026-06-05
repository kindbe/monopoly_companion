## Why

The first property bidding companion works as a single shared-device setup tool, but silent bidding and timed play need each player to interact privately from their own device. A local Node/WebSocket session lets a host run the table while players join by code, bid during synchronized countdowns, and see only their own money and winnings.

## What Changes

- Add a host-created multiplayer bidding session with a short join code.
- Let players join the session from their own browser by entering the code and their name.
- Replace the shared-device bidding view with role-specific host and player views for multiplayer sessions.
- Give each player a private view showing the current property, current bid, remaining property count, their own remaining cash, their own won properties, and bid/skip controls.
- Run each property through a synchronized 30-second countdown.
- Resolve bids server-side through a Node/WebSocket session server and broadcast updated session state to connected clients.
- Preserve the existing property pool, hidden randomized reveal, cash deduction, skipped-property, and completion summary rules.

## Capabilities

### New Capabilities

- `multiplayer-bidding`: A realtime host/player bidding session using join codes, private player views, synchronized countdowns, WebSocket state updates, and server-side bid resolution.

### Modified Capabilities

- `property-bidding`: Extend the existing setup bidding behavior from a single shared-device flow to support multiplayer sessions while preserving property selection, hidden reveal, cash budget, and assignment rules.

## Impact

- Add a Node/WebSocket server alongside the Vite React app.
- Add client-side routing or role selection for host and player views.
- Add shared session/state types used by the server and client.
- Add realtime connection lifecycle handling for session creation, player join, countdown ticks, bid/skip submissions, property resolution, and completion.
- Add tests for server-side bidding resolution and client-visible state privacy.
