import { describe, it, expect } from 'vitest'
import { WorkflowStateMachine } from '../src/state-machine.js'

describe('WorkflowStateMachine', () => {
  it('starts at bootstrap', () => {
    const sm = new WorkflowStateMachine()
    expect(sm.getPhase()).toBe('bootstrap')
  })

  it('allows bootstrap → foundation', () => {
    const sm = new WorkflowStateMachine()
    expect(sm.canTransition('foundation')).toBe(true)
    sm.transition('foundation')
    expect(sm.getPhase()).toBe('foundation')
  })

  it('allows full chapter cycle: plan → blueprint_confirm → write → qa → canonize', () => {
    const sm = new WorkflowStateMachine('idle')
    sm.transition('plan')
    sm.transition('blueprint_confirm')
    sm.transition('write')
    sm.transition('qa')
    sm.transition('canonize')
    expect(sm.getPhase()).toBe('canonize')
  })

  it('allows canonize → plan (next chapter)', () => {
    const sm = new WorkflowStateMachine('canonize')
    sm.transition('plan')
    expect(sm.getPhase()).toBe('plan')
  })

  it('allows qa → idle (revision needed)', () => {
    const sm = new WorkflowStateMachine('qa')
    sm.transition('idle')
    expect(sm.getPhase()).toBe('idle')
  })

  it('allows blueprint_confirm → plan (re-plan)', () => {
    const sm = new WorkflowStateMachine('blueprint_confirm')
    sm.transition('plan')
    expect(sm.getPhase()).toBe('plan')
  })

  it('rejects write → plan (invalid)', () => {
    const sm = new WorkflowStateMachine('write')
    expect(sm.canTransition('plan')).toBe(false)
    expect(() => sm.transition('plan')).toThrow('Invalid transition')
  })

  it('rejects plan → write (must confirm blueprint first)', () => {
    const sm = new WorkflowStateMachine('plan')
    expect(sm.canTransition('write')).toBe(false)
    expect(() => sm.transition('write')).toThrow('Invalid transition')
  })

  it('rejects bootstrap → write (skipping steps)', () => {
    const sm = new WorkflowStateMachine()
    expect(() => sm.transition('write')).toThrow('Invalid transition')
  })

  it('reset puts machine to idle', () => {
    const sm = new WorkflowStateMachine('write')
    sm.reset()
    expect(sm.getPhase()).toBe('idle')
  })
})
