# M4: Orchestrator Core + Packet Compiler Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build the deterministic orchestration engine: workflow state machine, packet compiler with token budget and tier-aware character inclusion, task dispatcher, safety limits, and canon gate.

**Architecture:** The Orchestrator is pure deterministic code (NOT LLM). It receives classified intents from Chat Agent, manages workflow state, compiles context packets for each worker, dispatches tasks via LLM Adapter, enforces safety limits, and gates canon admission.

**Tech Stack:** TypeScript, Zod (validation), packages/orchestrator depends on packages/core and packages/llm-adapter

---

## File Structure

```
packages/orchestrator/
├── src/
│   ├── index.ts                    # Re-export public API
│   ├── state-machine.ts            # Workflow state machine
│   ├── packet-compiler.ts          # Context packet assembly with token budget
│   ├── task-dispatcher.ts          # Dispatch tasks to LLM workers
│   ├── safety.ts                   # Safety limits enforcement
│   └── types.ts                    # Orchestrator-specific types
└── __tests__/
    ├── state-machine.test.ts
    ├── packet-compiler.test.ts
    ├── safety.test.ts
    └── task-dispatcher.test.ts
```

---

### Task 1: Orchestrator Types

**Files:**
- Create: `packages/orchestrator/src/types.ts`

- [ ] **Step 1: Create types.ts**

```typescript
export type WorkflowPhase =
  | 'bootstrap'
  | 'foundation'
  | 'plan'
  | 'blueprint_confirm'
  | 'write'
  | 'qa'
  | 'canonize'
  | 'idle'

export type IntentType = 'casual' | 'canon_edit' | 'pipeline_task' | 'blueprint_edit' | 'setting_change'

export interface ClassifiedIntent {
  type: IntentType
  payload?: Record<string, unknown>
  rawMessage: string
}

export interface PacketSection {
  key: string
  content: string
  priority: number // 0 = highest
  estimatedTokens: number
}

export interface CompiledPacket {
  sections: PacketSection[]
  totalTokens: number
  budgetUsed: number
  budgetLimit: number
  includedCharacters: string[]
  workerType: string
}

export interface TaskRecord {
  id: string
  projectId: string
  taskType: string
  assignedWorker: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  tokensInput?: number
  tokensOutput?: number
  estimatedCostUsd?: number
  durationMs?: number
  error?: string
}

export interface SafetyLimits {
  maxTasksPerAction: number
  maxTokensPerTask: number
  maxTotalTokensPerAction: number
}

export const DEFAULT_SAFETY_LIMITS: SafetyLimits = {
  maxTasksPerAction: 5,
  maxTokensPerTask: 50_000,
  maxTotalTokensPerAction: 150_000,
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/orchestrator/src/types.ts
git commit -m "feat(m4): add orchestrator types"
```

---

### Task 2: Workflow State Machine

**Files:**
- Create: `packages/orchestrator/src/state-machine.ts`
- Create: `packages/orchestrator/__tests__/state-machine.test.ts`

- [ ] **Step 1: Create state-machine.ts**

```typescript
import type { WorkflowPhase } from './types.js'

const VALID_TRANSITIONS: Record<WorkflowPhase, WorkflowPhase[]> = {
  bootstrap: ['foundation'],
  foundation: ['plan', 'idle'],
  idle: ['plan'],
  plan: ['blueprint_confirm'],
  blueprint_confirm: ['write', 'plan'], // can go back to re-plan
  write: ['qa'],
  qa: ['canonize', 'idle'], // idle = revision needed (new user action)
  canonize: ['plan', 'idle'], // next chapter or wait
}

export class WorkflowStateMachine {
  private phase: WorkflowPhase

  constructor(initialPhase: WorkflowPhase = 'bootstrap') {
    this.phase = initialPhase
  }

  getPhase(): WorkflowPhase {
    return this.phase
  }

  canTransition(to: WorkflowPhase): boolean {
    const allowed = VALID_TRANSITIONS[this.phase]
    return allowed?.includes(to) ?? false
  }

  transition(to: WorkflowPhase): void {
    if (!this.canTransition(to)) {
      throw new Error(
        `Invalid transition: ${this.phase} → ${to}. Allowed: ${VALID_TRANSITIONS[this.phase]?.join(', ') ?? 'none'}`,
      )
    }
    this.phase = to
  }

  reset(): void {
    this.phase = 'idle'
  }
}
```

