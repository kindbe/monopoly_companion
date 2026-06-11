## Why

The current entry and host experience still exposes local/hot-seat setup paths that distract from the multiplayer companion flow. The host should create and join the multiplayer session as a normal bidder, then see the same bidding and final summary screens as everyone else.

## What Changes

- Replace the initial setup screen with a simple landing screen containing only `Host Multiplayer` and `Join Session`.
- Remove local/hot-seat bidding from the main UI for now.
- Move multiplayer setup options behind `Host Multiplayer`.
- Require the host to enter their own player name before creating a session.
- Create the host as the first player in the multiplayer session.
- Show the lobby join code and joined player names, including the host, after session creation.
- Keep bidding locked until the host explicitly presses `Start Bidding`.
- After bidding starts, show the host the same player bidding view as all other participants.
- After completion, show the host the same player final summary as all other participants.

## Capabilities

### New Capabilities

### Modified Capabilities

- `property-bidding`: The app entry flow becomes multiplayer-first and removes local/hot-seat bidding from the main UI.
- `multiplayer-bidding`: Host session creation includes host player registration, lobby display, start control, and host-as-player bidding/completion.
- `ui-automation`: Browser automation must cover the simplified landing, host setup, host-as-player bidding, and host player summary.

## Impact

- Affected code: React app phases and screens, multiplayer session creation protocol, server session store, shared multiplayer event types, tests, and Playwright flow.
- No new runtime dependencies are expected.
