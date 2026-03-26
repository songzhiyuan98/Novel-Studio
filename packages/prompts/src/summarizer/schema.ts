import { z } from 'zod'

export const characterDeltaSchema = z.object({
  character: z.string(),
  change: z.string(),
  dimensionUpdates: z.record(z.string(), z.unknown()).optional(),
})

export const timelineEventSchema = z.object({
  event: z.string(),
  location: z.string().optional(),
})

export const summarizerOutputSchema = z.object({
  chapterNumber: z.number(),
  summary: z.string(),
  keyEvents: z.array(z.string()).default([]),
  characterDeltas: z.array(characterDeltaSchema).default([]),
  newThreads: z.array(z.string()).default([]),
  resolvedThreads: z.array(z.string()).default([]),
  advancedThreads: z.array(z.string()).default([]),
  newWorldFacts: z.array(z.string()).default([]),
  timelineEvents: z.array(timelineEventSchema).default([]),
  episodicCharactersToArchive: z.array(z.string()).default([]),
})

export type SummarizerOutput = z.infer<typeof summarizerOutputSchema>
