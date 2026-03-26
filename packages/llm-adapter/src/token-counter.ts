import type { CostEstimate } from './types.js'

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o-2024-11-20': { input: 2.5, output: 10 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-haiku-4-5': { input: 0.8, output: 4 },
  // DeepSeek — extremely cheap
  'deepseek-chat': { input: 0.27, output: 1.1 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
}

const DEFAULT_PRICING = { input: 5, output: 15 }

export function estimateCost(
  model: string,
  tokensInput: number,
  tokensOutput: number,
): CostEstimate {
  const pricing = MODEL_PRICING[model] || DEFAULT_PRICING
  const inputCost = (tokensInput / 1_000_000) * pricing.input
  const outputCost = (tokensOutput / 1_000_000) * pricing.output
  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    currency: 'USD',
  }
}

export function formatCost(cost: CostEstimate): string {
  return `$${cost.totalCost.toFixed(6)}`
}
