# Agent Design and Responsibilities

## Guiding Rule

Agent count is not the product advantage. Controlled role boundaries are. For MVP, a small number of well-scoped workers is preferable to a large theatrical agent roster.

## Production Roles

### 1. Producer (Always-On Control Layer)

**Mission**
- The only user-facing orchestrator.

**Responsibilities**
- parse user intent
- determine current workflow stage
- identify missing information
- route work to internal workers
- compile context packets
- manage artifact statuses and transitions
- mediate conflicts
- enforce canon gate

**Cannot**
- directly mutate canon without explicit user confirmation
- bypass QA for chapter publication
- invent world rules without storing them as artifacts first

**Inputs**
- user chat input
- active project state
- recent artifacts
- issue queue

**Outputs**
- user response
- task dispatches
- issue packets
- context packets
- artifact state changes

---

### 2. Planner (MVP combined planning role)

**Mission**
- Convert vague user goals into structured narrative assets.

**Responsibilities**
- evaluate material sufficiency
- produce minimal question set when missing info blocks progress
- generate structure options A/B/C when needed
- define world-rule drafts
- create outline beats
- create scene cards
- maintain development logic chains

**Cannot**
- finalize canon
- write polished chapter prose for release
- overrule confirmed canon

**Outputs**
- evaluation report
- option cards
- world drafts
- outline drafts
- scene cards
- dependency chain notes

---

### 3. Writer

**Mission**
- Generate chapter prose strictly from approved planning artifacts.

**Responsibilities**
- draft chapter prose from scene cards
- preserve tone, POV, and style constraints
- obey canon and current-state packets
- produce rewrite variants when requested

**Cannot**
- invent new world rules without marking them as unresolved/provisional
- rewrite confirmed canon implicitly
- skip required scenes unless instructed

**Inputs**
- scene card
- current chapter objective
- relevant canon packet
- character state packet
- style rules

**Outputs**
- chapter draft
- rewrite version
- scene-level prose blocks

---

### 4. QA / Critic

**Mission**
- Evaluate generated output before canonization or publication.

**Responsibilities**
- style and pacing review
- continuity validation
- detect canon conflicts
- detect relationship / motivation drift
- generate evidence-based issue reports
- recommend pass, revise, or block

**Cannot**
- silently modify canon
- rewrite content without producing a tracked suggested patch

**Outputs**
- QA report
- issue list with severity
- evidence references
- suggested patch notes
- gate decision

---

## On-Demand Roles for Later Versions

### Divergent
Focused on ideation breadth and alternate possibilities.

### Worldbuilder
Focused on minimal viable world logic and system rule formalization.

### Character & Romance
Focused on relationship arcs, tension, chemistry, and emotional logic.

### Research
Uses external sources for factual support; cannot mutate canon directly.

### Reader Persona
Predicts drop-off risk, confusion points, and reward pacing.

## Write Permissions by Role

| Role | Can create drafts | Can review | Can confirm canon | Can archive | Can publish chapter |
|---|---:|---:|---:|---:|---:|
| Producer | Yes | No | No | Yes | No |
| Planner | Yes | No | No | No | No |
| Writer | Yes | No | No | No | No |
| QA | Suggested patch only | Yes | No | No | No |
| User | Yes | Yes | Yes | Yes | Yes |

## MVP Recommendation

Implement only four runtime personas:
- Producer
- Planner
- Writer
- QA

Everything else should initially be modeled as prompts, modes, or tools rather than new runtimes.

