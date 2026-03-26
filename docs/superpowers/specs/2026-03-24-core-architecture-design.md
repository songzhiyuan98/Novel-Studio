# Novel Studio — Core Architecture Design Spec

> Date: 2026-03-24
> Status: Approved
> Scope: MVP core pipeline architecture, RAG strategy, summarization system, interaction model, safety mechanisms

---

## 1. Product Vision

### Core Selling Point

AI writes ultra-long serialized web novels (hundreds to thousands of chapters, Fanqie/番茄小说 level) without quality degradation — no lore drift, no character inconsistency, no broken continuity.

### Target Format

- 2000-3000 Chinese characters per chapter
- ~100 chapters per volume
- Target: hundreds to thousands of chapters per project

### Target Users

- Hobbyist novel writers, webnovel/serialized fiction creators
- Idea-rich but structure-poor creators who prefer decision-making over drafting prose

### Success Criteria

The system can sustain 10+ sequential chapters with preserved world rules, character consistency, relationship continuity, and unresolved thread tracking — all under user-controlled canon admission.

---

## 2. Architecture Overview

### Design Principle: Separate Conversation from Orchestration

The original "Producer" role is split into two layers:

- **Chat Agent (LLM)** — understands user intent, generates user-facing responses
- **Orchestrator (deterministic code)** — workflow state machine, packet compilation, task dispatch, canon gate enforcement

This ensures orchestration logic is testable, deterministic, and not subject to LLM hallucination.

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   UX Layer                       │
│   Chat UI + Orchestration Trace + Confirm/Reject │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              Chat Agent (LLM)                    │
│  - Parse user intent                             │
│  - Generate user-facing replies                  │
│  - Handle lightweight creative requests directly │
│  - Route workflow commands to Orchestrator       │
└──────────────────────┬──────────────────────────┘
                       │ intent + user decisions
┌──────────────────────▼──────────────────────────┐
│           Orchestrator (deterministic code)       │
│  - Workflow state machine                        │
│  - Packet compiler (L0 structured recall)        │
│  - Task dispatcher                               │
│  - Canon gate enforcement                        │
│  - Summarizer trigger on canonize                │
│  - Token budget management                       │
│  - Safety limits enforcement                     │
└───────┬──────────┬──────────┬───────────────────┘
        │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌──▼───┐ ┌──────────┐
   │Planner │ │ Writer │ │  QA  │ │Summarizer│
   │ (LLM)  │ │ (LLM)  │ │(LLM) │ │  (LLM)   │
   └────────┘ └────────┘ └──────┘ └──────────┘
        │          │          │         │
