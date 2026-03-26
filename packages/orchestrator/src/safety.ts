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
      return { allowed: false, reason: `Task limit reached (${this.taskCount}/${this.limits.maxTasksPerAction}). User action required.` }
    }
    if (estimatedInputTokens > this.limits.maxTokensPerTask) {
      return { allowed: false, reason: `Packet too large (${estimatedInputTokens} tokens > ${this.limits.maxTokensPerTask} limit).` }
    }
    if (this.totalTokens + estimatedInputTokens > this.limits.maxTotalTokensPerAction) {
      return { allowed: false, reason: `Total token budget exhausted (${this.totalTokens + estimatedInputTokens} > ${this.limits.maxTotalTokensPerAction}).` }
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
    return { taskCount: this.taskCount, totalTokens: this.totalTokens, limits: this.limits }
  }
}
