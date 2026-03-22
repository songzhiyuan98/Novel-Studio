# API Specification

## External API (Web to Backend)

### POST /projects
Create project.

Request:
```json
{
  "title": "string",
  "genre": "string",
  "tone": "string",
  "premise": "string"
}
```

### GET /projects/:projectId
Fetch project summary.

### GET /projects/:projectId/feed
Fetch chat + task feed.

### GET /projects/:projectId/artifacts
Query artifacts by type/status/version window.

### POST /projects/:projectId/chat
Send user message to Producer.

Request:
```json
{
  "message": "string",
  "intentHint": "optional-string"
}
```

Response:
```json
{
  "assistantMessage": "string",
  "createdArtifacts": ["artifactId"],
  "createdIssues": ["issueId"],
  "nextSuggestedActions": ["string"]
}
```

### POST /artifacts/:artifactId/edit
Create new artifact version.

### POST /artifacts/:artifactId/confirm
Confirm artifact into canon flow.

### POST /artifacts/:artifactId/reject
Reject artifact.

### GET /chapters
Query chapter timeline.

### POST /chapters/:chapterId/generate
Trigger Writer for target chapter.

### POST /chapters/:chapterId/qa
Trigger QA review.

### GET /issues
Fetch open issues and evidence.

## Internal Worker Contracts

### Planner Task
Input packet:
- project brief
- current canon summary
- missing info list
- requested output type

Output schema:
```json
{
  "resultType": "outline|scene_cards|world_rules|character_cards|evaluation",
  "artifacts": [],
  "issues": [],
  "assumptions": []
}
```

### Writer Task
Input packet:
- chapter objective
- scene cards
- relevant canon
- character states
- style constraints

Output schema:
```json
{
  "chapterTitle": "string",
  "chapterText": "string",
  "newQuestions": [],
  "provisionalDetails": []
}
```

### QA Task
Input packet:
- chapter draft
- relevant canon
- prior chapter summaries
- character states

Output schema:
```json
{
  "decision": "pass|pass_with_notes|revise|block",
  "issues": [
    {
      "severity": "low|medium|high",
      "type": "continuity|style|motivation|pacing|world_logic",
      "description": "string",
      "evidence": []
    }
  ],
  "suggestedPatches": []
}
```

