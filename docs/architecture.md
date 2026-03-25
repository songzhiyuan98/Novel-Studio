# System Architecture

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec with all decisions.

## High-Level View

Novel Studio is a monorepo with four architecture planes. The key architectural decision is **separating conversation (LLM) from orchestration (deterministic code)**.

## 1. UX Plane

Components:
- Chat interface (natural language + option buttons)
- Orchestration Trace panel (debug view of agent collaboration)
- Confirm/reject controls
- Artifact view/edit pane
- Chapter timeline (later priority)
- Diff/compare modal (later priority)

Responsibilities:
- render state
- collect user actions
- present artifacts and workflow status
- display backend orchestration trace for debugging
- avoid embedding business rules into UI

## 2. Control Plane

The original "Producer" concept is split into two components:

### Chat Agent (LLM)
- parse user intent from natural language
- classify input: casual/creative → handle directly; canon edit → route to Orchestrator; pipeline task → route to Orchestrator
- generate user-facing responses
- handle lightweight creative requests without dispatching workers

### Orchestrator (deterministic code, NOT LLM)
- workflow state machine (plan → write → qa → canonize)
- packet compiler with token budget mechanism
- task dispatcher
- canon gate enforcement
- summarizer trigger on canonize
- safety limits enforcement
- audit logging

Responsibilities:
- route tasks via code logic, not LLM judgment
- assemble packets with priority-based token budget filling
- enforce gates and transitions deterministically

## 3. Knowledge Plane

Components:
- project store
- artifact store (all versions including draft/rejected)
- Canon Store (confirmed-only):
  - story bible / world rules store
  - character state store
  - relationship state store
  - chapter summary store (per chapter, Layer 0)
  - volume summary store (per ~100 chapters, Layer 1)
  - timeline event store
  - unresolved thread store
  - development chain store

Responsibilities:
- persist structured story state
- preserve version history
- support L0 structured recall via exact key matching
- support future L1 semantic retrieval

## 4. Generation Plane

Components:
- Chat Agent runtime (LLM — mid-tier)
- Planner runtime (LLM — high-tier)
- Writer runtime (LLM — high-tier)
- QA runtime (LLM — mid-tier)
- Summarizer runtime (LLM — low-tier)
- LLM Adapter layer (Vercel AI SDK, multi-provider)
- packet schemas
- prompt templates
- output contracts

Responsibilities:
- generate drafts and structured outputs
- analyze outputs for quality and consistency
- all workers are stateless single-shot calls
- workers receive only compiled packets, never chat history
- workers cannot dispatch other workers

## MVP Orchestration Loop

1. User sends message via chat interface.
2. Chat Agent (LLM) classifies intent.
3. If lightweight creative → Chat Agent responds directly.
4. If pipeline task → Chat Agent forwards to Orchestrator.
5. Orchestrator determines workflow stage via state machine.
6. Orchestrator compiles context packet with token budget.
7. Orchestrator dispatches to appropriate worker.
8. Worker returns structured output.
9. Orchestrator writes artifacts, updates states, logs audit.
10. If canonize → Orchestrator triggers Summarizer → canon projection.
11. UI refreshes with new artifacts / statuses / trace data.

## RAG Strategy

### L0 — Structured Canon Recall (MVP)
- Scene cards contain structured annotations (characters, threads, callbacks)
- Packet Compiler queries canon store by exact key match
- No embeddings, no vector search
- Token budget limits how much canon is included

### L1 — Semantic Retrieval (Post-MVP)
- Embedding-based search for conceptual connections
- Only after artifact schemas are stable and chapter summaries are proven

## Safety Architecture

1. **Hard limits**: max 5 tasks per user action, max 50K tokens per task, max 150K total per action
2. **Deterministic orchestration**: Orchestrator is code, not LLM — cannot create arbitrary tasks
3. **Unidirectional call chain**: User → Chat Agent → Orchestrator → Worker → return. Workers cannot dispatch workers.

## Model Selection

User-provided API keys with two modes:
- **Simple mode**: one key, system auto-selects models per worker
- **Advanced mode**: per-worker model/provider configuration

Supported via Vercel AI SDK: OpenAI, Anthropic, Google Gemini, DeepSeek, and more.
