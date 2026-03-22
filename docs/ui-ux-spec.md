# UI / UX Specification

## UX Goal

Make the product feel like a controlled writers' room rather than an endless chatbot.

## Main Layout

### Left: Project / Chapter Rail
- project selector tabs
- chapter timeline
- lazy-load older chapters on upward scroll
- chapter status badges

### Center: Producer Chat Feed
- user messages
- Producer responses
- inline option cards
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

## Key Screens

### 1. Project Home
- title
- premise
- style profile
- project health summary
- open issues count
- latest confirmed chapter

### 2. Artifact Editor
- JSON-backed but user-friendly form/text hybrid
- version selector
- compare against prior version
- status badge
- confirm/reject controls

### 3. Chapter Draft View
- chapter text
- scene anchors
- QA side notes
- rewrite controls
- confirm button gated by QA state

### 4. Compare Modal
- side-by-side diff between artifact versions
- visual highlight of inserted/removed text
- retain choice actions

## UX Rules

- the system must always show whether content is draft, reviewed, or canon
- confirmed canon must be visually distinct from temporary drafts
- actions should be attached to artifacts, not buried in chat
- chat is for negotiation; artifacts are for stateful story objects

## MVP Components
- project shell
- chat panel
- artifact list + detail pane
- chapter timeline
- confirm/reject buttons
- diff modal
- QA report viewer

## Nice-to-Have Later
- relationship graph visualization
- pacing chart
- unresolved thread board
- canon provenance inspector

