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
  priority: number
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
