# Climbing the AI Delegation Ladder

## No AI Needed

To the man with a hammer…  It’s easy to fall into the habit of having AI solve every problem, and with modern models and harnesses, it will almost always do a credible job.  But there are cases where AI is too heavy a tool.  Why ask Claude to rename a method in a small codebase when ctrl+h is deterministic and faster?  Do you need Hermes to set up a cron job, or is it easier and more token-efficient to do it yourself?  Step 0 should always be asking “do I need to use AI for this task?”

Traps:

* Ignoring non-AI solutions 🙂

## Manual with AI Assistance

Most developers first engage with AI for coding via either in-IDE tools like GitHub Copilot or coding CLIs.  At this level, the AI augments their existing flows more than opening up new and novel ones.  Tab complete is more robust.  Instead of reading a code base to understand it, I can have GHCP in VS Code summarize it for me.  I can interactively ask questions and seek advice/feedback about code I’ve written.

The 2x productivity from this flow feels magical at first until you realize the person sitting next to you is 10x-ing using a team of agents in Pi.  That said, it can be perfectly reasonable for small, scoped tasks to hop in VS Code and tab complete your way through a quick change.

Traps: 

* This feels the most like the old job and it can be tempting to stay here out of comfort

## Vibe Coding

“Vibe coding” as a concept has a fraught reputation.  To seasoned developers, it often feels like a form of psychosis wherein non-coders trick themselves into thinking AI can make them into capable devs.  On the other hand, there is real power in lowering the cost of converting an idea into a meaningful prototype, especially for those without a strong coding background.

Vibe coding itself is iterative and conversational, usually flowing out of plain language prompting.  It can be extremely useful for rapid prototyping or exploring a concept, but without formally defined requirements, vibe coding will generally not produce production-ready code.

Traps:

* Given the conversational nature, vibe coded results can be difficult to replicate.  
* Vibe coded UIs can give the impression of a fully-featured app while never meaningfully addressing pillars like security, performance, privacy, etc.

## Agent Delegated Tasks

Can be single agent or multi-agent depending on scope.

* Refactors  
* Adding unit tests

Traps:

* Without defined termination conditions and validations, it may be hard for the agents to know when they’re done.

## Iterative Agentic Exploration

Exploration It’s almost like “Vibe Specification”, where research and exploration coalesce into a rigorous, well-defined plan.  As AI helps narrow focus and resolve ambiguity, the results might funnel directly into agentic plan execution, or they may lead into full-blown Spec-Driven Development.

Traps: 

* Exploration can decay into Vibe Coding without sufficient structure

## Spec-Driven Development

Specs can be defined manually, via a tool like OpenSpec, or some combination of multiple techniques.  Having one AI help write the specs and another offer critiques can be a powerful way to enhance the process.

In SDD, the primary artifact of software development shifts fully from code to specs.

Traps:

* Specifications need well-defined acceptance criteria and the accompanying validations to prove them.

# Agent Teams

* Supervisor  
* Adversarial critic

# Appendix

## Resources

[https://agenticthinking.ai/blog/agent-personas/](https://agenticthinking.ai/blog/agent-personas/)   
[https://code.claude.com/docs/en/best-practices](https://code.claude.com/docs/en/best-practices) 