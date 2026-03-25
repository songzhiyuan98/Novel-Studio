# Agent Design and Responsibilities

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.

## Guiding Rule

Agent count is not the product advantage. Controlled role boundaries are. For MVP, a small number of well-scoped workers is preferable to a large theatrical agent roster.

## Architecture Decision: Producer Split

The original "Producer" concept is split into two components:

- **Chat Agent (LLM)** — the only user-facing component. Handles dialogue, intent classification, and lightweight creative tasks.
- **Orchestrator (deterministic code)** — workflow state machine, packet compilation, task dispatch, canon gate. NOT an LLM.

This separation ensures orchestration logic is testable, deterministic, and immune to LLM hallucination.

## Production Roles

### 1. Chat Agent (LLM — mid-tier model)

**Mission**
- The only user-facing conversational interface.

**Responsibilities**
- parse user intent from natural language
- classify input into: casual/creative, canon edit, or pipeline task
- handle lightweight creative requests directly (e.g., brainstorm names, quick suggestions)
- generate user-facing responses with option buttons
- route pipeline tasks to Orchestrator

**Cannot**
- directly mutate canon (routes to Orchestrator)
- dispatch workers directly (routes to Orchestrator)
- bypass QA for chapter publication

**Inputs**
- user chat input
- project summary (from canon store)
- recent conversation history (rolling window)

**Outputs**
- user response
- intent classification
- structured action request to Orchestrator

---

### 2. Orchestrator (deterministic code, NOT LLM)

**Mission**
- Execute workflow logic, compile packets, dispatch tasks, enforce safety.

**Responsibilities**
- workflow state machine (plan → write → qa → canonize)
- compile context packets with token budget
- dispatch tasks to LLM workers
- manage artifact statuses and transitions
- enforce canon gate
- trigger Summarizer on canonize
- enforce safety limits (max tasks, max tokens)
- write audit logs with token tracking

**Cannot**
- directly mutate canon without explicit user confirmation
- create arbitrary tasks outside defined workflow
- exceed safety limits

**Hard constraints**
- MAX_TASKS_PER_USER_ACTION = 5
- MAX_TOKENS_PER_TASK = 50,000
- MAX_TOTAL_TOKENS_PER_ACTION = 150,000

---

### 3. Planner (LLM — high-tier model)

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
- dispatch other workers

**Inputs**
- compiled packet from Orchestrator (never chat history)

**Outputs**
- evaluation report
- option cards
- world drafts
- outline drafts
- scene cards
- dependency chain notes

---

### 4. Writer (LLM — high-tier model)

**Mission**
- Generate chapter prose (2000-3000 Chinese characters) strictly from approved planning artifacts.

**Responsibilities**
- draft chapter prose from scene cards
- preserve tone, POV, and style constraints
- obey canon and current-state packets
- produce rewrite variants when requested

**Cannot**
- invent new world rules without marking them as unresolved/provisional
- rewrite confirmed canon implicitly
- skip required scenes unless instructed
- dispatch other workers

**Inputs**
- compiled packet from Orchestrator (scene cards, canon, character states, style rules)

**Outputs**
- chapter draft
- rewrite version
- scene-level prose blocks

---

### 5. QA / Critic (LLM — mid-tier model)

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
- dispatch other workers

**Inputs**
- compiled packet from Orchestrator (chapter draft, relevant canon, character states)

**Outputs**
- QA report
- issue list with severity
- evidence references
- suggested patch notes
- gate decision

---

### 6. Summarizer (LLM — low-tier model)

**Mission**
- Compress chapter content into structured summaries on canonize.

**Responsibilities**
- generate chapter-level summaries (300-500 chars)
- extract character state deltas
- identify new/resolved/advanced threads
- extract timeline events
- trigger volume-level summary generation at volume boundaries (~100 chapters)

**Cannot**
- modify canon directly (output is processed by Orchestrator)
- dispatch other workers

**Inputs**
- full chapter text
- character list
- current thread list

**Outputs**
- structured summary with: summary text, key events, character deltas, thread changes, timeline events

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
| Chat Agent | No (routes to Orchestrator) | No | No | No | No |
| Orchestrator | Yes (on behalf of workers) | No | No (requires user) | Yes | No |
| Planner | Yes | No | No | No | No |
| Writer | Yes | No | No | No | No |
| QA | Suggested patch only | Yes | No | No | No |
| Summarizer | Summary only | No | No | No | No |
| User | Yes | Yes | Yes | Yes | Yes |

## Safety: Workers Cannot Dispatch Workers

Call chain is always unidirectional:
```
User → Chat Agent → Orchestrator → Worker → return result → chain ends
```

Workers are stateless single-shot LLM calls. They receive only compiled packets, never chat history. They cannot call other workers or the Orchestrator.

## MVP Implementation

Implement five LLM workers + one code orchestrator:
- Chat Agent (LLM)
- Orchestrator (code)
- Planner (LLM)
- Writer (LLM)
- QA (LLM)
- Summarizer (LLM)

Everything else should initially be modeled as prompts, modes, or tools rather than new runtimes.
