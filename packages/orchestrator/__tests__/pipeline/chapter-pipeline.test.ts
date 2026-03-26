import { describe, it, expect } from 'vitest'
import { ChapterPipeline } from '../../src/pipeline/chapter-pipeline.js'
import type { Blueprint } from '../../src/pipeline/blueprint-gate.js'
import type { SceneSegment } from '../../src/pipeline/scene-rewriter.js'

const mockBlueprint: Blueprint = {
  id: 'bp-1',
  chapterNumber: 1,
  status: 'draft',
  scenes: [
    { sceneIndex: 0, sceneKey: 'opening', objective: 'Introduce hero', beats: ['Enter'], characters: ['lin_fan'] },
    { sceneIndex: 1, sceneKey: 'conflict', objective: 'First fight', beats: ['Fight'], characters: ['lin_fan', 'lin_haotian'] },
    { sceneIndex: 2, sceneKey: 'resolution', objective: 'Hero wins', beats: ['Victory'], characters: ['lin_fan'] },
  ],
}

const mockScenes: SceneSegment[] = [
  { sceneIndex: 0, sceneKey: 'opening', text: 'Hero enters the arena.' },
  { sceneIndex: 1, sceneKey: 'conflict', text: 'The fight begins.' },
  { sceneIndex: 2, sceneKey: 'resolution', text: 'Hero wins the battle.' },
]

const mockTaskRecord = { id: 'task-1', projectId: 'p1', taskType: 'write', assignedWorker: 'writer', status: 'completed' as const }

describe('ChapterPipeline', () => {
  it('runs full chapter cycle: plan → confirm → write → qa → canonize', async () => {
    const pipeline = new ChapterPipeline('idle')

    const bp = await pipeline.plan(1, { onPlan: async () => ({ ...mockBlueprint }) })
    expect(bp.status).toBe('draft')
    expect(pipeline.getPhase()).toBe('blueprint_confirm')

    pipeline.confirmBlueprint()
    expect(pipeline.getBlueprint()!.status).toBe('confirmed')

    const scenes = await pipeline.write({
      onWrite: async () => ({ scenes: [...mockScenes], taskRecord: mockTaskRecord }),
    })
    expect(scenes.length).toBe(3)

    const qa = await pipeline.qa({
      onQA: async () => ({ decision: 'pass', issues: [], taskRecord: mockTaskRecord }),
    })
    expect(qa.decision).toBe('pass')

    let canonized = false
    await pipeline.canonize(1, { onCanonize: async () => { canonized = true } })
    expect(canonized).toBe(true)
    expect(pipeline.getPhase()).toBe('idle')
  })

  it('blocks write without confirmed blueprint', async () => {
    const pipeline = new ChapterPipeline('idle')
    await pipeline.plan(1, { onPlan: async () => ({ ...mockBlueprint }) })

    await expect(
      pipeline.write({ onWrite: async () => ({ scenes: mockScenes, taskRecord: mockTaskRecord }) }),
    ).rejects.toThrow('must be confirmed')
  })

  it('supports per-scene rewrite after QA', async () => {
    const pipeline = new ChapterPipeline('idle')
    await pipeline.plan(1, { onPlan: async () => ({ ...mockBlueprint }) })
    pipeline.confirmBlueprint()
    await pipeline.write({ onWrite: async () => ({ scenes: [...mockScenes], taskRecord: mockTaskRecord }) })
    await pipeline.qa({
      onQA: async () => ({ decision: 'revise', issues: [{ scene: 1, issue: 'too generic' }], taskRecord: mockTaskRecord }),
    })

    const rewritten = await pipeline.rewriteScene(1, {
      onRewriteScene: async () => ({ newText: 'REWRITTEN fight scene.', taskRecord: mockTaskRecord }),
    })

    expect(rewritten[1].text).toBe('REWRITTEN fight scene.')
    expect(rewritten[0].text).toBe('Hero enters the arena.')
    expect(rewritten[2].text).toBe('Hero wins the battle.')
  })

  it('emits events throughout the pipeline', async () => {
    const pipeline = new ChapterPipeline('idle')
    await pipeline.plan(1, { onPlan: async () => ({ ...mockBlueprint }) })
    pipeline.confirmBlueprint()
    await pipeline.write({ onWrite: async () => ({ scenes: [...mockScenes], taskRecord: mockTaskRecord }) })
    await pipeline.qa({ onQA: async () => ({ decision: 'pass', issues: [], taskRecord: mockTaskRecord }) })
    await pipeline.canonize(1, { onCanonize: async () => {} })

    const eventTypes = pipeline.getEvents().map((e) => e.type)
    expect(eventTypes).toContain('phase_changed')
    expect(eventTypes).toContain('blueprint_generated')
    expect(eventTypes).toContain('blueprint_confirmed')
    expect(eventTypes).toContain('chapter_drafted')
    expect(eventTypes).toContain('qa_completed')
    expect(eventTypes).toContain('chapter_canonized')
  })

  it('resets state after canonize for next chapter', async () => {
    const pipeline = new ChapterPipeline('idle')
    await pipeline.plan(1, { onPlan: async () => ({ ...mockBlueprint }) })
    pipeline.confirmBlueprint()
    await pipeline.write({ onWrite: async () => ({ scenes: [...mockScenes], taskRecord: mockTaskRecord }) })
    await pipeline.qa({ onQA: async () => ({ decision: 'pass', issues: [], taskRecord: mockTaskRecord }) })
    await pipeline.canonize(1, { onCanonize: async () => {} })

    expect(pipeline.getPhase()).toBe('idle')
    expect(pipeline.getBlueprint()).toBeNull()
    expect(pipeline.getScenes()).toEqual([])
  })
})
