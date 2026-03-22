# PM Overview

## Product Goal

Build an interactive multi-agent writing room for long-form fiction where the user acts as creative director, not full-time author. The system must help the user create, revise, and serialize story artifacts while preserving canon and avoiding context drift.

## Core Problem

Current AI writing tools are strong at one-off generation but weak at long-form narrative control. Common failures:

- lore drift
- character inconsistency
- broken pacing
- forgotten foreshadowing
- inability to safely revise earlier decisions
- lack of structured memory

## Product Thesis

Long-form fiction generation should be treated as a **stateful production workflow**, not a single chat thread.

Novel Studio solves this by combining:

- project-scoped story memory
- artifact-first editing
- canon admission control
- task-specific context isolation
- multi-step generation with QA gates

## Product Principles

1. **Canon Gate**
   Only user-confirmed content enters official canon.

2. **Context Isolation**
   Workers receive curated packets, not full chat history.

3. **Artifact-First**
   Story elements are stored as editable artifacts with status and versions.

4. **Task-on-Demand**
   Most agents are invoked only when needed.

5. **Triage Router**
   When ambiguity appears, the system chooses one of three paths:
   - resolve internally
   - ask the user a minimal question set
   - mark provisional and continue within constraints

6. **Quality Gate**
   Chapter publication requires style and continuity review.

## Target Users

### Primary
- hobbyist novel writers
- webnovel / serialized fiction creators
- idea-rich but structure-poor creators
- users who prefer decision-making over drafting prose

### Secondary
- collaborative co-writers
- plot-heavy storytellers
- fandom / romance / progression fantasy authors

## MVP Success Definition

A single user can:

- create a project
- define initial premise and style preferences
- generate/edit story bible, character cards, outline, scene cards
- generate a chapter draft
- receive QA feedback
- confirm approved material into canon
- continue this loop for multiple chapters with stable continuity

## Non-Goals for MVP

- external knowledge research automation
- multi-user simultaneous editing
- image generation / comics pipeline
- full publishing platform
- fully autonomous novel writing without user decisions

