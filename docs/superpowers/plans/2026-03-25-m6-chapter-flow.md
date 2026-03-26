# M6: Blueprint + Chapter Complete Flow Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development.

**Goal:** Wire up the end-to-end chapter production pipeline: blueprint generation → user confirmation → Writer execution → QA review → per-scene rewrite → chapter status management. This is the first time the full loop runs.

**Architecture:** A ChapterPipeline class in packages/orchestrator coordinates the flow using dependency injection for DB and LLM operations. The pipeline uses the existing WorkflowStateMachine, PacketCompiler, TaskDispatcher, SafetyGuard, and LLM Adapter.

**Tech Stack:** TypeScript, existing packages (orchestrator, llm-adapter, prompts)

---

## File Structure

```
packages/orchestrator/
├── src/
│   ├── pipeline/
│   │   ├── chapter-pipeline.ts      # End-to-end chapter flow coordinator
│   │   ├── blueprint-gate.ts        # Blueprint confirmation enforcement
│   │   └── scene-rewriter.ts        # Per-scene rewrite logic
│   └── index.ts                     # Updated exports
└── __tests__/
    ├── pipeline/
    │   ├── chapter-pipeline.test.ts  # Pipeline integration tests
    │   ├── blueprint-gate.test.ts    # Gate enforcement tests
    │   └── scene-rewriter.test.ts   # Per-scene rewrite tests
```

---

### Task 1: Blueprint Gate

**Files:**
- Create: `packages/orchestrator/src/pipeline/blueprint-gate.ts`
- Create: `packages/orchestrator/__tests__/pipeline/blueprint-gate.test.ts`

- [ ] **Step 1: Create blueprint-gate.ts**

```typescript
export interface Blueprint {
  id: string
  chapterNumber: number
  status: 'draft' | 'confirmed' | 'rejected'
  scenes: BlueprintScene[]
}

export interface BlueprintScene {
  sceneIndex: number
  sceneKey: string
  objective: string
  beats: string[]
  dialogueNotes?: string
  combatNotes?: string
  characters: string[]
}

export class BlueprintGate {
  assertConfirmed(blueprint: Blueprint | null): asserts blueprint is Blueprint {
    if (!blueprint) {
      throw new BlueprintNotFoundError()
    }
    if (blueprint.status !== 'confirmed') {
      throw new BlueprintNotConfirmedError(blueprint.status)
    }
    if (blueprint.scenes.length === 0) {
      throw new BlueprintEmptyError()
    }
  }
}

export class BlueprintNotFoundError extends Error {
  constructor() {
    super('No blueprint found. Generate a blueprint before writing.')
    this.name = 'BlueprintNotFoundError'
  }
}

export class BlueprintNotConfirmedError extends Error {
  constructor(currentStatus: string) {
    super(`Blueprint must be confirmed before writing. Current status: ${currentStatus}`)
    this.name = 'BlueprintNotConfirmedError'
  }
}

export class BlueprintEmptyError extends Error {
  constructor() {
    super('Blueprint has no scenes. Add at least one scene before writing.')
    this.name = 'BlueprintEmptyError'
  }
}
```

- [ ] **Step 2: Create blueprint-gate test**

```typescript
import { describe, it, expect } from 'vitest'
import { BlueprintGate, type Blueprint } from '../../src/pipeline/blueprint-gate.js'

describe('BlueprintGate', () => {
  const gate = new BlueprintGate()

  const validBlueprint: Blueprint = {
    id: 'bp-1',
    chapterNumber: 1,
    status: 'confirmed',
    scenes: [
      {
        sceneIndex: 0,
        sceneKey: 'opening',
        objective: 'Introduce hero',
        beats: ['Hero enters', 'Conflict begins'],
        characters: ['lin_fan'],
      },
    ],
  }

  it('passes for confirmed blueprint with scenes', () => {
    expect(() => gate.assertConfirmed(validBlueprint)).not.toThrow()
  })

  it('throws for null blueprint', () => {
    expect(() => gate.assertConfirmed(null)).toThrow('No blueprint found')
  })

  it('throws for draft blueprint', () => {
    const draft = { ...validBlueprint, status: 'draft' as const }
    expect(() => gate.assertConfirmed(draft)).toThrow('must be confirmed')
  })

  it('throws for rejected blueprint', () => {
    const rejected = { ...validBlueprint, status: 'rejected' as const }
    expect(() => gate.assertConfirmed(rejected)).toThrow('must be confirmed')
  })

  it('throws for blueprint with no scenes', () => {
    const empty = { ...validBlueprint, scenes: [] }
    expect(() => gate.assertConfirmed(empty)).toThrow('no scenes')
  })
})
```

