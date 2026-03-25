# Prompts and Packet Contracts

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.
> See also: `docs/api-spec.md` for the authoritative output schemas (all contracts are unified there).

## Packet Philosophy

Packets must be compact, structured, and task-specific. They are the main defense against context drift. The Orchestrator (deterministic code) compiles different packets per worker type.

## Per-Worker Packet Sections

Each worker receives a different packet tailored to its task. The Packet Compiler fills sections by priority within the token budget.

### Planner Packet
- task_objective
- workflow_stage
- hard_constraints (world rules, confirmed canon)
- open_questions
- full outline (current)
- unresolved_threads
- development_chains
- character_arcs (high-level)
- output_contract

### Writer Packet
- chapter_objective
- scene_cards (confirmed)
- current_character_states (only in-scene characters)
- relationship_states (only relevant)
- recent_chapter_summaries (previous 3)
- current_volume_summary
- style_profile
- output_contract

### QA Packet
- chapter_draft (full text)
- relevant_canon (character states, world rules)
- recent_chapter_summaries
- timeline_events (relevant)
- unresolved_threads (active)
- output_contract

### Summarizer Packet
- chapter_text (full)
- chapter_number
- character_list
- active_threads
- output_contract

## Token Budget Priority

For all workers, the Packet Compiler fills sections in this order:

```
P0 — Hard constraints (must include: scene cards, objectives, contracts)
P1 — Current state (character states, relationship states, active threads)
P2 — Recent context (previous 3 chapter summaries, current volume summary)
P3 — Distant reference (historical volume summaries, full world rules)
P4 — Supplementary (development chains, historical QA issues)
```

Filling stops when the token budget for that worker is exhausted.

## Output Contracts

All worker output contracts are defined in `docs/api-spec.md` (Internal Worker Contracts section). That is the single source of truth. Summary:

- **Planner**: returns `summary`, `assumptions`, `questions`, `artifacts[]`, `issues[]`
- **Writer**: returns `chapter_title`, `chapter_summary`, `chapter_text`, `introduced_provisional_elements[]`, `risks[]`
- **QA**: returns `decision`, `overall_notes`, `issues[]` with `evidence_refs[]` and `suggested_fix`
- **Summarizer**: returns `summary`, `key_events[]`, `character_deltas[]`, thread changes, `timeline_events[]`

## Minimum Question Set Rule

When the system needs user clarification, the Chat Agent should ask no more than three targeted questions at once, ideally in selectable form (multiple choice or option cards).

## Style Profile

Stored as structured data on the Project entity (`style_profile_json`), not vague text.

Fields:
- pov (first, third_limited, third_omniscient)
- tense (past, present)
- prose_density (light, medium, dense)
- dialogue_ratio (low, medium, high)
- emotional_intensity (low, medium, high)
- humor_level (none, light, moderate, heavy)
- darkness_level (light, medium, dark, grimdark)
- romance_emphasis (none, light, moderate, heavy)
- action_frequency (low, medium, high)

The style profile is included in the Writer packet and QA packet for style compliance checking.
