import type { WorkflowPhase } from './types.js'

const VALID_TRANSITIONS: Record<WorkflowPhase, WorkflowPhase[]> = {
  bootstrap: ['foundation'],
  foundation: ['plan', 'idle'],
  idle: ['plan'],
  plan: ['blueprint_confirm'],
  blueprint_confirm: ['write', 'plan'],
  write: ['qa'],
  qa: ['canonize', 'idle'],
  canonize: ['plan', 'idle'],
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
