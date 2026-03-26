# Novel Studio — AI-Powered Serial Fiction Workbench

AI 驱动的网文连载工作台。你当导演，AI 当执行团队。

## Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/songzhiyuan98/Novel-Studio.git
cd Novel-Studio
cp .env.example .env
# Edit .env — fill in your API keys:
#   OPENAI_API_KEY=sk-...
#   DEEPSEEK_API_KEY=sk-...

# 2. Start (Docker)
docker compose up -d
# Starts: PostgreSQL (5432) + API (3001) + Web (3002)

# 3. Initialize database (first time only)
pnpm install
cd apps/api && DATABASE_URL=postgresql://novel_studio:novel_studio_dev@localhost:5432/novel_studio npx drizzle-kit push
cd apps/api && DATABASE_URL=postgresql://novel_studio:novel_studio_dev@localhost:5432/novel_studio npx tsx src/db/seed.ts

# 4. Open browser
open http://localhost:3002
```

### Local Dev (without Docker for API/Web)

```bash
docker compose up postgres -d          # DB only
cd apps/api && pnpm dev                # API on :3001
cd apps/web && pnpm dev                # Web on :3002
```

## What It Does

| Feature | Status |
|---------|--------|
| **Chat with AI** — casual chat, brainstorm, intent classification | ✅ |
| **Chapter Writing Flow** — directions → blueprint → write → QA → canonize | ✅ |
| **Canon Memory** — characters, world rules, timeline, threads auto-tracked | ✅ |
| **Character Cards** — tiered (core/important/episodic), editable | ✅ |
| **World Settings** — view story bible entries | ✅ |
| **Chapter Viewer** — read confirmed chapters with scene markers + summaries | ✅ |
| **Multi-Model** — DeepSeek (writer/QA) + GPT-4o-mini (planner) | ✅ |
| **Cost Tracking** — token usage and cost per LLM call | ✅ |
| **Orchestration Trace** — see what each agent did | ✅ |
| Project creation with template presets | ✅ |
| Per-scene rewriting | Backend ✅ / Frontend pending |
| Impact analysis for setting changes | Planned |
| Streaming output display | Backend ✅ / Frontend partial |

## Architecture

```
User ↔ Chat Agent (GPT-4o-mini) → Orchestrator (code) → Workers (LLM)
                                                          ├── Planner (GPT-4o-mini)
                                                          ├── Writer (DeepSeek)
                                                          ├── QA (DeepSeek)
                                                          └── Summarizer (DeepSeek)
                                       ↕
                               Knowledge Layer
                            (PostgreSQL + Canon Store)
```

**Key design:** The Orchestrator is deterministic code, NOT an LLM. Workflow routing, state machine transitions, and packet assembly are testable and reliable.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node.js + TypeScript |
| LLM | Vercel AI SDK (OpenAI + DeepSeek) |
| Database | PostgreSQL + Drizzle ORM |
| API | Hono |
| Frontend | Next.js 15 + Tailwind CSS |
| Monorepo | pnpm workspace |
| Container | Docker Compose |

## Project Structure

```
apps/
  api/          Hono backend (port 3001)
  web/          Next.js frontend (port 3002)
packages/
  core/         Shared types
  orchestrator/ Workflow engine, packet compiler, safety guard, canon projection
  prompts/      LLM prompt templates + Zod output schemas
  llm-adapter/  Vercel AI SDK wrapper, multi-provider, token counting
docs/           Design specs, plans, architecture docs
```

## Test Results

- **98 unit tests** across 6 packages
- **5-chapter end-to-end** validation passed
- **DeepSeek Writer**: 2842-4471 Chinese chars/chapter (target: 2000-3000)
- **Cost**: ~$0.032 / 5 chapters

## Documentation

- `docs/superpowers/specs/2026-03-25-design-v2.md` — Full design spec (23 decisions)
- `docs/mvp-todolist.md` — Implementation progress
- `docs/data-models.md` — Database schema (17 tables)
- `docs/agents.md` — Agent roles and responsibilities
- `docs/workflow.md` — Chapter production workflow
- `docs/api-spec.md` — API endpoint documentation
