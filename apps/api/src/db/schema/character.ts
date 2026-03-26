import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const characterStates = pgTable('character_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  characterKey: text('character_key').notNull(),
  name: text('name').notNull(),
  tier: text('tier', { enum: ['core', 'important', 'episodic'] }).notNull().default('important'),
  basicJson: jsonb('basic_json').$type<Record<string, unknown>>(),
  personalityJson: jsonb('personality_json').$type<{ coreTraits: string[]; speechStyle: string; speechExamples?: string[]; taboos?: string[] }>(),
  dimensionsJson: jsonb('dimensions_json').$type<Record<string, unknown>>().default({}),
  currentStatusJson: jsonb('current_status_json').$type<{ location?: string; physical?: string; emotional?: string; objective?: string; secrets?: string[] }>(),
  hooksJson: jsonb('hooks_json').$type<Array<{ hook: string; plantedChapter: number; status: string }>>().default([]),
  changeHistoryJson: jsonb('change_history_json').$type<Array<{ chapter: number; delta: string }>>().default([]),
  lastUpdatedFromChapter: text('last_updated_from_chapter'),
  sourceArtifactId: uuid('source_artifact_id'),
  archivedAt: timestamp('archived_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const relationshipStates = pgTable('relationship_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  characterA: text('character_a').notNull(),
  characterB: text('character_b').notNull(),
  relationshipType: text('relationship_type'),
  baseScoresJson: jsonb('base_scores_json').$type<{ trust: number; tension: number }>().notNull().default({ trust: 50, tension: 0 }),
  customScoresJson: jsonb('custom_scores_json').$type<Record<string, number>>().default({}),
  statusNotesJson: jsonb('status_notes_json'),
  lastUpdatedFromChapter: text('last_updated_from_chapter'),
  sourceArtifactId: uuid('source_artifact_id'),
})
