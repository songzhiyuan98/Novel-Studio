import { describe, it, expect } from 'vitest'
import { SafetyGuard } from '../src/safety.js'
import type { SafetyLimits } from '../src/types.js'

describe('SafetyGuard', () => {
  const limits: SafetyLimits = { maxTasksPerAction: 5, maxTokensPerTask: 50_000, maxTotalTokensPerAction: 150_000 }

  it('allows first task', () => {
    const guard = new SafetyGuard(limits)
    expect(guard.canDispatch(1000).allowed).toBe(true)
  })

  it('blocks after max tasks reached', () => {
    const guard = new SafetyGuard(limits)
    for (let i = 0; i < 5; i++) guard.recordTask(1000)
    const result = guard.canDispatch(1000)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Task limit reached')
  })

  it('blocks oversized packet', () => {
    const guard = new SafetyGuard(limits)
    const result = guard.canDispatch(60_000)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Packet too large')
  })

  it('blocks when total budget exhausted', () => {
    const guard = new SafetyGuard(limits)
    guard.recordTask(145_000)
    const result = guard.canDispatch(10_000)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Total token budget')
  })

  it('resets for new user action', () => {
    const guard = new SafetyGuard(limits)
    for (let i = 0; i < 5; i++) guard.recordTask(1000)
    expect(guard.canDispatch().allowed).toBe(false)
    guard.resetForNewAction()
    expect(guard.canDispatch().allowed).toBe(true)
  })

  it('tracks stats correctly', () => {
    const guard = new SafetyGuard(limits)
    guard.recordTask(2000)
    guard.recordTask(3000)
    const stats = guard.getStats()
    expect(stats.taskCount).toBe(2)
    expect(stats.totalTokens).toBe(5000)
  })
})
