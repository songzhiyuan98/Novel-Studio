import { describe, it, expect } from 'vitest'
import { TaskDispatcher } from '../src/task-dispatcher.js'

describe('TaskDispatcher', () => {
  it('dispatches a task', () => {
    const dispatcher = new TaskDispatcher()
    dispatcher.startNewAction()
    const task = dispatcher.dispatch('proj1', 'plan', 'planner', 1000)
    expect(task.status).toBe('pending')
    expect(task.assignedWorker).toBe('planner')
  })

  it('completes a task with stats', () => {
    const dispatcher = new TaskDispatcher()
    dispatcher.startNewAction()
    const task = dispatcher.dispatch('proj1', 'write', 'writer', 5000)
    dispatcher.completeTask(task.id, {
      tokensInput: 5000,
      tokensOutput: 3000,
      costUsd: 0.05,
      durationMs: 2000,
    })
    const tasks = dispatcher.getTasks()
    expect(tasks[0].status).toBe('completed')
    expect(tasks[0].tokensInput).toBe(5000)
    expect(tasks[0].estimatedCostUsd).toBe(0.05)
  })

  it('blocks after 5 tasks in one action', () => {
    const dispatcher = new TaskDispatcher()
    dispatcher.startNewAction()
    for (let i = 0; i < 5; i++) {
      const task = dispatcher.dispatch('proj1', 'task', 'worker', 100)
      dispatcher.completeTask(task.id, {
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: 0.001,
        durationMs: 100,
      })
    }
    expect(() => dispatcher.dispatch('proj1', 'task', 'worker', 100)).toThrow('Dispatch blocked')
  })

  it('resets on new action', () => {
    const dispatcher = new TaskDispatcher()
    dispatcher.startNewAction()
    for (let i = 0; i < 5; i++) {
      const task = dispatcher.dispatch('proj1', 'task', 'worker', 100)
      dispatcher.completeTask(task.id, {
        tokensInput: 100,
        tokensOutput: 50,
        costUsd: 0.001,
        durationMs: 100,
      })
    }
    dispatcher.startNewAction()
    const task = dispatcher.dispatch('proj1', 'task', 'worker', 100)
    expect(task.status).toBe('pending')
  })

  it('fails a task', () => {
    const dispatcher = new TaskDispatcher()
    dispatcher.startNewAction()
    const task = dispatcher.dispatch('proj1', 'write', 'writer')
    dispatcher.failTask(task.id, 'LLM timeout')
    expect(dispatcher.getTasks()[0].status).toBe('failed')
    expect(dispatcher.getTasks()[0].error).toBe('LLM timeout')
  })
})
