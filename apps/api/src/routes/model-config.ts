import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Database } from '../db/index.js'
import { modelConfigs } from '../db/schema/index.js'

export function modelConfigRoutes(db: Database) {
  const app = new Hono()

  app.get('/:projectId/model-config', async (c) => {
    const [config] = await db.select().from(modelConfigs).where(eq(modelConfigs.projectId, c.req.param('projectId')))
    if (!config) return c.json({ error: 'Not found' }, 404)
    return c.json(config)
  })

  app.put('/:projectId/model-config', async (c) => {
    const body = await c.req.json()
    const projectId = c.req.param('projectId')
    const existing = await db.select().from(modelConfigs).where(eq(modelConfigs.projectId, projectId))
    if (existing.length > 0) {
      const [updated] = await db.update(modelConfigs).set({ ...body, updatedAt: new Date() }).where(eq(modelConfigs.projectId, projectId)).returning()
      return c.json(updated)
    }
    const [created] = await db.insert(modelConfigs).values({ ...body, projectId }).returning()
    return c.json(created, 201)
  })

  return app
}
