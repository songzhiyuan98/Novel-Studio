import { Hono } from 'hono'
import { PACKAGE_NAME as CORE } from '@novel-studio/core'

const app = new Hono()

app.get('/', (c) => c.json({ name: 'Novel Studio API', core: CORE }))

app.get('/health', (c) => c.json({ status: 'ok' }))

export { app }
