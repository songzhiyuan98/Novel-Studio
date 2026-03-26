import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const artifacts = pgTable('artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  type: text('type', {
    enum: ['story_bible', 'world_rule', 'character_card', 'relationship_map', 'outline', 'scene_card', 'chapter_draft', 'qa_report', 'style_guide'],
  }).notNull(),
  title: text('title').notNull(),
  status: text('status', {
    enum: ['draft', 'reviewed', 'confirmed', 'rejected', 'archived', 'locked'],
  }).notNull().default('draft'),
  version: integer('version').notNull().default(1),
  parentArtifactId: uuid('parent_artifact_id'),
  sourceTaskId: uuid('source_task_id'),
  contentJson: jsonb('content_json'),
  sceneSegmentsJson: jsonb('scene_segments_json').$type<Array<{ sceneIndex: number; sceneKey: string; text: string }>>(),
  summaryText: text('summary_text'),
  confirmedAt: timestamp('confirmed_at'),
  archivedAt: timestamp('archived_at'),
  createdByRole: text('created_by_role', {
    enum: ['chat_agent', 'planner', 'writer', 'qa', 'summarizer', 'user'],
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