- [ ] **Step 3: Run tests**

Expected: 5 new tests pass, total orchestrator tests increase.

- [ ] **Step 4: Commit**

```bash
git add packages/orchestrator/
git commit -m "feat(m6): add blueprint confirmation gate"
```

---

### Task 2: Scene Rewriter

**Files:**
- Create: `packages/orchestrator/src/pipeline/scene-rewriter.ts`
- Create: `packages/orchestrator/__tests__/pipeline/scene-rewriter.test.ts`

- [ ] **Step 1: Create scene-rewriter.ts**

```typescript
export interface SceneSegment {
  sceneIndex: number
  sceneKey: string
  text: string
}

export interface RewriteRequest {
  chapterScenes: SceneSegment[]
  targetSceneIndex: number
  newText: string
}

export function mergeRewrittenScene(request: RewriteRequest): SceneSegment[] {
  const { chapterScenes, targetSceneIndex, newText } = request

  const sceneExists = chapterScenes.some((s) => s.sceneIndex === targetSceneIndex)
  if (!sceneExists) {
    throw new Error(`Scene index ${targetSceneIndex} not found in chapter`)
  }

  return chapterScenes.map((scene) => {
    if (scene.sceneIndex === targetSceneIndex) {
      return { ...scene, text: newText }
    }
    return scene
  })
}

export function assembleSurroundingContext(
  scenes: SceneSegment[],
  targetIndex: number,
  contextRadius: number = 1,
): { before: string; after: string } {
  const before = scenes
    .filter((s) => s.sceneIndex >= targetIndex - contextRadius && s.sceneIndex < targetIndex)
    .map((s) => s.text)
    .join('\n\n')

  const after = scenes
    .filter((s) => s.sceneIndex > targetIndex && s.sceneIndex <= targetIndex + contextRadius)
    .map((s) => s.text)
    .join('\n\n')

  return { before, after }
}

export function combineScenesToChapter(scenes: SceneSegment[]): string {
  return scenes
    .sort((a, b) => a.sceneIndex - b.sceneIndex)
    .map((s) => s.text)
    .join('\n\n')
}
```

- [ ] **Step 2: Create scene-rewriter test**

```typescript
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
      mergeRewrittenScene({
        chapterScenes: mockScenes,
        targetSceneIndex: 99,
        newText: 'new',
      }),
    ).toThrow('Scene index 99 not found')
  })

  it('does not mutate original array', () => {
    const original = mockScenes[1].text
    mergeRewrittenScene({
      chapterScenes: mockScenes,
      targetSceneIndex: 1,
      newText: 'changed',
    })
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
```

- [ ] **Step 3: Run tests**

Expected: 8 new tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/orchestrator/
git commit -m "feat(m6): add per-scene rewrite + merge logic"
```

---

### Task 3: Chapter Pipeline

**Files:**
- Create: `packages/orchestrator/src/pipeline/chapter-pipeline.ts`
- Create: `packages/orchestrator/__tests__/pipeline/chapter-pipeline.test.ts`

- [ ] **Step 1: Create chapter-pipeline.ts**

```typescript
import { WorkflowStateMachine } from '../state-machine.js'
import { TaskDispatcher } from '../task-dispatcher.js'
import { BlueprintGate, type Blueprint } from './blueprint-gate.js'
import { mergeRewrittenScene, combineScenesToChapter, type SceneSegment } from './scene-rewriter.js'
import type { TaskRecord } from '../types.js'

export interface PipelineCallbacks {
  onPlan: (chapterNumber: number) => Promise<Blueprint>
  onWrite: (blueprint: Blueprint) => Promise<{ scenes: SceneSegment[]; taskRecord: TaskRecord }>
  onQA: (chapterText: string, blueprint: Blueprint) => Promise<{ decision: string; issues: unknown[]; taskRecord: TaskRecord }>
  onRewriteScene: (sceneIndex: number, scenes: SceneSegment[], blueprint: Blueprint) => Promise<{ newText: string; taskRecord: TaskRecord }>
  onCanonize: (chapterNumber: number, scenes: SceneSegment[]) => Promise<void>
}

export type PipelineEvent =
  | { type: 'phase_changed'; phase: string }
  | { type: 'blueprint_generated'; blueprint: Blueprint }
  | { type: 'blueprint_confirmed'; blueprint: Blueprint }
  | { type: 'chapter_drafted'; sceneCount: number }
  | { type: 'qa_completed'; decision: string; issueCount: number }
  | { type: 'scene_rewritten'; sceneIndex: number }
  | { type: 'chapter_canonized'; chapterNumber: number }
  | { type: 'error'; message: string }

