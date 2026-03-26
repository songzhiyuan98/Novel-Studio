# M7: Canon Projection + Summarization Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development.

**Goal:** When a chapter is canonized, automatically generate a structured summary and propagate state changes to all canon stores (characters, relationships, timeline, threads, chains). Uses dependency injection for DB ops.

**Architecture:** A CanonProjector class in packages/orchestrator receives Summarizer output and applies structured updates to canon stores via injected repository callbacks. Provenance tracking links every canon update to its source artifact.

**Tech Stack:** TypeScript, existing packages

---

## File Structure

```
packages/orchestrator/
├── src/
│   ├── canon/
│   │   ├── projector.ts            # Canon projection logic
│   │   └── types.ts                # Canon-specific types
│   └── index.ts                    # Updated exports
└── __tests__/
    └── canon/
        └── projector.test.ts       # Projection tests
```

---

### Task 1: Canon Types + Projector

**Files:**
- Create: `packages/orchestrator/src/canon/types.ts`
- Create: `packages/orchestrator/src/canon/projector.ts`
- Create: `packages/orchestrator/__tests__/canon/projector.test.ts`

- [ ] **Step 1: Create canon/types.ts**

```typescript
export interface SummarizerResult {
  chapterNumber: number
  summary: string
  keyEvents: string[]
  characterDeltas: Array<{ character: string; change: string; dimensionUpdates?: Record<string, unknown> }>
  newThreads: string[]
  resolvedThreads: string[]
  advancedThreads: string[]
  newWorldFacts: string[]
  timelineEvents: Array<{ event: string; location?: string }>
  episodicCharactersToArchive: string[]
}

export interface CanonUpdate {
  type: 'chapter_summary' | 'character_delta' | 'timeline_event' | 'thread_new' | 'thread_resolved' | 'thread_advanced' | 'character_archived' | 'world_fact'
  target: string
  data: Record<string, unknown>
  sourceArtifactId: string
  chapterNumber: number
}

export interface CanonRepositories {
  saveChapterSummary: (summary: {
    projectId: string
    chapterId: string
    chapterNumber: number
    summaryText: string
    keyEventsJson: string[]
    characterDeltasJson: Array<{ character: string; change: string }>
    newThreadsJson: string[]
    resolvedThreadsJson: string[]
    advancedThreadsJson: string[]
    newWorldFactsJson: string[]
    timelineEventsJson: Array<{ event: string; location?: string }>
    sourceArtifactId: string
  }) => Promise<void>

  updateCharacterState: (projectId: string, characterKey: string, delta: {
    change: string
    dimensionUpdates?: Record<string, unknown>
    chapterNumber: number
    sourceArtifactId: string
  }) => Promise<void>

  addTimelineEvent: (event: {
    projectId: string
    chapterNumber: number
    eventType: string
    eventSummary: string
    locationKey?: string
    sourceArtifactId: string
  }) => Promise<void>

  createThread: (thread: {
    projectId: string
    label: string
    originChapter: number
  }) => Promise<void>

  resolveThread: (projectId: string, threadLabel: string) => Promise<void>

  advanceThread: (projectId: string, threadLabel: string) => Promise<void>

  archiveCharacter: (projectId: string, characterKey: string) => Promise<void>

  writeAuditLog: (log: {
    projectId: string
    eventType: string
    actor: string
    targetType: string
    targetId: string
    detailsJson: Record<string, unknown>
  }) => Promise<void>
}
```

- [ ] **Step 2: Create canon/projector.ts**

