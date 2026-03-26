# Agent Design and Responsibilities

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.
> See also: v2 design spec for blueprint-driven agents, character tiers, impact analysis, and ProjectTemplate configuration.

## Guiding Rule

Agent count is not the product advantage. Controlled role boundaries are. For MVP, a small number of well-scoped workers is preferable to a large theatrical agent roster. Novel Studio is an **AI serial fiction workbench**, not a generator — the user drives creative decisions while agents execute within strict boundaries.

## Architecture Decision: Producer Split

The original "Producer" concept is split into two components:

- **Chat Agent (LLM)** — the only user-facing component. Handles dialogue, intent classification, and lightweight creative tasks.
- **Orchestrator (deterministic code)** — workflow state machine, packet compilation, task dispatch, canon gate, impact analysis. NOT an LLM.

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
- present impact analysis results (green/yellow/red risk levels) for user decision

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
- workflow state machine (plan → blueprint confirm → write → qa → canonize)
- compile context packets with token budget
- dispatch tasks to LLM workers
- manage artifact statuses and transitions
- enforce canon gate
- trigger Summarizer on canonize
- enforce safety limits (max tasks, max tokens)
- write audit logs with token tracking
- **run impact analysis** for mid-workflow canon changes (green/yellow/red risk classification)
- **manage character tier lifecycle** (core/important/episodic transitions, episodic cleanup on canonize)
- **enforce blueprint confirmation** before Writer dispatch

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
- Convert vague user goals into structured narrative blueprints. Operates in two modes depending on user input.

**Mode A — Expand User Outline**
- User provides an outline or direction
- Planner expands it into a detailed blueprint with per-scene granularity
- Canon-aware: suggestions respect confirmed world rules, character states, and active threads

**Mode B — Brainstorm Directions**
- User has no specific direction
- Planner generates multiple candidate directions (A/B/C) grounded in canon, unresolved threads, and development chains
- After user selects a direction, Planner expands it into a full blueprint

**Responsibilities**
- evaluate material sufficiency
- produce minimal question set when missing info blocks progress
- generate structure options A/B/C when needed (Mode B)
- define world-rule drafts
- create outline beats
- **generate blueprints** (replace simple scene cards) including:
  - scene objectives and emotional beats
  - combat choreography details
  - key dialogue beats and reversals
  - character entrance/exit and state changes
- maintain development logic chains
- **canon-aware suggestions**: all output respects confirmed canon and flags potential conflicts
- **character tier awareness**: plan appropriate page time and development depth per character tier (core/important/episodic)

**Cannot**
- finalize canon
- write polished chapter prose for release
- overrule confirmed canon
- dispatch other workers

**Inputs**
- compiled packet from Orchestrator (never chat history)

**Outputs**
- evaluation report
- option cards (Mode B brainstorm directions)
- world drafts
- outline drafts
- **blueprints** (per-scene detail including combat, dialogue, reversals)
- dependency chain notes

---

### 4. Writer (LLM — high-tier model)

**Mission**
- Generate chapter prose strictly from confirmed blueprints. The Writer **executes** blueprints — it makes no independent content decisions. Chapter length is determined by ProjectTemplate configuration.

**Responsibilities**
- draft chapter prose from blueprints at **per-scene granularity**
- preserve tone, POV, and style constraints (from ProjectTemplate style profile)
- obey canon and current-state packets
- produce rewrite variants for individual scenes when requested (per-scene rewriting)
- **stream output** to the client during generation
- treat the blueprint as a binding contract — every scene objective, dialogue beat, and reversal must be addressed

**Cannot**
- invent new world rules without marking them as unresolved/provisional
- rewrite confirmed canon implicitly
- skip required scenes unless instructed
- make content decisions not specified in the blueprint
- dispatch other workers

**Inputs**
- compiled packet from Orchestrator (blueprint as contract, canon, character states, style rules)

**Outputs**
- chapter draft (streamed)
- rewrite version (per-scene)
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
- **blueprint coverage check** — verify every scene objective, dialogue beat, combat detail, and reversal from the blueprint is addressed in the draft
- **character card compliance** — verify character behavior matches their card traits, tier expectations, and current state
- generate evidence-based issue reports
- recommend pass, revise, or block
- flag issues at per-scene granularity to enable targeted rewriting

**Cannot**
- silently modify canon
- rewrite content without producing a tracked suggested patch
- dispatch other workers

**Inputs**
- compiled packet from Orchestrator (chapter draft, relevant canon, character states, **blueprint for coverage check**)

**Outputs**
- QA report
- issue list with severity (flagged per scene)
- evidence references
- suggested patch notes
- gate decision
- **blueprint coverage report** (which blueprint items are fulfilled/missing)
- **character compliance report** (which character behaviors match/deviate from cards)

---

### 6. Summarizer (LLM — low-tier model)

**Mission**
- Compress chapter content into structured summaries on canonize.

**Responsibilities**
- generate chapter-level summaries (length per ProjectTemplate configuration)
- extract character state deltas
- identify new/resolved/advanced threads
- extract timeline events
- trigger volume-level summary generation at volume boundaries (per ProjectTemplate volume size setting)

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

## Character Tier Management

Characters are classified into three tiers with different lifecycle management:

| Tier | Description | Lifecycle |
|---|---|---|
| **Core** | Protagonists and central antagonists | Persistent across all volumes; full state tracking |
| **Important** | Recurring secondary characters | Persistent within active arcs; state tracked while relevant |
| **Episodic** | One-off or short-arc characters | Active during their scenes; cleaned up on canonize when arc concludes |

Tier assignment happens during foundation (Step 1.2) and can be adjusted by the user at any time. The Orchestrator manages tier transitions and ensures Planner allocates appropriate development depth per tier. On canonize, the Orchestrator runs episodic character cleanup to archive characters whose arcs have concluded.

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
