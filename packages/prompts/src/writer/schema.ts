import { z } from 'zod'

export const sceneSegmentSchema = z.object({
  sceneIndex: z.number(),
  sceneKey: z.string(),
  text: z.string(),
})

export const writerOutputSchema = z.object({
  chapterTitle: z.string(),
  chapterSummary: z.string(),
  sceneSegments: z.array(sceneSegmentSchema),
  chapterText: z.string(),
  introducedProvisionalElements: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
})

export type WriterOutput = z.infer<typeof writerOutputSchema>