```typescript
import type { SummarizerResult, CanonUpdate, CanonRepositories } from './types.js'

export class CanonProjector {
  private repos: CanonRepositories

  constructor(repos: CanonRepositories) {
    this.repos = repos
  }

  async project(params: {
    projectId: string
    chapterId: string
    chapterNumber: number
    summarizerResult: SummarizerResult
    sourceArtifactId: string
  }): Promise<CanonUpdate[]> {
    const { projectId, chapterId, chapterNumber, summarizerResult, sourceArtifactId } = params
    const updates: CanonUpdate[] = []

    // 1. Save chapter summary
    await this.repos.saveChapterSummary({
      projectId,
      chapterId,
      chapterNumber,
      summaryText: summarizerResult.summary,
      keyEventsJson: summarizerResult.keyEvents,
      characterDeltasJson: summarizerResult.characterDeltas.map((d) => ({
        character: d.character,
        change: d.change,
      })),
      newThreadsJson: summarizerResult.newThreads,
      resolvedThreadsJson: summarizerResult.resolvedThreads,
      advancedThreadsJson: summarizerResult.advancedThreads,
      newWorldFactsJson: summarizerResult.newWorldFacts,
      timelineEventsJson: summarizerResult.timelineEvents,
      sourceArtifactId,
    })
    updates.push({
      type: 'chapter_summary',
      target: `chapter_${chapterNumber}`,
      data: { summary: summarizerResult.summary },
      sourceArtifactId,
      chapterNumber,
    })

    // 2. Apply character deltas
    for (const delta of summarizerResult.characterDeltas) {
      await this.repos.updateCharacterState(projectId, delta.character, {
        change: delta.change,
        dimensionUpdates: delta.dimensionUpdates,
        chapterNumber,
        sourceArtifactId,
      })
      updates.push({
        type: 'character_delta',
        target: delta.character,
        data: { change: delta.change, dimensionUpdates: delta.dimensionUpdates },
        sourceArtifactId,
        chapterNumber,
      })
    }

    // 3. Add timeline events
    for (const event of summarizerResult.timelineEvents) {
      await this.repos.addTimelineEvent({
        projectId,
        chapterNumber,
        eventType: 'plot',
        eventSummary: event.event,
        locationKey: event.location,
        sourceArtifactId,
      })
      updates.push({
        type: 'timeline_event',
        target: event.event,
        data: { location: event.location },
        sourceArtifactId,
        chapterNumber,
      })
    }

    // 4. Handle threads
    for (const thread of summarizerResult.newThreads) {
      await this.repos.createThread({ projectId, label: thread, originChapter: chapterNumber })
      updates.push({ type: 'thread_new', target: thread, data: {}, sourceArtifactId, chapterNumber })
    }

    for (const thread of summarizerResult.resolvedThreads) {
      await this.repos.resolveThread(projectId, thread)
      updates.push({ type: 'thread_resolved', target: thread, data: {}, sourceArtifactId, chapterNumber })
    }

    for (const thread of summarizerResult.advancedThreads) {
      await this.repos.advanceThread(projectId, thread)
      updates.push({ type: 'thread_advanced', target: thread, data: {}, sourceArtifactId, chapterNumber })
    }

    // 5. Archive episodic characters
    for (const charKey of summarizerResult.episodicCharactersToArchive) {
      await this.repos.archiveCharacter(projectId, charKey)
      updates.push({ type: 'character_archived', target: charKey, data: {}, sourceArtifactId, chapterNumber })
    }

    // 6. Audit log
    await this.repos.writeAuditLog({
      projectId,
      eventType: 'canon_projected',
      actor: 'orchestrator',
      targetType: 'chapter',
      targetId: chapterId,
      detailsJson: {
        chapterNumber,
        updatesCount: updates.length,
        characterDeltasCount: summarizerResult.characterDeltas.length,
        timelineEventsCount: summarizerResult.timelineEvents.length,
        threadsNew: summarizerResult.newThreads.length,
        threadsResolved: summarizerResult.resolvedThreads.length,
        episodicArchived: summarizerResult.episodicCharactersToArchive.length,
      },
    })

    return updates
  }
}
```

- [ ] **Step 3: Create projector test**

