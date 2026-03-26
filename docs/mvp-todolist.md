# MVP Implementation Todo List

> See also: `docs/superpowers/specs/2026-03-25-design-v2.md` for v2 design spec.

## MVP Goal

User can create a project from a ProjectTemplate, manage tiered characters, confirm detailed blueprints, and write 5 sequential chapters with configurable format parameters — without continuity breakdown.

## Milestone 0 — Specs Freeze ✅

- [x] finalize artifact taxonomy
- [x] finalize state machines
- [x] define packet schemas
- [x] define worker output schemas
- [x] define chapter lifecycle
- [x] define canon projection rules
- [x] define architecture: Chat Agent + Orchestrator + Workers
- [x] define RAG strategy: L0 structured recall
- [x] define summarization: canonize-time compression + three layers
- [x] define safety mechanisms: hard limits + deterministic orchestration
- [x] define model selection: user-provided API keys
- [x] define v2 spec: ProjectTemplate, character tiers, blueprint workflow, impact analysis
- [x] define per-milestone test criteria and acceptance standards

---

## Milestone 1 — Monorepo + Infrastructure

**Tasks:**

- [ ] initialize monorepo with pnpm workspace
- [ ] add TypeScript workspace config (tsconfig base + per-package extends)
- [ ] create apps/web (Next.js)
- [ ] create apps/api (Hono)
- [ ] create packages/core
- [ ] create packages/orchestrator
- [ ] create packages/prompts
- [ ] create packages/llm-adapter (Vercel AI SDK)
- [ ] add ESLint + Prettier + Vitest baseline

**Acceptance Criteria:**

- [ ] `pnpm install` succeeds with no errors
- [ ] `pnpm -r build` compiles all packages
- [ ] packages/core can be imported from apps/api (`import { ... } from '@novel-studio/core'`)
- [ ] `pnpm test` runs a placeholder test in each package
- [ ] ESLint + Prettier enforce on save / pre-commit

**Test Method:** `pnpm install && pnpm -r build && pnpm test` — all pass.

---

## Milestone 2 — Data Layer + Schemas

**Tasks:**

- [ ] set up PostgreSQL + Drizzle ORM in apps/api
- [ ] define schema migrations for ALL entities:
  - ProjectTemplate, Project, ModelConfig
  - Artifact (with scene_segments_json), Chapter, ChapterSummary, VolumeSummary
  - CharacterState (base + dimensions_json), RelationshipState (base_scores + custom_scores)
  - StoryBibleEntry, TimelineEvent, UnresolvedThread, DevelopmentChain
  - Task (with token tracking), Issue (open issue_type), AuditLog
  - ConversationMessage
- [ ] implement Repository layer (CRUD for each entity)
- [ ] implement Artifact status state machine (draft→confirmed→locked, draft→rejected→archived)
- [ ] implement Chapter status state machine
- [ ] seed script: create example project + ProjectTemplate + 3 characters + sample world rules

**Acceptance Criteria:**

- [ ] `pnpm db:migrate` creates all tables without error
- [ ] seed script creates a complete example project
- [ ] CRUD works for: Project, ProjectTemplate, Artifact, Chapter, CharacterState, RelationshipState
- [ ] CharacterState.dimensions_json stores different schemas (e.g., realm for xianxia, net_worth for billionaire)
- [ ] Artifact status machine: draft→confirmed OK, confirmed→draft REJECTED
- [ ] Foreign key constraints work: cannot create Artifact without valid project_id
- [ ] AuditLog records are created on key operations

**Test Method:**

```
unit: Repository CRUD tests (create, read, update, delete for each entity)
unit: status machine transition tests (5 legal + 5 illegal cases)
integration: seed script → query back all data → verify correctness
```

---

## Milestone 3 — LLM Adapter + Streaming

**Tasks:**

- [ ] implement LLMAdapter unified interface (via Vercel AI SDK)
- [ ] support OpenAI provider (GPT-4o, GPT-4o-mini)
- [ ] implement per-worker model config resolution (read from ModelConfig table)
- [ ] implement simple mode (one key → auto-select models) and advanced mode (per-worker config)
- [ ] implement token counting + cost estimation
- [ ] implement streaming output (SSE stream)
- [ ] implement timeout (30s) + retry (1 attempt) mechanism
- [ ] implement error handling (invalid key, rate limit, network timeout)

**Acceptance Criteria:**

