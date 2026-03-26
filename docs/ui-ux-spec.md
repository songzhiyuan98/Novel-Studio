# UI / UX Specification

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full v2 design spec.

## UX Goal

Make the product feel like a controlled writers' room rather than an endless chatbot. The user interacts via natural language + option buttons. The user never needs to know about agent internals. Navigation follows a clear hierarchy: project -> chapters -> workspace.

## Main Layout

### Left: Sidebar Navigation
- **Project Selector** — switch between projects
- **Chapter List** — ordered chapter timeline within current project
  - chapter status badges (draft / in-progress / confirmed / locked)
  - lazy-load older chapters on upward scroll
  - click to navigate to chapter workspace
- **Quick Access** — links to story bible, character panel, outline, settings
- Collapsible for more workspace area

### Center: Workspace Area
Context-sensitive based on sidebar selection:

#### Chat Feed (default)
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

#### Blueprint View
- detailed blueprint display with per-scene sections
- each section shows: scene goal, beats, emotional arc, continuity anchors
- inline edit controls per section
- confirm / reject / regenerate controls
- visual indicator: "Blueprint must be confirmed before generation"
- diff view when blueprint is regenerated

#### Streaming Generation View
- real-time token output as prose is generated
- per-scene progress indicator
- controls:
  - **Pause** — temporarily halt generation (resume later)
  - **Stop** — cancel generation, keep what was produced
  - **Edit** — switch to edit mode on already-generated content
- scene boundary markers in the output stream

### Right: Artifact Panel
Tabs:
- Bible
- Characters
- Outline
- Blueprints
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
- ProjectTemplate summary (genre, format params)
- style profile
- model configuration summary
- project health summary
- open issues count
- latest confirmed chapter
- total token usage / cost summary
- character count summary (core / important / episodic)

### 2. Model Configuration
- simple mode: one API key + provider selector
- advanced mode: per-worker model/provider/key configuration
- test connection button
- recommended defaults display

### 3. Character Panel (Tiered Cards)
- **Tab view by tier**: Core | Important | Episodic
- Each character card shows:
  - name, portrait placeholder, role
  - tier badge (core / important / episodic)
  - key attributes (appearance, personality, goals, backstory)
  - current state summary (evolves per chapter)
  - relationship links to other characters
- **Card actions**: edit, promote/demote tier, view history, archive
- **Tier summary bar**: shows context budget allocation per tier
- **Add character**: manual creation or extract from confirmed content

### 4. Blueprint View
- chapter number and title
- per-scene blueprint sections:
  - scene number and title
  - POV character
  - scene goal / purpose
  - beat list (ordered story beats)
  - emotional arc notation
  - continuity anchors (references to canon items)
  - characters involved (with tier indicators)
- section-level actions: edit, regenerate this section, approve
- full blueprint actions: confirm all, reject all, regenerate all
- status indicator: draft / confirmed
- warning if any continuity anchor references stale canon

### 5. Artifact Editor
- JSON-backed but user-friendly form/text hybrid
- version selector
- compare against prior version (later priority)
- status badge (draft, reviewed, confirmed, locked)
- confirm/reject controls

### 6. Chapter Draft View
- chapter text with scene boundary markers
- scene anchors with per-scene rewrite controls
- QA side notes
- streaming indicator (when generation is active)
- confirm button gated by QA state

### 7. Impact Analysis Modal
- triggered when user attempts to reverse a confirmed canon decision
- displays:
  - the canon item being reversed
  - list of affected downstream artifacts (with links)
  - list of affected chapters
  - affected character states
  - affected unresolved threads
- severity indicator per affected item (critical / warning / info)
- actions:
  - **Proceed** — execute the reversal and mark affected items for review
  - **Cancel** — abort the reversal
  - **Review individually** — step through affected items one by one

### 8. Compare Modal (later priority)
- side-by-side diff between artifact versions
- visual highlight of inserted/removed text
- retain choice actions

## UX Rules

- the system must always show whether content is draft, reviewed, or canon
- confirmed canon must be visually distinct from temporary drafts
- actions should be attached to artifacts, not buried in chat
- chat is for negotiation and lightweight creative interaction; artifacts are for stateful story objects
- Orchestration Trace is collapsible but always accessible for debugging
- blueprint must show a clear "not yet confirmed" state before generation is allowed
- streaming generation must always show progress and provide interrupt controls
- character tier must be visible on every character reference throughout the UI
- impact analysis must be shown before any canon reversal is executed

## MVP UI Components (Priority Order)

### High Priority (build alongside core pipeline)
- sidebar navigation (project -> chapters -> workspace)
- chat interface with natural language input
- blueprint view with confirm/reject controls
- character panel with tiered cards
- Orchestration Trace panel (debug view)
- confirm / reject buttons
- project setup page (ProjectTemplate selection, format params)
- model configuration page

### Medium Priority
- streaming generation view with pause/stop/edit
- artifact list + detail pane
- basic chapter view with per-scene rewrite controls
- QA report viewer
- impact analysis modal

### Low Priority (later)
- chapter timeline with lazy loading
- diff / compare modal
- relationship graph visualization
- pacing chart
- unresolved thread board
- canon provenance inspector
