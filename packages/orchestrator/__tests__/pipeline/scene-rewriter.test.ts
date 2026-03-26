import { describe, it, expect } from 'vitest'
import {
  mergeRewrittenScene,
  assembleSurroundingContext,
  combineScenesToChapter,
  type SceneSegment,
} from '../../src/pipeline/scene-rewriter.js'

const mockScenes: SceneSegment[] = [
  { sceneIndex: 0, sceneKey: 'opening', text: 'Scene 0 text here.' },
  { sceneIndex: 1, sceneKey: 'conflict', text: 'Scene 1 original text.' },
  { sceneIndex: 2, sceneKey: 'climax', text: 'Scene 2 text here.' },
  { sceneIndex: 3, sceneKey: 'resolution', text: 'Scene 3 text here.' },
]

describe('mergeRewrittenScene', () => {
  it('replaces target scene text', () => {
    const result = mergeRewrittenScene({
      chapterScenes: mockScenes,
      targetSceneIndex: 1,
      newText: 'Scene 1 REWRITTEN text.',
    })
    expect(result[1].text).toBe('Scene 1 REWRITTEN text.')
    expect(result[0].text).toBe('Scene 0 text here.')
    expect(result[2].text).toBe('Scene 2 text here.')
  })

  it('throws for invalid scene index', () => {
    expect(() =>
      mergeRewrittenScene({ chapterScenes: mockScenes, targetSceneIndex: 99, newText: 'new' }),
    ).toThrow('Scene index 99 not found')
  })

  it('does not mutate original array', () => {
    const original = mockScenes[1].text
    mergeRewrittenScene({ chapterScenes: mockScenes, targetSceneIndex: 1, newText: 'changed' })
    expect(mockScenes[1].text).toBe(original)
  })
})

describe('assembleSurroundingContext', () => {
  it('gets before and after context for middle scene', () => {
    const ctx = assembleSurroundingContext(mockScenes, 2)
    expect(ctx.before).toContain('Scene 1')
    expect(ctx.after).toContain('Scene 3')
  })

  it('handles first scene (no before)', () => {
    const ctx = assembleSurroundingContext(mockScenes, 0)
    expect(ctx.before).toBe('')
    expect(ctx.after).toContain('Scene 1')
  })

  it('handles last scene (no after)', () => {
    const ctx = assembleSurroundingContext(mockScenes, 3)
    expect(ctx.before).toContain('Scene 2')
    expect(ctx.after).toBe('')
  })
})

describe('combineScenesToChapter', () => {
  it('combines all scenes in order', () => {
    const text = combineScenesToChapter(mockScenes)
    expect(text).toContain('Scene 0')
    expect(text).toContain('Scene 3')
    expect(text.indexOf('Scene 0')).toBeLessThan(text.indexOf('Scene 3'))
  })

  it('handles single scene', () => {
    const text = combineScenesToChapter([mockScenes[0]])
    expect(text).toBe('Scene 0 text here.')
  })
})