- [ ] can call GPT-4o-mini with a simple prompt → receive text response
- [ ] can call GPT-4o-mini with streaming → receive ≥5 chunks
- [ ] token count result matches OpenAI usage field (±10%)
- [ ] cost estimation returns reasonable USD value
- [ ] simple mode: one API key → all workers use same provider
- [ ] advanced mode: different models per worker
- [ ] invalid API key → returns clear auth error (not crash)
- [ ] network timeout → retries once, then returns error

**Test Method:**

```
unit: mock provider → test token counting logic, cost calculation
integration (requires API key):
  - call GPT-4o-mini → verify response
  - stream call → verify chunk count ≥ 5
  - bad key → verify error message
```

---

## Milestone 4 — Orchestrator Core + Packet Compiler

**Tasks:**

- [ ] implement workflow state machine (plan → blueprint_confirm → write → qa → canonize)
- [ ] implement intent classification contract (Chat Agent → Orchestrator interface)
- [ ] implement Packet Compiler:
  - token budget priority filling (P0→P1→P2→P3→P4)
  - tier-aware character inclusion (core=always, important=relevant, episodic=scene-only)
  - per-worker packet differentiation (Planner/Writer/QA/Summarizer get different data)
- [ ] implement task dispatcher (calls LLM Adapter, records results)
- [ ] implement safety limits: MAX_TASKS_PER_USER_ACTION=5, MAX_TOKENS_PER_TASK=50K
- [ ] persist Task records with tokens_input, tokens_output, cost_usd, duration_ms
- [ ] implement canon gate: only confirmed artifacts appear in packets

**Acceptance Criteria:**

- [ ] state machine: plan→write OK, write→plan REJECTED (unless user-triggered revise)
- [ ] Planner packet contains: world rules, character arcs, outline, unresolved threads
- [ ] Writer packet contains: blueprint, character states, recent summaries, style profile
- [ ] core characters always in packet; episodic characters only in their scene
- [ ] packet total tokens ≤ configured budget
- [ ] 6th task dispatch in same user action → REJECTED with "需要用户操作"
- [ ] Task record has complete token/cost data after completion
- [ ] draft artifact NOT in packet; confirmed artifact IS in packet

**Test Method:**

```
unit: state machine transition matrix (legal/illegal transitions)
unit: packet compiler with mock data → verify output format, token count, tier filtering
unit: safety limit → dispatch 6 tasks → 6th rejected
integration: create project + 5 characters (2 core, 2 important, 1 episodic)
  → compile Writer packet → verify only relevant characters included
  → create draft artifact → verify NOT in packet
  → confirm artifact → verify IS in packet
```

---

## Milestone 5 — Chat Agent + All Workers

**Tasks:**

- [ ] Chat Agent prompt with intent classification (casual / canon_edit / pipeline_task)
- [ ] conversation history management (rolling window 20 turns + older turns compressed)
- [ ] lightweight creative response (casual → no worker dispatch, direct LLM reply)
- [ ] pipeline task routing (Chat Agent → Orchestrator)
- [ ] canon edit routing (Chat Agent → Orchestrator)
- [ ] Planner prompt + Zod output parser (Mode A: expand outline, Mode B: brainstorm 2-3 options)
- [ ] Writer prompt + Zod output parser (strict blueprint execution, output scene_segments)
- [ ] QA prompt + Zod output parser (decision + issues + blueprint_coverage + character_compliance)
- [ ] Summarizer prompt + Zod output parser (summary + character_deltas + thread changes)
- [ ] retry on invalid output (1 attempt)

**Acceptance Criteria:**

- [ ] "帮我想个名字" → classified as casual, no Orchestrator call
- [ ] "开始写下一章" → classified as pipeline_task, routed to Orchestrator
- [ ] "把林凡改名" → classified as canon_edit, routed to Orchestrator
- [ ] Planner Mode A: given outline → returns blueprint with ≥3 scenes, each with objective
- [ ] Planner Mode B: no outline → returns 2-3 direction options
- [ ] Writer: given blueprint → returns chapter text with scene_segments matching blueprint scenes
- [ ] Writer: streams output token by token
- [ ] QA: given chapter with obvious contradiction → returns decision=revise with ≥1 issue
- [ ] QA: returns blueprint_coverage_report showing which objectives met/missed
- [ ] Summarizer: returns summary <500 chars + character_deltas + thread changes
- [ ] all outputs pass Zod validation
- [ ] invalid LLM output → retries once → if still invalid, returns error

**Test Method:**

```
unit: Zod schema validation (3 valid + 3 invalid mock outputs per worker)
unit: intent classification (10 test inputs)
integration (requires API key):
  - Planner: give outline + canon → verify blueprint structure
  - Writer: give blueprint → verify text >1000 chars, scene count matches
  - QA: give chapter with contradiction → verify issue detected
  - Summarizer: give chapter text → verify summary length
```