- [ ] **Step 2: Create state-machine test**

```typescript
import { describe, it, expect } from 'vitest'
import { WorkflowStateMachine } from '../src/state-machine.js'

describe('WorkflowStateMachine', () => {
  it('starts at bootstrap', () => {
    const sm = new WorkflowStateMachine()
    expect(sm.getPhase()).toBe('bootstrap')
  })

  it('allows bootstrap → foundation', () => {
    const sm = new WorkflowStateMachine()
    expect(sm.canTransition('foundation')).toBe(true)
    sm.transition('foundation')
    expect(sm.getPhase()).toBe('foundation')
  })

  it('allows full chapter cycle: plan → blueprint_confirm → write → qa → canonize', () => {
    const sm = new WorkflowStateMachine('idle')
    sm.transition('plan')
    sm.transition('blueprint_confirm')
    sm.transition('write')
    sm.transition('qa')
    sm.transition('canonize')
    expect(sm.getPhase()).toBe('canonize')
  })

  it('allows canonize → plan (next chapter)', () => {
    const sm = new WorkflowStateMachine('canonize')
    sm.transition('plan')
    expect(sm.getPhase()).toBe('plan')
  })

  it('allows qa → idle (revision needed)', () => {
    const sm = new WorkflowStateMachine('qa')
    sm.transition('idle')
    expect(sm.getPhase()).toBe('idle')
  })

  it('allows blueprint_confirm → plan (re-plan)', () => {
    const sm = new WorkflowStateMachine('blueprint_confirm')
    sm.transition('plan')
    expect(sm.getPhase()).toBe('plan')
  })

  it('rejects write → plan (invalid)', () => {
    const sm = new WorkflowStateMachine('write')
    expect(sm.canTransition('plan')).toBe(false)
    expect(() => sm.transition('plan')).toThrow('Invalid transition')
  })

  it('rejects plan → write (must confirm blueprint first)', () => {
    const sm = new WorkflowStateMachine('plan')
    expect(sm.canTransition('write')).toBe(false)
    expect(() => sm.transition('write')).toThrow('Invalid transition')
  })

  it('rejects bootstrap → write (skipping steps)', () => {
    const sm = new WorkflowStateMachine()
    expect(() => sm.transition('write')).toThrow('Invalid transition')
  })

  it('reset puts machine to idle', () => {
    const sm = new WorkflowStateMachine('write')
    sm.reset()
    expect(sm.getPhase()).toBe('idle')
  })
})
```

- [ ] **Step 3: Delete old placeholder test**

Delete `packages/orchestrator/__tests__/placeholder.test.ts`.

- [ ] **Step 4: Run tests**

```bash
cd packages/orchestrator && pnpm test
```

Expected: 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/orchestrator/
git commit -m "feat(m4): add workflow state machine with transition validation"
```

---

### Task 3: Safety Limits

**Files:**
- Create: `packages/orchestrator/src/safety.ts`
- Create: `packages/orchestrator/__tests__/safety.test.ts`

- [ ] **Step 1: Create safety.ts**

```typescript
import type { SafetyLimits } from './types.js'

export class SafetyGuard {
  private limits: SafetyLimits
  private taskCount: number = 0
  private totalTokens: number = 0

  constructor(limits: SafetyLimits) {
    this.limits = limits
  }

  canDispatch(estimatedInputTokens: number = 0): { allowed: boolean; reason?: string } {
    if (this.taskCount >= this.limits.maxTasksPerAction) {
      return {
        allowed: false,
        reason: `Task limit reached (${this.taskCount}/${this.limits.maxTasksPerAction}). User action required.`,
      }
    }

    if (estimatedInputTokens > this.limits.maxTokensPerTask) {
      return {
        allowed: false,
        reason: `Packet too large (${estimatedInputTokens} tokens > ${this.limits.maxTokensPerTask} limit).`,
      }
    }

    if (this.totalTokens + estimatedInputTokens > this.limits.maxTotalTokensPerAction) {
      return {
        allowed: false,
        reason: `Total token budget exhausted (${this.totalTokens + estimatedInputTokens} > ${this.limits.maxTotalTokensPerAction}).`,
      }
    }

    return { allowed: true }
  }

