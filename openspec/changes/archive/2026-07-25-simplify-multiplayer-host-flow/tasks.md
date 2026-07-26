## Implementation

- [x] Add failing tests for simplified landing, host setup validation, host-created player registration, host lobby player list, host-as-player bidding, and host player summary completion.
- [x] Update shared multiplayer messages/types so `create-session` accepts a host name and returns or emits the host player id.
- [x] Update server session creation to create the host as the first player and validate the host name.
- [x] Replace the initial UI with a landing screen containing only `Host Multiplayer` and `Join Session`.
- [x] Move multiplayer configuration into a host setup screen shown after `Host Multiplayer`.
- [x] Update host lobby to show join code and all joined player names, including the host, before `Start Bidding`.
- [x] Switch the host client to the same player bidding and completion views as joined players after `Start Bidding`.
- [x] Remove or hide local/hot-seat bidding controls from the main UI.
- [x] Update Playwright automation for the simplified multiplayer-only host/player flow.
- [x] Run unit tests, build, and E2E verification.
