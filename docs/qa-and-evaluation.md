# QA and Evaluation Strategy

> See also: `docs/api-spec.md` for QA output contract schema.

## QA Gate Purpose

QA is not cosmetic editing. It is the release gate for narrative consistency and chapter quality. QA is a stateless LLM worker dispatched by the Orchestrator. It receives a compiled packet (chapter draft + relevant canon) and returns a structured report.

## QA Dimensions

### 1. Continuity

- does chapter violate confirmed canon?
- does it contradict character state?
- does it break timeline order?

### 2. Motivation Integrity

- do major character actions match known motives and pressure?
- if behavior changes, is there an in-text trigger?

### 3. Pacing

- does scene sequence feel appropriately distributed?
- does chapter over-compress or stall?

### 4. Style Compliance

- does prose match style profile (pov, tense, prose_density, etc.)?
- are POV and tense stable?

### 5. Setup / Payoff Logic

- are important callbacks missing?
- are new hooks introduced cleanly?

## Evidence Rule

Every medium/high severity QA issue must include at least one evidence reference with:

- source_type (canon_entry, chapter_summary, character_state, timeline_event)
- source_id
- quote (relevant excerpt)

## Release Policy

- `pass` or `pass_with_notes` → Chat Agent presents to user → user can confirm (canonize)
- `revise` → Chat Agent presents QA issues to user → user decides to revise (new user action, resets task counter) or accept as-is
- `block` → Chat Agent presents blocking issues → requires explicit user intervention or major replanning

## Revision Loop Behavior

When QA returns `revise`:

1. Orchestrator returns QA report to Chat Agent
2. Chat Agent presents issues and suggested fixes to user
3. User clicks "Revise" → this is a **new user action** (task counter resets)
4. Orchestrator re-dispatches Writer with updated instructions, then QA again
5. Safety limit: MAX_TASKS_PER_USER_ACTION=5 per action prevents infinite loops

## Evaluation Suite for Development

### Functional Tests

- packet schema validation (Zod)
- worker output schema validation (Zod)
- status transition tests (state machine)
- confirm projection tests (canon updates)
- context isolation tests (verify workers don't see chat history)
- safety limit tests (verify max tasks/tokens enforced)

### Story Tests

- multi-chapter consistency test (5 chapters)
- character drift test
- unresolved thread carryover test
- retroactive rule conflict test
- canon pollution test (draft/rejected content must not appear in packets)

## Human Review Rubric

Use a 1-5 score for:

- coherence
- continuity
- readability
- excitement
- controllability
