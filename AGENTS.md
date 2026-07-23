# Project Overview

This project is a companion experience for the Monopoly board game. It is meant to be run before the start of gameplay where players bid on some or all of the properties in the game. The goal is to add a novel alternative setup to both speed up the base game and create a new competitive gameplay layer via a standalone web experience. The application is purely a pre-game addition and does not otherwise implement the game or track state.

# Technical Details

- TypeScript
- React frontend built with Vite
- Tailwind for styling
- pnpm for package management

# Project Layout

```
monopoly-companion/
├──e2e/           # End-to-end tests
├── openspec/     # OpenSpec specifications and changes
└── src/
  ├── common/     # Shared utilities
  ├── components/ # React components and component-specific supporting types/utilities
  └── server/     # Multiplayer session coordination server code
```

# Coding Conventions

- Use camelCase for pure TypeScript files, such as helpers
- Use PascalCase for React components
- Tests should be in separate *.test.[ts|tsx] files colocated with the test target

# Change Guidelines

Before making a change:

1. Read the relevant OpenSpec specification or change, when one exists.
2. Evaluate the requirements for ambiguity, internal inconsistency, and conflicts with existing specifications, tests, or architecture. Ask clarifying questions when a material uncertainty would affect behavior or design; otherwise, state reasonable assumptions and proceed.
3. Inspect nearby code and tests for established patterns.
4. Identify whether the change affects the frontend, shared logic, server, or multiple layers.

When implementing a change:

- Make the smallest coherent change that satisfies the requirement.
- Preserve existing architectural boundaries.
- Add or update tests for changed behavior.
- Do not introduce a new dependency unless it provides clear value.

Before considering a change complete:

- Run the relevant unit tests. Verify that overall code coverage is at or above 80% line coverage.
- Run type checking and linting.
- Run end-to-end tests when the change affects a complete user workflow or multiplayer coordination.
- Report any tests that could not be run or any remaining uncertainty.

OpenSpec changes define intended behavior for work performed under that change. Existing code should not override an explicit specification silently; surface conflicts between the specification, tests, and implementation.

# Development Commands

- pnpm build          # Builds the app
- pnpm dev:all        # Runs both the frontend and the multiplayer coordination server
- pnpm test           # Runs unit tests
- pnpm test:coverage  # Runs unit tests with code coverage enabled
- pnpm test:e2e       # Runs PlayWright e2e tests
