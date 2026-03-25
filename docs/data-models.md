# Data Models

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.

## Core Entities

## Project
- id
- title
- description
- genre
- tone
- target_length
- style_profile_json (pov, tense, prose_density, dialogue_ratio, emotional_intensity, humor_level, darkness_level, romance_emphasis, action_frequency)
- status (active, archived)
- created_at
- updated_at

## ModelConfig
- id
- project_id
- config_mode (simple, advanced)
- default_provider
- default_api_key_ref (encrypted reference, never stored in plain text)
- chat_provider
- chat_model
- planner_provider
- planner_model
- writer_provider
- writer_model
- qa_provider
- qa_model
- summarizer_provider
- summarizer_model
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
- created_by_role (chat_agent, planner, writer, qa, summarizer, user)
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
- style_guide

Note: `development_chain` and `issue` are separate canon/tracking entities, not artifacts.

## Chapter
- id
- project_id
- chapter_number
- volume_number
- title
- status
- latest_artifact_id
- canonized_at
- published_at
- created_at
- updated_at

## ChapterSummary
- id
- project_id
- chapter_id
- chapter_number
- summary_text (300-500 chars narrative summary)
- key_events_json (array of event strings)
- character_deltas_json (array of { character, change })
- new_threads_json (array of thread IDs)
- resolved_threads_json (array of thread IDs)
- advanced_threads_json (array of thread IDs)
- new_world_facts_json (array of fact strings)
- timeline_events_json (array of { event, location })
- source_artifact_id
- created_at

## VolumeSummary
- id
- project_id
- volume_number
- chapter_range_start
- chapter_range_end
- summary_text (1000-2000 chars compressed summary)
- main_plot_progression_json
- character_arc_turning_points_json
- world_changes_json
- major_hooks_json
- source_chapter_summary_ids_json
- created_at

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
- task_type (plan, write, qa, summarize, evaluate)
- requested_by (user_action_id or system)
- assigned_worker (chat_agent, planner, writer, qa, summarizer)
- input_packet_json
- output_artifact_ids_json
- status (pending, running, completed, failed)
- model_provider
- model_name
- tokens_input
- tokens_output
- tokens_total
- estimated_cost_usd
- duration_ms
- error_message
- created_at
- completed_at

## Issue
- id
- project_id
- severity (low, medium, high)
- issue_type (continuity, style, motivation, pacing, world_logic)
- description
- evidence_refs_json (array of { artifact_id, version, quote })
- suggested_fix
- resolution_path
- status
- source_task_id
- created_at
- resolved_at

## ConversationMessage
- id
- project_id
- role (user, assistant, system)
- content
- intent_classification (casual, canon_edit, pipeline_task, null)
- related_task_ids_json
- related_artifact_ids_json
- created_at

## AuditLog
- id
- project_id
- event_type (task_created, task_completed, task_failed, packet_compiled, artifact_created, artifact_edited, artifact_confirmed, artifact_rejected, qa_passed, qa_blocked, chapter_canonized, canon_projected, projection_failed, summary_generated, volume_summary_generated)
- actor (chat_agent, orchestrator, planner, writer, qa, summarizer, user)
- target_type (task, artifact, chapter, canon_entry)
- target_id
- details_json
- tokens_used
- cost_usd
- created_at

## State Machines

### Artifact Status
- draft → reviewed → confirmed → locked
- draft → rejected → archived
- confirmed → archived
- Any non-locked status → archived

### Chapter Status
- planned → drafted → reviewed → user_approved → canonized → published
- reviewed (QA revise) → drafted (revision loop, new user action)
- reviewed (QA block) → requires user decision
- Any status → archived

### Issue Status
- open
- needs_user_decision
- resolved_internal
- resolved_user
- deferred
- closed
