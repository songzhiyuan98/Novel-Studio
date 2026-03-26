import type { TaskRecord, SafetyLimits } from './types.js'
import { SafetyGuard } from './safety.js'
import { DEFAULT_SAFETY_LIMITS } from './types.js'

export class TaskDispatcher {
  private guard: SafetyGuard
  private tasks: TaskRecord[] = []

  constructor(limits: SafetyLimits = DEFAULT_SAFETY_LIMITS) {
    this.guard = new SafetyGuard(limits)
  }

  startNewAction(): void {
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
