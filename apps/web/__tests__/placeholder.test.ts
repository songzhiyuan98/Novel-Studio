import { describe, it, expect } from 'vitest'
import { PACKAGE_NAME } from '@novel-studio/core'

describe('web', () => {
  it('can import from core package', () => {
    expect(PACKAGE_NAME).toBe('@novel-studio/core')
  })
})
