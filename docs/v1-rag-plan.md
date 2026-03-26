# RAG Strategy — Two-Layer Plan

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.

## Overview

RAG is introduced in two layers. L0 ships with MVP. L1 comes after MVP is validated.

## L0 — Structured Canon Recall (MVP, Day 1)

### What It Is

Not embedding/vector search. It is structured JSON storage of confirmed canon, queried by exact ID/key match driven by scene card metadata.

### How It Works

1. Scene cards contain structured annotations: `characters`, `locations`, `threads`, `callbacks`
2. Packet Compiler uses these annotations as database query keys
3. Canon store returns matching structured data (character states, world rules, thread status, etc.)
4. Packet Compiler fills packet sections within token budget, by priority

### What L0 Retrieves From

- confirmed story bible entries
- confirmed character cards and character state summaries
- chapter summaries (Layer 0: per-chapter)
- volume summaries (Layer 1: per ~100 chapters)
- timeline events
- unresolved threads
- development chains

### Token Budget Mechanism

Each worker call has a finite context budget. Packet Compiler fills by priority:

```
P0 — Hard constraints (must include)
P1 — Current state (almost always include)
P2 — Recent context (important)
P3 — Distant reference (as needed)
P4 — Supplementary (fill if space remains)
```

See design spec for detailed breakdown per worker type.

### Why L0 Is Sufficient for MVP

At chapter 350 with three-layer summarization:

- 3 volume summaries + 3 recent chapter summaries + relevant character states + active threads
- Total: ~8000 chars ≈ ~12K tokens
- 12K tokens of canon context covers 350 chapters of history

The key insight: scene card annotations provide the "what to retrieve" signal that replaces semantic search in MVP.

## L1 — Semantic Retrieval (Post-MVP)

### Goal

Add embedding-based search to find conceptual connections that exact key matching cannot discover.

### Problems L1 Solves

- finding related foreshadowing/callback patterns across distant chapters
- discovering conceptually similar conflicts
- identifying thematic connections
- retrieving relevant development chain nodes when not explicitly tagged in scene cards

### Retrieval Readiness Criteria

Do not start L1 until:

- artifact schemas are stable
- chapter summaries exist and are reliable
- canonical read models are proven
- QA report schema is stable
- L0 packet assembly has been tested across 5+ chapters

### Migration Strategy

L0 and L1 coexist. L1 supplements L0, does not replace it:

```
Packet Compiler:
  1. L0: structured query by scene card keys (always runs)
  2. L1: semantic search for supplementary context (fills remaining budget)
  3. Merge and deduplicate
  4. Fill packet within token budget
```

## Retrieval Use Cases by Worker

### Chat Agent

Does not use retrieval directly. Receives project summary from canon store.

### Planner

Find dependencies, callbacks, unresolved threads, and development chain nodes relevant to next chapter planning.

### Writer

Retrieve canon and recent story state relevant to current scenes. Focus on character states, relationship states, and active threads for in-scene characters.

### QA

Retrieve evidence sources for potential conflicts. Compare draft claims against confirmed canon entries.

### Summarizer

Does not use retrieval. Receives full chapter text as direct input.
