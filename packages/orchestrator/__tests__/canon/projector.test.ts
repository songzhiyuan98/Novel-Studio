import { describe, it, expect, vi } from 'vitest'
import { CanonProjector } from '../../src/canon/projector.js'
import type { CanonRepositories, SummarizerResult } from '../../src/canon/types.js'

function createMockRepos(): CanonRepositories {
  return {
    saveChapterSummary: vi.fn().mockResolvedValue(undefined),
    updateCharacterState: vi.fn().mockResolvedValue(undefined),
    addTimelineEvent: vi.fn().mockResolvedValue(undefined),
    createThread: vi.fn().mockResolvedValue(undefined),
    resolveThread: vi.fn().mockResolvedValue(undefined),
    advanceThread: vi.fn().mockResolvedValue(undefined),
    archiveCharacter: vi.fn().mockResolvedValue(undefined),
    writeAuditLog: vi.fn().mockResolvedValue(undefined),
  }
}

const summarizerResult: SummarizerResult = {
  chapterNumber: 1,
  summary: '林凡在比武中被林浩天羞辱，魔帝残魂觉醒，林凡反击击碎林浩天手腕。',
  keyEvents: ['魔帝觉醒', '林凡反击'],
  characterDeltas: [
    { character: 'lin_fan', change: '获得噬魂爪', dimensionUpdates: { techniques: ['噬魂爪'] } },
    { character: 'lin_haotian', change: '右手骨折' },
  ],
  newThreads: ['父母失踪真相', '灰袍长老的注意'],
  resolvedThreads: [],
  advancedThreads: [],
  newWorldFacts: [],
  timelineEvents: [{ event: '林凡击败林浩天', location: '林家演武场' }],
  episodicCharactersToArchive: [],
}

describe('CanonProjector', () => {
  it('saves chapter summary', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)
    await projector.project({ projectId: 'proj-1', chapterId: 'ch-1', chapterNumber: 1, summarizerResult, sourceArtifactId: 'art-1' })
    expect(repos.saveChapterSummary).toHaveBeenCalledOnce()
    const call = vi.mocked(repos.saveChapterSummary).mock.calls[0][0]
    expect(call.chapterNumber).toBe(1)
    expect(call.summaryText).toContain('魔帝残魂觉醒')
  })

  it('applies character deltas', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)
    await projector.project({ projectId: 'proj-1', chapterId: 'ch-1', chapterNumber: 1, summarizerResult, sourceArtifactId: 'art-1' })
    expect(repos.updateCharacterState).toHaveBeenCalledTimes(2)
    const firstCall = vi.mocked(repos.updateCharacterState).mock.calls[0]
    expect(firstCall[1]).toBe('lin_fan')
    expect(firstCall[2].change).toBe('获得噬魂爪')
  })

  it('adds timeline events', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)
    await projector.project({ projectId: 'proj-1', chapterId: 'ch-1', chapterNumber: 1, summarizerResult, sourceArtifactId: 'art-1' })
    expect(repos.addTimelineEvent).toHaveBeenCalledOnce()
    const call = vi.mocked(repos.addTimelineEvent).mock.calls[0][0]
    expect(call.eventSummary).toBe('林凡击败林浩天')
    expect(call.locationKey).toBe('林家演武场')
  })

  it('creates new threads', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)
    await projector.project({ projectId: 'proj-1', chapterId: 'ch-1', chapterNumber: 1, summarizerResult, sourceArtifactId: 'art-1' })
    expect(repos.createThread).toHaveBeenCalledTimes(2)
    const labels = vi.mocked(repos.createThread).mock.calls.map((c) => c[0].label)
    expect(labels).toContain('父母失踪真相')
    expect(labels).toContain('灰袍长老的注意')
  })

  it('archives episodic characters', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)
    const resultWithArchive: SummarizerResult = { ...summarizerResult, episodicCharactersToArchive: ['herb_guard'] }
    await projector.project({ projectId: 'proj-1', chapterId: 'ch-1', chapterNumber: 1, summarizerResult: resultWithArchive, sourceArtifactId: 'art-1' })
    expect(repos.archiveCharacter).toHaveBeenCalledWith('proj-1', 'herb_guard')
  })

  it('writes audit log', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)
    await projector.project({ projectId: 'proj-1', chapterId: 'ch-1', chapterNumber: 1, summarizerResult, sourceArtifactId: 'art-1' })
    expect(repos.writeAuditLog).toHaveBeenCalledOnce()
    const call = vi.mocked(repos.writeAuditLog).mock.calls[0][0]
    expect(call.eventType).toBe('canon_projected')
    expect(call.actor).toBe('orchestrator')
  })

  it('returns all updates with provenance', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)
    const updates = await projector.project({ projectId: 'proj-1', chapterId: 'ch-1', chapterNumber: 1, summarizerResult, sourceArtifactId: 'art-1' })
    expect(updates.length).toBeGreaterThan(0)
    for (const update of updates) {
      expect(update.sourceArtifactId).toBe('art-1')
      expect(update.chapterNumber).toBe(1)
    }
    const types = updates.map((u) => u.type)
    expect(types).toContain('chapter_summary')
    expect(types).toContain('character_delta')
    expect(types).toContain('timeline_event')
    expect(types).toContain('thread_new')
  })

  it('handles empty summarizer result gracefully', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)
    const emptyResult: SummarizerResult = {
      chapterNumber: 2, summary: 'Nothing happened.', keyEvents: [], characterDeltas: [],
      newThreads: [], resolvedThreads: [], advancedThreads: [], newWorldFacts: [],
      timelineEvents: [], episodicCharactersToArchive: [],
    }
    const updates = await projector.project({ projectId: 'proj-1', chapterId: 'ch-2', chapterNumber: 2, summarizerResult: emptyResult, sourceArtifactId: 'art-2' })
    expect(repos.saveChapterSummary).toHaveBeenCalledOnce()
    expect(repos.updateCharacterState).not.toHaveBeenCalled()
    expect(repos.addTimelineEvent).not.toHaveBeenCalled()
    expect(updates.length).toBe(1)
  })
})
