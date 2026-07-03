# Monopoly Auction Companion

A standalone web companion that lets players bid on Monopoly properties as part of gameplay setup.

**Status**: This is an active AI learning project. The core mechanics are functional, but it hasn't undergone any live playtesting or meaningful polish.

**Disclaimer**: This project is an unofficial companion app for experimenting with property-auction setup rules for a Monopoly-style board game. It is in no way affiliated with, endorsed by, or sponsored by Hasbro. Monopoly and related marks are trademarks of their respective owners.

## Why I Built This

My family loves playing Monopoly, but one downside is the amount of time it takes to get through a full game. A lot of this has to do with the random chance involved with landing on properties in order to purchase them. We have a variant of the game where the properties are randomly dealt to players prior to starting, but this often leads to stalemates when no one is willing to trade or sell properties.

For a while I'd had an idea to auction off properties before starting the game to speed things up and add a layer of strategy to the base game, but the manual effort of selecting an auctioneer and keeping track of bids and results was a high barrier to entry. So I had thought about building an app like this for some time, and when I was looking for a quick project to explore agentic AI coding and spec-driven development, it was a natural fit.

## Development Approach

I started by trying to write my own proposals and specs, but I learned pretty quickly that this isn't a strength. My requirements and acceptance criteria were too broad and left the agent with too many questions. I researched a handful of SDD tools, notably SpecKit and OpenSpec. I felt like OpenSpec was more lightweight and beginner friendly, so I chose that. Additionally, from previous projects, my environment already had the superpowers skill set.

### New Features

For new features or large modification, my flow typically looked like this:

1.  ospx:explore to iteratively define and narrow down the problem space
2.  ospx:apply
3.  Sanity test the change manually
4.  Iterate as needed

### UI Iteration

SDD generally worked well, but there were some challenges around UI polish. "Make it look cool" is not a well-defined requirement. For UI prototyping and refinement, I found superpowers visual companion incredibly helpful in brainstorming designs. Codex in /goal mode did a respectable job of taking a screenshot, instructions around color palette, layout, etc. and improving the UI.

### Bug Fixes

For very small changes, I would either make them myself or enage in a CLI chat. For issues that required some investigation and/or were larger, I logged an issue in GitHub and engaged the CLI in /goal mode with the issue URL and some validation instructions, for example (simplified and genericized):

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

- With hindsight, I would've written the PROJECT_CONTEXT.md first before jumping into SDD. I believe it would've given the agents better guardrails around folder structure and tech stack (notably using Tailwind)

[AI Learnings](./docs/AI%20Learnings.md) has additional high-level insights into what I've learned during this process.
