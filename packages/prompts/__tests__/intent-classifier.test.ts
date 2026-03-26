import { describe, it, expect } from 'vitest'
import { intentSchema } from '../src/chat-agent/intent-classifier.js'

describe('Intent classifier schema', () => {
  it('validates casual intent', () => {
    const result = intentSchema.parse({ type: 'casual', confidence: 0.95, explanation: 'Name suggestions' })
    expect(result.type).toBe('casual')
  })

  it('validates pipeline_task intent', () => {
    const result = intentSchema.parse({ type: 'pipeline_task', confidence: 0.9, explanation: 'Write next chapter' })
    expect(result.type).toBe('pipeline_task')
  })

  it('validates canon_edit intent', () => {
    const result = intentSchema.parse({ type: 'canon_edit', confidence: 0.85, explanation: 'Rename character' })
    expect(result.type).toBe('canon_edit')
  })

  it('validates setting_change intent', () => {
    const result = intentSchema.parse({ type: 'setting_change', confidence: 0.8, explanation: 'Change power system' })
    expect(result.type).toBe('setting_change')
  })

  it('rejects invalid type', () => {
    expect(() => intentSchema.parse({ type: 'unknown', confidence: 0.5, explanation: '' })).toThrow()
  })

  it('rejects confidence out of range', () => {
    expect(() => intentSchema.parse({ type: 'casual', confidence: 1.5, explanation: '' })).toThrow()
  })
})
