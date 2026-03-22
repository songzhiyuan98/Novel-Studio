# Product Requirements Document

## 1. Objective

Deliver a controllable, long-form writing environment that supports project-based fiction generation with canon management, artifact editing, chapter generation, and QA review.

## 2. MVP Scope

### In Scope
- Project-based workspace
- Chat-based conversation with Producer
- Artifact panel for story bible, outline, character cards, scene cards, chapter drafts
- Chapter timeline with lazy loading
- Artifact status lifecycle
- Producer orchestration
- Planner functionality (may combine evaluator + plotting in MVP)
- Writer generation
- QA review
- Canon confirmation flow
- Audit trail and version history

### Out of Scope
- full RAG/hybrid retrieval engine
- external web research
- collaborative real-time editing
- public reader publishing page
- mobile app native clients

## 3. User Stories

### Project Setup
- As a user, I can create a new novel project with title, genre, tone, and premise.
- As a user, I can open one project in one dedicated tab/workspace.

### Story Development
- As a user, I can describe my idea in natural language.
- As a user, I can receive structured options rather than a single forced direction.
- As a user, I can edit generated world, character, and outline artifacts before confirming them.

### Chapter Production
- As a user, I can ask the system to plan scenes for the next chapter.
- As a user, I can generate a chapter draft from approved scene cards.
- As a user, I can compare revisions and choose one.

### Canon Control
- As a user, I can confirm only the parts I want to become official canon.
- As a user, I can prevent draft or rejected ideas from polluting future generations.

### Continuity
- As a user, I can see continuity warnings before publication.
- As a user, I can inspect why the system thinks something conflicts.

## 4. Functional Requirements

### FR-1 Project Management
- Create, rename, archive project
- Store project-level metadata
- Load recent chapters and artifacts by project

### FR-2 Artifact System
- Support artifact types:
  - story bible
  - world rules
  - character card
  - relationship map
  - outline
  - scene card
  - chapter draft
  - QA report
- All artifacts must support:
  - versioning
  - status
  - edit
  - soft delete/archive
  - diff against prior version

### FR-3 Producer Orchestration
- Interpret user intent
- Select next workflow phase
- Build context packet
- Request minimal missing information
- Dispatch tasks to workers
- Aggregate worker results into user-facing outputs

### FR-4 Chapter Workflow
- Scene planning before chapter drafting
- Writer only writes from scene card + packet
- QA review before canonization/publication

### FR-5 Canon Gate
- Only confirmed artifacts update canon stores
- Drafts and rejected artifacts must remain excluded from canon retrieval

### FR-6 Auditability
- Log task execution, packet inputs, model outputs, review outcomes, confirm actions

## 5. Non-Functional Requirements

- Project isolation
- deterministic write rules for canon updates
- rollback support
- traceability for QA findings
- low-complexity MVP architecture
- prompt/input size discipline

## 6. Acceptance Criteria

### MVP accepted when:
- a user can complete one full end-to-end chapter cycle
- draft artifacts do not automatically affect canon
- a confirmed character/world rule is reflected in future chapter packets
- QA can cite at least one evidence source when flagging continuity issues
- the system can sustain 5 sequential chapters with acceptable continuity under manual review

