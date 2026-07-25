## Why

The current multiplayer flow depends on a Node/WebSocket server as the authoritative owner of session state, countdowns, and bidding resolution. Moving authority into the host browser would make multiplayer feel closer to a table-local companion: the central service only helps peers find each other, while bids, skips, countdowns, and state snapshots flow directly between browsers.

## What Changes

- Add a WebRTC DataChannel multiplayer transport for direct host/player browser communication.
- Keep a small signaling server for join-code lookup, peer presence, and WebRTC offer/answer/ICE exchange.
- Move authoritative multiplayer session state from the central server into the host browser.
- Treat the host browser as the arbiter for player joins, bidding start, countdown timing, bid/skip validation, property resolution, and role-filtered state snapshots.
- Preserve the existing host/player UI shape, join-code flow, bidding rules, property selection, private player state boundary, and Playwright-covered multiplayer workflow.
- Keep the central signaling service out of game-state relay after peers establish WebRTC connections.
- Retain a pragmatic fallback path during rollout so existing WebSocket multiplayer behavior can continue working while the P2P transport is introduced and verified.

## Capabilities

### New Capabilities

- `webrtc-signaling`: Defines the lightweight signaling behavior required to connect host and player browsers without carrying authoritative game state.

### Modified Capabilities

- `multiplayer-bidding`: Multiplayer sessions become host-authoritative over browser peer connections instead of server-authoritative over WebSocket game events.
- `ui-automation`: Browser automation must verify the WebRTC host/player flow and continue proving privacy and session completion across multiple pages.

## Impact

- Affected code: multiplayer session state ownership, shared multiplayer protocol types, server signaling transport, client connection lifecycle, host/player state dispatch, reconnect/error handling, Vitest server/client tests, and Playwright multiplayer E2E coverage.
- New browser API usage: `RTCPeerConnection`, `RTCDataChannel`, and ICE server configuration.
- Possible dependency impact: small QR/share helpers are optional, but the planned join-code flow should not require a new hosted realtime provider.
- Operational impact: the backend changes from authoritative game server to lightweight signaling server; future horizontal scaling should use shared ephemeral signaling state or sticky routing.
