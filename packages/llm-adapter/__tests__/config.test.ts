import { describe, it, expect } from 'vitest'
import { resolveModelForWorker } from '../src/config.js'
import type { ModelConfigInput } from '../src/types.js'

describe('resolveModelForWorker', () => {
  const simpleConfig: ModelConfigInput = {
    configMode: 'simple',
    defaultProvider: 'openai',
    defaultApiKey: 'sk-test-key',
  }

  it('simple mode: writer gets strong model', () => {
    const result = resolveModelForWorker(simpleConfig, 'writer')
    expect(result.provider).toBe('openai')
    expect(result.model).toBe('gpt-4o')
    expect(result.apiKey).toBe('sk-test-key')
  })

  it('simple mode: summarizer gets fast model', () => {
    const result = resolveModelForWorker(simpleConfig, 'summarizer')
    expect(result.model).toBe('gpt-4o-mini')
  })

  it('simple mode: chat gets chat model', () => {
    const result = resolveModelForWorker(simpleConfig, 'chat')
    expect(result.model).toBe('gpt-4o-mini')
  })

  it('advanced mode: uses per-worker config', () => {
    const advancedConfig: ModelConfigInput = {
      configMode: 'advanced',
      defaultProvider: 'openai',
      defaultApiKey: 'sk-default',
      workers: {
        writer: { provider: 'openai', model: 'gpt-4o-2024-11-20', apiKey: 'sk-writer-key' },
      },
    }
    const result = resolveModelForWorker(advancedConfig, 'writer')
    expect(result.model).toBe('gpt-4o-2024-11-20')
    expect(result.apiKey).toBe('sk-writer-key')
  })

  it('advanced mode: falls back to simple for unconfigured workers', () => {
    const advancedConfig: ModelConfigInput = {
      configMode: 'advanced',
      defaultProvider: 'openai',
      defaultApiKey: 'sk-default',
      workers: {
        writer: { provider: 'openai', model: 'gpt-4o' },
      },
    }
    const result = resolveModelForWorker(advancedConfig, 'qa')
    expect(result.model).toBe('gpt-4o-mini')
    expect(result.apiKey).toBe('sk-default')
  })
})
