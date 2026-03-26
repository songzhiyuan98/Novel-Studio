import { describe, it, expect } from 'vitest'
import { app } from '../src/app.js'

describe('API routes', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
  })

  it('GET /api/projects returns array', async () => {
    const res = await app.request('/api/projects')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })

  it('GET /api/projects/templates returns array', async () => {
    const res = await app.request('/api/projects/templates')
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
  })
})