┌───────▼──────────▼──────────▼─────────▼─────────┐
│              Knowledge Layer                     │
│  Canon Store (confirmed-only structured state)   │
│  ├── StoryBible / WorldRules                     │
│  ├── CharacterState / RelationshipState          │
│  ├── ChapterSummary (per chapter)                │
│  ├── VolumeSummary (per ~100 chapters)           │
│  ├── TimelineEvents                              │
│  ├── UnresolvedThreads                           │
│  └── DevelopmentChains                           │
│                                                  │
│  Artifact Store (all versions incl. draft/reject)│
└─────────────────────────────────────────────────┘
```

### User Input Classification

Not every user input triggers the full pipeline. Chat Agent classifies input into three types:

| Type                        | Example                | Handler                                 |
| --------------------------- | ---------------------- | --------------------------------------- |
| Casual/lightweight creative | "这名字不好听，换几个" | Chat Agent replies directly             |
| Canon modification          | "把林凡改名叫陈霄"     | Chat Agent → Orchestrator updates canon |
| Pipeline task               | "开始写下一章"         | Full pipeline: Planner → Writer → QA    |

The user never needs to know about agent internals. Interaction is natural language + option buttons + confirm/reject.

---

## 3. LLM Worker Design

### Workers Are Stateless

Each worker (Planner, Writer, QA, Summarizer) is a **stateless single-shot LLM call**. Workers:

- Receive only a compiled packet (no chat history, no conversation context)
- Return structured output conforming to a defined contract
- Cannot call other workers
- Cannot call the Orchestrator
- Cannot modify canon directly

### Worker Roster

| Worker     | Mission                                    | Typical Model Tier               |
| ---------- | ------------------------------------------ | -------------------------------- |
| Chat Agent | User intent parsing + dialogue             | Mid-tier (Sonnet/GPT-4o-mini)    |
| Planner    | Structure planning, scene cards, outlines  | High-tier (Opus/GPT-4o)          |
| Writer     | Chapter prose generation (2000-3000 chars) | High-tier (Opus/GPT-4o/DeepSeek) |
| QA         | Continuity/style/pacing validation         | Mid-tier (Sonnet/GPT-4o-mini)    |
| Summarizer | Chapter compression on canonize            | Low-tier (Haiku/GPT-4o-mini)     |

### Model Selection: User-Controlled

Users provide their own API keys and choose models. Two configuration modes:

**Simple mode:** One API key, system auto-selects appropriate models per worker.

**Advanced mode:** Per-worker model configuration, potentially different providers.

Supported providers (via Vercel AI SDK unified interface):

- OpenAI (GPT-4o, GPT-4o-mini)
- Anthropic (Claude Opus, Sonnet, Haiku)
- Google (Gemini)
- DeepSeek
- More as needed

```typescript
interface WorkerModelConfig {
  chat: { provider: string; model: string }
  planner: { provider: string; model: string }
  writer: { provider: string; model: string }
  qa: { provider: string; model: string }
  summarizer: { provider: string; model: string }
}
```

---

## 4. RAG Strategy: L0 Structured Recall (MVP) → L1 Semantic Retrieval (Later)

### Why Not Full RAG in MVP

Full embedding/vector search adds complexity without value until the base workflow is proven. But zero retrieval makes long-form writing impossible.

### L0 — Structured Canon Recall (MVP, Day 1)

Store confirmed canon as structured JSON. Query by exact ID/key match driven by scene card metadata. No embeddings, no vector search.

**How it works:**

1. Scene cards contain structured annotations: `characters`, `locations`, `threads`, `callbacks`
2. Packet Compiler uses these annotations as query keys
3. Canon store returns matching structured data
4. Packet Compiler fills packet within token budget

```json
{
  "chapter": 350,
  "scenes": [
    {
      "location": "云顶秘境",
      "characters": ["林凡", "苏雨晴", "天魔老祖"],
      "threads": ["thread_042_天魔封印"],
      "callbacks": ["chain_015_苏雨晴身世"],
      "objective": "林凡与天魔老祖第一次正面交锋"
    }
  ]
}
```

### L1 — Semantic Retrieval (Post-MVP)

Add embedding-based search only after:

- Artifact schemas are stable
- Chapter summaries exist and are reliable
- Canon read models are proven
- QA report schema is stable

L1 solves: finding related foreshadowing/callbacks, conceptually similar conflicts, thematic connections — things that structured key matching cannot find.

---

## 5. Packet Compiler Design

### Core Principle

Not "stuff all canon in" but "give this task the minimum information it needs."

### Token Budget Mechanism

Each LLM call has a total context window. Packet Compiler fills by priority until budget exhausted:

```
P0 — Hard constraints (must include)
  ├── Current scene cards
  ├── Chapter objective
  ├── Style constraints
  └── Output format contract

P1 — Current state (almost always include)
  ├── Relevant character states (only characters in this chapter)
  ├── Relevant relationship states
  └── Active threads / unresolved hooks

P2 — Recent context (important)
  ├── Previous 3 chapter summaries (Layer 0)
  ├── Current volume summary (Layer 1)
  └── Recent timeline events

P3 — Distant reference (as needed)
  ├── Historical volume summaries
  ├── Full world rules
  └── Historical relationship changes

P4 — Supplementary (fill if space remains)
  ├── Related development chains
  └── Historical QA common issues
