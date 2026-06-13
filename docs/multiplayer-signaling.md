# Multiplayer Signaling Boundary

The WebRTC multiplayer design keeps the backend as a signaling service only.

The signaling service may store:

- active join-code ownership
- connected signaling client ids
- pending offer, answer, and ICE routing metadata
- cleanup timestamps

The signaling service must not store or relay:

- bids or skips
- countdown state
- player cash
- won properties
- completed bid history
- host or player state snapshots

After a host and player establish a WebRTC DataChannel, game traffic flows directly between browsers. The host browser owns authoritative session state and sends each player only that player's state snapshot.

For multi-instance deployments, route all signaling messages for a join code to the same instance with sticky routing, or move the ephemeral signaling registry to a shared store such as Redis. The shared store should remain temporary; it should not become authoritative bidding storage.
