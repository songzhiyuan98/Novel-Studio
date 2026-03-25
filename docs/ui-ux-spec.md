# UI / UX Specification

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.

## UX Goal

Make the product feel like a controlled writers' room rather than an endless chatbot. The user interacts via natural language + option buttons. The user never needs to know about agent internals.

## Main Layout

### Left: Project / Chapter Rail
- project selector tabs
- chapter timeline
- lazy-load older chapters on upward scroll
- chapter status badges

### Center: Chat Feed
- user messages
- Chat Agent responses
- inline option cards (A/B/C choices)
- task progress blocks
- artifact creation announcements
- lightweight action chips:
  - Confirm
  - Edit
  - Rewrite
  - Compare
  - Ask Why

### Right: Artifact Panel
Tabs:
- Bible
- Characters
- Outline
- Scene Cards
- QA
- Issues

### Bottom / Collapsible: Orchestration Trace Panel
- expandable per-action trace view
- shows: Chat Agent intent classification, Orchestrator decisions, worker dispatches
- per-step: actor, action, tokens used, cost, duration
- color-coded by actor (Chat Agent, Orchestrator, Planner, Writer, QA, Summarizer)

## Key Screens

### 1. Project Home
- title
- premise
- style profile
- model configuration summary
- project health summary
- open issues count
- latest confirmed chapter
- total token usage / cost summary

### 2. Model Configuration
- simple mode: one API key + provider selector
- advanced mode: per-worker model/provider/key configuration
- test connection button
- recommended defaults display

### 3. Artifact Editor
- JSON-backed but user-friendly form/text hybrid
- version selector
- compare against prior version (later priority)
- status badge (draft, reviewed, confirmed, locked)
- confirm/reject controls

### 4. Chapter Draft View
- chapter text
- scene anchors
- QA side notes
- rewrite controls
- confirm button gated by QA state

### 5. Compare Modal (later priority)
- side-by-side diff between artifact versions
- visual highlight of inserted/removed text
- retain choice actions

## UX Rules

- the system must always show whether content is draft, reviewed, or canon
- confirmed canon must be visually distinct from temporary drafts
- actions should be attached to artifacts, not buried in chat
- chat is for negotiation and lightweight creative interaction; artifacts are for stateful story objects
- Orchestration Trace is collapsible but always accessible for debugging

## MVP UI Components (Priority Order)

### High Priority (build alongside core pipeline)
- chat interface with natural language input
- Orchestration Trace panel (debug view)
- confirm / reject buttons
- project setup page (title, genre, tone, premise, style profile)
- model configuration page

### Medium Priority
- artifact list + detail pane
- basic chapter view
- QA report viewer

### Low Priority (later)
- chapter timeline with lazy loading
- diff / compare modal
- relationship graph visualization
- pacing chart
- unresolved thread board
- canon provenance inspector
