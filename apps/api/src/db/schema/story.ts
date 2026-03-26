import { pgTable, uuid, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const storyBibleEntries = pgTable('story_bible_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  entryType: text('entry_type').notNull(),
  key: text('key').notNull(),
  valueJson: jsonb('value_json'),
  sourceArtifactId: uuid('source_artifact_id'),
  sourceVersion: integer('source_version'),
  effectiveFromChapter: integer('effective_from_chapter'),
  overridable: boolean('overridable').default(true),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const timelineEvents = pgTable('timeline_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  chapterNumber: integer('chapter_number').notNull(),
  eventType: text('event_type').notNull(),
  eventSummary: text('event_summary').notNull(),
  involvedCharactersJson: jsonb('involved_characters_json').$type<string[]>(),
  locationKey: text('location_key'),
  sourceArtifactId: uuid('source_artifact_id'),
  canonical: boolean('canonical').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const unresolvedThreads = pgTable('unresolved_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  label: text('label').notNull(),
  type: text('type').notNull(),
  originChapter: integer('origin_chapter'),
  currentStatus: text('current_status').notNull().default('active'),
  payoffTarget: text('payoff_target'),
  relatedCharactersJson: jsonb('related_characters_json').$type<string[]>(),
  relatedArtifactsJson: jsonb('related_artifacts_json').$type<string[]>(),
  notesJson: jsonb('notes_json'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const developmentChains = pgTable('development_chains', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  chainKey: text('chain_key').notNull(),
  originNode: text('origin_node'),
  triggerNode: text('trigger_node'),
  consequenceNodesJson: jsonb('consequence_nodes_json'),
  dependencyNodesJson: jsonb('dependency_nodes_json'),
  payoffTarget: text('payoff_target'),
  sourceArtifactId: uuid('source_artifact_id'),
  status: text('status').notNull().default('active'),
})
