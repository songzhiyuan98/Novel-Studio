import { describe, it, expect } from 'vitest'
import { estimateCost, formatCost } from '../src/token-counter.js'

describe('estimateCost', () => {
  it('calculates GPT-4o cost correctly', () => {
    const cost = estimateCost('gpt-4o', 1000, 500)
    expect(cost.inputCost).toBeCloseTo(0.0025)
    expect(cost.outputCost).toBeCloseTo(0.005)
    expect(cost.totalCost).toBeCloseTo(0.0075)
    expect(cost.currency).toBe('USD')
  })

  it('calculates GPT-4o-mini cost correctly', () => {
    const cost = estimateCost('gpt-4o-mini', 5000, 2000)
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