export class ChapterPipeline {
  private stateMachine: WorkflowStateMachine
  private dispatcher: TaskDispatcher
  private gate: BlueprintGate
  private currentBlueprint: Blueprint | null = null
  private currentScenes: SceneSegment[] = []
  private events: PipelineEvent[] = []

  constructor(initialPhase: 'idle' | 'plan' = 'idle') {
    this.stateMachine = new WorkflowStateMachine(initialPhase)
    this.dispatcher = new TaskDispatcher()
    this.gate = new BlueprintGate()
  }

  getPhase() {
    return this.stateMachine.getPhase()
  }

  getEvents() {
    return [...this.events]
  }

  getBlueprint() {
    return this.currentBlueprint
  }

  getScenes() {
    return [...this.currentScenes]
  }

  private emit(event: PipelineEvent) {
    this.events.push(event)
  }

  async plan(chapterNumber: number, callbacks: Pick<PipelineCallbacks, 'onPlan'>): Promise<Blueprint> {
    this.stateMachine.transition('plan')
    this.dispatcher.startNewAction()
    this.emit({ type: 'phase_changed', phase: 'plan' })

    const blueprint = await callbacks.onPlan(chapterNumber)
    this.currentBlueprint = blueprint
    this.emit({ type: 'blueprint_generated', blueprint })

    this.stateMachine.transition('blueprint_confirm')
    this.emit({ type: 'phase_changed', phase: 'blueprint_confirm' })

    return blueprint
  }

  confirmBlueprint(): void {
    if (!this.currentBlueprint) {
      throw new Error('No blueprint to confirm')
    }
    this.currentBlueprint.status = 'confirmed'
    this.emit({ type: 'blueprint_confirmed', blueprint: this.currentBlueprint })
  }

  async write(callbacks: Pick<PipelineCallbacks, 'onWrite'>): Promise<SceneSegment[]> {
    this.gate.assertConfirmed(this.currentBlueprint)
    this.stateMachine.transition('write')
    this.emit({ type: 'phase_changed', phase: 'write' })

    const result = await callbacks.onWrite(this.currentBlueprint!)
    this.currentScenes = result.scenes
    this.emit({ type: 'chapter_drafted', sceneCount: result.scenes.length })

    return result.scenes
  }

  async qa(callbacks: Pick<PipelineCallbacks, 'onQA'>): Promise<{ decision: string; issues: unknown[] }> {
    this.stateMachine.transition('qa')
    this.emit({ type: 'phase_changed', phase: 'qa' })

    const chapterText = combineScenesToChapter(this.currentScenes)
    const result = await callbacks.onQA(chapterText, this.currentBlueprint!)
    this.emit({ type: 'qa_completed', decision: result.decision, issueCount: result.issues.length })

    return { decision: result.decision, issues: result.issues }
  }

  async rewriteScene(
    sceneIndex: number,
    callbacks: Pick<PipelineCallbacks, 'onRewriteScene'>,
  ): Promise<SceneSegment[]> {
    // Revision is a new user action — reset to idle then back to write
    this.stateMachine.transition('idle')
    this.dispatcher.startNewAction()
    this.stateMachine.transition('plan')
    this.stateMachine.transition('blueprint_confirm')
    this.stateMachine.transition('write')

    const result = await callbacks.onRewriteScene(sceneIndex, this.currentScenes, this.currentBlueprint!)
    this.currentScenes = mergeRewrittenScene({
      chapterScenes: this.currentScenes,
      targetSceneIndex: sceneIndex,
      newText: result.newText,
    })
    this.emit({ type: 'scene_rewritten', sceneIndex })

    return this.currentScenes
  }

