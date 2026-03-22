# Workflow Phases

## Phase 0 — Project Bootstrap

Input:
- title
- genre
- tone
- premise
- optional target length / audience / restrictions

Output:
- project record
- initial project brief
- initial open issues list

## Phase 1 — Feasibility / Evaluation

Producer asks Planner to evaluate if enough information exists to proceed.

Possible outcomes:
1. **Sufficient** → continue
2. **Insufficient but recoverable** → ask minimal question set
3. **Ambiguous but not blocking** → mark provisional and continue cautiously

Artifacts:
- evaluation report
- minimum question set
- provisional assumptions list

## Phase 2 — Story Foundation

Planner creates foundational artifacts:
- world rules draft
- character cards
- relationship map
- high-level outline
- development chains

User can:
- edit
- reject
- request alternates
- confirm selected artifacts into canon

## Phase 3 — Chapter Planning

Producer requests chapter planning for next target chapter.

Planner produces:
- chapter objective
- required callbacks / dependencies
- scene cards
- emotional and pacing targets

User can edit and confirm the scene plan.

## Phase 4 — Chapter Drafting

Writer generates chapter draft from:
- confirmed scene cards
- current project canon packet
- current character states
- style packet

Writer returns chapter draft artifact.

## Phase 5 — QA Gate

QA validates:
- continuity
- pacing
- tone alignment
- motivation consistency
- unresolved logic gaps

Outcomes:
- Pass
- Pass with notes
- Revision required
- Blocked

## Phase 6 — Canonization / Publication

Only after user confirmation:
- chapter status becomes canonized/published
- timeline updates
- character current-state updates
- unresolved threads updates
- canon provenance records created

## Triage Router Logic

When the system encounters uncertainty, Producer must choose exactly one route:

### Route A — Internal Resolve
Use existing canon and planning artifacts to resolve without user interruption.

### Route B — Ask User
If ambiguity affects major plot, character logic, or world rule validity, ask 1-3 highly targeted questions.

### Route C — Provisional Continue
Continue with a clear temporary assumption that is not canon until user confirms.

## Hard Rule

No worker should ever read the full raw conversation history by default. All work must be packet-based.

