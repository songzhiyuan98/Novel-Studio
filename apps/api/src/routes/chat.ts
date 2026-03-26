import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { eq } from 'drizzle-orm'
import { generateText, streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { Database } from '../db/index.js'
import * as schema from '../db/schema/index.js'
import {
  CHAT_AGENT_SYSTEM_PROMPT,
  INTENT_CLASSIFICATION_PROMPT,
  buildPlannerPacketPrompt,
  buildWriterProsePrompt,
  buildWriterMetadataPrompt,
  buildQAPacketPrompt,
  buildSummarizerPacketPrompt,
} from '@novel-studio/prompts'
import { filterCharactersByTier, type CharacterForPacket } from '@novel-studio/orchestrator'
import { estimateCost } from '@novel-studio/llm-adapter'

export function chatRoutes(db: Database) {
  const app = new Hono()

  // Initialize providers lazily from env
  function getOpenAI() {
    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  }

  function getDeepSeek() {
    return createOpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseURL: 'https://api.deepseek.com/v1',
    })
  }

  // ─── POST /:projectId/chat ────────────────────────
  app.post('/:projectId/chat', async (c) => {
    const projectId = c.req.param('projectId')
    const { message, stream: useStream } = await c.req.json<{ message: string; stream?: boolean }>()

    // Get project
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId))
    if (!project) return c.json({ error: 'Project not found' }, 404)

    // Get canon context for Chat Agent
    const characters = await db.select().from(schema.characterStates).where(eq(schema.characterStates.projectId, projectId))
    const chapters = await db.select().from(schema.chapters).where(eq(schema.chapters.projectId, projectId))

    const projectSummary = `项目: ${project.title}\n角色: ${characters.map((ch) => `${ch.name}(${ch.tier})`).join(', ')}\n已写章节: ${chapters.length}`

    const trace: Array<{
      timestamp: string
      actor: string
      action: string
      tokens?: { input: number; output: number }
      duration_ms?: number
      cost_usd?: number
    }> = []

    function addTrace(actor: string, action: string, extras?: { tIn?: number; tOut?: number; ms?: number }) {
      const entry: (typeof trace)[0] = {
        timestamp: new Date().toISOString(),
        actor,
        action,
      }
      if (extras?.tIn !== undefined) {
        entry.tokens = { input: extras.tIn, output: extras.tOut ?? 0 }
        const cost = estimateCost('gpt-4o-mini', extras.tIn, extras.tOut ?? 0)
        entry.cost_usd = cost.totalCost
      }
      if (extras?.ms) entry.duration_ms = extras.ms
      trace.push(entry)
    }

    // ─── Step 1: Classify intent ────────────────────
    const openai = getOpenAI()
    const t0 = Date.now()

    addTrace('chat_agent', '意图分类中...')

    const classifyResult = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        { role: 'system', content: INTENT_CLASSIFICATION_PROMPT },
        { role: 'user', content: message },
      ],
      maxTokens: 200,
      temperature: 0,
    })

    const classifyMs = Date.now() - t0
    let intent = 'casual'
    try {
      const parsed = JSON.parse(classifyResult.text)
      intent = parsed.type || 'casual'
      addTrace('chat_agent', `意图: ${intent} (${parsed.explanation || ''})`, {
        tIn: classifyResult.usage?.inputTokens ?? 0,
        tOut: classifyResult.usage?.outputTokens ?? 0,
        ms: classifyMs,
      })
    } catch {
      addTrace('chat_agent', `意图分类失败，默认 casual`, { ms: classifyMs })
    }

    // ─── Step 2: Handle by intent ───────────────────

    if (intent === 'casual' || intent === 'blueprint_edit') {
      // Direct response from Chat Agent — stream if requested
      addTrace('chat_agent', '直接回复（不触发管道）')

      if (useStream) {
        return streamSSE(c, async (stream) => {
          const result = streamText({
            model: openai('gpt-4o-mini'),
            messages: [
              { role: 'system', content: `${CHAT_AGENT_SYSTEM_PROMPT}\n\n## 项目上下文\n${projectSummary}` },
              { role: 'user', content: message },
            ],
            maxTokens: 1000,
            temperature: 0.7,
          })

          let fullText = ''
          for await (const chunk of result.textStream) {
            fullText += chunk
            await stream.writeSSE({ data: JSON.stringify({ type: 'chunk', content: chunk }) })
          }

          const usage = await result.usage
          addTrace('chat_agent', '回复完成', {
            tIn: usage?.inputTokens ?? 0,
            tOut: usage?.outputTokens ?? 0,
            ms: Date.now() - t0,
          })

          await stream.writeSSE({
            data: JSON.stringify({
              type: 'done',
              assistant_message: fullText,
              intent,
              trace: { steps: trace },
            }),
          })
        })
      }

      // Non-streaming response
      const chatResult = await generateText({
        model: openai('gpt-4o-mini'),
        messages: [
          { role: 'system', content: `${CHAT_AGENT_SYSTEM_PROMPT}\n\n## 项目上下文\n${projectSummary}` },
          { role: 'user', content: message },
        ],
        maxTokens: 1000,
        temperature: 0.7,
      })

      addTrace('chat_agent', '回复完成', {
        tIn: chatResult.usage?.inputTokens ?? 0,
        tOut: chatResult.usage?.outputTokens ?? 0,
        ms: Date.now() - t0,
      })

      return c.json({
        assistant_message: chatResult.text,
        intent,
        created_artifacts: [],
        pending_confirmations: [],
        trace: { steps: trace },
        suggested_actions: [],
      })
    }

    if (intent === 'pipeline_task') {
      // Determine what pipeline action to take
      addTrace('orchestrator', '分析管道任务...')

      const nextChapterNum = chapters.length + 1

      // For MVP: auto-trigger chapter planning
      addTrace('orchestrator', `准备第${nextChapterNum}章规划`)

      // Get canon context
      const worldRules = await db.select().from(schema.storyBibleEntries).where(eq(schema.storyBibleEntries.projectId, projectId))
      const summaries = await db.select().from(schema.chapterSummaries).where(eq(schema.chapterSummaries.projectId, projectId))
      const threads = await db.select().from(schema.unresolvedThreads).where(eq(schema.unresolvedThreads.projectId, projectId))

      const charStr = characters.map((ch) => `【${ch.name}】${ch.tier} | ${JSON.stringify(ch.dimensionsJson)}`).join('\n')
      const worldStr = worldRules.map((r) => `【${r.key}】${JSON.stringify(r.valueJson)}`).join('\n')
      const prevStr = summaries.sort((a, b) => a.chapterNumber - b.chapterNumber).map((s) => `第${s.chapterNumber}章: ${s.summaryText}`).join('\n') || '(无前章)'
      const threadStr = threads.map((t) => `- ${t.label} (${t.currentStatus})`).join('\n') || '(暂无)'

      // Call Planner
      addTrace('orchestrator', '编译 Planner packet')
      const plannerContext = `
## 《${project.title}》第${nextChapterNum}章
## 用户要求: ${message}
## 角色: ${charStr}
## 世界规则: ${worldStr}
## 前章摘要: ${prevStr}
## 线索: ${threadStr}
## 要求：基于用户要求，头脑风暴2-3个方向
输出JSON: {"summary":"概述","assumptions":[],"questions":[],"artifacts":[{"type":"scene_card","title":"方向","content":{"directions":[{"title":"方向A","description":"..."},{"title":"方向B","description":"..."}]}}],"issues":[]}
`

      addTrace('planner', '生成章节方向...')
      const t1 = Date.now()
      const planResult = await generateText({
        model: openai('gpt-4o-mini'),
        prompt: buildPlannerPacketPrompt(plannerContext, 'brainstorm'),
        maxTokens: 2000,
        temperature: 0.7,
      })
      addTrace('planner', '方向生成完成', {
        tIn: planResult.usage?.inputTokens ?? 0,
        tOut: planResult.usage?.outputTokens ?? 0,
        ms: Date.now() - t1,
      })

      // Parse planner output
      let plannerResponse = planResult.text
      try {
        const jsonMatch = planResult.text.match(/```(?:json)?\s*([\s\S]*?)```/) || planResult.text.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1].trim().replace(/[\x00-\x1f\x7f]/g, ' '))
          const directions = parsed.artifacts?.[0]?.content?.directions || []
          if (directions.length > 0) {
            plannerResponse = `好的！以下是第${nextChapterNum}章的几个方向建议：\n\n`
            directions.forEach((d: { title: string; description: string }, i: number) => {
              plannerResponse += `**${String.fromCharCode(65 + i)}. ${d.title}**\n${d.description}\n\n`
            })
            plannerResponse += `你想选哪个方向？或者你有自己的想法？`
          }
        }
      } catch {
        // Use raw text if JSON parsing fails
      }

      return c.json({
        assistant_message: plannerResponse,
        intent,
        created_artifacts: [],
        pending_confirmations: [],
        trace: { steps: trace },
        suggested_actions: ['选择方向A', '选择方向B', '我有自己的想法'],
      })
    }

    if (intent === 'canon_edit' || intent === 'setting_change') {
      addTrace('orchestrator', `检测到${intent === 'canon_edit' ? '设定修改' : '重大设定变更'}请求`)

      const chatResult = await generateText({
        model: openai('gpt-4o-mini'),
        messages: [
          {
            role: 'system',
            content: `${CHAT_AGENT_SYSTEM_PROMPT}\n\n## 项目上下文\n${projectSummary}\n\n用户想要修改设定。请确认他们想改什么，并提醒可能的影响。用中文回复。`,
          },
          { role: 'user', content: message },
        ],
        maxTokens: 500,
        temperature: 0.7,
      })

      addTrace('chat_agent', '确认修改意图', {
        tIn: chatResult.usage?.inputTokens ?? 0,
        tOut: chatResult.usage?.outputTokens ?? 0,
        ms: Date.now() - t0,
      })

      return c.json({
        assistant_message: chatResult.text,
        intent,
        created_artifacts: [],
        pending_confirmations: [],
        trace: { steps: trace },
        suggested_actions: ['确认修改', '取消'],
      })
    }

    // Fallback
    return c.json({
      assistant_message: '收到你的消息，但我还不确定该怎么处理。你可以试试：\n- "开始写下一章"\n- "帮我想个角色名字"\n- "修改林凡的境界"',
      intent: 'unknown',
      trace: { steps: trace },
    })
  })

  return app
}