  async canonize(
    chapterNumber: number,
    callbacks: Pick<PipelineCallbacks, 'onCanonize'>,
  ): Promise<void> {
    this.stateMachine.transition('canonize')
    this.emit({ type: 'phase_changed', phase: 'canonize' })

    await callbacks.onCanonize(chapterNumber, this.currentScenes)
    this.emit({ type: 'chapter_canonized', chapterNumber })

    // Reset for next chapter
    this.stateMachine.transition('idle')
    this.currentBlueprint = null
    this.currentScenes = []
  }
}
```

- [ ] **Step 2: Create chapter-pipeline test**

```typescript
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

    // Plan
    const bp = await pipeline.plan(1, {
      onPlan: async () => ({ ...mockBlueprint }),
    })
    expect(bp.status).toBe('draft')
    expect(pipeline.getPhase()).toBe('blueprint_confirm')

    // Confirm
    pipeline.confirmBlueprint()
    expect(pipeline.getBlueprint()!.status).toBe('confirmed')

    // Write
    const scenes = await pipeline.write({
      onWrite: async () => ({ scenes: [...mockScenes], taskRecord: mockTaskRecord }),
    })
    expect(scenes.length).toBe(3)
    expect(pipeline.getPhase()).toBe('write')

    // QA
    const qa = await pipeline.qa({
      onQA: async () => ({ decision: 'pass', issues: [], taskRecord: mockTaskRecord }),
    })
    expect(qa.decision).toBe('pass')
    expect(pipeline.getPhase()).toBe('qa')

    // Canonize
    let canonized = false
    await pipeline.canonize(1, {
      onCanonize: async () => { canonized = true },
    })
    expect(canonized).toBe(true)
    expect(pipeline.getPhase()).toBe('idle')
  })

  it('blocks write without confirmed blueprint', async () => {
    const pipeline = new ChapterPipeline('idle')

    await pipeline.plan(1, {
      onPlan: async () => ({ ...mockBlueprint }),
    })
    // NOT confirming blueprint

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

    // Rewrite scene 1
    const rewritten = await pipeline.rewriteScene(1, {
      onRewriteScene: async () => ({ newText: 'REWRITTEN fight scene.', taskRecord: mockTaskRecord }),
    })

    expect(rewritten[1].text).toBe('REWRITTEN fight scene.')
    expect(rewritten[0].text).toBe('Hero enters the arena.') // unchanged
    expect(rewritten[2].text).toBe('Hero wins the battle.') // unchanged
  })

  it('emits events throughout the pipeline', async () => {
    const pipeline = new ChapterPipeline('idle')

    await pipeline.plan(1, { onPlan: async () => ({ ...mockBlueprint }) })
    pipeline.confirmBlueprint()
    await pipeline.write({ onWrite: async () => ({ scenes: [...mockScenes], taskRecord: mockTaskRecord }) })
    await pipeline.qa({ onQA: async () => ({ decision: 'pass', issues: [], taskRecord: mockTaskRecord }) })
    await pipeline.canonize(1, { onCanonize: async () => {} })

    const events = pipeline.getEvents()
    const eventTypes = events.map((e) => e.type)

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
```

- [ ] **Step 3: Run tests**

Expected: 5 new pipeline tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/orchestrator/
git commit -m "feat(m6): add chapter pipeline with full lifecycle"
```

---

### Task 4: Update Orchestrator Index + Final Verification

**Files:**
- Modify: `packages/orchestrator/src/index.ts`

- [ ] **Step 1: Update index.ts** — add pipeline exports

Read current index.ts first, then add these exports at the end:

```typescript
// Pipeline
export { ChapterPipeline } from './pipeline/chapter-pipeline.js'
export type { PipelineCallbacks, PipelineEvent } from './pipeline/chapter-pipeline.js'
export { BlueprintGate, BlueprintNotFoundError, BlueprintNotConfirmedError, BlueprintEmptyError } from './pipeline/blueprint-gate.js'
export type { Blueprint, BlueprintScene } from './pipeline/blueprint-gate.js'
export { mergeRewrittenScene, assembleSurroundingContext, combineScenesToChapter } from './pipeline/scene-rewriter.js'
export type { SceneSegment, RewriteRequest } from './pipeline/scene-rewriter.js'
```

- [ ] **Step 2: Run full workspace tests**

```bash
pnpm test
```

Expected: all packages pass, orchestrator should have 51+ tests.

- [ ] **Step 3: Commit**

```bash
git add packages/orchestrator/src/index.ts
git commit -m "feat(m6): export pipeline modules from orchestrator"
```

---

## M6 Acceptance Checklist

- [ ] Blueprint gate blocks writing without confirmed blueprint (5 tests)
- [ ] Per-scene rewrite merges correctly, doesn't mutate original (8 tests)
- [ ] Full pipeline cycle: plan → confirm → write → qa → canonize (5 tests)
- [ ] Pipeline blocks write without blueprint confirmation
- [ ] Per-scene rewrite: only target scene changes, others unchanged
- [ ] Events emitted at each pipeline stage
- [ ] State resets after canonize for next chapter
- [ ] 51+ orchestrator tests pass
- [ ] Full workspace tests pass