  recordTask(tokensUsed: number): void {
    this.taskCount++
    this.totalTokens += tokensUsed
  }

  resetForNewAction(): void {
    this.taskCount = 0
    this.totalTokens = 0
  }

  getStats(): { taskCount: number; totalTokens: number; limits: SafetyLimits } {
    return {
      taskCount: this.taskCount,
      totalTokens: this.totalTokens,
      limits: this.limits,
    }
  }
}
```

- [ ] **Step 2: Create safety test**

```typescript
import { describe, it, expect } from 'vitest'
import { SafetyGuard } from '../src/safety.js'
import type { SafetyLimits } from '../src/types.js'

describe('SafetyGuard', () => {
  const limits: SafetyLimits = {
    maxTasksPerAction: 5,
    maxTokensPerTask: 50_000,
    maxTotalTokensPerAction: 150_000,
  }

  it('allows first task', () => {
    const guard = new SafetyGuard(limits)
    expect(guard.canDispatch(1000).allowed).toBe(true)
  })

  it('blocks after max tasks reached', () => {
    const guard = new SafetyGuard(limits)
    for (let i = 0; i < 5; i++) {
      guard.recordTask(1000)
    }
    const result = guard.canDispatch(1000)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Task limit reached')
  })

  it('blocks oversized packet', () => {
    const guard = new SafetyGuard(limits)
    const result = guard.canDispatch(60_000)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Packet too large')
  })

  it('blocks when total budget exhausted', () => {
    const guard = new SafetyGuard(limits)
    guard.recordTask(100_000)
    const result = guard.canDispatch(60_000)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Total token budget')
  })

  it('resets for new user action', () => {
    const guard = new SafetyGuard(limits)
    for (let i = 0; i < 5; i++) {
      guard.recordTask(1000)
    }
    expect(guard.canDispatch().allowed).toBe(false)
    guard.resetForNewAction()
    expect(guard.canDispatch().allowed).toBe(true)
  })

  it('tracks stats correctly', () => {
    const guard = new SafetyGuard(limits)
    guard.recordTask(2000)
    guard.recordTask(3000)
    const stats = guard.getStats()
    expect(stats.taskCount).toBe(2)
    expect(stats.totalTokens).toBe(5000)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd packages/orchestrator && pnpm test
```

Expected: 16 tests pass (10 state machine + 6 safety).

- [ ] **Step 4: Commit**

```bash
git add packages/orchestrator/
git commit -m "feat(m4): add safety guard with task/token limits"
```

---

### Task 4: Packet Compiler

**Files:**
- Create: `packages/orchestrator/src/packet-compiler.ts`
- Create: `packages/orchestrator/__tests__/packet-compiler.test.ts`

- [ ] **Step 1: Create packet-compiler.ts**

```typescript
import type { PacketSection, CompiledPacket } from './types.js'

// Rough estimate: 1 Chinese char ≈ 1.5 tokens, 1 English word ≈ 1.3 tokens
export function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars * 1.5 + otherChars * 0.4)
}

export interface PacketCompilerOptions {
  tokenBudget: number
  workerType: string
}

export class PacketCompiler {
  private sections: PacketSection[] = []
  private options: PacketCompilerOptions

  constructor(options: PacketCompilerOptions) {
    this.options = options
  }

  addSection(key: string, content: string, priority: number): this {
    const estimatedTokens = estimateTokens(content)
    this.sections.push({ key, content, priority, estimatedTokens })
    return this
  }

  compile(): CompiledPacket {
    // Sort by priority (lower = higher priority)
    const sorted = [...this.sections].sort((a, b) => a.priority - b.priority)

    const included: PacketSection[] = []
    let totalTokens = 0
    const includedCharacters: string[] = []

    for (const section of sorted) {
      if (totalTokens + section.estimatedTokens > this.options.tokenBudget) {
        // Budget exceeded, skip remaining sections
        break
      }
      included.push(section)
      totalTokens += section.estimatedTokens

      // Extract character names from character-related sections
      if (section.key.startsWith('character:')) {
        includedCharacters.push(section.key.replace('character:', ''))
      }
    }

    return {
      sections: included,
      totalTokens,
      budgetUsed: totalTokens,
      budgetLimit: this.options.tokenBudget,
      includedCharacters,
      workerType: this.options.workerType,
    }
  }

  toPromptString(): string {
    const packet = this.compile()
    return packet.sections.map((s) => `## ${s.key}\n${s.content}`).join('\n\n')
  }
}

export type CharacterTier = 'core' | 'important' | 'episodic'

export interface CharacterForPacket {
  characterKey: string
  name: string
  tier: CharacterTier
  stateJson: string // serialized character state
}

export function filterCharactersByTier(
  characters: CharacterForPacket[],
  sceneCharacterKeys: string[],
): CharacterForPacket[] {
  return characters.filter((c) => {
    switch (c.tier) {
      case 'core':
        return true // always included
      case 'important':
        return sceneCharacterKeys.includes(c.characterKey) // only if in scene
      case 'episodic':
        return sceneCharacterKeys.includes(c.characterKey) // only if in scene
      default:
        return false
    }
  })
}
```

- [ ] **Step 2: Create packet-compiler test**

```typescript
import { describe, it, expect } from 'vitest'
import {
  PacketCompiler,
  estimateTokens,
  filterCharactersByTier,
  type CharacterForPacket,
} from '../src/packet-compiler.js'

describe('estimateTokens', () => {
  it('estimates Chinese text tokens', () => {
    const tokens = estimateTokens('林凡站在演武场上')
    expect(tokens).toBeGreaterThan(0)
    expect(tokens).toBeLessThan(50)
  })

  it('estimates English text tokens', () => {
    const tokens = estimateTokens('The hero stood in the arena')
    expect(tokens).toBeGreaterThan(0)
  })

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })
})

