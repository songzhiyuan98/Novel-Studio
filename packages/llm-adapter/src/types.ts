export type WorkerRole = 'chat' | 'planner' | 'writer' | 'qa' | 'summarizer'

export interface ModelSelection {
  provider: string
  model: string
  apiKey: string
}

export interface ModelConfigInput {
  configMode: 'simple' | 'advanced'
  defaultProvider?: string
  defaultApiKey?: string
  workers?: Partial<Record<WorkerRole, { provider: string; model: string; apiKey?: string }>>
}

export interface LLMResult {
  text: string
  tokensInput: number
  tokensOutput: number
  tokensTotal: number
  estimatedCostUsd: number
  durationMs: number
  model: string
  provider: string
}

export interface LLMStreamCallbacks {
  onChunk?: (chunk: string) => void
  onDone?: (result: LLMResult) => void
  onError?: (error: Error) => void
}

export interface TokenUsage {
  input: number
  output: number
  total: number
}

export interface CostEstimate {
  inputCost: number
  outputCost: number
  totalCost: number
  currency: 'USD'
}
