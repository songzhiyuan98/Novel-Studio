import { describe, it, expect } from 'vitest'
import { app } from '../src/app.js'

describe('api', () => {
  it('returns health check', async () => {
    const res = await app.request('/health')
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.status).toBe('ok')
  })

  it('returns root info with core dependency', async () => {
    const res = await app.request('/')
    const json = await res.json()
    expect(json.name).toBe('Novel Studio API')
    expect(json.core).toBe('@novel-studio/core')
  })
})
