import { pgTable, uuid, text, integer, real, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  eventType: text('event_type').notNull(),
  actor: text('actor').notNull(),
  targetType: text('target_type'),
  targetId: uuid('target_id'),
  detailsJson: jsonb('details_json'),
  tokensUsed: integer('tokens_used'),
  costUsd: real('cost_usd'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  intentClassification: text('intent_classification'),
  relatedTaskIdsJson: jsonb('related_task_ids_json').$type<string[]>(),
  relatedArtifactIdsJson: jsonb('related_artifact_ids_json').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
