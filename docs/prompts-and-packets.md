# Prompts and Packet Contracts

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.
> See also: `docs/api-spec.md` for the authoritative output schemas (all contracts are unified there).
> See also: v2 design spec for blueprint-driven packets, ProjectTemplate configuration, and character tier management.

## Packet Philosophy

Packets must be compact, structured, and task-specific. They are the main defense against context drift. The Orchestrator (deterministic code) compiles different packets per worker type. All format parameters (chapter length, style base, volume size) are sourced from ProjectTemplate — no hardcoded defaults in packet compilation.

## Per-Worker Packet Sections

Each worker receives a different packet tailored to its task. The Packet Compiler fills sections by priority within the token budget.

### Planner Packet

- task_objective
- workflow_stage
- planning_mode (expand_outline | brainstorm_directions)
- hard_constraints (world rules, confirmed canon)
- open_questions
- full outline (current)
- unresolved_threads
- development_chains
- character_arcs (high-level, with tier annotations: core/important/episodic)
- project_template_params (chapter length, volume size, format constraints)
- output_contract

### Writer Packet

- chapter_objective
- **blueprint** (confirmed — treated as binding contract; replaces simple scene cards)
  - per-scene objectives and emotional beats
  - combat choreography details (if applicable)
  - key dialogue beats and reversals
  - character entrance/exit and state changes
- current_character_states (only in-scene characters, with tier and card data)
- relationship_states (only relevant)
- recent_chapter_summaries (previous 3)
- current_volume_summary
- **style_profile** (base profile from ProjectTemplate + any custom overrides)
- project_template_params (chapter length target, streaming config)
- output_contract

### QA Packet

- chapter_draft (full text)
- **blueprint** (for coverage verification — every scene objective, dialogue beat, combat detail, and reversal must be checked against the draft)
- relevant_canon (character states with card data, world rules)
- recent_chapter_summaries
- timeline_events (relevant)
- unresolved_threads (active)
- **character_cards** (for compliance checking — behavior must match traits and tier expectations)
- style_profile (from ProjectTemplate, for style compliance)
- output_contract

### Summarizer Packet

- chapter_text (full)
- chapter_number
- character_list (with tiers)
- active_threads
- project_template_params (summary length target)
- output_contract

## Token Budget Priority

For all workers, the Packet Compiler fills sections in this order:

```
P0 — Hard constraints (must include: blueprint/scene data, objectives, contracts)
P1 — Current state (character states + cards, relationship states, active threads)
P2 — Recent context (previous 3 chapter summaries, current volume summary)
P3 — Distant reference (historical volume summaries, full world rules)
P4 — Supplementary (development chains, historical QA issues)
```

Filling stops when the token budget for that worker is exhausted.

## Output Contracts

All worker output contracts are defined in `docs/api-spec.md` (Internal Worker Contracts section). That is the single source of truth. Summary:

- **Planner**: returns `summary`, `assumptions`, `questions`, `artifacts[]`, `issues[]`, `blueprint` (with per-scene detail)
- **Writer**: returns `chapter_title`, `chapter_summary`, `chapter_text` (streamed), `introduced_provisional_elements[]`, `risks[]`, `scene_blocks[]`
- **QA**: returns `decision`, `overall_notes`, `issues[]` with `evidence_refs[]` and `suggested_fix`, `blueprint_coverage_report`, `character_compliance_report`
- **Summarizer**: returns `summary`, `key_events[]`, `character_deltas[]`, thread changes, `timeline_events[]`

## Minimum Question Set Rule

When the system needs user clarification, the Chat Agent should ask no more than three targeted questions at once, ideally in selectable form (multiple choice or option cards).

## Style Profile

Style profile configuration is managed through ProjectTemplate. The profile consists of a **base profile** (selected from presets or genre defaults) plus **custom overrides** set by the user.

Stored as structured data on the ProjectTemplate entity, not vague text.

Available fields (all configurable per project via ProjectTemplate):

- pov (first, third_limited, third_omniscient)
- tense (past, present)
- prose_density (light, medium, dense)
- dialogue_ratio (low, medium, high)
- emotional_intensity (low, medium, high)
- humor_level (none, light, moderate, heavy)
- darkness_level (light, medium, dark, grimdark)
- romance_emphasis (none, light, moderate, heavy)
- action_frequency (low, medium, high)
- custom fields (extensible per ProjectTemplate)

The style profile is included in the Writer packet (as binding style contract) and QA packet (for style compliance checking).

## Blueprint as Contract

The blueprint is the central artifact connecting Planner, Writer, and QA:

1. **Planner** generates the blueprint (via expand or brainstorm mode)
2. **User** confirms the blueprint (required gate)
3. **Writer** receives the blueprint as a binding contract — every element must be addressed in prose
4. **QA** receives the blueprint for coverage verification — flags any missed elements

This ensures the writing pipeline is deterministic: what was planned is what gets written, and what gets written is what gets checked.
