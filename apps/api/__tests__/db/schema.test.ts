import { describe, it, expect } from 'vitest'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../../src/db/schema/index.js'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

describe('database schemas', () => {
  it('can query projects', async () => {
    const results = await db.select().from(schema.projects)
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].title).toBe('吞天魔帝')
  })

  it('can query project template with dynamic dimensions', async () => {
    const results = await db.select().from(schema.projectTemplates)
    expect(results.length).toBeGreaterThanOrEqual(1)
    const t = results[0]
    expect(t.genreJson.primary).toBe('玄幻')
    expect(t.characterDimensionsJson.length).toBe(3)
    expect(t.characterDimensionsJson[0].key).toBe('realm')
  })

  it('can query characters with tiers and dynamic dimensions', async () => {
    const results = await db.select().from(schema.characterStates)
    expect(results.length).toBeGreaterThanOrEqual(3)

    const core = results.find((c) => c.tier === 'core')
    expect(core).toBeDefined()
    expect(core!.name).toBe('林凡')
    expect((core!.dimensionsJson as Record<string, unknown>).realm).toBe('炼气三层')

    const episodic = results.find((c) => c.tier === 'episodic')
    expect(episodic).toBeDefined()
    expect(episodic!.name).toBe('药园守卫')
  })

  it('can query relationships with base + custom scores', async () => {
    const results = await db.select().from(schema.relationshipStates)
    expect(results.length).toBeGreaterThanOrEqual(2)

    const enemy = results.find((r) => r.relationshipType === '死敌')
    expect(enemy).toBeDefined()
    expect(enemy!.baseScoresJson.trust).toBe(0)
    expect((enemy!.customScoresJson as Record<string, number>).hatred).toBe(95)
  })

  it('can query story bible entries', async () => {
    const results = await db.select().from(schema.storyBibleEntries)
    expect(results.length).toBeGreaterThanOrEqual(2)
  })

  it('can query artifacts', async () => {
    const results = await db.select().from(schema.artifacts)
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].type).toBe('outline')
    expect(results[0].status).toBe('draft')
  })
})
