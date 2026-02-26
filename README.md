# Task Intelligence Dashboard

AI-powered task analysis tool that categorizes, prioritizes, and generates action plans for raw project tasks using a custom state machine pipeline with Anthropic Claude.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **AI:** Anthropic Claude (raw SDK, no agent frameworks)
- **Validation:** Zod + zod-to-json-schema
- **Logging:** pino + pino-pretty
- **Testing:** Vitest (integration tests)

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Start dev server
npm run dev

# Run integration tests (requires running dev server)
npm test
```

## Architecture

### Pipeline Engine (Custom State Machine)

The core engine is a hand-built state machine with ability to emit events. (think of langraph)

- shared state that each step works on
- each step can emit real-time updates to support responsive UI
- provide easy way to delete/add new steps as the product grows
- ability to replace in-memory store with persitent implementations

Raw Input → ParseStep → CategorizeStep → PrioritizeStep → ActionPlanStep → Completed Tasks
                ↓              ↓               ↓                ↓
            StateStore    StateStore       StateStore       StateStore
                ↓              ↓               ↓                ↓
            SSE Events    SSE Events      SSE Events       SSE Events
**Key components:**

- **`Step`** — Abstract class. Each concrete step implements `execute(state, emit)`. Steps do NOT handle retries — they throw on failure.
- **`StateMachine`** — Orchestrator that runs steps sequentially with configurable retry logic per step. Emits structured events for real-time UI updates.
- **`StateStore`** — Interface-based shared state (in-memory Map). Steps read/write to a common store. Designed for future swap to persistent storage.

### LLM Provider Abstraction

Anthropic SDK is isolated behind a generic `LLMProvider` interface. Only `anthropic-adapter.ts` imports the SDK.

- **Structured output** — Uses Claude's `tool_use` to force JSON output matching Zod schemas. Zod schemas serve as single source of truth for runtime validation, TypeScript types, and JSON Schema generation.
- **Self-correcting** — Schema validation failures throw `LLMValidationError`, triggering the state machine's retry loop. The LLM gets a fresh attempt without manual intervention.

### API Layer


| Method   | Route             | Purpose                                                         |
| -------- | ----------------- | --------------------------------------------------------------- |
| `POST`   | `/api/tasks`      | Submit tasks. Returns SSE stream with real-time pipeline events |
| `GET`    | `/api/tasks`      | List tasks (paginated, filterable by category/priority)         |
| `GET`    | `/api/tasks/[id]` | Get single task                                                 |
| `PATCH`  | `/api/tasks/[id]` | Inline edit (priority, category, action plan)                   |
| `DELETE` | `/api/tasks/[id]` | Remove task                                                     |

## Trade-offs

- I decided to spend significant amount of time on UX, probing few approaches instead of spend additional time on improving code quality
- simplified streaming. Production-ready SSE approach would require backend streaming queue (to persist events across potential SSE reconnects), ability to reconnect to a specific stream, etc

## Some things that I'd have done differently in the real life

- Work hard on refining product requirements, main user scenarious and pain points before any dev work
- most likely use TanQuery for API/caching/state management
- Langraph for agent workflow management / LLM abstraction / etc

## Out of scope

- Authentication / user management
- Proper Persistent storage (I used local sql db)
- RAG for the project/company context. It would drastically improve quality of description/action plan if Agent would knew how Tasks connected to the actual Company/Project
- cost audit functionality - properly track costs per user/task
- Agent performance metrics - success/failure/retries
- CI/CD
- IaC
