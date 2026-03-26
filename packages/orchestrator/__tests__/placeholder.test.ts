import { describe, it, expect } from 'vitest'
import { PACKAGE_NAME, CORE } from '../src/index.js'

describe('orchestrator', () => {
  it('exports package name', () => {
    expect(PACKAGE_NAME).toBe('@novel-studio/orchestrator')
  })
  it('can import from core', () => {
    expect(CORE).toBe('@novel-studio/core')
  })
})
