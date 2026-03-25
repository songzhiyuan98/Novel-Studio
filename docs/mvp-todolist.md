# MVP Implementation Todo List

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.

## MVP Goal

User can create a project from scratch and write 5 sequential chapters (2000-3000 chars each) without continuity breakdown.

## Milestone 0 — Specs Freeze
- [x] finalize artifact taxonomy
- [x] finalize state machines
- [x] define packet schemas
- [x] define worker output schemas
- [x] define chapter lifecycle
- [x] define canon projection rules
- [x] define architecture: Chat Agent + Orchestrator + Workers
- [x] define RAG strategy: L0 structured recall
- [x] define summarization: canonize-time compression + three layers
- [x] define safety mechanisms: hard limits + deterministic orchestration
- [x] define model selection: user-provided API keys

## Milestone 1 — Monorepo Setup
- [ ] initialize monorepo with pnpm workspace
- [ ] add TypeScript workspace config
- [ ] create apps/web (Next.js)
- [ ] create apps/api (Hono or Express)
- [ ] create packages/core
- [ ] create packages/orchestrator
- [ ] create packages/prompts
- [ ] create packages/llm-adapter (Vercel AI SDK)
- [ ] add lint/format/test baseline

## Milestone 2 — Persistence Layer
- [ ] set up PostgreSQL + Drizzle ORM
- [ ] define schema migrations for all entities
- [ ] implement repositories for Project, Artifact, Chapter, Issue
- [ ] implement canon stores: StoryBibleEntry, CharacterState, RelationshipState, TimelineEvent, UnresolvedThread, DevelopmentChain
- [ ] implement ChapterSummary store
- [ ] implement audit log table (with token tracking)
- [ ] seed initial example project

## Milestone 3 — LLM Adapter Layer
- [ ] implement LLMAdapter interface (Vercel AI SDK)
- [ ] support at least one provider (OpenAI recommended for initial dev)
- [ ] implement per-worker model configuration
- [ ] implement token counting and cost estimation
- [ ] implement simple mode (one key) and advanced mode (per-worker)

## Milestone 4 — Orchestrator Skeleton
- [ ] implement workflow state machine (plan → write → qa → canonize)
- [ ] implement intent classification contract (Chat Agent → Orchestrator)
- [ ] implement packet compiler v0 with token budget
- [ ] implement task dispatcher
- [ ] implement safety limits (max tasks, max tokens per action)
- [ ] persist task records with token/cost audit
- [ ] implement canon gate enforcement

## Milestone 5 — Chat Agent
- [ ] implement Chat Agent prompt with intent classification
- [ ] implement conversation history management (rolling window + compression)
- [ ] implement lightweight creative response (no worker dispatch)
- [ ] implement pipeline task routing to Orchestrator
- [ ] implement canon edit routing to Orchestrator

## Milestone 6 — Worker Integrations
- [ ] Planner prompt + output parser
- [ ] Writer prompt + output parser
- [ ] QA prompt + output parser
- [ ] Summarizer prompt + output parser
- [ ] structured response validation (zod schemas)
- [ ] retry/failure handling

## Milestone 7 — Artifact CRUD
- [ ] create artifact list endpoint
- [ ] create artifact detail endpoint
- [ ] create artifact edit/version endpoint
- [ ] create confirm/reject endpoint
- [ ] implement artifact status state machine

## Milestone 8 — Chapter Flow
- [ ] scene card generation flow (Planner)
- [ ] writer draft flow (Writer)
- [ ] QA review flow (QA)
- [ ] chapter status updates
- [ ] revision loop (QA revise → re-write)

## Milestone 9 — Canon Projection
- [ ] build confirmation projection service
- [ ] trigger Summarizer on chapter canonize
- [ ] parse Summarizer output into structured updates
- [ ] update ChapterSummary on canonize
- [ ] update CharacterState on chapter canonization
- [ ] update RelationshipState on chapter canonization
- [ ] update TimelineEvent on chapter canonization
- [ ] update UnresolvedThread state
- [ ] update DevelopmentChain state
- [ ] create provenance links

## Milestone 10 — MVP Frontend
- [ ] project setup page (title, genre, tone, premise)
- [ ] model configuration page (API key, model selection)
- [ ] chat interface (natural language + option buttons)
- [ ] orchestration trace panel (debug view)
- [ ] confirm/reject buttons
- [ ] artifact list + detail pane
- [ ] basic chapter view

## Milestone 11 — Testing
- [ ] golden path project test (5 chapters end-to-end)
- [ ] artifact status transition tests
- [ ] chapter loop integration test
- [ ] confirm projection test
- [ ] context isolation test (verify workers don't see chat history)
- [ ] safety limit test (verify max tasks/tokens enforced)
- [ ] continuity QA smoke tests (chapter 5 references chapter 1 canon)

## Milestone 12 — Demo Readiness
- [ ] create sample project (Chinese web novel)
- [ ] generate 5 chapters end-to-end
- [ ] verify no draft pollution into canon
- [ ] verify rollback path on rejected revision
- [ ] verify orchestration trace shows full collaboration flow
- [ ] verify token usage tracking accuracy

## MVP Acceptance Criteria

1. Can create a project and generate world rules / character cards / outline
2. Can write a 2000-3000 character Chinese chapter from scene cards
3. QA detects at least one type of consistency issue (character/setting/timeline)
4. Confirmed content correctly updates canon stores
5. Chapter 5 context packet correctly references settings confirmed in Chapter 1
6. Draft and rejected content does not appear in subsequent packets
7. Orchestration trace shows all agent collaboration steps with token usage
