# Monopoly Auction Companion

A standalone web companion that lets players bid on Monopoly properties as part of gameplay setup.

**Status**: This is an active AI learning project. The core mechanics are functional and covered by automated tests, but the app is intended as a local demonstration rather than a production service.

**Disclaimer**: This project is an unofficial companion app for experimenting with property-auction setup rules for a Monopoly-style board game. It is in no way affiliated with, endorsed by, or sponsored by Hasbro. Monopoly and related marks are trademarks of their respective owners.

## Why I Built This

My family loves playing Monopoly, but one downside is the amount of time it takes to get through a full game. A lot of this has to do with the random chance involved with landing on properties in order to purchase them. We have a variant of the game where the properties are randomly dealt to players prior to starting, but this often leads to stalemates when no one is willing to trade or sell properties.

For a while I'd had an idea to auction off properties before starting the game to speed things up and add a layer of strategy to the base game, but the manual effort of selecting an auctioneer and keeping track of bids and results was a high barrier to entry. So I had thought about building an app like this for some time, and when I was looking for a quick project to explore agentic AI coding and spec-driven development, it was a natural fit.

## Quickstart

### Prerequisites
 - Node.js 22+
 - pnpm

### Install
```sh
pnpm install
```

### Run Locally
Start both the app and the multiplayer signalling server:

```sh
pnpm dev:all
```

Then open the Vite URL shown in the terminal (e.g., http://localhost:5173).  To test multiplayer, open the URL in multiple browser tabs or windows.

### Scripts
This is not an exhaustive list, but is enough to get started:
 - `pnpm build` - Builds the frontend and signalling server
 - `pnpm dev:all` - Runs the frontend and signalling server
 - `pnpm test` - Run unit tests
 - `pnpm test:e2e` - Run end-to-end playwright tests

## Architecture
The app is a Vite/React single-page app with a small TypeScript signalling server for multiplayer session discovery and WebRTC negotiation. The host is the authority for session state, and there is no persistent storage.

### Project Layout
 - `src/components/` contains screen-level React UI for setup, lobby, bidding, summaries, and property details.
 - `src/domain/` contains Monopoly property data and bidding rules that are independent of React.
 - `src/shared/` contains multiplayer/session logic shared by browser and server-adjacent code, including transport abstractions and host-authoritative session behavior.
 - `src/server/` contains the local signaling/WebSocket server used to coordinate multiplayer connections.

## Auction Flow

When loading the app, the user is presented with a simple UI to host or join an auction session:

![Landing screen](docs/images/landing_screen.png)

Clicking the "Host Multiplayer" button loads the auction setup screen where the host can set options like the number of properties, time per bid, number of allowed bids per player per round, etc.:

![Auction Setup](docs/images/host_setup.png)

Once the setup is complete, the host is taken to a lobby screen with a join code to share with other players:

![Host Lobby](docs/images/host_lobby.png)

Other players can join by selecting "Join Session" on the landing screen and entering the join code in the subsequent screen:

![Session Join](docs/images/session_join.png)

Once all players have joined, the host can click "Start multiplayer bidding" from the host lobby to initiate the bidding.  At that point, all players are shown individual bidding screens with the property up for bid, their available cash, bid increments, etc.:

![Player Bidding](docs/images/player_bidding.png)

As players win properties, they accumulate under the "Your properties" section, grouped by color group so you can see which monopolies you are close to completing.  Players can click on won properties to see additional details:

![Property Details Overlay](docs/images/owned_property_overlay.png)

### Contrast Modes

The screenshots above are the standard theme.  A single control in the corner cycles three contrast modes: standard, high contrast, and dark.

High contrast targets a 7:1 text ratio rather than the usual 4.5:1, and additionally gives every property color group a distinct fill pattern on its band.  That matters because the color group determines which monopolies a player can complete, so it is strategic information rather than decoration and cannot be carried by hue alone.  Reaching 7:1 means the high contrast palette deliberately departs from the authentic board colors.

<details>
<summary>Dark mode screenshots</summary>

![Dark landing screen](docs/images/landing_screen_dark.png)
![Dark auction setup](docs/images/host_setup_dark.png)
![Dark host lobby](docs/images/host_lobby_dark.png)
![Dark session join](docs/images/session_join_dark.png)
![Dark player bidding](docs/images/player_bidding_dark.png)
![Dark property details overlay](docs/images/owned_property_overlay_dark.png)

</details>

<details>
<summary>High contrast screenshots</summary>

![High contrast landing screen](docs/images/landing_screen_high_contrast.png)
![High contrast auction setup](docs/images/host_setup_high_contrast.png)
![High contrast host lobby](docs/images/host_lobby_high_contrast.png)
![High contrast session join](docs/images/session_join_high_contrast.png)
![High contrast player bidding](docs/images/player_bidding_high_contrast.png)
![High contrast property details overlay](docs/images/owned_property_overlay_high_contrast.png)

</details>

Bidding continues until all of the properties have been won or skipped/ignored.  After that, it's up to the players to dole out the won properties, settle up with the bank, and play the real game!

## Development Approach

I started by trying to write my own proposals and specs, but my early requirements and acceptance criteria were too broad and left the agent with unresolved questions. I researched a handful of SDD tools, notably SpecKit and OpenSpec. I felt like OpenSpec was more lightweight and beginner friendly, so I chose that. Additionally, from previous projects, my environment already had the superpowers skill set.

As I improved at narrowing problem spaces, both on my own and with the help of OpenSpec and superpowers, the efficiency and quality of changes also improved significantly.

### New Features

For new features or large modification, my flow typically looked like this:

1.  opsx:explore to iteratively define and narrow down the problem space
2.  opsx:propose to formalize specs and implementation plan
3.  opsx:apply
4.  Sanity test the change manually
5.  Iterate as needed

### UI Iteration

SDD generally worked well, but there were some challenges around UI polish. "Make it look cool" is not a well-defined requirement. For UI prototyping and refinement, I found superpowers visual companion incredibly helpful in brainstorming designs. Agents in /goal mode did a respectable job of taking a screenshot, instructions around color palette, layout, etc. and improving the UI.

### Bug Fixes

For very small changes, I would either make them myself or engage in a CLI chat. For issues that required some investigation and/or were larger, I logged an issue in GitHub and engaged the CLI in /goal mode with the issue URL and some validation instructions, for example (simplified and genericized):

```
/goal Resolve issue https://github.com/kindbe/monopoly_companion/1234.  Read the issue title and description and implement a solution for the issue.  Ask questions if the nature of the issue is unclear or if there are multiple possible solutions.

Acceptance criteria:
  1. The change must resolve the issue symptoms, and you must provide empirical proof that it does.
  2. The failure mode must be covered by a unit test if one does not already exist.
  3. Code coverage on new or changed code must meet project guidelines.
```

### Failure Modes

- Not providing detailed requirements
- Not adequately describing acceptance criteria and test methodologies
- "Vibe Code Decay": letting the AI fall back into a more conversational mode while iterating on code changes

### Other Learnings

- With hindsight, I would've written the AGENTS.md first before jumping into SDD. I believe it would've given the agents better guardrails around folder structure and tech stack (notably using Tailwind)

[AI Learnings](./docs/AI%20Learnings.md) has additional high-level insights into what I've learned during this process.
