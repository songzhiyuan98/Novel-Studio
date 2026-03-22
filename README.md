# Novel Studio — Multi-Agent Writing Room

A product specification and engineering design package for an interactive, artifact-driven long-form fiction generation system.

## Product Summary

Novel Studio turns long-form fiction creation into an interactive writers' room workflow. The user does not need to fully author plot beats or prose. Instead, the system helps the user make structured creative decisions through a controlled pipeline:

1. User provides premise, taste, constraints, and decisions.
2. Producer interprets the intent and plans the next step.
3. Planner-side agents produce options, world rules, structure, and scene cards.
4. Writer generates chapter drafts strictly from approved scene cards.
5. QA checks style, pacing, continuity, and canon alignment.
6. User confirms selected outputs into canon.

## Design Priorities

- **Long-run consistency over one-shot brilliance**
- **Artifact-first workflow over chat-only generation**
- **Controlled canon evolution over uncontrolled memory growth**
- **Task-specific context packets over full-history prompting**
- **Gradual architecture: MVP first, RAG second**

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
- `docs/v1-rag-plan.md` — RAG introduction plan and migration strategy
- `docs/rag-optimization-strategy.md` — retrieval design, testing, optimization ideas
- `docs/prompts-and-packets.md` — packet schemas, prompt contracts, output schemas
- `docs/qa-and-evaluation.md` — QA gate rubric and test methodology
- `docs/repo-structure.md` — monorepo structure and ownership boundaries

## Recommended Delivery Order

1. Finalize data models and workflow.
2. Build no-RAG MVP.
3. Prove end-to-end chapter loop.
4. Add summaries, state tracking, and auditability.
5. Introduce project-internal retrieval.
6. Expand into hybrid retrieval and deeper QA.

## Success Criteria

The system is successful when it can support at least 10 sequential chapters in one project while preserving:

- world rules
- character behavior consistency
- relationship continuity
- unresolved thread tracking
- user control over canon admission

