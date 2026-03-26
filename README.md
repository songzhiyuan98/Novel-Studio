# Novel Studio — AI-Powered Serial Fiction Workbench

> v2 Design Spec: `docs/superpowers/specs/2026-03-24-core-architecture-design.md`

## Product Summary

Novel Studio is an **AI-powered serial fiction workbench** for ultra-long serialized web novels (Fanqie/番茄-level, hundreds to thousands of chapters). The user acts as creative director — making structured decisions, confirming blueprints, and managing canon — while the system handles planning, drafting, and quality assurance.

The system is **genre-agnostic**: a dynamic ProjectTemplate drives all genre-specific schemas, format parameters, and character archetypes. Chapter length, volume size, and structural conventions are fully configurable per project.

## Pipeline

1. User creates a project from a **ProjectTemplate** (genre, format params, character archetypes).
2. User provides premise, taste, constraints, and decisions via natural language chat.
3. Chat Agent (LLM) understands intent and routes to the Orchestrator.
4. Orchestrator (deterministic code) compiles context packets and dispatches LLM workers.
5. Planner produces options, world rules, structure, and **detailed blueprints** (two modes: expand outline OR brainstorm).
6. **User reviews and confirms blueprints** before any prose generation.
7. Writer generates chapter drafts **strictly from confirmed blueprints** (per-scene rewriting, streaming output).
8. QA checks style, pacing, continuity, and canon alignment.
9. User confirms selected outputs into canon; **impact analysis** surfaces downstream effects of any reverse changes.
10. Summarizer compresses confirmed chapters for long-term memory.

## Key Features

- **ProjectTemplate System** — dynamic, genre-agnostic project configuration driving all schemas
- **Character Card System** — tiered cards (core / important / episodic) with structured state tracking
- **Blueprint Workflow** — detailed blueprints replace simple scene cards; user confirms before prose
- **Per-Scene Rewriting** — rewrite individual scenes without regenerating entire chapters
- **Streaming Output** — real-time token streaming with pause/stop/edit controls
- **Impact Analysis** — reverse-change analysis surfaces downstream canon effects
- **Sidebar Navigation** — project -> chapters -> workspace flow
- **Configurable Format Params** — chapter length, volume size, all structural values user-defined
- **Canon Gate** — only user-confirmed content enters official canon
- **Deterministic Orchestration** — Orchestrator is code, not LLM
- **L0 Structured Recall** — scene-card-driven exact queries with token budget

## Architecture

```
User <-> Chat Agent (LLM) -> Orchestrator (code) -> Workers (LLM)
                                                      |-- Planner
                                                      |-- Writer
                                                      |-- QA
                                                      +-- Summarizer
                                   |
                            Knowledge Layer
                         (Canon Store + Artifacts)
```

Key architectural decision: the Orchestrator is **deterministic code**, not an LLM. This ensures workflow routing, state machine transitions, and packet assembly are testable, reliable, and not subject to hallucination.

## Included Documents

- `docs/pm-overview.md` — executive PM summary
- `docs/product-requirements.md` — MVP scope, user stories, acceptance criteria
- `docs/agents.md` — agent roster, responsibilities, constraints, handoffs
- `docs/workflow.md` — end-to-end phase flow and gating rules
- `docs/architecture.md` — high-level system architecture and modules
- `docs/data-models.md` — entities, schemas, relationships, state machines
- `docs/database-logic.md` — write rules, change propagation, transactions, audit logic
- `docs/api-spec.md` — internal and external API contracts
- `docs/ui-ux-spec.md` — UI layout, interactions, component behaviors
- `docs/mvp-todolist.md` — implementation plan and engineering todo
- `docs/v1-rag-plan.md` — RAG strategy (L0 structured recall -> L1 semantic retrieval)
- `docs/rag-optimization-strategy.md` — retrieval design, testing, optimization ideas
- `docs/prompts-and-packets.md` — per-worker packet schemas, prompt contracts, output schemas
- `docs/qa-and-evaluation.md` — QA gate rubric and test methodology
- `docs/repo-structure.md` — monorepo structure and ownership boundaries
- `docs/superpowers/specs/2026-03-24-core-architecture-design.md` — full v2 design spec

## Recommended Delivery Order

1. Finalize data models, workflow, and ProjectTemplate schemas (done).
2. Build ProjectTemplate + character card system.
3. Build core pipeline: Orchestrator + Workers + blueprint workflow + L0 structured recall.
4. Add streaming output and per-scene rewriting.
5. Prove end-to-end chapter loop (5 chapters).
6. Add minimal UI: sidebar navigation + chat + blueprint view + trace panel + confirm buttons.
7. Add impact analysis for reverse changes.
8. Introduce L1 semantic retrieval and volume-level summaries.
9. Expand into deeper QA and specialist agents.

## Success Criteria

### MVP (5 chapters)

The system can support 5 sequential chapters in one project while preserving world rules, character consistency, and unresolved thread tracking — with blueprint confirmation before every chapter draft.

### Post-MVP (10+ chapters)

The system can support 10+ sequential chapters with all of the above plus relationship continuity, volume-level summarization, and evidence-based QA.

### Long-Term Vision

The system can support hundreds to thousands of chapters (Fanqie-level web novels) without quality degradation, using hierarchical summarization (chapter -> volume -> global state) and L1 semantic retrieval.
