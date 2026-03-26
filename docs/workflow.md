# Workflow Phases

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.
> See also: v2 design spec for blueprint-driven workflow, impact analysis, and ProjectTemplate configuration.

## Phase 0 — Project Bootstrap

**Trigger:** User creates a new project.

Input:
- title
- genre
- tone
- premise
- optional target length / audience / restrictions

Processing:
- Chat Agent acknowledges user input
- Orchestrator creates project record and initial brief
- Orchestrator initializes ProjectTemplate with format parameters (chapter length, volume size, style base, etc.)
- Orchestrator creates initial open issues list

Output:
- project record
- initial project brief
- ProjectTemplate (all format parameters configurable)
- initial open issues list

## Phase 1 — Story Foundation (runs once per project)

**Trigger:** After bootstrap, Orchestrator automatically enters foundation phase.

### Step 1.1 — Feasibility Evaluation

Orchestrator dispatches Planner to evaluate whether enough information exists to proceed.

Possible outcomes:
1. **Sufficient** → continue to Step 1.2
2. **Insufficient but recoverable** → Orchestrator returns minimal question set to Chat Agent → Chat Agent asks user → user answers → re-evaluate
3. **Ambiguous but not blocking** → Orchestrator marks provisional assumptions and continues

Artifacts:
- evaluation report
- minimum question set (if needed)
- provisional assumptions list (if any)

### Step 1.2 — Foundation Artifact Generation

Orchestrator dispatches Planner to create foundational artifacts:
- world rules draft
- character cards (with tier assignment: core / important / episodic)
- relationship map
- high-level outline
- development chains

Chat Agent presents artifacts to user. User can:
- edit
- reject
- request alternates
- confirm selected artifacts into canon

Orchestrator processes confirmations → canon projection.

## Phase 2-N — Chapter Loop (repeats for each chapter)

### Step 1: Blueprint Planning

**Trigger:** User requests next chapter (via Chat Agent → Orchestrator).

Orchestrator dispatches Planner with relevant canon packet. Planner operates in one of two modes:

**Mode A — Expand User Outline:** When the user provides an outline or direction, Planner expands it into a full blueprint with scene-level detail.

**Mode B — Brainstorm Directions:** When the user has no specific direction, Planner generates multiple candidate directions (A/B/C) grounded in canon, unresolved threads, and development chains. User selects a direction, then Planner expands it into a blueprint.

Planner produces a **blueprint** (replaces simple scene cards):
- chapter objective
- required callbacks / dependencies
- per-scene breakdown including:
  - scene objective and emotional beat
  - combat choreography details (if applicable)
  - key dialogue beats and reversals
  - character entrance/exit and state changes
- emotional and pacing targets

Chat Agent presents the blueprint to user. User can edit and confirm. **Blueprint confirmation is required before writing proceeds.**

### Step 2: Chapter Drafting

**Trigger:** User confirms blueprint.

Orchestrator compiles context packet (via L0 structured recall with token budget) and dispatches Writer.

Writer generates chapter draft (length per ProjectTemplate configuration) from:
- confirmed blueprint (treated as binding contract)
- canon packet (character states, world rules, recent summaries)
- style packet (base + custom from ProjectTemplate)

Writer strictly executes the blueprint — no independent content decisions. Output is streamed to the client.

Orchestrator saves chapter draft artifact.

### Step 3: QA Gate

**Trigger:** Writer returns draft. Orchestrator automatically dispatches QA.

QA validates:
- continuity
- pacing
- tone alignment
- motivation consistency
- unresolved logic gaps
- **blueprint coverage** — every scene objective, dialogue beat, and reversal in the blueprint must be addressed
- **character card compliance** — character behavior must match their card traits, tier expectations, and current state

Outcomes:
- **Pass** → proceed to Step 4
- **Pass with notes** → proceed to Step 4 (notes attached)
- **Revision required** → Chat Agent presents QA issues to user. User decides whether to revise at **per-scene granularity** (new user action → back to Step 2 for affected scenes only) or accept as-is
- **Blocked** → Chat Agent presents blocking issues to user. Requires explicit user decision before proceeding

### Step 3b: Per-Scene Rewriting (Revision Loop)

When QA flags issues at the scene level, the user can request rewriting of individual scenes rather than the entire chapter:

1. Chat Agent presents flagged scenes with QA notes
2. User selects which scenes to revise and optionally provides guidance
3. Orchestrator dispatches Writer with the specific scene blueprint + revision notes
4. Writer rewrites only the targeted scenes (streamed output)
5. Orchestrator merges revised scenes into the chapter draft
6. Return to Step 3 (QA re-evaluates the updated draft)

### Step 3c: Impact Analysis (Mid-Chapter Setting Changes)

When the user requests a change to canon elements (character traits, world rules, relationships) during an active chapter cycle:

1. Orchestrator runs impact analysis against current canon and in-progress content
2. Impact is classified by risk level:
   - **Green** — localized change, no downstream effects
   - **Yellow** — affects related artifacts; Orchestrator lists affected items for user review
   - **Red** — cascading impact across multiple chapters/threads; requires explicit user confirmation with full scope visibility
3. Chat Agent presents the impact report with risk level
4. User confirms or cancels the change
5. If confirmed, Orchestrator applies the change and flags any in-progress drafts that need revision

### Step 4: Canonization

**Trigger:** User confirms chapter (via confirm button).

Orchestrator executes canon projection pipeline:
1. Update chapter status → canonized
2. Dispatch Summarizer → generate structured chapter summary
3. Parse Summarizer output → update canon stores:
   - ChapterSummary
   - CharacterState (incremental)
   - RelationshipState (incremental)
   - TimelineEvent (insert new)
   - UnresolvedThread (status change)
   - DevelopmentChain (advance)
4. Check volume boundary (per ProjectTemplate volume size setting) → trigger volume summary if needed
5. Update character lifecycle (tier transitions, episodic character cleanup)
6. Write audit log

### Step 5: Loop

Return to Step 1 for next chapter.

## Triage Router Logic

When the system encounters uncertainty, the following triage happens:

### Route A — Internal Resolve (Orchestrator)
Orchestrator uses existing canon and planning artifacts to resolve without user interruption. Applies when the answer is deterministic from existing data.

### Route B — Ask User (Chat Agent)
If ambiguity affects major plot, character logic, or world rule validity, Orchestrator sends the question to Chat Agent, which asks 1-3 highly targeted questions. Applies when user judgment is needed.

### Route C — Provisional Continue (Orchestrator)
Orchestrator continues with a clear temporary assumption stored as a provisional artifact (not canon) until user confirms. Applies when the ambiguity is non-blocking.

## Revision Loop and Safety Limits

Each user action (message, button click) resets the task counter. The Orchestrator enforces:
- MAX_TASKS_PER_USER_ACTION = 5
- MAX_TOKENS_PER_TASK = 50,000
- MAX_TOTAL_TOKENS_PER_ACTION = 150,000

A typical chapter cycle (Plan + Write + QA) = 3 tasks. If QA returns `revise`, the system presents the issues to the user. The user clicking "Revise" is a **new user action**, resetting the counter. This ensures the user is always in control and the system never enters unbounded loops.

## Hard Rules

1. No worker should ever read the full raw conversation history. All work must be packet-based.
2. Workers cannot dispatch other workers. Call chain is always: User → Chat Agent → Orchestrator → Worker → return.
3. Only user confirmation can admit content into canon.
4. Blueprint confirmation is required before Writer is dispatched.
5. All format parameters (chapter length, volume size, style base) are defined in ProjectTemplate — no hardcoded defaults in workflow logic.
