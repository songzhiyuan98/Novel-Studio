# Data Models

> See also: `docs/superpowers/specs/2026-03-25-design-v2.md` for the v2 design spec.
> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for the original design spec.

## Core Entities

## ProjectTemplate

- id
- project_id
- genre_json (primary, tags)
- format_json (chapter_length: { min, max, unit }, volume_size, language)
- character_dimensions_json (array of { key, label, type })
- relationship_dimensions_json (array of { key, label, type })
- style_profile_json (base: { pov, tense, prose_density }, custom: array of { key, value })
- writing_rules_json (array of rule strings)
- qa_custom_dimensions_json (array of dimension strings)
- created_at
- updated_at

## Project

- id
- title
- description
- template_id (references ProjectTemplate)
- status (active, archived)
- created_at
- updated_at

Note: Genre, tone, style profile, chapter length, and volume size are all derived from the associated ProjectTemplate. No genre-specific fields are hardcoded on Project.

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
- scene_segments_json (array of { scene_index, scene_key, text } — used for per-scene rewriting; only populated for chapter_draft artifacts)
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
- scene_card (detailed blueprint with combat/dialogue/reversal specifics)
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
- scene_segments_json (array of { scene_index, scene_key, status } — tracks per-scene state for rewriting)
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
- summary_text (compressed summary; length configurable via ProjectTemplate)
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
- name
- tier (core, important, episodic)
- basic_json (age, appearance, etc. — universal fields)
- personality_json (core_traits, speech_style, speech_examples, taboos — universal fields)
- dimensions_json (dynamic per genre, schema defined by ProjectTemplate.character_dimensions)
- current_status_json (location, physical, emotional, objective — universal fields)
- hooks_json (array of { hook, planted_chapter, status })
- change_history_json (array of { chapter, delta })
- last_updated_from_chapter
- source_artifact_id
- archived_at
- updated_at

Note: `dimensions_json` stores genre-specific fields (e.g., realm/techniques for cultivation, net_worth/companies for billionaire). The schema is defined by `ProjectTemplate.character_dimensions` and varies per project.

## RelationshipState

- id
- project_id
- character_a
- character_b
- relationship_type
- base_scores_json (universal scores always present: { trust, tension })
- custom_scores_json (dynamic per genre, schema defined by ProjectTemplate.relationship_dimensions; e.g., { intimacy, rivalry, debt })
- status_notes_json
- last_updated_from_chapter
- source_artifact_id

Note: `base_scores_json` contains universal relationship metrics. `custom_scores_json` contains genre-specific metrics defined by `ProjectTemplate.relationship_dimensions`.

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
- task_type (plan, write, qa, summarize, evaluate, rewrite_scene, impact_analysis)
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
- issue_type (open string; common defaults: continuity, style, motivation, pacing, world_logic, power_scaling, plus any custom types from ProjectTemplate.qa_custom_dimensions)
- description
- evidence_refs_json (array of { artifact_id, version, quote })
- suggested_fix
- resolution_path
- status
- source_task_id
- created_at
- resolved_at

Note: `issue_type` is an open string, not a closed enum. Projects may define additional issue types via `ProjectTemplate.qa_custom_dimensions`.

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
- event_type (task_created, task_completed, task_failed, packet_compiled, artifact_created, artifact_edited, artifact_confirmed, artifact_rejected, qa_passed, qa_blocked, chapter_canonized, canon_projected, projection_failed, summary_generated, volume_summary_generated, impact_analysis_completed, scene_rewritten)
- actor (chat_agent, orchestrator, planner, writer, qa, summarizer, user)
- target_type (task, artifact, chapter, canon_entry)
- target_id
- details_json
- tokens_used
- cost_usd
- created_at

## State Machines

### Artifact Status

- draft -> reviewed -> confirmed -> locked
- draft -> rejected -> archived
- confirmed -> archived
- Any non-locked status -> archived

### Chapter Status

- planned -> drafted -> reviewed -> user_approved -> canonized -> published
- reviewed (QA revise) -> drafted (revision loop, new user action)
- reviewed (QA block) -> requires user decision
- Any status -> archived

### Issue Status

- open
- needs_user_decision
- resolved_internal
- resolved_user
- deferred
- closed