```

### Per-Worker Packet Differences

| Worker     | Core needs                                                                 | Does not need                            |
| ---------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| Planner    | Full outline, unresolved threads, development chains, character arcs       | Previous chapter raw text, style details |
| Writer     | Scene cards, character states, recent chapter summaries, style constraints | Full outline, resolved threads           |
| QA         | Current chapter draft, relevant canon entries, character state snapshots   | Style constraints, outline               |
| Summarizer | Current chapter full text, character list                                  | Outline, world rules                     |

---

## 6. Hierarchical Summarization System

### Three-Layer Structure

**Layer 0 — Chapter Summary (generated on each canonize)**

- ~300-500 Chinese characters
- Preserves: key events, character state changes, new hooks, new world facts
- Discards: transition prose, environment descriptions, combat details
- Lifecycle: permanent

**Layer 1 — Volume Summary (generated every ~100 chapters)**

- ~1000-2000 Chinese characters
- Compressed from 100 chapter summaries
- Preserves: main plot progression, character arc turning points, world changes, major hooks
- Discards: subplot details, single-chapter minor conflicts
- Lifecycle: permanent

**Layer 2 — Global State (continuously updated real-time view)**

- Not a summary — structured state tables
- CharacterState, WorldRules, ActiveThreads, RelationshipMap
- Incrementally updated on each canonize
- Lifecycle: live, always current

### Summarizer Output Contract

```json
{
  "chapter_number": 350,
  "summary": "string (300-500 chars)",
  "key_events": ["string"],
  "character_deltas": [{ "character": "string", "change": "string" }],
  "new_threads": ["thread_id"],
  "resolved_threads": ["thread_id"],
  "advanced_threads": ["thread_id"],
  "new_world_facts": ["string"],
  "timeline_events": [{ "event": "string", "location": "string" }]
}
```

### Canon Projection Flow (triggered on canonize)

1. Update Chapter status → canonized
2. Call Summarizer (LLM) → generate chapter summary
3. Parse Summarizer structured output
4. Write to canon stores:
   - ChapterSummary
   - CharacterState (incremental update)
   - RelationshipState (incremental update)
   - TimelineEvent (insert new)
   - UnresolvedThread (status change)
   - DevelopmentChain (advance)
5. Check if chapter count hits volume boundary (~100)
   - Yes → trigger volume summary generation
6. Write audit log

### Packet Assembly Example (Writer at Chapter 350)

```
Volume 1 summary (Layer 1)     ~1500 chars
Volume 2 summary (Layer 1)     ~1500 chars
Volume 3 summary (Layer 1)     ~1500 chars
Chapter 347-349 summaries (L0) ~1500 chars (detailed, recent)
Relevant character states (L2) ~1000 chars (real-time)
Active threads (L2)            ~500 chars  (real-time)
────────────────────────────────────────────
Total: ~8000 chars ≈ ~12K tokens

12K tokens of canon context covers 350 chapters of history.
```

---

## 7. Safety Mechanisms

### Protection Layer 1: Hard Limits

```
MAX_TASKS_PER_USER_ACTION = 5
  Each user input triggers at most 5 worker calls.
  Exceeded → stop and ask user for decision.

MAX_TOKENS_PER_TASK = 50,000
  Single worker call input token ceiling.

MAX_TOTAL_TOKENS_PER_ACTION = 150,000
  Total token budget per user action.
```

### Protection Layer 2: Deterministic Orchestration

The Orchestrator is code, not an LLM. It cannot "decide" to dispatch extra tasks. The workflow state machine strictly defines allowed transitions:

```
plan → write → qa → canonize
```

Each state can only transition to defined next states. No freeform task creation.

```typescript
switch (intent) {
  case 'start_chapter':
    await runPipeline(['planner', 'writer', 'qa'])
    break
  case 'edit_artifact':
    await updateArtifact(payload)
    break
  case 'confirm':
    await canonize(artifactId)
    break
  default:
    // Chat Agent handles directly, no task dispatch
    break
}
```

### Protection Layer 3: Workers Cannot Dispatch Workers

Architectural hard constraint:

- Workers can only return structured output
- Workers cannot call other workers
- Workers cannot call the Orchestrator
- Only the Orchestrator can dispatch tasks
- Only user actions can trigger the Orchestrator

Call chain is always unidirectional:

```
User → Chat Agent → Orchestrator → Worker → return result → chain ends
```

### Context Isolation

- Workers are stateless single-shot calls, seeing only compiled packets
- Chat Agent conversation history is managed separately (rolling window + compression)
- Chat history never leaks into worker packets

### Token Monitoring

Every task records:

```json
{
  "task_id": "string",
  "worker": "planner|writer|qa|summarizer",
  "model": "string",
  "tokens": { "input": 0, "output": 0, "total": 0 },
  "estimated_cost_usd": 0.0,
  "duration_ms": 0,
  "status": "completed|failed"
}
```

Displayed in Orchestration Trace panel for real-time debugging.

---

## 8. MVP Scope Definition

### What "MVP Done" Means

User can create a project from scratch and write 5 sequential chapters without continuity breakdown.

### Minimal Complete Loop

```
Phase 0: Bootstrap
  Input: { title, genre, tone, premise }
  Output: project record + initial brief

Phase 1: Foundation (runs once)
  Planner → world rules + character cards + outline
  User confirms → canon write

