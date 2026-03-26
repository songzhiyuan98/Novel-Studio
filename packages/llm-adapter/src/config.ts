import type { ModelConfigInput, ModelSelection, WorkerRole } from './types.js'
import { getDefaultModelForWorker } from './providers.js'

export function resolveModelForWorker(
  config: ModelConfigInput,
  worker: WorkerRole,
): ModelSelection {
  if (config.configMode === 'advanced' && config.workers?.[worker]) {
    const w = config.workers[worker]!
    return {
      provider: w.provider,
      model: w.model,
      apiKey: w.apiKey || config.defaultApiKey || '',
    }
  }

  const provider = config.defaultProvider || 'openai'
  const apiKey = config.defaultApiKey || ''
  const model = getDefaultModelForWorker(provider, worker)

  return { provider, model, apiKey }
}
