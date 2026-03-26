import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Database } from '../db/index.js'
import { artifacts } from '../db/schema/index.js'

export function artifactRoutes(db: Database) {
  const app = new Hono()

  app.get('/:projectId/artifacts', async (c) => {
    const results = await db.select().from(artifacts).where(eq(artifacts.projectId, c.req.param('projectId')))
    return c.json(results)
  })

  app.get('/artifacts/:id', async (c) => {
    const [artifact] = await db.select().from(artifacts).where(eq(artifacts.id, c.req.param('id')))
    if (!artifact) return c.json({ error: 'Not found' }, 404)
    return c.json(artifact)
  })

  app.post('/:projectId/artifacts', async (c) => {
    const body = await c.req.json()
    body.projectId = c.req.param('projectId')
    const [artifact] = await db.insert(artifacts).values(body).returning()
    return c.json(artifact, 201)
  })

  app.post('/artifacts/:id/confirm', async (c) => {
    const [updated] = await db.update(artifacts)
      .set({ status: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() })
      .where(eq(artifacts.id, c.req.param('id')))
      .returning()
    if (!updated) return c.json({ error: 'Not found' }, 404)
    return c.json(updated)
  })

  app.post('/artifacts/:id/reject', async (c) => {
    const [updated] = await db.update(artifacts)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(artifacts.id, c.req.param('id')))
      .returning()
    if (!updated) return c.json({ error: 'Not found' }, 404)
    return c.json(updated)
  })

  return app
}