---

## Milestone 6 — Blueprint + Chapter Complete Flow

**Tasks:**

- [ ] Blueprint schema (per-scene: goals, beats, dialogue, combat, reversals, character entrances)
- [ ] Blueprint generation flow: user input → Planner → blueprint artifact
- [ ] Blueprint confirmation gate: Writer dispatch BLOCKED without confirmed blueprint
- [ ] Writer execution: confirmed blueprint → chapter draft with scene_segments
- [ ] streaming output to client (SSE)
- [ ] QA auto-dispatch after Writer completes
- [ ] QA checks: continuity + blueprint coverage + character card compliance
- [ ] per-scene rewrite: rewrite scene N only, merge back into chapter
- [ ] chapter status updates: planned → drafted → reviewed → user_approved
- [ ] revision loop: QA revise → user clicks "重写" (new user action) → re-write affected scenes

**Acceptance Criteria:**

- [ ] Planner generates blueprint with ≥3 scenes, each with objective and beats
- [ ] calling Writer without confirmed blueprint → REJECTED by Orchestrator
- [ ] confirming blueprint → Writer generates chapter → text split into scene_segments
- [ ] streaming works: client receives chunks in real-time
- [ ] QA automatically runs after Writer, returns coverage report
- [ ] QA revise: user selects scene 2 to rewrite → only scene 2 regenerated
- [ ] after per-scene rewrite: scene 1 and 3 unchanged, scene 2 updated
- [ ] QA re-runs on updated chapter → pass
- [ ] all Task records have complete token/cost data
- [ ] chapter status transitions correctly through the flow

**Test Method:**

```
end-to-end (requires API key):
  1. create project + template + characters
  2. give Planner outline → get blueprint
  3. confirm blueprint
  4. Writer generates chapter (streaming)
  5. QA reviews → simulate revise on scene 2
  6. rewrite scene 2 only
  7. QA re-reviews → pass
  8. verify Task records: 4 tasks total (plan, write, qa, rewrite)
```

---

## Milestone 7 — Canon Projection + Summarization

**Tasks:**

- [ ] canon projection service: triggered on chapter confirm
- [ ] Summarizer auto-dispatch on confirm → structured chapter summary
- [ ] parse Summarizer output → update canon stores:
  - ChapterSummary (create)
  - CharacterState (incremental update from character_deltas)
  - RelationshipState (incremental update)
  - TimelineEvent (insert new events)
  - UnresolvedThread (status changes: new/advanced/resolved)
  - DevelopmentChain (advance nodes)
- [ ] character lifecycle: archive episodic characters flagged by Summarizer
- [ ] provenance: each canon update links to source artifact_id
- [ ] volume boundary check: if chapter_count % volume_size == 0 → trigger volume summary (post-MVP, stub only)
- [ ] audit log: chapter_canonized + canon_projected events

**Acceptance Criteria:**

- [ ] confirm chapter → Summarizer auto-called → ChapterSummary created
- [ ] character_delta {character: "林凡", change: "突破炼气四层"} → CharacterState updated
- [ ] new thread created by Summarizer → UnresolvedThread record created
- [ ] resolved thread → UnresolvedThread status = resolved
- [ ] episodic character flagged for archive → archived_at set
- [ ] every canon update has source_artifact_id (provenance)
- [ ] AuditLog contains chapter_canonized + canon_projected events
- [ ] next chapter packet includes: this chapter's summary + updated character states
- [ ] draft artifacts still NOT in packet after projection

**Test Method:**

```
integration:
  1. create project with characters (trust=50)
  2. write and confirm chapter 1
  3. Summarizer returns character_delta: trust+20
  4. query CharacterState → trust=70 ✓
  5. create episodic character, confirm chapter → verify archived
  6. compile next chapter packet → verify includes chapter 1 summary + updated states
  7. verify AuditLog has correct events
```

---

## Milestone 8 — API Layer + MVP Frontend

**Tasks:**

- [ ] API endpoints:
  - ProjectTemplate CRUD
  - Project CRUD (references template)
  - ModelConfig GET/PUT
  - POST /chat (with SSE streaming)
  - GET /chat/history
  - Artifact CRUD + confirm/reject
  - Chapter query + GET summary
  - POST /chapters/:id/scenes/:index/rewrite
  - Canon store queries (characters by tier, world-rules, timeline, threads, chains)
  - Task/Audit query
