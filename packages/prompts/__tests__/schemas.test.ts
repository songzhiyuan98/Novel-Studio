import { describe, it, expect } from 'vitest'
import { plannerOutputSchema } from '../src/planner/schema.js'
import { writerOutputSchema } from '../src/writer/schema.js'
import { qaOutputSchema } from '../src/qa/schema.js'
import { summarizerOutputSchema } from '../src/summarizer/schema.js'

describe('Planner output schema', () => {
  it('validates valid output', () => {
    const valid = {
      summary: 'Chapter plan ready',
      assumptions: ['Hero is alive'],
      questions: [],
      artifacts: [{ type: 'scene_card', title: 'Scene 1', content: { objective: 'Fight' } }],
      issues: [],
    }
    expect(() => plannerOutputSchema.parse(valid)).not.toThrow()
  })

  it('rejects missing summary', () => {
    expect(() => plannerOutputSchema.parse({ artifacts: [] })).toThrow()
  })

  it('applies defaults for optional arrays', () => {
    const result = plannerOutputSchema.parse({ summary: 'Plan' })
    expect(result.assumptions).toEqual([])
    expect(result.artifacts).toEqual([])
  })
})

describe('Writer output schema', () => {
  it('validates valid output', () => {
    const valid = {
      chapterTitle: 'Chapter 1',
      chapterSummary: 'Hero fights villain',
      sceneSegments: [{ sceneIndex: 0, sceneKey: 'fight', text: 'The battle began...' }],
      chapterText: 'The battle began...',
    }
    expect(() => writerOutputSchema.parse(valid)).not.toThrow()
  })

  it('rejects missing sceneSegments', () => {
    expect(() => writerOutputSchema.parse({ chapterTitle: 'Ch1', chapterSummary: 'Sum', chapterText: 'Text' })).toThrow()
  })
})

describe('QA output schema', () => {
  it('validates pass decision', () => {
    expect(() => qaOutputSchema.parse({ decision: 'pass', overallNotes: 'All good', issues: [] })).not.toThrow()
  })

  it('validates revise with issues', () => {
    const valid = {
      decision: 'revise',
      overallNotes: 'Found problems',
      issues: [{
        severity: 'high',
        type: 'continuity',
        description: 'Character name changed',
        evidenceRefs: [{ sourceType: 'canon_entry', sourceId: 'char_001' }],
        suggestedFix: 'Use original name',
      }],
    }
    expect(() => qaOutputSchema.parse(valid)).not.toThrow()
  })

  it('rejects invalid decision', () => {
    expect(() => qaOutputSchema.parse({ decision: 'maybe', overallNotes: '' })).toThrow()
  })
})

describe('Summarizer output schema', () => {
  it('validates valid output', () => {
    const valid = {
      chapterNumber: 1,
      summary: 'Hero awakened powers',
      keyEvents: ['Power awakening'],
      characterDeltas: [{ character: 'lin_fan', change: 'Gained shadow claw' }],
      timelineEvents: [{ event: 'Shadow claw obtained', location: 'Back mountain' }],
    }
    expect(() => summarizerOutputSchema.parse(valid)).not.toThrow()
  })

  it('applies defaults', () => {
    const result = summarizerOutputSchema.parse({ chapterNumber: 1, summary: 'Brief' })
    expect(result.keyEvents).toEqual([])
    expect(result.characterDeltas).toEqual([])
  })
})
