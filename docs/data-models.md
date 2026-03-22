# Data Models

## Core Entities

## Project
- id
- title
- description
- genre
- tone
- target_length
- status (active, archived)
- created_at
- updated_at

## Artifact
- id
- project_id
- type
- title
- status
- version
- parent_artifact_id
- source_task_id
- content_json
- summary_text
- confirmed_at
- archived_at
- created_by_role
- created_at
- updated_at

### Artifact Types
- story_bible
- world_rule
- character_card
- relationship_map
- outline
- scene_card
- chapter_draft
- qa_report
- issue_packet
- style_guide
- development_chain

## StoryBibleEntry
- id
- project_id
- entry_type
- key
- value_json
- source_artifact_id
- source_version
- effective_from_chapter
- overridable
- status
- created_at

## CharacterState
- id
- project_id
- character_key
- immutable_traits_json
- evolving_traits_json
- secrets_json
- public_persona_json
- emotional_state_json
- objective_json
- last_updated_from_chapter
- source_artifact_id
- updated_at

## RelationshipState
- id
- project_id
- character_a
- character_b
- relationship_type
- trust_score
- tension_score
- intimacy_score
- status_notes_json
- last_updated_from_chapter
- source_artifact_id

## Chapter
- id
- project_id
- chapter_number
- title
- status
- latest_artifact_id
- summary_text
- canonized_at
- published_at
- created_at
- updated_at

## TimelineEvent
- id
- project_id
- chapter_number
- event_type
- event_summary
- involved_characters_json
- location_key
- source_artifact_id
- canonical
- created_at

## UnresolvedThread
- id
- project_id
- label
- type
- origin_chapter
- current_status
- payoff_target
- related_characters_json
- related_artifacts_json
- notes_json
- updated_at

## DevelopmentChain
- id
- project_id
- chain_key
- origin_node
- trigger_node
- consequence_nodes_json
- dependency_nodes_json
- payoff_target
- source_artifact_id
- status

## Task
- id
- project_id
- task_type
- requested_by
- assigned_role
- input_packet_json
- output_artifact_ids_json
- status
- created_at
- completed_at

## Issue
- id
- project_id
- severity
- issue_type
- description
- evidence_refs_json
- resolution_path
- status
- created_at
- resolved_at

## State Machines

### Artifact Status
- draft
- reviewed
- confirmed
- rejected
- archived
- locked

### Chapter Status
- planned
- drafted
- reviewed
- user_approved
- canonized
- published
- archived

### Issue Status
- open
- needs_user_decision
- resolved_internal
- resolved_user
- deferred
- closed

