# MVP Implementation Todo List

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full v2 design spec.

## MVP Goal

User can create a project from a ProjectTemplate, manage tiered characters, confirm detailed blueprints, and write 5 sequential chapters with configurable format parameters — without continuity breakdown.

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
- [x] define v2 spec: ProjectTemplate, character tiers, blueprint workflow, impact analysis

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

## Milestone 2 — ProjectTemplate System
- [ ] define ProjectTemplate schema (genre, format params, character archetypes, structural conventions)
- [ ] implement template registry with built-in templates (xianxia, romance, urban, fantasy, etc.)
- [ ] implement custom template creation and modification
- [ ] ensure all format values (chapter length, volume size) are template-driven, not hardcoded
- [ ] implement template-driven artifact field schemas

## Milestone 3 — Persistence Layer
- [ ] set up PostgreSQL + Drizzle ORM
- [ ] define schema migrations for all entities (including ProjectTemplate, character tiers)
- [ ] implement repositories for Project, Artifact, Chapter, Issue, ProjectTemplate
- [ ] implement canon stores: StoryBibleEntry, CharacterState, RelationshipState, TimelineEvent, UnresolvedThread, DevelopmentChain
- [ ] implement ChapterSummary store
- [ ] implement audit log table (with token tracking)
- [ ] seed initial example project with ProjectTemplate

## Milestone 4 — Character Card System
- [ ] implement character card schema with tier field (core / important / episodic)
- [ ] implement tier-based context inclusion logic (core=always, important=relevant, episodic=scene-only)
- [ ] implement character state evolution tracking across chapters
- [ ] implement tier promotion/demotion with context budget adjustment
- [ ] implement character card CRUD endpoints

## Milestone 5 — LLM Adapter Layer
- [ ] implement LLMAdapter interface (Vercel AI SDK)
- [ ] support at least one provider (OpenAI recommended for initial dev)
- [ ] implement per-worker model configuration
- [ ] implement token counting and cost estimation
- [ ] implement simple mode (one key) and advanced mode (per-worker)
- [ ] implement streaming output support

## Milestone 6 — Orchestrator Skeleton
- [ ] implement workflow state machine (plan -> blueprint -> confirm -> write -> qa -> canonize)
- [ ] implement intent classification contract (Chat Agent -> Orchestrator)
- [ ] implement packet compiler v0 with token budget and tier-aware character inclusion
- [ ] implement task dispatcher
- [ ] implement safety limits (max tasks, max tokens per action)
- [ ] persist task records with token/cost audit
- [ ] implement canon gate enforcement

## Milestone 7 — Chat Agent
- [ ] implement Chat Agent prompt with intent classification
- [ ] implement conversation history management (rolling window + compression)
- [ ] implement lightweight creative response (no worker dispatch)
- [ ] implement pipeline task routing to Orchestrator
- [ ] implement canon edit routing to Orchestrator

## Milestone 8 — Worker Integrations
- [ ] Planner prompt + output parser (two modes: expand outline OR brainstorm)
- [ ] Writer prompt + output parser (strict blueprint execution only)
- [ ] QA prompt + output parser
- [ ] Summarizer prompt + output parser
- [ ] structured response validation (zod schemas)
- [ ] retry/failure handling

## Milestone 9 — Blueprint System
- [ ] implement blueprint schema (per-scene goals, beats, emotional arcs, continuity anchors)
- [ ] implement blueprint generation flow (Planner -> detailed blueprint)
- [ ] implement blueprint review UI data model (section-level approve/edit/reject)
- [ ] enforce blueprint confirmation gate: Writer cannot execute without confirmed blueprint
- [ ] implement blueprint regeneration (full or per-section)

## Milestone 10 — Artifact CRUD
- [ ] create artifact list endpoint
- [ ] create artifact detail endpoint
- [ ] create artifact edit/version endpoint
- [ ] create confirm/reject endpoint
- [ ] implement artifact status state machine

## Milestone 11 — Chapter Flow
- [ ] blueprint confirmation -> writer draft flow
- [ ] per-scene rewriting flow (rewrite individual scenes without full regeneration)
- [ ] streaming output delivery (real-time token streaming with pause/stop)
- [ ] QA review flow
- [ ] chapter status updates
- [ ] revision loop (QA revise -> re-write)

## Milestone 12 — Impact Analysis
- [ ] implement downstream dependency graph for canon items
- [ ] compute affected artifacts, chapters, character states on reversal
- [ ] implement impact analysis API endpoint
- [ ] implement severity classification (critical / warning / info)
- [ ] implement reversal execution with affected item marking

## Milestone 13 — Canon Projection
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

## Milestone 14 — MVP Frontend
- [ ] sidebar navigation (project selector + chapter list + quick access)
- [ ] project setup page (ProjectTemplate selection, format params)
- [ ] model configuration page (API key, model selection)
- [ ] chat interface (natural language + option buttons)
- [ ] character panel with tiered cards (core / important / episodic)
- [ ] blueprint view with section-level confirm/edit/reject
- [ ] streaming generation view with pause/stop/edit controls
- [ ] impact analysis modal
- [ ] orchestration trace panel (debug view)
- [ ] confirm/reject buttons
- [ ] artifact list + detail pane
- [ ] basic chapter view with per-scene rewrite controls

## Milestone 15 — Testing
- [ ] golden path project test (5 chapters end-to-end with blueprint workflow)
- [ ] ProjectTemplate creation and application test
- [ ] character tier context inclusion test
- [ ] blueprint confirmation gate test (writer blocked without confirmed blueprint)
- [ ] per-scene rewriting test
- [ ] streaming output test
- [ ] impact analysis correctness test
- [ ] artifact status transition tests
- [ ] chapter loop integration test
- [ ] confirm projection test
- [ ] context isolation test (verify workers don't see chat history)
- [ ] safety limit test (verify max tasks/tokens enforced)
- [ ] continuity QA smoke tests (chapter 5 references chapter 1 canon)

## Milestone 16 — Demo Readiness
- [ ] create sample project from ProjectTemplate
- [ ] set up character cards with all three tiers
- [ ] generate and confirm blueprints for 5 chapters
- [ ] generate 5 chapters end-to-end with streaming
- [ ] demonstrate per-scene rewrite
- [ ] demonstrate impact analysis on a canon reversal
- [ ] verify no draft pollution into canon
- [ ] verify rollback path on rejected revision
- [ ] verify orchestration trace shows full collaboration flow
- [ ] verify token usage tracking accuracy

## MVP Acceptance Criteria

1. Can create a project from a ProjectTemplate with configurable format parameters
2. Can manage character cards with tier assignments (core/important/episodic)
3. Can generate and confirm detailed blueprints before chapter writing
4. Can write a chapter from confirmed blueprint with streaming output
5. Can rewrite individual scenes without regenerating the full chapter
6. QA detects at least one type of consistency issue (character/setting/timeline)
7. Confirmed content correctly updates canon stores
8. Character tier determines context inclusion behavior
9. Impact analysis correctly identifies downstream effects of canon reversal
10. Chapter 5 context packet correctly references settings confirmed in Chapter 1
11. Draft and rejected content does not appear in subsequent packets
12. Orchestration trace shows all agent collaboration steps with token usage
