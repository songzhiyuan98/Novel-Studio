import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import type { Database } from '../db/index.js'
import { projects, projectTemplates } from '../db/schema/index.js'

export function projectRoutes(db: Database) {
  const app = new Hono()

  app.get('/templates', async (c) => {
    const results = await db.select().from(projectTemplates)
    return c.json(results)
  })

  app.post('/templates', async (c) => {
    const body = await c.req.json()
    const [template] = await db.insert(projectTemplates).values(body).returning()
    return c.json(template, 201)
  })

  app.get('/templates/:id', async (c) => {
    const [template] = await db.select().from(projectTemplates).where(eq(projectTemplates.id, c.req.param('id')))
    if (!template) return c.json({ error: 'Not found' }, 404)
    return c.json(template)
  })

  app.get('/', async (c) => {
    const results = await db.select().from(projects)
    return c.json(results)
  })

  app.post('/', async (c) => {
    const body = await c.req.json()
    const [project] = await db.insert(projects).values(body).returning()
    return c.json(project, 201)
  })

  app.get('/:id', async (c) => {
    const [project] = await db.select().from(projects).where(eq(projects.id, c.req.param('id')))
    if (!project) return c.json({ error: 'Not found' }, 404)
    return c.json(project)
  })

  return app
}
