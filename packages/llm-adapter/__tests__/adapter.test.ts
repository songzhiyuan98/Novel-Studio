import { describe, it, expect } from 'vitest'
import type { ModelSelection, LLMResult } from '../src/types.js'

describe('adapter types', () => {
  it('ModelSelection has required fields', () => {
    const selection: ModelSelection = {
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'sk-test',
    }
    expect(selection.provider).toBe('openai')
    expect(selection.model).toBe('gpt-4o-mini')
  })

  it('LLMResult has all tracking fields', () => {
    const result: LLMResult = {
      text: 'hello',
      tokensInput: 100,
      tokensOutput: 50,
      tokensTotal: 150,
      estimatedCostUsd: 0.001,
      durationMs: 500,
      model: 'gpt-4o-mini',
      provider: 'openai',
    }
    expect(result.tokensTotal).toBe(150)
    expect(result.estimatedCostUsd).toBeGreaterThan(0)
  })
})
