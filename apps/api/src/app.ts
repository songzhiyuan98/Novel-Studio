import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { db } from './db/index.js'
import { projectRoutes } from './routes/projects.js'
import { characterRoutes } from './routes/characters.js'
import { artifactRoutes } from './routes/artifacts.js'
import { chapterRoutes } from './routes/chapters.js'
import { canonRoutes } from './routes/canon.js'
import { modelConfigRoutes } from './routes/model-config.js'

const app = new Hono()

app.use('*', cors())

app.get('/health', (c) => c.json({ status: 'ok' }))

app.route('/api/projects', projectRoutes(db))
app.route('/api/projects', characterRoutes(db))
app.route('/api/projects', artifactRoutes(db))
app.route('/api/projects', chapterRoutes(db))
app.route('/api/projects', canonRoutes(db))
app.route('/api/projects', modelConfigRoutes(db))

export { app }
