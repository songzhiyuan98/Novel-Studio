# Novel Studio — Multi-Agent Writing Room

A product specification and engineering design package for an interactive, artifact-driven long-form fiction generation system.

## Product Summary

Novel Studio turns long-form fiction creation into an interactive writers' room workflow, targeting ultra-long serialized web novels (hundreds to thousands of chapters, 2000-3000 Chinese characters per chapter). The user does not need to fully author plot beats or prose. Instead, the system helps the user make structured creative decisions through a controlled pipeline:

1. User provides premise, taste, constraints, and decisions via natural language chat.
2. Chat Agent (LLM) understands intent and routes to the Orchestrator.
3. Orchestrator (deterministic code) compiles context packets and dispatches LLM workers.
4. Planner produces options, world rules, structure, and scene cards.
5. Writer generates chapter drafts strictly from approved scene cards.
6. QA checks style, pacing, continuity, and canon alignment.
7. User confirms selected outputs into canon.
8. Summarizer compresses confirmed chapters for long-term memory.

## Design Priorities

- **Long-run consistency over one-shot brilliance**
- **Artifact-first workflow over chat-only generation**
- **Controlled canon evolution over uncontrolled memory growth**
- **Task-specific context packets over full-history prompting**
- **Deterministic orchestration over LLM-driven routing**
- **Gradual architecture: L0 structured recall first, L1 semantic RAG second**

## Architecture

```
User ↔ Chat Agent (LLM) → Orchestrator (code) → Workers (LLM)
                                                   ├── Planner
                                                   ├── Writer
                                                   ├── QA
                                                   └── Summarizer
                                    ↕
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
- `docs/v1-rag-plan.md` — RAG strategy (L0 structured recall → L1 semantic retrieval)
- `docs/rag-optimization-strategy.md` — retrieval design, testing, optimization ideas
- `docs/prompts-and-packets.md` — per-worker packet schemas, prompt contracts, output schemas
- `docs/qa-and-evaluation.md` — QA gate rubric and test methodology
- `docs/repo-structure.md` — monorepo structure and ownership boundaries
- `docs/superpowers/specs/2026-03-24-core-architecture-design.md` — full design spec with all architecture decisions

## Recommended Delivery Order

1. Finalize data models and workflow (done).
2. Build core pipeline: Orchestrator + Workers + L0 structured recall.
3. Prove end-to-end chapter loop (5 chapters).
4. Add minimal UI: chat + trace panel + confirm buttons.
5. Introduce L1 semantic retrieval and volume-level summaries.
6. Expand into deeper QA and specialist agents.

## Success Criteria

### MVP (5 chapters)
The system can support 5 sequential chapters in one project while preserving world rules, character consistency, and unresolved thread tracking.

### Post-MVP (10+ chapters)
The system can support 10+ sequential chapters with all of the above plus relationship continuity, volume-level summarization, and evidence-based QA.

### Long-Term Vision
The system can support hundreds to thousands of chapters (Fanqie/番茄-level web novels) without quality degradation, using hierarchical summarization (chapter → volume → global state) and L1 semantic retrieval.
