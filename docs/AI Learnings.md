# Learnings

I wanted to capture what I've discovered along the way (both before and after starting this project). This document is my perspective on what I've learned, and certainly isn't exhaustive. But it has been useful for me to frame how I think about AI-driven software development.

## Climbing the AI Delegation Ladder

Reflecting on my own journey with AI, I've been thinking about the ways I delegate tasks (or don't). I think there's a very natural rubric in how and when I assign tasks to AI that in some ways mirrors that journey.

### No AI Needed

To the man with a hammer… It’s easy to fall into the habit of having AI solve every problem, and with modern models and harnesses, it will almost always do a credible job. But there are cases where AI is more power than you actually need, and the inherent non-determinism of AI is a continual (though diminishing) risk. Why ask Claude to rename a method in a small codebase when Ctrl+H is deterministic and faster? Do you need Hermes to set up a cron job, or is it easier and more token-efficient to do it yourself? Step 0 should always be asking “do I need to use AI for this task?” This is doubly true when integrating AI into the solution instead of just using it to build the solution.

### Manual with AI Assistance

Most developers first engage with AI for coding via either in-IDE tools like GitHub Copilot or coding CLIs. At this level, the AI augments their existing flows more than opening up new and novel ones. Tab complete is more robust. Instead of reading a codebase to understand it, I can have GHCP in VS Code summarize it for me. I can interactively ask questions and seek advice/feedback about code I’ve written.

The increased productivity from this flow feels magical at first until you realize the person sitting next to you is even more productive using a team of agents in Pi. That said, it can be perfectly reasonable for small, scoped tasks to hop in VS Code and tab complete your way through a quick change.

Traps:

- This feels the most like the old job and it can be tempting to stay here out of comfort.
- Model variety and selection, system prompting, and tool calling may feel like choices the IDE has made for you.

### Vibe Coding

“Vibe coding” as a concept has a fraught reputation. To seasoned developers, it often feels like sleight of hand wherein non-coders trick themselves into thinking AI can make them into capable devs. On the other hand, there is real power in lowering the cost of converting an idea into a meaningful prototype, especially for those without a strong coding background.

Vibe coding itself is iterative and conversational, usually flowing out of plain language prompting. It can be extremely useful for rapid prototyping or exploring a concept, but without formally defined requirements, vibe coding will generally not produce production-ready code.

Traps:

- Given the conversational nature, vibe coded results can be difficult to replicate.
- Vibe coded UIs can give the impression of a fully-featured app while never meaningfully addressing pillars like security, performance, privacy, etc.

### Agent Delegated Tasks

For bounded tasks with defined guardrails, it's straightforward to assign them to an agent or team of agents to hill climb until completion. CLI agent harnesses typically support a /goal mode that will loop until a set of acceptance criteria are met. This can be as simple as typing the description and acceptance criteria into the CLI, or it can scale out to implementing full plans (as in SDD) using teams of agents with different roles/personas.

Examples of bounded tasks that can be good candidates for one-shotting in /goal mode:

- Refactors
- Adding unit tests
- Small bug fixes

Traps:

- Without defined termination conditions and validations, it may be hard for the agents to know when they’re done.
- Multi-agent or agents spawning subagents can burn through tokens.
- Task-appropriate model selection can be a challenge.

### Iterative Conceptual Exploration

Exploration is almost like “Vibe Specification”, where research and exploration coalesce into a rigorous, well-defined plan. As AI helps narrow focus and resolve ambiguity, the results might funnel directly into agentic plan execution, or they may lead into full-blown Spec-Driven Development. Or brainstorming with an AI may lead you to completely reframe the original idea. To my mind, validating and refining ideas ahead of time is one of the most valuable aspects of AI development.

Traps:

- Exploration can decay into Vibe Coding without sufficient structure.

### Spec-Driven Development

Specs can be defined manually, via a tool like OpenSpec, or some combination of multiple techniques. Having one AI help write the specs and another offer critiques can be a powerful way to enhance the process. SDD can flow naturally out of exploration, where you brainstorm on an idea or feature using AI and then coalesce that into a formal set of feature specs.

In SDD, the primary artifact of software development shifts from code to specs. This is the endpoint of the "coding is a solved problem" thesis, where the plan and evaluations drive the output. So long as all acceptance criteria are met, the result is considered valid. Human inspection of the code may become optional, depending on the tastes of the humans involved.

Traps:

- Specifications need well-defined acceptance criteria and the accompanying validations to prove them.
- Without inspection, code may become difficult for human maintainers to reason over, risking future maintenance costs.

## Appendix

### Resources

[https://agenticthinking.ai/blog/agent-personas/](https://agenticthinking.ai/blog/agent-personas/)  
[https://code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices)
