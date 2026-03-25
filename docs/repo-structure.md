# Repository Structure

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.

## Recommendation

Use a monorepo with pnpm workspace for MVP.

## Proposed Structure

```text
.
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── src/
│   │   └── package.json
│   └── api/                        # Hono or Express backend
│       ├── src/
│       └── package.json
├── packages/
│   ├── core/                       # Shared domain logic
│   │   ├── src/models/
│   │   ├── src/schemas/
│   │   ├── src/types/
│   │   └── src/state-machines/
│   ├── orchestrator/               # Deterministic orchestration (NOT LLM)
│   │   ├── src/workflow/           # Workflow state machine
│   │   ├── src/router/             # Intent routing (from Chat Agent)
│   │   ├── src/packets/            # Packet compiler with token budget
│   │   ├── src/tasks/              # Task dispatcher
│   │   ├── src/canon/              # Canon gate + projection
│   │   └── src/audit/              # Audit logging
│   ├── llm-adapter/                # LLM provider abstraction (Vercel AI SDK)
│   │   ├── src/providers/
│   │   ├── src/config/
│   │   └── src/token-counter/
│   ├── prompts/                    # LLM worker prompts and contracts
│   │   ├── chat-agent/
│   │   ├── planner/
│   │   ├── writer/
│   │   ├── qa/
│   │   └── summarizer/
│   └── retrieval/                  # Retrieval interfaces (MVP: L0 structured; later: L1 semantic)
│       └── src/
├── docs/
└── README.md
```

## Ownership Boundaries

### apps/web
- presentation (Next.js)
- local UI state
- action dispatch
- Orchestration Trace display

### apps/api
- HTTP API (Hono or Express)
- auth (later)
- orchestration entrypoint
- persistence integration (PostgreSQL + Drizzle ORM)

### packages/core
- domain models and TypeScript types
- enums and constants
- shared Zod schemas (artifact types, status machines, output contracts)
- state machine definitions

### packages/orchestrator
- workflow state machine (plan → write → qa → canonize)
- intent routing (receives classified intent from Chat Agent)
- packet compiler with token budget and per-worker assembly
- task dispatcher with safety limits
- canon gate enforcement and projection pipeline
- audit logging hooks with token tracking

### packages/llm-adapter
- unified LLM interface (via Vercel AI SDK)
- provider configuration (OpenAI, Anthropic, Google, DeepSeek)
- per-worker model config resolution
- token counting and cost estimation

### packages/prompts
- Chat Agent prompt templates
- Planner prompt templates
- Writer prompt templates
- QA prompt templates
- Summarizer prompt templates
- output contract schemas (Zod validation)

### packages/retrieval
- L0: structured canon query interfaces (exact key matching)
- L1 (later): embedding/vector search interfaces
- packet retrieval adapters

## Why Not Multi-Repo Yet

Too much early coupling exists between:
- shared schemas
- packet formats
- API contracts
- UI rendering requirements

Keep velocity high until architecture stabilizes.
