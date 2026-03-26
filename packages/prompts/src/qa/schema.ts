import { z } from 'zod'

export const evidenceRefSchema = z.object({
  sourceType: z.enum(['canon_entry', 'chapter_summary', 'character_state', 'timeline_event']),
  sourceId: z.string(),
  quote: z.string().optional(),
})

export const qaIssueSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  type: z.string(),
  sceneIndex: z.number().optional(),
  description: z.string(),
  evidenceRefs: z.array(evidenceRefSchema).default([]),
  suggestedFix: z.string().optional(),
})

export const qaOutputSchema = z.object({
  decision: z.enum(['pass', 'pass_with_notes', 'revise', 'block']),
  overallNotes: z.string(),
  issues: z.array(qaIssueSchema).default([]),
})

export type QAOutput = z.infer<typeof qaOutputSchema>
