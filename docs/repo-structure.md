# Repository Structure

## Recommendation

Use a monorepo for MVP.

## Proposed Structure

```text
.
├── apps/
│   ├── web/
│   │   ├── src/
│   │   └── package.json
│   └── api/
│       ├── src/
│       └── package.json
├── packages/
│   ├── core/
│   │   ├── src/models/
│   │   ├── src/schemas/
│   │   └── src/types/
│   ├── orchestrator/
│   │   ├── src/producer/
│   │   ├── src/router/
│   │   ├── src/packets/
│   │   └── src/tasks/
│   ├── prompts/
│   │   ├── producer/
│   │   ├── planner/
│   │   ├── writer/
│   │   └── qa/
│   └── retrieval/
│       └── src/
├── docs/
└── README.md
```

## Ownership Boundaries

### apps/web
- presentation
- local UI state
- action dispatch

### apps/api
- HTTP API
- auth later
- orchestration entrypoint
- persistence integration

### packages/core
- domain models
- enums
- shared schemas
- status machine definitions

### packages/orchestrator
- Producer logic
- packet compiler
- task dispatcher
- audit logging hooks

### packages/prompts
- agent prompt templates
- output contracts

### packages/retrieval
- retrieval interfaces
- rerankers later
- packet retrieval adapters

## Why Not Multi-Repo Yet

Too much early coupling exists between:
- shared schemas
- packet formats
- API contracts
- UI rendering requirements

Keep velocity high until architecture stabilizes.

