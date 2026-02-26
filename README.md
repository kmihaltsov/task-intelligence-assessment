# Task Intelligence Dashboard

AI-powered task analysis tool that categorizes, prioritizes, and generates action plans for raw project tasks using a custom state machine pipeline with Anthropic Claude.

## Architecture

### Pipeline Engine (Custom State Machine)

The core engine is a hand-built state machine inspired by LangGraph — no LangChain, CrewAI, or Vercel AI SDK agent components.

```
Raw Input → ParseStep → CategorizeStep → PrioritizeStep → ActionPlanStep → Completed Tasks
                ↓              ↓               ↓                ↓
            StateStore    StateStore       StateStore       StateStore
                ↓              ↓               ↓                ↓
            SSE Events    SSE Events      SSE Events       SSE Events
```

**Key components:**

- **`Step`** — Abstract class. Each concrete step implements `execute(state, emit)`. Steps do NOT handle retries — they throw on failure.
- **`StateMachine`** — Orchestrator that runs steps sequentially with configurable retry logic per step. Emits structured events for real-time UI updates.
- **`StateStore`** — Interface-based shared state (in-memory Map). Steps read/write to a common store. Designed for future swap to persistent storage.
- **Progressive persistence** — After each step completes, the machine syncs task state to the server store. Tasks appear on the dashboard immediately after parsing and progressively update.

### LLM Provider Abstraction

Anthropic SDK is isolated behind a generic `LLMProvider` interface. Only `anthropic-adapter.ts` imports the SDK.

- **Structured output** — Uses Claude's `tool_use` to force JSON output matching Zod schemas. Zod schemas serve as single source of truth for runtime validation, TypeScript types, and JSON Schema generation.
- **Self-correcting** — Schema validation failures throw `LLMValidationError`, triggering the state machine's retry loop. The LLM gets a fresh attempt without manual intervention.

### Agentic Tool Use

The `ActionPlanStep` supports autonomous tool invocation:

- **`ToolRegistry`** — Register tools, convert to LLM definitions, execute by name
- **`UrlHealthCheckTool`** — HEAD request with 5s timeout to check URL accessibility
- If a task mentions URLs, the step asks the LLM (with tools available) whether to check them, executes any tool calls, then feeds results back for a more informed action plan.

### API Layer


| Method   | Route             | Purpose                                                         |
| -------- | ----------------- | --------------------------------------------------------------- |
| `POST`   | `/api/tasks`      | Submit tasks. Returns SSE stream with real-time pipeline events |
| `GET`    | `/api/tasks`      | List tasks (paginated, filterable by category/priority)         |
| `GET`    | `/api/tasks/[id]` | Get single task                                                 |
| `PATCH`  | `/api/tasks/[id]` | Inline edit (priority, category, action plan)                   |
| `DELETE` | `/api/tasks/[id]` | Remove task                                                     |

### Frontend

Two pages built with React 19 + Next.js App Router:

- **Home (`/`)** — Task submission + real-time SSE processing view with step indicator and reasoning timeline
- **Tasks (`/tasks`)** — Paginated list with category/priority filters, inline editing, and collapsible reasoning logs

**Anti-jank patterns:** Skeleton placeholders with matching dimensions, opacity+translateY fade-in transitions, stable min-heights during loading states.

## Trade-offs


| Decision                                     | Rationale                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **In-memory store**                          | Simplicity for assessment scope. Interface-based design allows DB swap.                                            |
| **Sequential LLM calls per task**            | Simpler error handling and clearer reasoning flow. Parallelization would improve speed for multi-task submissions. |
| **Tool use via separate LLM call**           | Keeps structured output clean. Tool results feed into the final structured call as context.                        |
| **SSE via ReadableStream (not EventSource)** | EventSource only supports GET. We need POST to send the task payload.                                              |
| **Zod as schema source of truth**            | Single definition powers runtime validation, TypeScript inference, and JSON Schema for LLM tool_use.               |

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

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **AI:** Anthropic Claude (raw SDK, no agent frameworks)
- **Validation:** Zod + zod-to-json-schema
- **Logging:** pino + pino-pretty
- **Testing:** Vitest (integration tests)


# Trade-offs

- I decided to spend significant amount of time on UX, probing few approaches instead of spend additional time on improving code quality
- Decided to not spend time on code clean-up (which I would do in the real teamwork)

## Some things that I'd have done differently in the real project

- Work hard on refining product requirements, main user scenarious and pain points before any dev work
- React TanQuery for API/caching/state management
- Langraph like  for agent workflow management / LLM abstraction / etc
- SSE support - it needs more love especially on disconnect/reconnect piece

## Out of scope

- Authentication / user management
- Proper Persistent storage (I used local sql db)
- RAG for the project/company context. It would drastically improve quality of description/action plan if Agent would knew how Tasks connected to the actual Company/Project
- cost audit functionality - properly track costs per user/task
- Agent performance metrics - success/failure/retries
