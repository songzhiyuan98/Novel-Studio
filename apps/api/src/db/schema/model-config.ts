import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const modelConfigs = pgTable('model_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull().unique(),
  configMode: text('config_mode', { enum: ['simple', 'advanced'] }).notNull().default('simple'),
  defaultProvider: text('default_provider'),
  defaultApiKeyRef: text('default_api_key_ref'),
  chatProvider: text('chat_provider'),
  chatModel: text('chat_model'),
  plannerProvider: text('planner_provider'),
  plannerModel: text('planner_model'),
  writerProvider: text('writer_provider'),
  writerModel: text('writer_model'),
  qaProvider: text('qa_provider'),
  qaModel: text('qa_model'),
  summarizerProvider: text('summarizer_provider'),
  summarizerModel: text('summarizer_model'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
