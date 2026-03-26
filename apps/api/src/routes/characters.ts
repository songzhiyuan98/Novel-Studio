import { Hono } from 'hono'
import { eq, and } from 'drizzle-orm'
import type { Database } from '../db/index.js'
import { characterStates } from '../db/schema/index.js'

export function characterRoutes(db: Database) {
  const app = new Hono()

  app.get('/:projectId/characters', async (c) => {
    const projectId = c.req.param('projectId')
    const tier = c.req.query('tier')
    const conditions = [eq(characterStates.projectId, projectId)]
    if (tier) {
      conditions.push(eq(characterStates.tier, tier as 'core' | 'important' | 'episodic'))
    }
    const results = await db.select().from(characterStates).where(and(...conditions))
    return c.json(results)
  })

  app.post('/:projectId/characters', async (c) => {
    const body = await c.req.json()
    body.projectId = c.req.param('projectId')
    const [char] = await db.insert(characterStates).values(body).returning()
    return c.json(char, 201)
  })

  app.patch('/:projectId/characters/:key', async (c) => {
    const projectId = c.req.param('projectId')
    const characterKey = c.req.param('key')
    const body = await c.req.json()
    const [updated] = await db.update(characterStates)
      .set({ ...body, updatedAt: new Date() })
      .where(and(eq(characterStates.projectId, projectId), eq(characterStates.characterKey, characterKey)))
      .returning()
    if (!updated) return c.json({ error: 'Not found' }, 404)
    return c.json(updated)
  })

  return app
}
