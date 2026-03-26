import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  chapterNumber: integer('chapter_number').notNull(),
  volumeNumber: integer('volume_number'),
  title: text('title'),
  status: text('status', {
    enum: ['planned', 'drafted', 'reviewed', 'user_approved', 'canonized', 'published', 'archived'],
  }).notNull().default('planned'),
  latestArtifactId: uuid('latest_artifact_id'),
  sceneSegmentsJson: jsonb('scene_segments_json').$type<Array<{ sceneIndex: number; sceneKey: string; status: string }>>(),
  canonizedAt: timestamp('canonized_at'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const chapterSummaries = pgTable('chapter_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  chapterId: uuid('chapter_id').references(() => chapters.id).notNull(),
  chapterNumber: integer('chapter_number').notNull(),
  summaryText: text('summary_text').notNull(),
  keyEventsJson: jsonb('key_events_json').$type<string[]>().notNull().default([]),
  characterDeltasJson: jsonb('character_deltas_json').$type<Array<{ character: string; change: string }>>().notNull().default([]),
  newThreadsJson: jsonb('new_threads_json').$type<string[]>().notNull().default([]),
  resolvedThreadsJson: jsonb('resolved_threads_json').$type<string[]>().notNull().default([]),
  advancedThreadsJson: jsonb('advanced_threads_json').$type<string[]>().notNull().default([]),
  newWorldFactsJson: jsonb('new_world_facts_json').$type<string[]>().notNull().default([]),
  timelineEventsJson: jsonb('timeline_events_json').$type<Array<{ event: string; location: string }>>().notNull().default([]),
  sourceArtifactId: uuid('source_artifact_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const volumeSummaries = pgTable('volume_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  volumeNumber: integer('volume_number').notNull(),
  chapterRangeStart: integer('chapter_range_start').notNull(),
  chapterRangeEnd: integer('chapter_range_end').notNull(),
  summaryText: text('summary_text').notNull(),
  mainPlotProgressionJson: jsonb('main_plot_progression_json'),
  characterArcTurningPointsJson: jsonb('character_arc_turning_points_json'),
  worldChangesJson: jsonb('world_changes_json'),
  majorHooksJson: jsonb('major_hooks_json'),
  sourceChapterSummaryIdsJson: jsonb('source_chapter_summary_ids_json').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
