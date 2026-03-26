# Product Requirements Document

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full v2 design spec.

## 1. Objective

Deliver a controllable, long-form serial fiction workbench that supports project-based fiction generation with dynamic ProjectTemplates, tiered character management, blueprint-driven chapter production, canon management, artifact editing, and QA review. The system is genre-agnostic; all format parameters (chapter length, volume size, structural conventions) are configurable per project via ProjectTemplate.

## 2. MVP Scope

### In Scope
- Project-based workspace driven by ProjectTemplate (genre, format params, character archetypes)
- Configurable format parameters (chapter length, volume size, etc.) — no hardcoded values
- User-provided API keys with model selection (simple/advanced modes)
- Chat-based conversation with Chat Agent (natural language + option buttons)
- Orchestrator (deterministic code) for workflow control
- Artifact panel for story bible, outline, character cards, blueprints, chapter drafts
- Character card system with tiers (core / important / episodic)
- Blueprint workflow: detailed blueprints confirmed before prose generation
- Per-scene rewriting without full chapter regeneration
- Streaming output with pause/stop/edit controls
- Impact analysis for reverse canon changes
- Artifact status lifecycle (draft -> reviewed -> confirmed -> locked)
- LLM Workers: Planner (expand outline OR brainstorm), Writer (strict blueprint execution), QA, Summarizer
- L0 structured canon recall with token budget (blueprint-driven exact queries)
- Canon confirmation flow with canon projection
- Chapter-level summarization on canonize
- Sidebar navigation (project -> chapters -> workspace)
- Orchestration Trace panel (debug view of agent collaboration)
- Token usage tracking per task
- Audit trail and version history
- Safety limits (max tasks, max tokens per action)

### Out of Scope
- L1 semantic retrieval / embedding / vector search (post-MVP)
- Volume-level summaries (post-MVP)
- External web research
- Collaborative real-time editing
- Public reader publishing page
- Mobile app native clients
- On-demand specialist agents (Divergent, Worldbuilder, etc.)

## 3. User Stories

### Project Setup
- As a user, I can create a new novel project from a ProjectTemplate with genre, tone, premise, and configurable format parameters.
- As a user, I can configure my API key and choose models for each worker.
- As a user, I can open one project in one dedicated workspace via sidebar navigation.
- As a user, I can adjust format parameters (chapter length, volume size) at any point during the project.

### Character Management
- As a user, I can create and edit character cards with structured fields (appearance, personality, goals, backstory).
- As a user, I can assign character tiers: core (always in context), important (included when relevant), or episodic (included only in their scenes).
- As a user, I can see how character state evolves across chapters via the character card timeline.
- As a user, I can promote or demote characters between tiers as the story evolves.

### Story Development
- As a user, I can describe my idea in natural language via chat.
- As a user, I can receive structured options rather than a single forced direction.
- As a user, I can edit generated world, character, and outline artifacts before confirming them.
- As a user, I can make lightweight creative requests (brainstorm names, tweak descriptions) without triggering the full pipeline.
- As a user, I can use the Planner in two modes: expand an existing outline OR brainstorm new directions.

### Blueprint Workflow
- As a user, I can request the system to generate a detailed blueprint for upcoming scenes.
- As a user, I can review blueprint details (per-scene goals, beats, emotional arcs, continuity anchors) before approving.
- As a user, I can edit individual blueprint sections before confirming.
- As a user, I can reject a blueprint and request regeneration with different parameters.
- As a user, I am guaranteed that no prose is generated until I confirm the blueprint.

### Chapter Production
- As a user, I can generate a chapter draft from a confirmed blueprint with streaming output.
- As a user, I can pause, stop, or intervene during streaming generation.
- As a user, I can rewrite individual scenes without regenerating the entire chapter.
- As a user, I can see QA results and decide whether to revise or accept.

### Canon Control
- As a user, I can confirm only the parts I want to become official canon.
- As a user, I can prevent draft or rejected ideas from polluting future generations.
- As a user, I can view impact analysis before reversing a previously confirmed canon decision, showing which downstream artifacts and chapters would be affected.

### Continuity
- As a user, I can see continuity warnings before publication.
- As a user, I can inspect why the system thinks something conflicts, with evidence references.

