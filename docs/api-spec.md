# API Specification

> See also: `docs/superpowers/specs/2026-03-24-core-architecture-design.md` for full design spec.

All pipeline tasks flow through: User → Chat Agent → Orchestrator → Worker. There are no direct worker-invocation endpoints.

## External API (Web to Backend)

### Project Management

#### POST /projects
Create project.

Request:
```json
{
  "title": "string",
  "genre": "string",
  "tone": "string",
  "premise": "string",
  "style_profile": {
    "pov": "first|third_limited|third_omniscient",
    "tense": "past|present",
    "prose_density": "light|medium|dense",
    "dialogue_ratio": "low|medium|high",
    "emotional_intensity": "low|medium|high",
    "humor_level": "none|light|moderate|heavy",
    "darkness_level": "light|medium|dark|grimdark",
    "romance_emphasis": "none|light|moderate|heavy",
    "action_frequency": "low|medium|high"
  }
}
```

#### GET /projects/:projectId
Fetch project summary.

#### PATCH /projects/:projectId
Update project metadata.

### Model Configuration

#### GET /projects/:projectId/model-config
Get current model configuration.

#### PUT /projects/:projectId/model-config
Set model configuration.

Request (simple mode):
```json
{
  "config_mode": "simple",
  "provider": "openai|anthropic|google|deepseek",
  "api_key": "string"
}
```

Request (advanced mode):
```json
{
  "config_mode": "advanced",
  "workers": {
    "chat": { "provider": "string", "model": "string", "api_key": "string" },
    "planner": { "provider": "string", "model": "string", "api_key": "string" },
    "writer": { "provider": "string", "model": "string", "api_key": "string" },
    "qa": { "provider": "string", "model": "string", "api_key": "string" },
    "summarizer": { "provider": "string", "model": "string", "api_key": "string" }
  }
}
```

### Chat (Primary User Interface)

#### POST /projects/:projectId/chat
Send user message. Chat Agent classifies intent and routes accordingly.

Request:
```json
{
  "message": "string"
}
```

Response:
```json
{
  "assistant_message": "string",
  "intent": "casual|canon_edit|pipeline_task",
  "created_artifacts": ["artifact_id"],
  "pending_confirmations": ["artifact_id"],
  "trace": {
    "steps": [
      {
        "timestamp": "ISO8601",
        "actor": "chat_agent|orchestrator|planner|writer|qa|summarizer",
        "action": "string",
        "details": {},
        "tokens": { "input": 0, "output": 0 },
        "duration_ms": 0,
        "cost_usd": 0.0
      }
    ]
  },
  "suggested_actions": ["string"]
}
```

#### GET /projects/:projectId/chat/history
Fetch conversation history with pagination.

Query params: `limit`, `before` (cursor).

### Artifacts

#### GET /projects/:projectId/artifacts
Query artifacts by type/status.

Query params: `type`, `status`, `chapter_number`.

#### GET /artifacts/:artifactId
Get artifact detail with content.

#### POST /artifacts/:artifactId/edit
Create new artifact version.

Request:
```json
{
  "content_json": {},
  "edit_note": "string"
}
```

#### POST /artifacts/:artifactId/confirm
Confirm artifact into canon. Triggers canon projection via Orchestrator.

Response:
```json
{
  "confirmed": true,
  "canon_updates": {
    "story_bible_entries": 0,
    "character_states": 0,
    "timeline_events": 0,
    "threads_updated": 0
  },
  "trace": {}
}
```

#### POST /artifacts/:artifactId/reject
Reject artifact. Sets status to rejected.

### Chapters

#### GET /projects/:projectId/chapters
Query chapter timeline with pagination.

Query params: `limit`, `offset`, `status`.

#### GET /chapters/:chapterId
Get chapter detail including latest draft artifact and summary.

#### GET /chapters/:chapterId/summary
Get chapter structured summary (ChapterSummary entity).

### Canon Stores (Read-Only Queries)

#### GET /projects/:projectId/canon/characters
Get all current character states.

#### GET /projects/:projectId/canon/characters/:characterKey
Get specific character state.

#### GET /projects/:projectId/canon/world-rules
Get all confirmed world rules.

#### GET /projects/:projectId/canon/timeline
Get timeline events with pagination.

Query params: `chapter_from`, `chapter_to`, `character`.

#### GET /projects/:projectId/canon/threads
Get unresolved threads.

Query params: `status` (active, resolved, deferred).

#### GET /projects/:projectId/canon/chains
Get development chains.

### Orchestration Trace

#### GET /projects/:projectId/tasks
Get task history with token usage and cost.

Query params: `limit`, `status`, `worker`.

#### GET /tasks/:taskId
Get task detail including input packet summary and output.

### Issues

#### GET /projects/:projectId/issues
Fetch open issues and evidence.

Query params: `status`, `severity`, `type`.

### Audit

#### GET /projects/:projectId/audit
Get audit log.

Query params: `limit`, `event_type`, `actor`, `before`.

## Internal Worker Contracts

All workers are stateless single-shot LLM calls dispatched by the Orchestrator. Workers receive a compiled packet and return structured output. Workers never see chat history.

### Planner Task

Input packet:
- task_objective
- workflow_stage
- current canon (world rules, character states, outline)
- unresolved threads
- development chains
- open questions
- output_contract

Output schema:
```json
{
  "summary": "string",
  "assumptions": ["string"],
  "questions": ["string"],
  "artifacts": [
    {
      "type": "outline|scene_card|world_rule|character_card|development_chain|evaluation",
      "title": "string",
      "content": {}
    }
  ],
  "issues": [
    {
      "severity": "low|medium|high",
      "type": "continuity|motivation|world_logic",
      "description": "string"
    }
  ]
}
```

### Writer Task

Input packet:
- chapter_objective
- scene_cards
- relevant canon (character states, world rules)
- recent chapter summaries
- relationship states
- style_profile
- output_contract

Output schema:
```json
{
  "chapter_title": "string",
  "chapter_summary": "string",
  "chapter_text": "string",
  "introduced_provisional_elements": ["string"],
  "risks": ["string"]
}
```

### QA Task

Input packet:
- chapter_draft
- relevant canon (character states, world rules)
- recent chapter summaries
- timeline events
- unresolved threads

Output schema:
```json
{
  "decision": "pass|pass_with_notes|revise|block",
  "overall_notes": "string",
  "issues": [
    {
      "severity": "low|medium|high",
      "type": "continuity|style|motivation|pacing|world_logic",
      "description": "string",
      "evidence_refs": [
        {
          "source_type": "canon_entry|chapter_summary|character_state|timeline_event",
          "source_id": "string",
          "quote": "string"
        }
      ],
      "suggested_fix": "string"
    }
  ]
}
```

### Summarizer Task

Input packet:
- chapter_text (full)
- chapter_number
- character_list
- active_threads

Output schema:
```json
{
  "chapter_number": 0,
  "summary": "string (300-500 chars)",
  "key_events": ["string"],
  "character_deltas": [
    { "character": "string", "change": "string" }
  ],
  "new_threads": ["string"],
  "resolved_threads": ["string"],
  "advanced_threads": ["string"],
  "new_world_facts": ["string"],
  "timeline_events": [
    { "event": "string", "location": "string" }
  ]
}
```