describe('PacketCompiler', () => {
  it('compiles sections by priority', () => {
    const compiler = new PacketCompiler({ tokenBudget: 10000, workerType: 'writer' })
    compiler
      .addSection('blueprint', 'Scene 1: Hero fights villain', 0)
      .addSection('style', 'Write in third person past tense', 0)
      .addSection('canon', 'The world has magic systems', 1)
      .addSection('summary', 'Previous chapter summary here', 2)

    const packet = compiler.compile()
    expect(packet.sections.length).toBe(4)
    expect(packet.sections[0].key).toBe('blueprint') // P0 first
    expect(packet.totalTokens).toBeGreaterThan(0)
    expect(packet.workerType).toBe('writer')
  })

  it('respects token budget', () => {
    const compiler = new PacketCompiler({ tokenBudget: 10, workerType: 'writer' })
    compiler
      .addSection('small', 'hi', 0)
      .addSection('large', 'a'.repeat(1000), 1)

    const packet = compiler.compile()
    // Should include 'small' but not 'large' due to budget
    expect(packet.sections.length).toBe(1)
    expect(packet.sections[0].key).toBe('small')
  })

  it('tracks included characters', () => {
    const compiler = new PacketCompiler({ tokenBudget: 10000, workerType: 'writer' })
    compiler
      .addSection('character:lin_fan', '林凡 state data', 1)
      .addSection('character:su_yuqing', '苏雨晴 state data', 1)
      .addSection('blueprint', 'scene details', 0)

    const packet = compiler.compile()
    expect(packet.includedCharacters).toContain('lin_fan')
    expect(packet.includedCharacters).toContain('su_yuqing')
  })

  it('generates prompt string', () => {
    const compiler = new PacketCompiler({ tokenBudget: 10000, workerType: 'writer' })
    compiler.addSection('blueprint', 'Fight scene', 0)
    compiler.addSection('style', 'Third person', 0)

    const prompt = compiler.toPromptString()
    expect(prompt).toContain('## blueprint')
    expect(prompt).toContain('## style')
    expect(prompt).toContain('Fight scene')
  })
})

