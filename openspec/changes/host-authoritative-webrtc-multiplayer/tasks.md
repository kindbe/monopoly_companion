## 1. Session Engine Extraction

- [x] 1.1 Add focused tests that capture current multiplayer session behavior for host creation, player join, bid validation, skip handling, countdown expiry, property resolution, private player state, and disconnect status.
- [x] 1.2 Extract the authoritative session logic from `src/server/session.ts` into a browser-safe shared module that has no WebSocket or Node-only dependencies.
- [x] 1.3 Update `src/server/session.ts` to wrap the shared session engine so the existing WebSocket server behavior remains unchanged.
- [x] 1.4 Run the session and transport unit tests to verify the extraction did not change current behavior.

## 2. Client Transport Boundary

- [x] 2.1 Add a typed client-side multiplayer transport interface for create session, join session, start bidding, bid, skip, state events, errors, and disconnects.
- [x] 2.2 Move the current WebSocket client logic from `src/App.tsx` into a WebSocket transport implementation behind that interface.
- [x] 2.3 Update React multiplayer handlers to use the transport interface while preserving the current UI flow and accessible labels.
- [x] 2.4 Add or update React tests proving host setup, player join, bidding, skip, error, and completion flows still work through the transport boundary.

## 3. Signaling Server

- [x] 3.1 Add shared signaling message types for host registration, player lookup, offer relay, answer relay, ICE candidate relay, signaling errors, peer connected, and cleanup.
- [x] 3.2 Implement signaling-session registration with unique join-code ownership, host/player presence, TTL cleanup, and disconnect cleanup.
- [x] 3.3 Implement offer/answer/ICE relay between matched host and player signaling sockets.
- [x] 3.4 Reject game-state message types on the signaling channel so bids, skips, countdowns, player cash, properties, and state snapshots cannot be relayed through signaling.
- [x] 3.5 Add server tests for valid signaling registration, unknown join rejection, host disconnect cleanup, TTL cleanup, negotiation relay, and game-message rejection.

## 4. WebRTC Peer Transport

- [x] 4.1 Add a WebRTC host transport that registers with signaling, accepts player peer connections, opens DataChannels, and exposes player join/bid/skip intents to the host session engine.
- [x] 4.2 Add a WebRTC player transport that looks up a join code through signaling, negotiates a DataChannel with the host, sends join/bid/skip intents, and receives player-safe state snapshots.
- [x] 4.3 Add configurable ICE server settings with a development default and a clear error path when peer connection setup fails.
- [x] 4.4 Add unit tests with mocked `RTCPeerConnection` and `RTCDataChannel` for host negotiation, player negotiation, DataChannel open/close, message parsing, malformed message handling, and connection failure.

## 5. Host-Authoritative Game Flow

- [x] 5.1 Wire the host browser to create and own the shared session engine after signaling registration succeeds.
- [x] 5.2 Route player join intents from DataChannels through the host-owned session engine and broadcast updated host/player snapshots.
- [x] 5.3 Route bid and skip intents from DataChannels through the host-owned session engine and broadcast updated player-safe snapshots.
- [x] 5.4 Move countdown ticking and expired-round resolution for WebRTC sessions into the host browser.
- [x] 5.5 Show a host-unavailable state on player pages when the host DataChannel closes before completion.
- [x] 5.6 Support player reconnect by stable player identity and send the latest player-safe session snapshot after reconnect.

## 6. Rollout and Fallback

- [x] 6.1 Keep the existing WebSocket authoritative multiplayer path available as a fallback while the WebRTC transport is introduced.
- [x] 6.2 Add a configuration switch or runtime capability check that chooses WebRTC when browser support and signaling are available.
- [x] 6.3 Surface concise user-facing errors for unsupported WebRTC, signaling failure, ICE failure, host disconnect, and player reconnect failure.
- [x] 6.4 Document the operational boundary that the backend is signaling-only and multi-instance deployments require sticky routing or shared ephemeral signaling state.

## 7. Browser Automation and Verification

- [x] 7.1 Update Playwright server setup so E2E starts the Vite app and signaling server required by WebRTC multiplayer.
- [x] 7.2 Update the multiplayer E2E test to create a host session, join two players by code over WebRTC, start bidding, submit one bid, submit one skip, resolve the property, and verify completion.
- [x] 7.3 Extend E2E assertions to verify player pages do not show other-player cash or won properties in the WebRTC flow.
- [x] 7.4 Run unit tests, coverage, build, and Playwright E2E verification.
- [x] 7.5 Remove or demote the old authoritative WebSocket game transport only after the WebRTC flow passes automated verification and the fallback decision is finalized.
