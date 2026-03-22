# System Architecture

## High-Level View

Novel Studio should be built as a monorepo with four architecture planes.

## 1. UX Plane

Components:
- Project tab/workspace selector
- Chat feed
- Artifact side panel
- Chapter timeline
- Diff/compare modal
- Confirm/reject controls
- QA report panel

Responsibilities:
- render state
- collect user actions
- present artifacts and workflow status
- avoid embedding business rules into UI

## 2. Control Plane

Components:
- Producer orchestrator
- workflow engine
- triage router
- artifact state manager
- task dispatcher
- audit logger

Responsibilities:
- interpret user intent
- route tasks
- assemble packets
- enforce gates and transitions

## 3. Knowledge Plane

Components:
- project store
- artifact store
- story bible store
- chapter summaries store
- character state store
- timeline store
- unresolved thread store
- later: retrieval index

Responsibilities:
- persist structured story state
- preserve version history
- support future retrieval and consistency checks

## 4. Generation Plane

Components:
- Planner runtime
- Writer runtime
- QA runtime
- packet schemas
- prompt templates

Responsibilities:
- generate drafts
- analyze outputs
- produce structured machine-readable responses

## MVP Orchestration Loop

1. UI sends command to API.
2. Producer loads project state.
3. Producer decides workflow stage.
4. Producer compiles context packet.
5. Producer dispatches to worker.
6. Worker returns structured output.
7. Producer writes artifacts and states.
8. UI refreshes with new artifacts / statuses.

## Why No Full RAG in MVP

MVP should prioritize:
- stable workflow
- state machine correctness
- packet design
- canon safety

Retrieval should be added only after the base packet assembly path is proven.

