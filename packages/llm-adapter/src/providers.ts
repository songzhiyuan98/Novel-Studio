import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModelV1 } from 'ai'

const PROVIDER_DEFAULTS: Record<string, { chat: string; strong: string; fast: string }> = {
  openai: { chat: 'gpt-4o-mini', strong: 'gpt-4o', fast: 'gpt-4o-mini' },
}

const WORKER_MODEL_TIER: Record<string, 'chat' | 'strong' | 'fast'> = {
  chat: 'chat',
  planner: 'strong',
  writer: 'strong',
  qa: 'chat',
  summarizer: 'fast',
}

export function getDefaultModelForWorker(provider: string, worker: string): string {
  const defaults = PROVIDER_DEFAULTS[provider]
  if (!defaults) throw new Error(`Unknown provider: ${provider}`)
  const tier = WORKER_MODEL_TIER[worker] || 'chat'
  return defaults[tier]
}

export function createLanguageModel(provider: string, model: string, apiKey: string): LanguageModelV1 {
  switch (provider) {
    case 'openai': {
      const openai = createOpenAI({ apiKey })
      return openai(model)
    }
    default:
      throw new Error(`Unsupported provider: ${provider}. Supported: openai`)
  }
}
