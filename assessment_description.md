# **Technical Assessment: The Agentic Task Orchestrator**

## Overview

At our firm, we value engineering taste as much as technical execution. This assessment is designed to evaluate your ability to architect sophisticated applications that prioritize speed, visual depth, and modern AI patterns.

Your task is to build a **"Task Intelligence Dashboard"**—a tool that allows users to input raw project tasks and utilizes an "Agentic" workflow to categorize, prioritize, and suggest execution steps.

**Time Limit:** 6 Hours Maximum. **Primary Stack:** Next.js (App Router), TypeScript, Tailwind CSS, and your choice of LLM (OpenAI, Anthropic, or Gemini).

## Core Requirements

### 1. The Agentic Reasoning Loop (No High-Level Frameworks)

We are looking for your ability to build primitives, not just glue libraries together.

* **Primitive Implementation:** You are **forbidden** from using high-level agent frameworks (e.g., LangChain, CrewAI, or pre-built Vercel AI SDK agent components). We want to see how you architect a reasoning loop using raw LLM calls.
* **Autonomous Error Recovery:** If the agent's output is malformed or doesn't meet the schema, how does your system handle it? We favor a loop that can self-correct without user intervention.
* **Stateful Thinking:** The UI should reflect the agent's internal state and cognitive load. Avoid generic indicators; provide transparency into the "reasoning" process in a way that builds trust.

### 2. High-Fidelity UI/UX (The "Linear" Bar)

We prioritize a premium aesthetic that signals quality through restraint and precision.

* **Visual Rhythm and Hierarchy:** We are looking for a sophisticated application of design tokens. The layout should feel balanced, using depth and contrast to guide the user’s eye without clutter.
* **Deterministic UI vs. Non-deterministic AI:** AI latency is unpredictable. Your UI must handle this "jitter" gracefully. How do you manage the transition between a pending AI state and a final UI state without jarring layout shifts?
* **Intentionality of Space:** Every pixel should earn its place. We value an interface that feels "quiet" yet powerful.

### 3. Engineering Philosophy & Mastery

* **Semantic Type Integrity:** Type safety should document intent. We are looking for a codebase where types provide a self-documenting map of the data flow, especially where AI-generated JSON meets your TypeScript interfaces.
* **Systemic Reliability:** How does the application behave when the external environment is unstable? We are looking for a philosophy of graceful degradation—handling failures and timeouts in a way that respects the user’s time.

## Evaluation Criteria (Subjective)

* **Technical Taste:** Did you make choices that favor long-term stability and developer joy?
* **Agentic Logic:** Did you treat the AI as a simple function, or did you build a workflow capable of autonomous reasoning and error recovery?
* **Visual Fidelity:** Does the final product look like a high-end SaaS application, or a basic template?
* **Judgment and Trade-offs:** Given the 6-hour constraint, where did you choose to over-index?

## Deliverables

1. **A GitHub Repository:** Ensure the repo is private (add us as collaborators) or public.
2. **The "Code Walkthrough" (Loom):** Along with your repo, you **must** include a 5-minute Loom video walking through your code. We want to hear your rationale for:
   * How you structured the Agentic Loop without a framework.
   * How you handled state management between the AI and the UI.
   * One specific trade-off you made to meet the 6-hour deadline.
3. **[README.md](http://README.md):**
   * Provide a brief architectural breakdown of your Agent loop.
   * Document the philosophical trade-offs you made during the build.
   * State your initial estimate versus actual time spent.
4. **Environment Variables:** Provide a `.env.example` file.

## Bonus (Optional)

* Implement a "Refine" loop where the user can provide feedback to the Agent.
* Implement a basic "Agentic Tool" (e.g., the agent can check a real URL or "ping" a mock service).
