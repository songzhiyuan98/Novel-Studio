import { z } from 'zod'

export const plannerArtifactSchema = z.object({
  type: z.enum(['outline', 'scene_card', 'world_rule', 'character_card', 'development_chain', 'evaluation']),
  title: z.string(),
  content: z.record(z.string(), z.unknown()),
})

export const plannerIssueSchema = z.object({
  severity: z.enum(['low', 'medium', 'high']),
  type: z.string(),
  description: z.string(),
})

export const plannerOutputSchema = z.object({
  summary: z.string(),
  assumptions: z.array(z.string()).default([]),
  questions: z.array(z.string()).default([]),
  artifacts: z.array(plannerArtifactSchema).default([]),
  issues: z.array(plannerIssueSchema).default([]),
})

export type PlannerOutput = z.infer<typeof plannerOutputSchema>
