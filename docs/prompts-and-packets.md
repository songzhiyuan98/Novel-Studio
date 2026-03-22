# Prompts and Packet Contracts

## Packet Philosophy

Packets must be compact, structured, and task-specific. They are the main defense against context drift.

## Producer Packet Sections

- task_objective
- workflow_stage
- hard_constraints
- open_questions
- relevant_canon
- current_character_states
- relationship_states
- recent_timeline
- unresolved_threads
- style_profile
- output_contract

## Planner Output Contract

```json
{
  "summary": "string",
  "assumptions": ["string"],
  "questions": ["string"],
  "artifacts": [
    {
      "type": "outline|scene_card|world_rule|character_card|development_chain",
      "title": "string",
      "content": {}
    }
  ]
}
```

## Writer Output Contract

```json
{
  "chapter_title": "string",
  "chapter_summary": "string",
  "chapter_text": "string",
  "introduced_provisional_elements": ["string"],
  "risks": ["string"]
}
```

## QA Output Contract

```json
{
  "decision": "pass|pass_with_notes|revise|block",
  "overall_notes": "string",
  "issues": [
    {
      "severity": "low|medium|high",
      "type": "continuity|pacing|style|motivation|world_logic",
      "description": "string",
      "evidence_refs": ["string"],
      "suggested_fix": "string"
    }
  ]
}
```

## Minimum Question Set Rule

If the system needs user clarification, Producer should ask no more than three targeted questions at once, ideally in selectable form.

## Style Packet

Store style as structure, not vague text only.

Suggested fields:
- pov
- tense
- prose_density
- dialogue_ratio
- emotional_intensity
- humor_level
- darkness_level
- romance_emphasis
- action_frequency

