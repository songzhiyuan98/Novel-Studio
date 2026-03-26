import { pgTable, uuid, text, integer, real, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  taskType: text('task_type').notNull(),
  requestedBy: text('requested_by'),
  assignedWorker: text('assigned_worker'),
  inputPacketJson: jsonb('input_packet_json'),
  outputArtifactIdsJson: jsonb('output_artifact_ids_json').$type<string[]>(),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed'] }).notNull().default('pending'),
  modelProvider: text('model_provider'),
  modelName: text('model_name'),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  tokensTotal: integer('tokens_total'),
  estimatedCostUsd: real('estimated_cost_usd'),
  durationMs: integer('duration_ms'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

export const issues = pgTable('issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').references(() => projects.id).notNull(),
  severity: text('severity', { enum: ['low', 'medium', 'high'] }).notNull(),
  issueType: text('issue_type').notNull(),
  description: text('description').notNull(),
  evidenceRefsJson: jsonb('evidence_refs_json').$type<Array<{ artifactId: string; version?: number; quote?: string }>>(),
  suggestedFix: text('suggested_fix'),
  resolutionPath: text('resolution_path'),
  status: text('status').notNull().default('open'),
  sourceTaskId: uuid('source_task_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
})
