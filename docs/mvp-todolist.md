# MVP Implementation Todo List

## Milestone 0 — Specs Freeze
- [ ] finalize artifact taxonomy
- [ ] finalize state machines
- [ ] define packet schemas
- [ ] define worker output schemas
- [ ] define chapter lifecycle
- [ ] define canon projection rules

## Milestone 1 — Monorepo Setup
- [ ] initialize monorepo
- [ ] add TypeScript workspace config
- [ ] create apps/web
- [ ] create apps/api
- [ ] create packages/core
- [ ] create packages/orchestrator
- [ ] create packages/prompts
- [ ] add lint/format/test baseline

## Milestone 2 — Persistence Layer
- [ ] select DB (Postgres recommended)
- [ ] define schema migrations
- [ ] implement repositories for Project, Artifact, Chapter, Issue
- [ ] implement audit log table
- [ ] seed initial example project

## Milestone 3 — Producer Skeleton
- [ ] build project load service
- [ ] build intent parser abstraction
- [ ] implement triage router
- [ ] implement packet compiler v0 (non-retrieval)
- [ ] implement task dispatcher
- [ ] persist task records

## Milestone 4 — Artifact CRUD
- [ ] create artifact list endpoint
- [ ] create artifact detail endpoint
- [ ] create artifact edit/version endpoint
- [ ] create confirm/reject endpoint
- [ ] implement diff support

## Milestone 5 — Worker Integrations
- [ ] Planner prompt + output parser
- [ ] Writer prompt + output parser
- [ ] QA prompt + output parser
- [ ] structured response validation
- [ ] retry/failure handling

## Milestone 6 — Chapter Flow
- [ ] scene card generation flow
- [ ] writer draft flow
- [ ] QA review flow
- [ ] chapter status updates
- [ ] chapter timeline page

## Milestone 7 — Canon Projection
- [ ] build confirmation projection service
- [ ] update StoryBibleEntry on confirm
- [ ] update CharacterState on chapter canonization
- [ ] update TimelineEvent on chapter canonization
- [ ] update UnresolvedThread state
- [ ] create provenance links

## Milestone 8 — Frontend MVP
- [ ] project shell UI
- [ ] chat feed
- [ ] artifact panel
- [ ] chapter timeline
- [ ] artifact editor
- [ ] QA report view
- [ ] compare modal

## Milestone 9 — Testing
- [ ] golden path project test
- [ ] artifact status transition tests
- [ ] chapter loop integration test
- [ ] confirm projection test
- [ ] continuity QA smoke tests

## Milestone 10 — Demo Readiness
- [ ] create sample project
- [ ] generate 3-5 chapters
- [ ] verify no draft pollution into canon
- [ ] verify rollback path on rejected revision

