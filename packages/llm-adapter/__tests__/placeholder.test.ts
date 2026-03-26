import { describe, it, expect } from 'vitest'
import { PACKAGE_NAME } from '../src/index.js'

describe('llm-adapter', () => {
  it('exports package name', () => {
    expect(PACKAGE_NAME).toBe('@novel-studio/llm-adapter')
  })
})
