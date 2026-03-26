import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Database } from '../db/index.js'
import { storyBibleEntries, timelineEvents, unresolvedThreads, developmentChains } from '../db/schema/index.js'

export function canonRoutes(db: Database) {
  const app = new Hono()

  app.get('/:projectId/canon/world-rules', async (c) => {
    const results = await db.select().from(storyBibleEntries).where(eq(storyBibleEntries.projectId, c.req.param('projectId')))
    return c.json(results)
  })

  app.get('/:projectId/canon/timeline', async (c) => {
    const results = await db.select().from(timelineEvents).where(eq(timelineEvents.projectId, c.req.param('projectId')))
    return c.json(results)
  })

  app.get('/:projectId/canon/threads', async (c) => {
    const results = await db.select().from(unresolvedThreads).where(eq(unresolvedThreads.projectId, c.req.param('projectId')))
    return c.json(results)
  })

  app.get('/:projectId/canon/chains', async (c) => {
    const results = await db.select().from(developmentChains).where(eq(developmentChains.projectId, c.req.param('projectId')))
    return c.json(results)
  })

  return app
}
