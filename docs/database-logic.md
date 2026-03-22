# Database Change Logic

## Principle

The database is not just storage. It is the source of truth for story state transitions. Writes must be explicit, auditable, and role-constrained.

## Canon Admission Rule

Only artifacts with status `confirmed` may write into canonical read models such as:
- StoryBibleEntry
- CharacterState
- RelationshipState
- TimelineEvent (canonical=true)
- UnresolvedThread
- DevelopmentChain

## Write Flow by Artifact Type

### World Rule / Story Bible
1. Draft artifact created.
2. User edits if needed.
3. User confirms.
4. Canon projection job upserts StoryBibleEntry rows.
5. Provenance links to source artifact/version.

### Character Card
1. Draft created by Planner.
2. User confirms.
3. Canon projection updates CharacterState immutable/evolving fields.
4. Previous values remain historically queryable by provenance.

### Scene Card
1. Draft created.
2. User confirms.
3. Scene card becomes eligible writer input.
4. Does not directly change canon unless explicitly promoted.

### Chapter Draft
1. Writer creates chapter_draft artifact.
2. QA creates qa_report artifact.
3. If user confirms chapter, projection pipeline updates:
   - Chapter status
   - Chapter summary
   - TimelineEvent(s)
   - CharacterState deltas
   - RelationshipState deltas
   - UnresolvedThread status changes

## Projection Pattern

Use write model + read model projection:

- **write model** = immutable-ish artifact versions
- **read model** = current canonical story state

This lets the system:
- roll back projected state
- regenerate projections if logic changes
- explain why a canon item exists

## Recommended Transaction Boundaries

### Safe Single Transaction
- create artifact version
- update artifact status
- create audit log row

### Async Projection Transaction
After confirmation:
- load confirmed artifact
- compute delta
- update canonical read models
- create provenance records
- append audit event

## Conflict Handling

When a confirmed artifact conflicts with existing canon:
1. do not silently overwrite
2. create issue record
3. require Producer triage
4. present user with resolution paths:
   - accept overwrite as retcon
   - fork revision branch
   - reject artifact

## Soft Delete Rules

- artifacts are archived, not hard deleted
- canonical projections should ignore archived/non-confirmed artifacts
- historical provenance remains intact

## Audit Events to Store
- task_created
- packet_compiled
- worker_completed
- artifact_created
- artifact_edited
- artifact_confirmed
- artifact_rejected
- qa_passed
- qa_blocked
- chapter_canonized
- projection_failed

