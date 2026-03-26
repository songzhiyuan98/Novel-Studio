# PM Overview

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full v2 design spec.

## Product Goal

Build an **AI-powered serial fiction workbench** for ultra-long serialized web novels (Fanqie/番茄-level, hundreds to thousands of chapters) where the user acts as creative director, not full-time author. The system must help the user create, revise, and serialize story artifacts while preserving canon and avoiding context drift.

The system is **genre-agnostic** — a dynamic ProjectTemplate drives all genre-specific schemas, format parameters, and character archetypes. No format values (chapter length, volume size, etc.) are hardcoded; everything is configurable per project.

## Core Problem

Current AI writing tools are strong at one-off generation but weak at long-form narrative control. Common failures:

- lore drift
- character inconsistency
- broken pacing
- forgotten foreshadowing
- inability to safely revise earlier decisions
- lack of structured memory
- context window limitations at scale (100s of chapters)

## Product Thesis

Long-form fiction generation should be treated as a **stateful production workflow**, not a single chat thread.

Novel Studio solves this by combining:

- project-scoped story memory with hierarchical summarization
- artifact-first editing
- canon admission control
- task-specific context isolation (compiled packets, not chat history)
- multi-step generation with QA gates
- deterministic orchestration (code, not LLM) for reliability
- dynamic ProjectTemplate for genre-agnostic schema generation
- blueprint confirmation before prose generation

## Product Principles

1. **Canon Gate**
   Only user-confirmed content enters official canon.

2. **Context Isolation**
   LLM workers receive curated packets compiled by the Orchestrator, not full chat history. Workers are stateless single-shot calls.

3. **Artifact-First**
   Story elements are stored as editable artifacts with status and versions.

4. **Task-on-Demand**
   LLM workers are invoked only when needed by the Orchestrator.

5. **Triage Router**
   When ambiguity appears, the Orchestrator chooses one of three paths:
   - Route A: resolve internally using existing canon (Orchestrator)
   - Route B: ask the user a minimal question set via Chat Agent
   - Route C: mark provisional and continue within constraints (Orchestrator)

6. **Quality Gate**
   Chapter publication requires QA review (style, continuity, motivation).

7. **Deterministic Orchestration**
   The Orchestrator is code, not an LLM. Workflow routing, state machine transitions, and packet assembly are deterministic and testable.

8. **User Controls Everything**
   The user interacts via natural language + buttons. All major decisions (confirm, reject, revise) require explicit user action. The system never autonomously admits content into canon.

9. **Dynamic Schemas**
   The system is genre-agnostic. A ProjectTemplate defines genre-specific field schemas, character archetypes, format parameters, and structural conventions. No genre logic is hardcoded — templates drive everything.

10. **Blueprint Before Prose**
    The user must review and confirm a detailed blueprint before any prose generation begins. Blueprints replace simple scene cards and include per-scene goals, beats, emotional arcs, and continuity anchors. The Writer executes strictly from confirmed blueprints.

## Target Users

### Primary

- hobbyist novel writers
- webnovel / serialized fiction creators (especially Chinese web novel authors)
- idea-rich but structure-poor creators
- users who prefer decision-making over drafting prose

### Secondary

- collaborative co-writers
- plot-heavy storytellers
- fandom / romance / progression fantasy authors

## MVP Success Definition

A single user can:

- create a project from a ProjectTemplate with configurable format parameters
- configure API key and choose models for each worker
- generate/edit story bible, character cards (with tiers), outline, blueprints
- review and confirm detailed blueprints before chapter generation
- generate a chapter draft from confirmed blueprints (with streaming output)
- rewrite individual scenes without regenerating the full chapter
- receive QA feedback with evidence references
- confirm approved material into canon
- view impact analysis when reversing earlier canon decisions
- continue this loop for 5+ chapters with stable continuity
- observe the full agent collaboration process via Orchestration Trace

## Non-Goals for MVP

- L1 semantic retrieval / embedding / vector search
- Volume-level summaries
- External knowledge research automation
- Multi-user simultaneous editing
- Image generation / comics pipeline
- Full publishing platform
- Fully autonomous novel writing without user decisions
- On-demand specialist agents (Divergent, Worldbuilder, etc.)
