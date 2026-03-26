import { generateText, streamText, type CoreMessage } from 'ai'
import { createLanguageModel } from './providers.js'
import { estimateCost } from './token-counter.js'
import type { ModelSelection, LLMResult, LLMStreamCallbacks } from './types.js'

export interface GenerateOptions {
  model: ModelSelection
  messages: CoreMessage[]
  maxTokens?: number
  temperature?: number
}

export async function llmGenerateText(options: GenerateOptions): Promise<LLMResult> {
  const { model, messages, maxTokens = 4096, temperature = 0.7 } = options
  const languageModel = createLanguageModel(model.provider, model.model, model.apiKey)

  const start = Date.now()

  const result = await generateText({
    model: languageModel,
    messages,
    maxTokens,
    temperature,
  })

  const durationMs = Date.now() - start
  const tokensInput = result.usage?.promptTokens ?? 0
  const tokensOutput = result.usage?.completionTokens ?? 0
  const cost = estimateCost(model.model, tokensInput, tokensOutput)

  return {
    text: result.text,
    tokensInput,
    tokensOutput,
    tokensTotal: tokensInput + tokensOutput,
    estimatedCostUsd: cost.totalCost,
    durationMs,
    model: model.model,
    provider: model.provider,
  }
}

export async function llmStreamText(
  options: GenerateOptions,
  callbacks: LLMStreamCallbacks = {},
): Promise<LLMResult> {
  const { model, messages, maxTokens = 4096, temperature = 0.7 } = options
  const languageModel = createLanguageModel(model.provider, model.model, model.apiKey)

  const start = Date.now()
  let fullText = ''

  const result = streamText({
    model: languageModel,
    messages,
    maxTokens,
    temperature,
  })

  for await (const chunk of result.textStream) {
    fullText += chunk
    callbacks.onChunk?.(chunk)
  }

  const usage = await result.usage
  const durationMs = Date.now() - start
  const tokensInput = usage?.promptTokens ?? 0
  const tokensOutput = usage?.completionTokens ?? 0
  const cost = estimateCost(model.model, tokensInput, tokensOutput)

  const llmResult: LLMResult = {
    text: fullText,
    tokensInput,
    tokensOutput,
    tokensTotal: tokensInput + tokensOutput,
    estimatedCostUsd: cost.totalCost,
    durationMs,
    model: model.model,
    provider: model.provider,
  }

  callbacks.onDone?.(llmResult)
  return llmResult
}