Phase 2-N: Chapter Loop (repeats)
  Step 1: Plan    → Planner generates scene cards → user confirms
  Step 2: Write   → Packet Compiler assembles context → Writer generates chapter
  Step 3: QA      → QA reviews → pass/revise/block → revise loops back to Step 2
  Step 4: Canonize → User confirms → Summarizer → canon projection
  Step 5: Loop    → back to Step 1
```

### MVP Includes

- 4 LLM workers + Summarizer
- Structured canon store (PostgreSQL)
- Chapter-level summaries
- Scene-card-driven precise recall (L0)
- Artifact versioning + status machine
- Simple API endpoints
- Chat UI + Orchestration Trace panel + Confirm/Reject buttons
- Single provider support (get one working first)
- Audit log with token tracking

### MVP Excludes

- On-demand agents (Divergent, Worldbuilder, etc.)
- Embedding / vector search (L1 RAG)
- Volume-level summaries (not needed for 5-chapter test)
- Diff / Compare UI
- Multi-provider switching UI
- Full provenance inspector
- Relationship graph visualization
- Pacing charts

### MVP Acceptance Criteria

1. Can create a project and generate world rules / character cards / outline
2. Can write a 2000-3000 character Chinese chapter from scene cards
3. QA detects at least one type of consistency issue (character/setting/timeline)
4. Confirmed content correctly updates canon
5. Chapter 5 context packet correctly references settings confirmed in Chapter 1
6. Draft and rejected content does not appear in subsequent packets

---

## 9. MVP UI Scope

UI priority is adjusted: not "UI last" but "minimal UI alongside core pipeline for debugging."

| Priority | Component                      | Purpose                                        |
| -------- | ------------------------------ | ---------------------------------------------- |
| High     | Chat interface                 | Test user interaction flow                     |
| High     | Orchestration Trace panel      | Debug and optimize agent collaboration         |
| High     | Confirm / Reject buttons       | Core canon gate interaction                    |
| Medium   | Artifact view/edit             | Inspect generated scene cards, character cards |
| Low      | Chapter timeline, diff compare | Later optimization                             |

The MVP UI is essentially: **a chat window with backend trace + a few buttons.**

---

## 10. Recommended Tech Stack

| Layer           | Choice                   | Reasoning                                                   |
| --------------- | ------------------------ | ----------------------------------------------------------- |
| Runtime         | Node.js + TypeScript     | Good ecosystem, full AI SDK support                         |
| LLM calls       | Vercel AI SDK            | Unified interface, zero-cost multi-provider switching later |
| Database        | PostgreSQL + Drizzle ORM | Structured data primary, lots of relational queries         |
| API             | Hono or Express          | Lightweight, sufficient                                     |
| Monorepo        | pnpm workspace           | Simple and reliable                                         |
| Frontend (last) | Next.js                  | Natural integration with Vercel AI SDK                      |

---

## 11. Decision Log

| #   | Decision             | Conclusion                                                                         |
| --- | -------------------- | ---------------------------------------------------------------------------------- |
| 1   | Core selling point   | AI writes Fanqie-level long-form (100s-1000s chapters) without degradation         |
| 2   | Development order    | Core pipeline → UI → RAG optimization                                              |
| 3   | Agent architecture   | Chat Agent (LLM) + Orchestrator (code) + Workers (LLM)                             |
| 4   | RAG strategy         | L0 structured recall (MVP) → L1 semantic retrieval (later)                         |
| 5   | Compression strategy | Canonize-time compression, three-layer summaries (chapter → volume → global state) |
| 6   | Packet Compiler      | Token budget + priority fill + scene-card-driven exact queries                     |
| 7   | Model selection      | User-provided API keys, simple/advanced config modes                               |
| 8   | Chapter spec         | 2000-3000 chars/chapter, ~100 chapters/volume                                      |
| 9   | MVP scope            | 5-chapter complete loop, CLI/API first, cut UI and semantic RAG                    |
| 10  | Tech stack           | TypeScript + Vercel AI SDK + PostgreSQL + pnpm monorepo                            |
| 11  | Interaction model    | Natural language + option buttons, user unaware of agent internals                 |
| 12  | Chat Agent scope     | Lightweight creative → direct reply; canon edit → Orchestrator; pipeline → workers |
| 13  | MVP UI scope         | Chat + Orchestration Trace + Confirm/Reject buttons                                |
| 14  | Context isolation    | Workers stateless single-shot, packet-only, no chat history                        |
| 15  | Token monitoring     | Per-task input/output tokens + cost + duration recorded and displayed              |
| 16  | Anti-infinite-loop   | Hard limits + deterministic orchestration + workers cannot dispatch workers        |
