## 1. Multiplayer Foundations

- [x] 1.1 Add Node/WebSocket server dependencies and development scripts
- [x] 1.2 Create shared TypeScript session, command, event, and role-filtered state types
- [x] 1.3 Define in-memory session storage, join-code generation, and active-session lookup
- [x] 1.4 Add tests for unique join-code creation and invalid join handling

## 2. Server Session Logic

- [x] 2.1 Implement host session creation and player join commands
- [x] 2.2 Implement host start-bidding command using existing property pool and hidden deck rules
- [x] 2.3 Implement server-controlled 30-second countdown state and expiry resolution
- [x] 2.4 Implement player bid and skip commands with cash, countdown, and duplicate-action validation
- [x] 2.5 Implement server-side property resolution, cash deduction, no-bid skip, and session completion
- [x] 2.6 Add tests for bid submission, skip submission, late rejection, timeout resolution, cash deduction, and completion

## 3. WebSocket Transport

- [x] 3.1 Implement WebSocket connection lifecycle, client registration, and disconnect handling
- [x] 3.2 Implement typed command parsing and error responses
- [x] 3.3 Implement host-state and player-state serializers that enforce privacy boundaries
- [x] 3.4 Add tests that player payloads exclude other-player cash, won properties, and bid submissions

## 4. Client Views

- [x] 4.1 Add role selection or routes for host session creation and player join
- [x] 4.2 Build host lobby view with join code, local URL guidance, joined players, and start controls
- [x] 4.3 Build player join flow requiring join code and non-empty player name
- [x] 4.4 Build player bidding view with current property, current bid, remaining property count, own cash, own won properties, countdown, bid, and skip controls
- [x] 4.5 Build host progress and completion summary views for the multiplayer session

## 5. Verification

- [x] 5.1 Add or update client tests for host creation, player join, private player state, countdown display, bid/skip actions, and completion
- [x] 5.2 Run server tests, client tests, production build, and OpenSpec validation
- [x] 5.3 Manually verify a host plus at least two player browser sessions can complete a short bidding session
