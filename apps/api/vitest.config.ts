import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'postgresql://novel_studio:novel_studio_dev@localhost:5432/novel_studio',
    },
  },
})
