# M3: LLM Adapter + Streaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a unified LLM adapter layer that wraps Vercel AI SDK, supports multiple providers, handles streaming, token counting, cost estimation, and per-worker model configuration.

**Architecture:** packages/llm-adapter wraps Vercel AI SDK with a unified interface. Model config is resolved per-worker from the database (ModelConfig table). Supports simple mode (one key) and advanced mode (per-worker). Streaming via AI SDK's native streaming.

**Tech Stack:** Vercel AI SDK (`ai`), `@ai-sdk/openai`, Zod for output validation

---

## File Structure

```
packages/llm-adapter/
├── src/
│   ├── index.ts                    # Re-export public API
│   ├── adapter.ts                  # Core LLMAdapter: generateText, streamText, generateObject
│   ├── config.ts                   # Model config resolution (simple/advanced mode)
│   ├── providers.ts                # Provider registry (OpenAI, extensible)
│   ├── token-counter.ts            # Token counting + cost estimation
│   └── types.ts                    # Shared types
└── __tests__/
    ├── config.test.ts              # Config resolution tests
    ├── token-counter.test.ts       # Token/cost calculation tests
    └── adapter.test.ts             # Adapter tests (with mocks)
```

---

### Task 1: Types + Provider Registry

**Files:**
- Create: `packages/llm-adapter/src/types.ts`
- Create: `packages/llm-adapter/src/providers.ts`

- [ ] **Step 1: Install AI SDK deps**

```bash
pnpm --filter @novel-studio/llm-adapter add ai @ai-sdk/openai zod
```

- [ ] **Step 2: Create types.ts**

```typescript
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
```

- [ ] **Step 3: Create providers.ts**

```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add packages/llm-adapter/src/types.ts packages/llm-adapter/src/providers.ts packages/llm-adapter/package.json pnpm-lock.yaml
git commit -m "feat(m3): add LLM adapter types + provider registry"
```

---

### Task 2: Model Config Resolution

**Files:**
- Create: `packages/llm-adapter/src/config.ts`
- Create: `packages/llm-adapter/__tests__/config.test.ts`

- [ ] **Step 1: Create config.ts**

```typescript
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
```

- [ ] **Step 2: Create config test**

```typescript
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
```

- [ ] **Step 3: Run tests**

```bash
cd packages/llm-adapter && pnpm test
```

Expected: 5 tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/llm-adapter/src/config.ts packages/llm-adapter/__tests__/config.test.ts
git commit -m "feat(m3): add model config resolution with simple/advanced modes"
```

---

### Task 3: Token Counter + Cost Estimation

**Files:**
- Create: `packages/llm-adapter/src/token-counter.ts`
- Create: `packages/llm-adapter/__tests__/token-counter.test.ts`

- [ ] **Step 1: Create token-counter.ts**

```typescript
import type { CostEstimate } from './types.js'

// Pricing per 1M tokens (USD) — updated as of 2026
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o-2024-11-20': { input: 2.5, output: 10 },
  // Claude models (for future)
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-opus-4-6': { input: 15, output: 75 },
  'claude-haiku-4-5': { input: 0.8, output: 4 },
}

const DEFAULT_PRICING = { input: 5, output: 15 } // conservative fallback

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
```

- [ ] **Step 2: Create token-counter test**

```typescript
import { describe, it, expect } from 'vitest'
import { estimateCost, formatCost } from '../src/token-counter.js'

describe('estimateCost', () => {
  it('calculates GPT-4o cost correctly', () => {
    const cost = estimateCost('gpt-4o', 1000, 500)
    // input: 1000/1M * 2.5 = 0.0025
    // output: 500/1M * 10 = 0.005
    expect(cost.inputCost).toBeCloseTo(0.0025)
    expect(cost.outputCost).toBeCloseTo(0.005)
    expect(cost.totalCost).toBeCloseTo(0.0075)
    expect(cost.currency).toBe('USD')
  })

  it('calculates GPT-4o-mini cost correctly', () => {
    const cost = estimateCost('gpt-4o-mini', 5000, 2000)
    // input: 5000/1M * 0.15 = 0.00075
    // output: 2000/1M * 0.6 = 0.0012
    expect(cost.totalCost).toBeCloseTo(0.00195)
  })

  it('uses fallback pricing for unknown model', () => {
    const cost = estimateCost('unknown-model', 1000, 1000)
    expect(cost.totalCost).toBeGreaterThan(0)
  })

  it('handles zero tokens', () => {
    const cost = estimateCost('gpt-4o', 0, 0)
    expect(cost.totalCost).toBe(0)
  })
})

describe('formatCost', () => {
  it('formats cost as dollar string', () => {
    const cost = estimateCost('gpt-4o', 1000, 500)
    const formatted = formatCost(cost)
    expect(formatted).toMatch(/^\$0\.00\d+/)
  })
})
```

- [ ] **Step 3: Run tests**

```bash
cd packages/llm-adapter && pnpm test
```

Expected: 10 tests pass (5 config + 5 token).

- [ ] **Step 4: Commit**

```bash
git add packages/llm-adapter/src/token-counter.ts packages/llm-adapter/__tests__/token-counter.test.ts
git commit -m "feat(m3): add token counting + cost estimation"
```

---

### Task 4: Core LLM Adapter (generateText + streamText)

**Files:**
- Create: `packages/llm-adapter/src/adapter.ts`
- Create: `packages/llm-adapter/__tests__/adapter.test.ts`
- Modify: `packages/llm-adapter/src/index.ts`

- [ ] **Step 1: Create adapter.ts**

```typescript
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
```

- [ ] **Step 2: Create adapter test (with mocks — no real API calls)**

```typescript
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
```

- [ ] **Step 3: Update index.ts to re-export public API**

```typescript
export { llmGenerateText, llmStreamText } from './adapter.js'
export type { GenerateOptions } from './adapter.js'
export { resolveModelForWorker } from './config.js'
export { estimateCost, formatCost } from './token-counter.js'
export { createLanguageModel, getDefaultModelForWorker } from './providers.js'
export type {
  WorkerRole,
  ModelSelection,
  ModelConfigInput,
  LLMResult,
  LLMStreamCallbacks,
  TokenUsage,
  CostEstimate,
} from './types.js'
```

- [ ] **Step 4: Run all tests**

```bash
cd packages/llm-adapter && pnpm test
```

Expected: 12 tests pass (5 config + 5 token + 2 adapter types).

- [ ] **Step 5: Verify the package can be imported from apps/api**

```bash
cd apps/api && pnpm test
```

Expected: existing tests still pass (the api already depends on @novel-studio/llm-adapter).

- [ ] **Step 6: Commit**

```bash
git add packages/llm-adapter/
git commit -m "feat(m3): add core LLM adapter with generateText + streamText"
```

---

## M3 Acceptance Checklist

- [ ] Config resolution: simple mode auto-selects models per worker tier
- [ ] Config resolution: advanced mode uses per-worker overrides
- [ ] Token counting: calculates correct cost for GPT-4o and GPT-4o-mini
- [ ] Adapter exports generateText and streamText functions
- [ ] All types properly exported from package
- [ ] 12+ tests pass
- [ ] Package importable from apps/api