- [ ] Frontend:
  - sidebar navigation (project list → chapter list)
  - project setup (select template + configure API key)
  - chat interface (natural language input + streaming display)
  - character panel (tiered cards: core/important/episodic, view/edit)
  - blueprint view (per-scene confirm/edit/reject)
  - streaming generation view (progress indicator, pause/stop)
  - confirm/reject buttons on artifacts and chapters
  - orchestration trace panel (collapsible, shows actor/tokens/cost per step)
  - chapter list: click confirmed chapter → read-only view

**Acceptance Criteria:**

- [ ] browser: create project → select template → fill API key → success
- [ ] browser: type message → receive streaming response
- [ ] browser: see character panel with cards grouped by tier
- [ ] browser: see Planner-generated blueprint → confirm per-scene
- [ ] browser: confirmed blueprint → Writer streams chapter text
- [ ] browser: see QA report after generation
- [ ] browser: click Confirm → chapter confirmed
- [ ] browser: orchestration trace shows every step with tokens + cost
- [ ] browser: sidebar chapter list → click old chapter → see read-only text
- [ ] all API endpoints return correct HTTP status codes and JSON

**Test Method:**

```
manual (requires API key):
  complete chapter 1 flow in the browser end-to-end
  create project → build characters → write outline → confirm blueprint → generate → QA → confirm
```

---

## Milestone 9 — 5-Chapter End-to-End Validation

**Tasks:**

- [ ] write 5 sequential chapters using real API keys
- [ ] verify canon consistency across all 5 chapters
- [ ] fix bugs found during the 5-chapter run
- [ ] optimize prompts based on output quality
- [ ] create sample project for demo

**Acceptance Criteria (Final MVP):**

- [ ] project created from ProjectTemplate with configurable format
- [ ] character card tier management works (create, promote/demote, archive)
- [ ] every chapter goes through blueprint confirmation before writing
- [ ] streaming output works with pause/stop
- [ ] QA detects ≥1 consistency issue across 5 chapters
- [ ] confirmed chapters correctly update canon (character states, timeline, threads)
- [ ] chapter 5 packet correctly references chapter 1 confirmed settings
- [ ] draft/rejected content never appears in any packet
- [ ] per-scene rewrite works (demonstrated at least once)
- [ ] orchestration trace shows complete collaboration with token usage
- [ ] 5 chapters have consistent character personalities and world rules
- [ ] total token usage accurately recorded

**Test Method:**

```
manual end-to-end:
  write 5 chapters of a sample novel, following the full workflow each time
  after chapter 5, review: are settings from chapter 1 still consistent?
  check: do character cards reflect all changes across 5 chapters?
```

---

## Milestone 10 — Impact Analysis + Polish (MVP-Optional)

**Tasks:**

- [ ] canon dependency graph
- [ ] impact analysis API: POST /projects/:id/impact-analysis
- [ ] green/yellow/red risk classification
- [ ] resolution options (auto-fix, apply-forward, full-rewrite, cancel)
- [ ] frontend: impact analysis modal
- [ ] demo polish and documentation

**Acceptance Criteria:**

- [ ] rename character → green risk → auto-replace works
- [ ] change character alignment → red risk → shows all affected chapters
- [ ] user confirms resolution → changes applied → affected items marked
- [ ] impact modal shows severity per affected item

---

## Dependency Graph

```
M1 (Monorepo)
 │
 ├── M2 (Data Layer) ──── M4 (Orchestrator)
 │                    \        │
 │                     M3 (LLM Adapter)
 │                         │
 │                    M5 (Chat Agent + Workers)
 │                         │
 │                    M6 (Blueprint + Chapter Flow)
 │                         │
 │                    M7 (Canon Projection)
 │                         │
 │                    M8 (API + Frontend)
 │                         │
 │                    M9 (5-Chapter Validation)
 │                         │
 │                    M10 (Impact Analysis — optional)
```

## MVP Acceptance Criteria (Summary)

1. Create project from ProjectTemplate with configurable format
2. Manage character cards with tier assignments (core/important/episodic)
3. Generate and confirm detailed blueprints before chapter writing
4. Write chapter from confirmed blueprint with streaming output
5. Rewrite individual scenes without full chapter regeneration
6. QA detects ≥1 consistency issue
7. Confirmed content correctly updates canon stores
8. Character tier determines context inclusion behavior
9. Chapter 5 packet correctly references chapter 1 settings
10. Draft/rejected content never appears in packets
11. Orchestration trace shows all steps with token usage
12. 5 sequential chapters maintain consistent characters and world rules
