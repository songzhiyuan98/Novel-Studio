# M2: Data Layer + Schemas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up PostgreSQL via Docker, define all entity schemas with Drizzle ORM, implement Repository layer with CRUD operations and status state machines, and create a seed script with example data.

**Architecture:** PostgreSQL in Docker container. Drizzle ORM for type-safe schema definitions and migrations. Repository pattern for data access. All schemas follow the v2 design spec: ProjectTemplate drives dynamic fields, CharacterState uses base + dimensions_json, RelationshipState uses base_scores + custom_scores.

**Tech Stack:** PostgreSQL 16, Docker, Drizzle ORM, drizzle-kit, Zod (for validation), dotenv

---

## File Structure

```
apps/api/
├── drizzle.config.ts              # Drizzle Kit config
├── src/
│   ├── db/
│   │   ├── index.ts               # DB connection
│   │   ├── schema/
│   │   │   ├── index.ts           # Re-export all schemas
│   │   │   ├── project.ts         # Project + ProjectTemplate
│   │   │   ├── artifact.ts        # Artifact
│   │   │   ├── chapter.ts         # Chapter + ChapterSummary + VolumeSummary
│   │   │   ├── character.ts       # CharacterState + RelationshipState
│   │   │   ├── story.ts           # StoryBibleEntry + TimelineEvent + UnresolvedThread + DevelopmentChain
│   │   │   ├── task.ts            # Task + Issue
│   │   │   ├── audit.ts           # AuditLog + ConversationMessage
│   │   │   └── model-config.ts    # ModelConfig
│   │   └── seed.ts                # Seed script
│   └── ...
├── __tests__/
│   ├── db/
│   │   ├── schema.test.ts         # Schema validation tests
│   │   ├── repository.test.ts     # CRUD tests
│   │   └── state-machine.test.ts  # Status transition tests
docker-compose.yml                  # (project root) PostgreSQL container
.env.example                        # (project root) env template
```

---

### Task 1: PostgreSQL Docker setup + Drizzle config

**Files:**
- Create: `docker-compose.yml` (project root)
- Create: `.env.example` (project root)
- Create: `.env` (project root, gitignored)
- Create: `apps/api/drizzle.config.ts`
- Modify: `apps/api/package.json` (add drizzle deps)
- Modify: `apps/api/tsconfig.json` (if needed)

- [ ] **Step 1: Create docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: novel-studio-db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: novel_studio
      POSTGRES_PASSWORD: novel_studio_dev
      POSTGRES_DB: novel_studio
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 2: Create .env.example and .env**

.env.example:
```
DATABASE_URL=postgresql://novel_studio:novel_studio_dev@localhost:5432/novel_studio
```

.env (same content, gitignored):
```
DATABASE_URL=postgresql://novel_studio:novel_studio_dev@localhost:5432/novel_studio
```

- [ ] **Step 3: Install Drizzle deps in apps/api**

```bash
pnpm --filter @novel-studio/api add drizzle-orm postgres dotenv
pnpm --filter @novel-studio/api add -D drizzle-kit
```

- [ ] **Step 4: Create apps/api/drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

- [ ] **Step 5: Create apps/api/src/db/index.ts**

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

const connectionString = process.env.DATABASE_URL!

const client = postgres(connectionString)
export const db = drizzle(client, { schema })
export type Database = typeof db
```

- [ ] **Step 6: Add db scripts to apps/api/package.json**

Add to scripts:
```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio",
  "db:seed": "tsx src/db/seed.ts"
}
```

- [ ] **Step 7: Start PostgreSQL and verify connection**

```bash
docker compose up -d
# Wait a few seconds for postgres to start
sleep 3
docker compose exec postgres psql -U novel_studio -d novel_studio -c "SELECT 1"
```

Expected: returns "1".

- [ ] **Step 8: Commit**

```bash
git add docker-compose.yml .env.example apps/api/drizzle.config.ts apps/api/src/db/index.ts apps/api/package.json pnpm-lock.yaml
git commit -m "chore(m2): add PostgreSQL Docker + Drizzle ORM setup"
```

---

### Task 2: Core entity schemas — Project + ProjectTemplate + ModelConfig

**Files:**
- Create: `apps/api/src/db/schema/project.ts`
- Create: `apps/api/src/db/schema/model-config.ts`
- Create: `apps/api/src/db/schema/index.ts`

- [ ] **Step 1: Create project.ts schema**

```typescript
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
    .$type<{
      base: Record<string, string>
      custom: Array<{ key: string; value: string }>
    }>()
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
  templateId: uuid('template_id')
    .references(() => projectTemplates.id)
    .notNull(),
  status: text('status', { enum: ['active', 'archived'] })
    .notNull()
    .default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