describe('filterCharactersByTier', () => {
  const characters: CharacterForPacket[] = [
    { characterKey: 'lin_fan', name: '林凡', tier: 'core', stateJson: '{}' },
    { characterKey: 'su_yuqing', name: '苏雨晴', tier: 'core', stateJson: '{}' },
    { characterKey: 'lin_haotian', name: '林浩天', tier: 'important', stateJson: '{}' },
    { characterKey: 'herb_guard', name: '药园守卫', tier: 'episodic', stateJson: '{}' },
    { characterKey: 'lin_laosan', name: '林老三', tier: 'important', stateJson: '{}' },
  ]

  it('always includes core characters', () => {
    const result = filterCharactersByTier(characters, [])
    expect(result.map((c) => c.characterKey)).toContain('lin_fan')
    expect(result.map((c) => c.characterKey)).toContain('su_yuqing')
  })

  it('includes important characters only if in scene', () => {
    const result = filterCharactersByTier(characters, ['lin_haotian'])
    expect(result.map((c) => c.characterKey)).toContain('lin_haotian')
    expect(result.map((c) => c.characterKey)).not.toContain('lin_laosan')
  })

  it('includes episodic characters only if in scene', () => {
    const result = filterCharactersByTier(characters, ['herb_guard'])
    expect(result.map((c) => c.characterKey)).toContain('herb_guard')
  })

  it('excludes episodic characters not in scene', () => {
    const result = filterCharactersByTier(characters, ['lin_haotian'])
    expect(result.map((c) => c.characterKey)).not.toContain('herb_guard')
  })

  it('returns only core when scene list is empty', () => {
    const result = filterCharactersByTier(characters, [])
    expect(result.length).toBe(2) // only core characters
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd packages/orchestrator && pnpm test
```

Expected: 28+ tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/orchestrator/
git commit -m "feat(m4): add packet compiler with token budget + tier filtering"
```

---

### Task 5: Task Dispatcher + Index Exports

**Files:**
- Create: `packages/orchestrator/src/task-dispatcher.ts`
- Create: `packages/orchestrator/__tests__/task-dispatcher.test.ts`
- Modify: `packages/orchestrator/src/index.ts`

- [ ] **Step 1: Create task-dispatcher.ts**

```typescript
import type { TaskRecord, SafetyLimits } from './types.js'
import { SafetyGuard } from './safety.js'
import { DEFAULT_SAFETY_LIMITS } from './types.js'

export class TaskDispatcher {
  private guard: SafetyGuard
  private tasks: TaskRecord[] = []
  private actionId: number = 0

  constructor(limits: SafetyLimits = DEFAULT_SAFETY_LIMITS) {
    this.guard = new SafetyGuard(limits)
  }

  startNewAction(): void {
    this.actionId++
    this.guard.resetForNewAction()
  }

  dispatch(
    projectId: string,
    taskType: string,
    worker: string,
    estimatedTokens: number = 0,
  ): TaskRecord {
    const check = this.guard.canDispatch(estimatedTokens)
    if (!check.allowed) {
      throw new Error(`Dispatch blocked: ${check.reason}`)
    }

    const task: TaskRecord = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId,
      taskType,
      assignedWorker: worker,
      status: 'pending',
    }

    this.tasks.push(task)
    return task
  }

  completeTask(
    taskId: string,
    result: { tokensInput: number; tokensOutput: number; costUsd: number; durationMs: number },
  ): void {
    const task = this.tasks.find((t) => t.id === taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)

    task.status = 'completed'
    task.tokensInput = result.tokensInput
    task.tokensOutput = result.tokensOutput
    task.estimatedCostUsd = result.costUsd
    task.durationMs = result.durationMs

    this.guard.recordTask(result.tokensInput + result.tokensOutput)
  }

  failTask(taskId: string, error: string): void {
    const task = this.tasks.find((t) => t.id === taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)
    task.status = 'failed'
    task.error = error
  }

  getTasks(): TaskRecord[] {
    return [...this.tasks]
  }

  getStats() {
    return this.guard.getStats()
  }
}
```

- [ ] **Step 2: Create task-dispatcher test**

```typescript
import { describe, it, expect } from 'vitest'
import { TaskDispatcher } from '../src/task-dispatcher.js'

describe('TaskDispatcher', () => {
  it('dispatches a task', () => {
    const dispatcher = new TaskDispatcher()
    dispatcher.startNewAction()
    const task = dispatcher.dispatch('proj1', 'plan', 'planner', 1000)
    expect(task.status).toBe('pending')
    expect(task.assignedWorker).toBe('planner')
  })

  it('completes a task with stats', () => {
    const dispatcher = new TaskDispatcher()
    dispatcher.startNewAction()
    const task = dispatcher.dispatch('proj1', 'write', 'writer', 5000)
    dispatcher.completeTask(task.id, {
      tokensInput: 5000,
      tokensOutput: 3000,
      costUsd: 0.05,
      durationMs: 2000,
    })
    const tasks = dispatcher.getTasks()
    expect(tasks[0].status).toBe('completed')
    expect(tasks[0].tokensInput).toBe(5000)
    expect(tasks[0].estimatedCostUsd).toBe(0.05)
  })

  it('blocks after 5 tasks in one action', () => {
    const dispatcher = new TaskDispatcher()
    dispatcher.startNewAction()
    for (let i = 0; i < 5; i++) {
      const task = dispatcher.dispatch('proj1', 'task', 'worker', 100)
      dispatcher.completeTask(task.id, {
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: 0.001,
        durationMs: 100,
      })
    }
    expect(() => dispatcher.dispatch('proj1', 'task', 'worker', 100)).toThrow('Dispatch blocked')
  })

  it('resets on new action', () => {
    const dispatcher = new TaskDispatcher()
    dispatcher.startNewAction()
    for (let i = 0; i < 5; i++) {
      const task = dispatcher.dispatch('proj1', 'task', 'worker', 100)
      dispatcher.completeTask(task.id, {
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: 0.001,
        durationMs: 100,
      })
    }
    dispatcher.startNewAction()
    // Should work again
    const task = dispatcher.dispatch('proj1', 'task', 'worker', 100)
    expect(task.status).toBe('pending')
  })

  it('fails a task', () => {
    const dispatcher = new TaskDispatcher()
    dispatcher.startNewAction()
    const task = dispatcher.dispatch('proj1', 'write', 'writer')
    dispatcher.failTask(task.id, 'LLM timeout')
    expect(dispatcher.getTasks()[0].status).toBe('failed')
    expect(dispatcher.getTasks()[0].error).toBe('LLM timeout')
  })
})
```

- [ ] **Step 3: Update index.ts with all exports**

```typescript
// State machine
export { WorkflowStateMachine } from './state-machine.js'

// Packet compiler
export { PacketCompiler, estimateTokens, filterCharactersByTier } from './packet-compiler.js'
export type { PacketCompilerOptions, CharacterForPacket, CharacterTier } from './packet-compiler.js'

// Safety
export { SafetyGuard } from './safety.js'

// Task dispatcher
export { TaskDispatcher } from './task-dispatcher.js'

// Types
export type {
  WorkflowPhase,
  IntentType,
  ClassifiedIntent,
  PacketSection,
  CompiledPacket,
  TaskRecord,
  SafetyLimits,
} from './types.js'
export { DEFAULT_SAFETY_LIMITS } from './types.js'
```

- [ ] **Step 4: Run all tests**

```bash
cd packages/orchestrator && pnpm test
```

Expected: 33+ tests pass.

- [ ] **Step 5: Verify full workspace**

```bash
pnpm test
```

Expected: all packages pass.

- [ ] **Step 6: Commit**

```bash
git add packages/orchestrator/
git commit -m "feat(m4): add task dispatcher + public API exports"
```

---

## M4 Acceptance Checklist

- [ ] State machine validates all transitions (10 test cases)
- [ ] Safety guard blocks at 5 tasks, oversized packets, and total budget
- [ ] Packet compiler respects token budget and priority ordering
- [ ] Character filtering: core=always, important/episodic=scene-only
- [ ] Task dispatcher tracks task lifecycle (pending→completed/failed)
- [ ] New user action resets safety counters
- [ ] All exports available from packages/orchestrator
- [ ] 33+ tests pass