### Observability
- As a user (developer), I can see the Orchestration Trace showing how agents collaborated.
- As a user (developer), I can see token usage and cost per task.

## 4. Functional Requirements

### FR-1 ProjectTemplate System
- Define ProjectTemplate with genre, format parameters, character archetypes, and structural schemas
- All format values (chapter length, volume size, act structure) derived from template, not hardcoded
- Templates are extensible: users can create custom templates or modify existing ones
- Template drives artifact field schemas (e.g., what fields appear on a character card)

### FR-2 Character Card System
- Support character tiers: core, important, episodic
- Core characters always included in context packets; important characters included when relevant; episodic characters included only in their scenes
- Character cards track evolving state across chapters (appearance, relationships, goals, knowledge)
- Tier promotion/demotion with automatic context budget adjustment

### FR-3 Project Management
- Create, rename, archive project from ProjectTemplate
- Store project-level metadata including style profile and format parameters
- Store model configuration per project
- Load recent chapters and artifacts by project

### FR-4 Artifact System
- Support artifact types: story bible, world rules, character card, relationship map, outline, blueprint, chapter draft, QA report, style guide
- All artifacts must support: versioning, status lifecycle, edit, soft delete/archive

### FR-5 Chat Agent + Orchestrator
- Chat Agent (LLM): interpret user intent, classify input (casual/canon edit/pipeline task), generate user responses, handle lightweight creative requests directly
- Orchestrator (code): workflow state machine, packet compilation with token budget, task dispatch, canon gate enforcement, safety limits, audit logging

### FR-6 Blueprint Workflow
- Planner generates detailed blueprints (not simple scene cards) with per-scene goals, beats, emotional arcs, continuity anchors
- Planner operates in two modes: expand outline OR brainstorm
- User must confirm blueprint before Writer can execute
- Writer executes strictly from confirmed blueprint — no creative deviation beyond blueprint scope

### FR-7 Chapter Production
- Per-scene rewriting: rewrite individual scenes without regenerating entire chapter
- Streaming output: real-time token delivery with pause/stop/edit controls
- Writer only writes from confirmed blueprint + compiled packet
- QA review before canonization
- Revision loop: QA revise -> user decides -> new user action -> re-write (resets task counter)

### FR-8 Impact Analysis
- When user reverses a confirmed canon decision, compute and display downstream effects
- Show affected artifacts, chapters, character states, and unresolved threads
- Require explicit user confirmation before executing reverse changes

### FR-9 Canon Gate
- Only confirmed artifacts update canon stores
- Drafts and rejected artifacts must remain excluded from canon retrieval
- Canon projection includes Summarizer-generated chapter summaries

### FR-10 Auditability
- Log task execution with token/cost tracking, packet inputs, model outputs, review outcomes, confirm actions
- Display in Orchestration Trace panel

## 5. Non-Functional Requirements

- Project isolation
- Deterministic write rules for canon updates (Orchestrator is code, not LLM)
- Rollback support
- Traceability for QA findings (evidence references)
- Low-complexity MVP architecture
- Prompt/input size discipline (token budget mechanism)
- Safety: MAX_TASKS_PER_USER_ACTION=5, MAX_TOKENS_PER_TASK=50K, MAX_TOTAL_TOKENS_PER_ACTION=150K
- Streaming latency: first token within 2s of generation start

## 6. Acceptance Criteria

### MVP accepted when:
- A user can create a project from a ProjectTemplate with configurable format parameters
- A user can manage character cards with tier assignments (core/important/episodic)
- A user can complete one full blueprint-to-chapter cycle (blueprint -> confirm -> generate -> QA -> canonize)
- Blueprint confirmation is enforced before any prose generation
- Per-scene rewriting works without regenerating the full chapter
- Streaming output delivers tokens in real-time with pause/stop controls
- Draft artifacts do not automatically affect canon
- A confirmed character/world rule is reflected in future chapter packets
- Character tier determines context inclusion behavior
- QA can cite at least one evidence source when flagging continuity issues
- Impact analysis correctly identifies downstream effects of a reversed canon decision
- The system can sustain 5 sequential chapters with acceptable continuity under manual review
- Chapter 5 context packet correctly references settings confirmed in Chapter 1
- Orchestration trace shows all agent collaboration steps with token usage
- Draft and rejected content does not appear in subsequent packets