```typescript
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
  timelineEvents: [
    { event: '林凡击败林浩天', location: '林家演武场' },
  ],
  episodicCharactersToArchive: [],
}

describe('CanonProjector', () => {
  it('saves chapter summary', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)

    await projector.project({
      projectId: 'proj-1',
      chapterId: 'ch-1',
      chapterNumber: 1,
      summarizerResult,
      sourceArtifactId: 'art-1',
    })

    expect(repos.saveChapterSummary).toHaveBeenCalledOnce()
    const call = vi.mocked(repos.saveChapterSummary).mock.calls[0][0]
    expect(call.chapterNumber).toBe(1)
    expect(call.summaryText).toContain('魔帝残魂觉醒')
  })

  it('applies character deltas', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)

    await projector.project({
      projectId: 'proj-1',
      chapterId: 'ch-1',
      chapterNumber: 1,
      summarizerResult,
      sourceArtifactId: 'art-1',
    })

    expect(repos.updateCharacterState).toHaveBeenCalledTimes(2)
    const firstCall = vi.mocked(repos.updateCharacterState).mock.calls[0]
    expect(firstCall[1]).toBe('lin_fan')
    expect(firstCall[2].change).toBe('获得噬魂爪')
  })

  it('adds timeline events', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)

    await projector.project({
      projectId: 'proj-1',
      chapterId: 'ch-1',
      chapterNumber: 1,
      summarizerResult,
      sourceArtifactId: 'art-1',
    })

    expect(repos.addTimelineEvent).toHaveBeenCalledOnce()
    const call = vi.mocked(repos.addTimelineEvent).mock.calls[0][0]
    expect(call.eventSummary).toBe('林凡击败林浩天')
    expect(call.locationKey).toBe('林家演武场')
  })

  it('creates new threads', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)

    await projector.project({
      projectId: 'proj-1',
      chapterId: 'ch-1',
      chapterNumber: 1,
      summarizerResult,
      sourceArtifactId: 'art-1',
    })

    expect(repos.createThread).toHaveBeenCalledTimes(2)
    const labels = vi.mocked(repos.createThread).mock.calls.map((c) => c[0].label)
    expect(labels).toContain('父母失踪真相')
    expect(labels).toContain('灰袍长老的注意')
  })

  it('archives episodic characters', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)

    const resultWithArchive: SummarizerResult = {
      ...summarizerResult,
      episodicCharactersToArchive: ['herb_guard'],
    }

    await projector.project({
      projectId: 'proj-1',
      chapterId: 'ch-1',
      chapterNumber: 1,
      summarizerResult: resultWithArchive,
      sourceArtifactId: 'art-1',
    })

    expect(repos.archiveCharacter).toHaveBeenCalledWith('proj-1', 'herb_guard')
  })

  it('writes audit log', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)

    await projector.project({
      projectId: 'proj-1',
      chapterId: 'ch-1',
      chapterNumber: 1,
      summarizerResult,
      sourceArtifactId: 'art-1',
    })

    expect(repos.writeAuditLog).toHaveBeenCalledOnce()
    const call = vi.mocked(repos.writeAuditLog).mock.calls[0][0]
    expect(call.eventType).toBe('canon_projected')
    expect(call.actor).toBe('orchestrator')
  })

  it('returns all updates with provenance', async () => {
    const repos = createMockRepos()
    const projector = new CanonProjector(repos)

    const updates = await projector.project({
      projectId: 'proj-1',
      chapterId: 'ch-1',
      chapterNumber: 1,
      summarizerResult,
      sourceArtifactId: 'art-1',
    })

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
      chapterNumber: 2,
      summary: 'Nothing happened.',
      keyEvents: [],
      characterDeltas: [],
      newThreads: [],
      resolvedThreads: [],
      advancedThreads: [],
      newWorldFacts: [],
      timelineEvents: [],
      episodicCharactersToArchive: [],
    }

    const updates = await projector.project({
      projectId: 'proj-1',
      chapterId: 'ch-2',
      chapterNumber: 2,
      summarizerResult: emptyResult,
      sourceArtifactId: 'art-2',
    })

    expect(repos.saveChapterSummary).toHaveBeenCalledOnce()
    expect(repos.updateCharacterState).not.toHaveBeenCalled()
    expect(repos.addTimelineEvent).not.toHaveBeenCalled()
    expect(updates.length).toBe(1) // only chapter_summary
  })
})
```

- [ ] **Step 4: Run tests**

Expected: 8 new tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/orchestrator/
git commit -m "feat(m7): add canon projector with provenance tracking"
```

---

### Task 2: Update Exports + Final Verification

**Files:**
- Modify: `packages/orchestrator/src/index.ts`

- [ ] **Step 1: Add canon exports to index.ts**

Read current index.ts, then append:

```typescript

// Canon projection
export { CanonProjector } from './canon/projector.js'
export type { SummarizerResult, CanonUpdate, CanonRepositories } from './canon/types.js'
```

- [ ] **Step 2: Run full workspace tests**

```bash
pnpm test
```

Expected: all pass, orchestrator 59+ tests.

- [ ] **Step 3: Commit and push**

```bash
git add packages/orchestrator/src/index.ts docs/superpowers/plans/2026-03-25-m7-canon-projection.md
git commit -m "feat(m7): export canon projection modules"
git push origin main
```

---

## M7 Acceptance Checklist

- [ ] Chapter summary saved with full structured data
- [ ] Character deltas applied (including dimension updates)
- [ ] Timeline events created with location
- [ ] New threads created, resolved threads marked, advanced threads tracked
- [ ] Episodic characters archived
- [ ] Audit log written with projection stats
- [ ] All updates carry sourceArtifactId (provenance)
- [ ] Empty summarizer result handled gracefully
- [ ] 8+ new tests pass
- [ ] Full workspace tests pass
