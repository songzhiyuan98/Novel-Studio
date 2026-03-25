# Product Requirements Document

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.

## 1. Objective

Deliver a controllable, long-form writing environment that supports project-based fiction generation with canon management, artifact editing, chapter generation, and QA review. Target: Fanqie-level ultra-long serialized web novels (hundreds to thousands of chapters, 2000-3000 Chinese characters per chapter).

## 2. MVP Scope

### In Scope
- Project-based workspace with style profile configuration
- User-provided API keys with model selection (simple/advanced modes)
- Chat-based conversation with Chat Agent (natural language + option buttons)
- Orchestrator (deterministic code) for workflow control
- Artifact panel for story bible, outline, character cards, scene cards, chapter drafts
- Artifact status lifecycle (draft → reviewed → confirmed → locked)
- LLM Workers: Planner, Writer, QA, Summarizer
- L0 structured canon recall with token budget (scene-card-driven exact queries)
- Canon confirmation flow with canon projection
- Chapter-level summarization on canonize
- Orchestration Trace panel (debug view of agent collaboration)
- Token usage tracking per task
- Audit trail and version history
- Safety limits (max tasks, max tokens per action)

### Out of Scope
- L1 semantic retrieval / embedding / vector search (post-MVP)
- Volume-level summaries (post-MVP, not needed for 5-chapter test)
- External web research
- Collaborative real-time editing
- Public reader publishing page
- Mobile app native clients
- On-demand specialist agents (Divergent, Worldbuilder, etc.)

## 3. User Stories

### Project Setup
- As a user, I can create a new novel project with title, genre, tone, premise, and style profile.
- As a user, I can configure my API key and choose models for each worker.
- As a user, I can open one project in one dedicated tab/workspace.

### Story Development
- As a user, I can describe my idea in natural language via chat.
- As a user, I can receive structured options rather than a single forced direction.
- As a user, I can edit generated world, character, and outline artifacts before confirming them.
- As a user, I can make lightweight creative requests (brainstorm names, tweak descriptions) without triggering the full pipeline.

### Chapter Production
- As a user, I can ask the system to plan scenes for the next chapter.
- As a user, I can generate a 2000-3000 character chapter draft from approved scene cards.
- As a user, I can see QA results and decide whether to revise or accept.

### Canon Control
- As a user, I can confirm only the parts I want to become official canon.
- As a user, I can prevent draft or rejected ideas from polluting future generations.

### Continuity
- As a user, I can see continuity warnings before publication.
- As a user, I can inspect why the system thinks something conflicts, with evidence references.

### Observability
- As a user (developer), I can see the Orchestration Trace showing how agents collaborated.
- As a user (developer), I can see token usage and cost per task.

## 4. Functional Requirements

### FR-1 Project Management
- Create, rename, archive project
- Store project-level metadata including style profile
- Store model configuration per project
- Load recent chapters and artifacts by project

### FR-2 Artifact System
- Support artifact types: story bible, world rules, character card, relationship map, outline, scene card, chapter draft, QA report, style guide
- All artifacts must support: versioning, status lifecycle, edit, soft delete/archive

### FR-3 Chat Agent + Orchestrator
- Chat Agent (LLM): interpret user intent, classify input (casual/canon edit/pipeline task), generate user responses, handle lightweight creative requests directly
- Orchestrator (code): workflow state machine, packet compilation with token budget, task dispatch, canon gate enforcement, safety limits, audit logging

### FR-4 Chapter Workflow
- Scene planning before chapter drafting
- Writer only writes from scene card + compiled packet
- QA review before canonization
- Revision loop: QA revise → user decides → new user action → re-write (resets task counter)

### FR-5 Canon Gate
- Only confirmed artifacts update canon stores
- Drafts and rejected artifacts must remain excluded from canon retrieval
- Canon projection includes Summarizer-generated chapter summaries

### FR-6 Auditability
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

## 6. Acceptance Criteria

### MVP accepted when:
- A user can complete one full end-to-end chapter cycle
- Draft artifacts do not automatically affect canon
- A confirmed character/world rule is reflected in future chapter packets
- QA can cite at least one evidence source when flagging continuity issues
- The system can sustain 5 sequential chapters with acceptable continuity under manual review
- Chapter 5 context packet correctly references settings confirmed in Chapter 1
- Orchestration trace shows all agent collaboration steps with token usage
- Draft and rejected content does not appear in subsequent packets
