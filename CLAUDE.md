# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Task Intelligence Dashboard — a tool where users input raw project tasks and an agentic workflow categorizes, prioritizes, and suggests execution steps. Built as a technical assessment with a 6-hour time constraint.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI:** Raw LLM API calls (OpenAI, Anthropic, or Gemini)

## Key Constraints

- **No high-level agent frameworks** (LangChain, CrewAI, Vercel AI SDK agent components are forbidden). Build the agentic reasoning loop from raw LLM calls.
- The agent loop must include autonomous error recovery (self-correcting malformed/off-schema outputs without user intervention).
- UI must expose the agent's internal reasoning state transparently — no generic spinners.
- Handle AI latency jitter gracefully: no jarring layout shifts between pending and final states.
- Types should document intent, especially at the boundary where AI-generated JSON meets TypeScript interfaces.

## Build & Dev Commands

```bash
npm install          # install dependencies
npm run dev          # start Next.js dev server (once scaffolded)
npm run build        # production build
npm run lint         # lint
npm test             # run tests
```

## Architecture Notes

The project is in early bootstrap stage. The intended architecture per the assessment:

1. **Agentic Reasoning Loop** — a stateful loop making raw LLM API calls, validating output against schemas, and retrying/self-correcting on failure.
2. **UI State Management** — bridge between non-deterministic AI responses and deterministic UI rendering, with transparent reasoning indicators.
3. **Graceful Degradation** — timeouts, failures, and unstable external environments handled without losing user trust.

## Deliverables Checklist

- README.md with architectural breakdown, trade-offs, and time estimates
- `.env.example` file for API keys
- Optional: "Refine" loop for user feedback to agent, agentic tool use (URL checking, mock service pinging)

## Additional instruction files

- If you work with react code, you should follow best practices from @.claude_files/REACT_BEST_PRACTICES.md