- [ ] **Step 2: Create model-config.ts schema**

```typescript
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const modelConfigs = pgTable('model_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull()
    .unique(),
  configMode: text('config_mode', { enum: ['simple', 'advanced'] })
    .notNull()
    .default('simple'),
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
```

- [ ] **Step 3: Create schema/index.ts (re-export)**

```typescript
export * from './project.js'
export * from './model-config.js'
```

- [ ] **Step 4: Generate migration and push to DB**

```bash
cd apps/api
npx dotenv -e ../../.env -- pnpm db:push
```

Expected: tables created in PostgreSQL.

- [ ] **Step 5: Verify tables exist**

```bash
docker compose exec postgres psql -U novel_studio -d novel_studio -c "\dt"
```

Expected: shows project_templates, projects, model_configs tables.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/db/schema/
git commit -m "chore(m2): add Project + ProjectTemplate + ModelConfig schemas"
```

---

### Task 3: Artifact + Chapter schemas

**Files:**
- Create: `apps/api/src/db/schema/artifact.ts`
- Create: `apps/api/src/db/schema/chapter.ts`
- Modify: `apps/api/src/db/schema/index.ts`

- [ ] **Step 1: Create artifact.ts schema**

```typescript
import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const artifacts = pgTable('artifacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  type: text('type', {
    enum: [
      'story_bible', 'world_rule', 'character_card', 'relationship_map',
      'outline', 'scene_card', 'chapter_draft', 'qa_report', 'style_guide',
    ],
  }).notNull(),
  title: text('title').notNull(),
  status: text('status', {
    enum: ['draft', 'reviewed', 'confirmed', 'rejected', 'archived', 'locked'],
  })
    .notNull()
    .default('draft'),
  version: integer('version').notNull().default(1),
  parentArtifactId: uuid('parent_artifact_id'),
  sourceTaskId: uuid('source_task_id'),
  contentJson: jsonb('content_json'),
  sceneSegmentsJson: jsonb('scene_segments_json')
    .$type<Array<{ sceneIndex: number; sceneKey: string; text: string }>>(),
  summaryText: text('summary_text'),
  confirmedAt: timestamp('confirmed_at'),
  archivedAt: timestamp('archived_at'),
  createdByRole: text('created_by_role', {
    enum: ['chat_agent', 'planner', 'writer', 'qa', 'summarizer', 'user'],
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

- [ ] **Step 2: Create chapter.ts schema**

```typescript
import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  chapterNumber: integer('chapter_number').notNull(),
  volumeNumber: integer('volume_number'),
  title: text('title'),
  status: text('status', {
    enum: ['planned', 'drafted', 'reviewed', 'user_approved', 'canonized', 'published', 'archived'],
  })
    .notNull()
    .default('planned'),
  latestArtifactId: uuid('latest_artifact_id'),
  sceneSegmentsJson: jsonb('scene_segments_json')
    .$type<Array<{ sceneIndex: number; sceneKey: string; status: string }>>(),
  canonizedAt: timestamp('canonized_at'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const chapterSummaries = pgTable('chapter_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  chapterId: uuid('chapter_id')
    .references(() => chapters.id)
    .notNull(),
  chapterNumber: integer('chapter_number').notNull(),
  summaryText: text('summary_text').notNull(),
  keyEventsJson: jsonb('key_events_json').$type<string[]>().notNull().default([]),
  characterDeltasJson: jsonb('character_deltas_json')
    .$type<Array<{ character: string; change: string }>>()
    .notNull()
    .default([]),
  newThreadsJson: jsonb('new_threads_json').$type<string[]>().notNull().default([]),
  resolvedThreadsJson: jsonb('resolved_threads_json').$type<string[]>().notNull().default([]),
  advancedThreadsJson: jsonb('advanced_threads_json').$type<string[]>().notNull().default([]),
  newWorldFactsJson: jsonb('new_world_facts_json').$type<string[]>().notNull().default([]),
  timelineEventsJson: jsonb('timeline_events_json')
    .$type<Array<{ event: string; location: string }>>()
    .notNull()
    .default([]),
  sourceArtifactId: uuid('source_artifact_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const volumeSummaries = pgTable('volume_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
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
```

- [ ] **Step 3: Update schema/index.ts**

```typescript
export * from './project.js'
export * from './model-config.js'
export * from './artifact.js'
export * from './chapter.js'
```

- [ ] **Step 4: Push to DB and verify**

```bash
cd apps/api && npx dotenv -e ../../.env -- pnpm db:push
docker compose exec postgres psql -U novel_studio -d novel_studio -c "\dt"
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/schema/
git commit -m "chore(m2): add Artifact + Chapter + Summary schemas"
```

---

### Task 4: Character + Relationship + Story schemas

**Files:**
- Create: `apps/api/src/db/schema/character.ts`
- Create: `apps/api/src/db/schema/story.ts`
- Modify: `apps/api/src/db/schema/index.ts`

- [ ] **Step 1: Create character.ts schema**

```typescript
import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const characterStates = pgTable('character_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  characterKey: text('character_key').notNull(),
  name: text('name').notNull(),
  tier: text('tier', { enum: ['core', 'important', 'episodic'] }).notNull().default('important'),
  basicJson: jsonb('basic_json').$type<Record<string, unknown>>(),
  personalityJson: jsonb('personality_json')
    .$type<{
      coreTraits: string[]
      speechStyle: string
      speechExamples?: string[]
      taboos?: string[]
    }>(),
  dimensionsJson: jsonb('dimensions_json').$type<Record<string, unknown>>().default({}),
  currentStatusJson: jsonb('current_status_json')
    .$type<{
      location?: string
      physical?: string
      emotional?: string
      objective?: string
      secrets?: string[]
    }>(),
  hooksJson: jsonb('hooks_json')
    .$type<Array<{ hook: string; plantedChapter: number; status: string }>>()
    .default([]),
  changeHistoryJson: jsonb('change_history_json')
    .$type<Array<{ chapter: number; delta: string }>>()
    .default([]),
  lastUpdatedFromChapter: text('last_updated_from_chapter'),
  sourceArtifactId: uuid('source_artifact_id'),
  archivedAt: timestamp('archived_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const relationshipStates = pgTable('relationship_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  characterA: text('character_a').notNull(),
  characterB: text('character_b').notNull(),
  relationshipType: text('relationship_type'),
  baseScoresJson: jsonb('base_scores_json')
    .$type<{ trust: number; tension: number }>()
    .notNull()
    .default({ trust: 50, tension: 0 }),
  customScoresJson: jsonb('custom_scores_json').$type<Record<string, number>>().default({}),
  statusNotesJson: jsonb('status_notes_json'),
  lastUpdatedFromChapter: text('last_updated_from_chapter'),
  sourceArtifactId: uuid('source_artifact_id'),
})
```

- [ ] **Step 2: Create story.ts schema**

```typescript
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const storyBibleEntries = pgTable('story_bible_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
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
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
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
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
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
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  chainKey: text('chain_key').notNull(),
  originNode: text('origin_node'),
  triggerNode: text('trigger_node'),
  consequenceNodesJson: jsonb('consequence_nodes_json'),
  dependencyNodesJson: jsonb('dependency_nodes_json'),
  payoffTarget: text('payoff_target'),
  sourceArtifactId: uuid('source_artifact_id'),
  status: text('status').notNull().default('active'),
})
```

- [ ] **Step 3: Update schema/index.ts**

```typescript
export * from './project.js'
export * from './model-config.js'
export * from './artifact.js'
export * from './chapter.js'
export * from './character.js'
export * from './story.js'
```

- [ ] **Step 4: Push and verify**

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/schema/
git commit -m "chore(m2): add Character + Relationship + Story schemas"
```

---

### Task 5: Task + Issue + Audit + ConversationMessage schemas

**Files:**
- Create: `apps/api/src/db/schema/task.ts`
- Create: `apps/api/src/db/schema/audit.ts`
- Modify: `apps/api/src/db/schema/index.ts`

- [ ] **Step 1: Create task.ts schema**

```typescript
import { pgTable, uuid, text, integer, real, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  taskType: text('task_type').notNull(),
  requestedBy: text('requested_by'),
  assignedWorker: text('assigned_worker'),
  inputPacketJson: jsonb('input_packet_json'),
  outputArtifactIdsJson: jsonb('output_artifact_ids_json').$type<string[]>(),
  status: text('status', {
    enum: ['pending', 'running', 'completed', 'failed'],
  })
    .notNull()
    .default('pending'),
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
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  severity: text('severity', { enum: ['low', 'medium', 'high'] }).notNull(),
  issueType: text('issue_type').notNull(),
  description: text('description').notNull(),
  evidenceRefsJson: jsonb('evidence_refs_json')
    .$type<Array<{ artifactId: string; version?: number; quote?: string }>>(),
  suggestedFix: text('suggested_fix'),
  resolutionPath: text('resolution_path'),
  status: text('status').notNull().default('open'),
  sourceTaskId: uuid('source_task_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
})
```

- [ ] **Step 2: Create audit.ts schema**

```typescript
import { pgTable, uuid, text, integer, real, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { projects } from './project.js'

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
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
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  intentClassification: text('intent_classification'),
  relatedTaskIdsJson: jsonb('related_task_ids_json').$type<string[]>(),
  relatedArtifactIdsJson: jsonb('related_artifact_ids_json').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

- [ ] **Step 3: Update schema/index.ts** (add task + audit exports)

- [ ] **Step 4: Push and verify all tables exist**

Expected: 15+ tables in PostgreSQL.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/db/schema/
git commit -m "chore(m2): add Task + Issue + Audit + ConversationMessage schemas"
```

---

### Task 6: Seed script

**Files:**
- Create: `apps/api/src/db/seed.ts`

- [ ] **Step 1: Create seed script**

Creates:
- 1 ProjectTemplate (玄幻爽文 preset)
- 1 Project referencing the template
- 1 ModelConfig (simple mode, placeholder key)
- 3 CharacterStates (1 core, 1 important, 1 episodic)
- 2 RelationshipStates
- 2 StoryBibleEntries (world rules)
- 1 Artifact (outline draft)

```typescript
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

async function seed() {
  console.log('Seeding database...')

  // 1. ProjectTemplate
  const [template] = await db
    .insert(schema.projectTemplates)
    .values({
      genreJson: { primary: '玄幻', tags: ['升级流', '爽文'] },
      formatJson: { chapterLength: { min: 2000, max: 3000, unit: 'chars' }, volumeSize: 100, language: 'zh-CN' },
      characterDimensionsJson: [
        { key: 'realm', label: '境界', type: 'string' },
        { key: 'techniques', label: '技能', type: 'list' },
        { key: 'combatStyle', label: '战斗风格', type: 'string' },
      ],
      relationshipDimensionsJson: [
        { key: 'trust', label: '信任', type: 'number' },
        { key: 'tension', label: '张力', type: 'number' },
        { key: 'hatred', label: '仇恨', type: 'number' },
      ],
      styleProfileJson: {
        base: { pov: 'third_limited', tense: 'past', prose_density: 'light' },
        custom: [
          { key: '爽点密度', value: 'extreme' },
          { key: '打脸层次', value: '三层递进' },
        ],
      },
      writingRulesJson: ['每500字至少一个冲突', '战斗必须有招式名', '禁止文艺腔'],
      qaCustomDimensionsJson: ['power_scaling', '爽点覆盖率'],
    })
    .returning()

  // 2. Project
  const [project] = await db
    .insert(schema.projects)
    .values({
      title: '吞天魔帝',
      description: '一个少年获得上古魔帝传承，在修仙世界中崛起的故事',
      templateId: template.id,
    })
    .returning()

  // 3. ModelConfig
  await db.insert(schema.modelConfigs).values({
    projectId: project.id,
    configMode: 'simple',
    defaultProvider: 'openai',
    defaultApiKeyRef: 'placeholder-key',
  })

  // 4. Characters
  await db.insert(schema.characterStates).values([
    {
      projectId: project.id,
      characterKey: 'lin_fan',
      name: '林凡',
      tier: 'core',
      basicJson: { age: 16, appearance: '瘦削少年，穿洗白青衫' },
      personalityJson: {
        coreTraits: ['隐忍', '记仇', '聪明'],
        speechStyle: '话少但每句有分量',
        taboos: ['提父母会情绪失控'],
      },
      dimensionsJson: { realm: '炼气三层', techniques: [], combatStyle: '体术' },
      currentStatusJson: {
        location: '林家',
        physical: '健康',
        emotional: '压抑但开始有信心',
        objective: '家族大比前三 → 进云霄宗',
        secrets: ['体内封印吞天魔帝残魂'],
      },
    },
    {
      projectId: project.id,
      characterKey: 'lin_haotian',
      name: '林浩天',
      tier: 'important',
      basicJson: { age: 18 },
      personalityJson: {
        coreTraits: ['嚣张', '不蠢'],
        speechStyle: '带优越感的嘲讽',
      },
      dimensionsJson: { realm: '炼气七层', techniques: ['碎岩掌'], combatStyle: '力量压制' },
      currentStatusJson: { location: '林家', objective: '确保林凡翻不了身' },
    },
    {
      projectId: project.id,
      characterKey: 'herb_guard',
      name: '药园守卫',
      tier: 'episodic',
      basicJson: {},
      dimensionsJson: { realm: '炼气六层' },
    },
  ])

  // 5. Relationships
  await db.insert(schema.relationshipStates).values([
    {
      projectId: project.id,
      characterA: 'lin_fan',
      characterB: 'lin_haotian',
      relationshipType: '死敌',
      baseScoresJson: { trust: 0, tension: 90 },
      customScoresJson: { hatred: 95 },
    },
    {
      projectId: project.id,
      characterA: 'lin_fan',
      characterB: 'su_yuqing',
      relationshipType: '潜在女主',
      baseScoresJson: { trust: 50, tension: 20 },
      customScoresJson: { hatred: 0 },
    },
  ])

  // 6. Story Bible
  await db.insert(schema.storyBibleEntries).values([
    {
      projectId: project.id,
      entryType: 'world_rule',
      key: '修炼体系',
      valueJson: {
        levels: ['炼气', '筑基', '金丹', '元婴', '化神', '渡劫', '大乘'],
        note: '每层灵力翻倍，三层到七层差16倍',
      },
      status: 'active',
    },
    {
      projectId: project.id,
      entryType: 'world_rule',
      key: '林家',
      valueJson: {
        type: '中等家族',
        location: '云荒城',
        strongestElder: '金丹期',
        event: '三个月后家族大比，前三进云霄宗',
      },
      status: 'active',
    },
  ])

  // 7. Artifact
  await db.insert(schema.artifacts).values({
    projectId: project.id,
    type: 'outline',
    title: '《吞天魔帝》大纲',
    status: 'draft',
    contentJson: {
      chapters: [
        { number: 1, title: '当众羞辱，魔魂初醒', summary: '林凡被林浩天羞辱，魔帝觉醒' },
        { number: 2, title: '后山修炼，偶遇佳人', summary: '魔帝教林凡噬魂爪，遇到苏雨晴' },
        { number: 3, title: '药园风波', summary: '林凡击败药园守卫，引起关注' },
      ],
    },
    createdByRole: 'user',
  })

  console.log('Seed complete!')
  console.log(`  Template: ${template.id}`)
  console.log(`  Project: ${project.id} - ${project.title}`)

  await client.end()
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
```

- [ ] **Step 2: Run seed**

```bash
cd apps/api && npx dotenv -e ../../.env -- pnpm db:seed
```

Expected: "Seed complete!" with IDs printed.

- [ ] **Step 3: Verify data in DB**

```bash
docker compose exec postgres psql -U novel_studio -d novel_studio -c "SELECT title FROM projects"
docker compose exec postgres psql -U novel_studio -d novel_studio -c "SELECT name, tier FROM character_states"
```

Expected: shows "吞天魔帝" and 3 characters with correct tiers.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/db/seed.ts
git commit -m "chore(m2): add seed script with example xianxia project"
```

---

### Task 7: Tests

**Files:**
- Create: `apps/api/__tests__/db/schema.test.ts`

- [ ] **Step 1: Create schema test** (tests that seed data can be queried back correctly)

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../../src/db/schema/index.js'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

describe('database schemas', () => {
  it('can query projects', async () => {
    const projects = await db.select().from(schema.projects)
    expect(projects.length).toBeGreaterThanOrEqual(1)
    expect(projects[0].title).toBe('吞天魔帝')
  })

  it('can query project template with dynamic dimensions', async () => {
    const templates = await db.select().from(schema.projectTemplates)
    expect(templates.length).toBeGreaterThanOrEqual(1)
    const t = templates[0]
    expect(t.genreJson.primary).toBe('玄幻')
    expect(t.characterDimensionsJson.length).toBe(3)
    expect(t.characterDimensionsJson[0].key).toBe('realm')
  })

  it('can query characters with tiers and dynamic dimensions', async () => {
    const chars = await db.select().from(schema.characterStates)
    expect(chars.length).toBeGreaterThanOrEqual(3)

    const core = chars.find((c) => c.tier === 'core')
    expect(core).toBeDefined()
    expect(core!.name).toBe('林凡')
    expect((core!.dimensionsJson as Record<string, unknown>).realm).toBe('炼气三层')

    const episodic = chars.find((c) => c.tier === 'episodic')
    expect(episodic).toBeDefined()
    expect(episodic!.name).toBe('药园守卫')
  })

  it('can query relationships with base + custom scores', async () => {
    const rels = await db.select().from(schema.relationshipStates)
    expect(rels.length).toBeGreaterThanOrEqual(2)

    const enemy = rels.find((r) => r.relationshipType === '死敌')
    expect(enemy).toBeDefined()
    expect(enemy!.baseScoresJson.trust).toBe(0)
    expect((enemy!.customScoresJson as Record<string, number>).hatred).toBe(95)
  })

  it('can query story bible entries', async () => {
    const entries = await db.select().from(schema.storyBibleEntries)
    expect(entries.length).toBeGreaterThanOrEqual(2)
  })

  it('can query artifacts', async () => {
    const arts = await db.select().from(schema.artifacts)
    expect(arts.length).toBeGreaterThanOrEqual(1)
    expect(arts[0].type).toBe('outline')
    expect(arts[0].status).toBe('draft')
  })
})
```

- [ ] **Step 2: Run test**

```bash
cd apps/api && npx dotenv -e ../../.env -- pnpm test
```

Expected: all schema tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/api/__tests__/
git commit -m "test(m2): add database schema integration tests"
```

---

## M2 Acceptance Checklist

- [ ] Docker PostgreSQL running with `novel-studio` database
- [ ] All 15+ tables created via Drizzle push
- [ ] Seed script creates complete example project
- [ ] Can query all entity types (Project, Template, Character, Relationship, Artifact, StoryBible)
- [ ] CharacterState.dimensionsJson stores genre-specific data correctly
- [ ] RelationshipState has base_scores + custom_scores working
- [ ] ProjectTemplate stores all dynamic dimension definitions
- [ ] All tests pass
