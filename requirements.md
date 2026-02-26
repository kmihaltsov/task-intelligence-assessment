## Requirements

### Functional requirements

**Task Input**
- User can input one or more raw project tasks as free-form text (e.g., "set up CI/CD", "design login page", "migrate DB to Postgres")
- Support both single-task and bulk-task input

**Agentic Processing — Custom State Machine (LangGraph-like)**
- Built as a state machine, not a simple sequential chain. No LangChain, CrewAI, or Vercel AI SDK agent components.
- **Step abstraction:** `Step` is an abstract class. Each concrete step (parse, categorize, prioritize, generate subtasks) is its own implementation.
- **State machine composition:** Steps are chained declaratively in code to form the processing pipeline. The state machine drives execution order and transitions.
- **Shared state:** An in-memory state store is passed through the pipeline. Each step reads from and writes to this shared state. The state store interface is designed so it can later be swapped for a persistent implementation (DB, Redis) — but for now, in-memory only.
- **Retry & error recovery:** The state machine supports configurable retries per step. Malformed or off-schema LLM output triggers automatic retry without user intervention.
- **Processing steps for Task Intelligence:**
  1. Parse and understand the raw task
  2. Categorize (e.g., Frontend, Backend, Infrastructure, Design, DevOps)
  3. Assess priority (critical / high / medium / low) with justification
  4. Generate an action plan — a flat ordered list of practical recommended steps (no dependencies or estimates, just actionable items)
- Each step's status and reasoning is streamed to the UI in real time via Server-Sent Events (SSE)

**Refine Loop (Bonus)**
- User can provide feedback on agent output (e.g., "this should be higher priority", "split this into two tasks")
- Agent re-processes based on user feedback, maintaining context from the original analysis

**Agentic Tool Use (Bonus)**
- Agent has access to at least one tool (e.g., URL health checker, mock service ping)
- Tool invocation is decided autonomously by the agent when relevant to a task

**Dashboard View**
- Display processed tasks with their categories, priorities, and execution steps
- Tasks are sortable/filterable by category and priority

### Non-functional requirements

**LLM Provider Abstraction**
- Anthropic SDK code is isolated behind a generic LLM provider interface
- Agent loop and all business logic depend on the abstraction, not the SDK directly
- Swapping to another provider (OpenAI, Gemini) should require only a new adapter implementation

**UI/UX — "Linear" Quality Bar**
- Premium, minimal aesthetic — clean typography, intentional whitespace, no visual clutter
- Transparent reasoning state: UI shows what the agent is thinking at each step (not a generic spinner)
- No layout jank: smooth transitions between pending AI state and final rendered output
- Design tokens for consistent spacing, color, and typography

**Engineering Quality**
- TypeScript types document intent, especially at the AI-output-to-app boundary (schema validation)
- Graceful degradation on API failures, timeouts, and rate limits

**Storage**
- In-memory only (React state). No persistence across page refreshes.

### Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API (behind provider abstraction)
