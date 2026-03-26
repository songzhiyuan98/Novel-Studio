import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const projectTemplates = pgTable('project_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  genreJson: jsonb('genre_json').$type<{ primary: string; tags: string[] }>().notNull(),
  formatJson: jsonb('format_json').$type<{
    chapterLength: { min: number; max: number; unit: string }
    volumeSize: number
    language: string
  }>().notNull(),
  characterDimensionsJson: jsonb('character_dimensions_json')
    .$type<Array<{ key: string; label: string; type: string }>>()
    .notNull()
    .default([]),
  relationshipDimensionsJson: jsonb('relationship_dimensions_json')
    .$type<Array<{ key: string; label: string; type: string }>>()
    .notNull()
    .default([]),
  styleProfileJson: jsonb('style_profile_json')
    .$type<{ base: Record<string, string>; custom: Array<{ key: string; value: string }> }>()
    .notNull(),
  writingRulesJson: jsonb('writing_rules_json').$type<string[]>().notNull().default([]),
  qaCustomDimensionsJson: jsonb('qa_custom_dimensions_json').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  templateId: uuid('template_id').references(() => projectTemplates.id).notNull(),
  status: text('status', { enum: ['active', 'archived'] }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
