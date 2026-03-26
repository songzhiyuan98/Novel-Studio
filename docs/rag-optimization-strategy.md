# RAG Optimization Strategy

## Retrieval Philosophy

Novel Studio should not use generic chatbot RAG. It needs **story-state retrieval**.

## Retrieval Layers

### Layer 1 — Structured Filters

Use metadata first:

- project_id
- confirmed_only
- artifact_type
- chapter_range
- related_characters
- status

### Layer 2 — Keyword Search

Find exact names and terms:

- characters
- locations
- factions
- power systems
- item names

### Layer 3 — Semantic Search

Find conceptually related items:

- similar conflict patterns
- related emotional states
- linked foreshadowing/payoff chains
- planning dependencies

### Layer 4 — Recency / Priority Boost

Boost:

- latest relevant confirmed updates
- unresolved threads close to payoff
- current volume / current chapter range

## What to Chunk

Prefer chunking by semantic unit, not blind token windows.

Recommended retrievable units:

- one story bible entry
- one character card section
- one chapter summary
- one timeline event
- one unresolved thread
- one development chain node
- one QA issue record

## What Not to Retrieve by Default

- full raw chapter text for every task
- rejected artifacts
- archived drafts
- provisional notes unless task explicitly requests them

## Packet Assembly Strategy

For each task, compose sections in priority order:

1. hard constraints
2. required canon
3. current chapter objective
4. current character/relationship states
5. relevant timeline and unresolved threads
6. optional reference snippets

## Quality Metrics

Measure retrieval success using:

- recall of required canon facts
- precision of included context
- token efficiency
- continuity violation rate after generation
- QA evidence hit rate

## Test Plan

### Dataset

Create one sample project with:

- 10+ chapters
- 6+ characters
- 10+ world rules
- 10+ timeline events
- 8+ unresolved threads
- 6+ development chains

### Evaluate Two Modes

- static packet mode
- retrieval-assisted mode

### Compare On

- number of lore errors
- number of motivation inconsistencies
- number of missed callbacks
- packet token size
- human preference score

## Optimization Ideas for Later

- summary refresh jobs after canonization
- retrieval caching per chapter planning cycle
- dependency-aware reranking
- QA-triggered retrieval expansion
- dual index: semantic + exact-match
