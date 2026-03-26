import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Database } from '../db/index.js'
import { chapters, chapterSummaries } from '../db/schema/index.js'

export function chapterRoutes(db: Database) {
  const app = new Hono()

  app.get('/:projectId/chapters', async (c) => {
    const results = await db.select().from(chapters).where(eq(chapters.projectId, c.req.param('projectId')))
    return c.json(results)
  })

  app.get('/chapters/:id', async (c) => {
    const [chapter] = await db.select().from(chapters).where(eq(chapters.id, c.req.param('id')))
    if (!chapter) return c.json({ error: 'Not found' }, 404)
    return c.json(chapter)
  })

  app.get('/chapters/:id/summary', async (c) => {
    const [summary] = await db.select().from(chapterSummaries).where(eq(chapterSummaries.chapterId, c.req.param('id')))
    if (!summary) return c.json({ error: 'Not found' }, 404)
    return c.json(summary)
  })

  return app
}
