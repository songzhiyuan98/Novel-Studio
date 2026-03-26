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

// Flow steps for chapter writing
type FlowStep = 'idle' | 'directions' | 'blueprint' | 'writing' | 'review' | 'canonized'

interface FlowContext {
  step: FlowStep
  chapterNumber?: number
  directions?: Array<{ title: string; description: string }>
  selectedDirection?: string
  blueprint?: any
  chapterText?: string
  qaResult?: any
}

interface TraceStep {
  timestamp: string
  actor: string
  action: string
  tokens?: { input: number; output: number }
  duration_ms?: number
  cost_usd?: number
}

export function chatRoutes(db: Database) {
  const app = new Hono()

  const getOpenAI = () => createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const getDeepSeek = () => createOpenAI({ apiKey: process.env.DEEPSEEK_API_KEY!, baseURL: 'https://api.deepseek.com/v1' })

  // ─── Helper: get canon context ────────────────────
  async function getCanon(projectId: string) {
    const characters = await db.select().from(schema.characterStates).where(eq(schema.characterStates.projectId, projectId))
    const worldRules = await db.select().from(schema.storyBibleEntries).where(eq(schema.storyBibleEntries.projectId, projectId))
    const threads = await db.select().from(schema.unresolvedThreads).where(eq(schema.unresolvedThreads.projectId, projectId))
    const summaries = await db.select().from(schema.chapterSummaries).where(eq(schema.chapterSummaries.projectId, projectId))
    const chapters = await db.select().from(schema.chapters).where(eq(schema.chapters.projectId, projectId))
    return { characters, worldRules, threads, summaries, chapters }
  }

  function formatCanon(canon: Awaited<ReturnType<typeof getCanon>>) {
    const charStr = canon.characters.map(c => `【${c.name}】[${c.characterKey}] ${c.tier} | ${JSON.stringify(c.dimensionsJson)}`).join('\n')
    const worldStr = canon.worldRules.map(r => `【${r.key}】${JSON.stringify(r.valueJson)}`).join('\n')
    const prevStr = canon.summaries.sort((a, b) => a.chapterNumber - b.chapterNumber).map(s => `第${s.chapterNumber}章: ${s.summaryText}`).join('\n') || '(无前章)'
    const threadStr = canon.threads.map(t => `- ${t.label} (${t.currentStatus})`).join('\n') || '(暂无)'
    return { charStr, worldStr, prevStr, threadStr }
  }

  async function callLLM(model: any, prompt: string, maxTok = 4000) {
    const t0 = Date.now()
    const r = await generateText({ model, prompt, maxTokens: maxTok, temperature: 0.7 })
    return { text: r.text, tIn: r.usage?.inputTokens ?? 0, tOut: r.usage?.outputTokens ?? 0, ms: Date.now() - t0 }
  }

  function parseJSON(text: string): any {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
    if (!m) return null
    try { return JSON.parse(m[1].trim().replace(/[\x00-\x1f\x7f]/g, (c) => c === '\n' || c === '\r' || c === '\t' ? c : ' ')) }
    catch { return null }
  }

  // ─── POST /:projectId/chat ────────────────────────
  app.post('/:projectId/chat', async (c) => {
    const projectId = c.req.param('projectId')
    const body = await c.req.json<{ message: string; stream?: boolean; flowContext?: FlowContext }>()
    const { message, flowContext } = body

    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, projectId))
    if (!project) return c.json({ error: 'Project not found' }, 404)

    const trace: TraceStep[] = []
    const addTrace = (actor: string, action: string, extras?: { tIn?: number; tOut?: number; ms?: number; model?: string }) => {
      const t: TraceStep = { timestamp: new Date().toISOString(), actor, action }
      if (extras?.tIn !== undefined) {
        t.tokens = { input: extras.tIn, output: extras.tOut ?? 0 }
        t.cost_usd = estimateCost(extras.model || 'gpt-4o-mini', extras.tIn, extras.tOut ?? 0).totalCost
      }
      if (extras?.ms) t.duration_ms = extras.ms
      trace.push(t)
    }

    const openai = getOpenAI()
    const deepseek = getDeepSeek()

    // ─── Handle flow continuation ───────────────────
    if (flowContext?.step === 'directions') {
      // User selected a direction → generate blueprint
      return await handleBlueprintGeneration(c, projectId, project, message, flowContext, trace, addTrace, openai, deepseek, db)
    }

    if (flowContext?.step === 'blueprint') {
      // User confirmed blueprint → write chapter
      return await handleChapterWriting(c, projectId, project, flowContext, trace, addTrace, openai, deepseek, db)
    }

    if (flowContext?.step === 'review') {
      // User confirmed chapter → canonize
      return await handleCanonize(c, projectId, project, flowContext, trace, addTrace, deepseek, db)
    }

    // ─── New message: classify intent ───────────────
    addTrace('chat_agent', '意图分类...')
    const classifyR = await callLLM(openai('gpt-4o-mini'), `${INTENT_CLASSIFICATION_PROMPT}\n\nUser message: ${message}`, 200)
    let intent = 'casual'
    try { intent = JSON.parse(classifyR.text).type || 'casual' } catch {}
    addTrace('chat_agent', `意图: ${intent}`, { tIn: classifyR.tIn, tOut: classifyR.tOut, ms: classifyR.ms })

    // ─── casual ─────────────────────────────────────
    if (intent === 'casual' || intent === 'blueprint_edit') {
      const canon = await getCanon(projectId)
      const chatR = await callLLM(
        openai('gpt-4o-mini'),
        `${CHAT_AGENT_SYSTEM_PROMPT}\n\n## 项目: ${project.title}\n角色: ${canon.characters.map(ch => ch.name).join(', ')}\n已写${canon.chapters.length}章\n\n用户: ${message}`,
        1000,
      )
      addTrace('chat_agent', '回复', { tIn: chatR.tIn, tOut: chatR.tOut, ms: chatR.ms })
      return c.json({ assistant_message: chatR.text, intent, trace: { steps: trace }, flowContext: { step: 'idle' } })
    }

    // ─── pipeline_task → generate directions ────────
    if (intent === 'pipeline_task') {
      const canon = await getCanon(projectId)
      const fmt = formatCanon(canon)
      const nextCh = canon.chapters.length + 1
      addTrace('orchestrator', `准备第${nextCh}章，头脑风暴方向`)

      const planCtx = `
## 《${project.title}》第${nextCh}章
## 用户说: ${message}
## 角色: ${fmt.charStr}
## 世界规则: ${fmt.worldStr}
## 前章摘要: ${fmt.prevStr}
## 线索: ${fmt.threadStr}
## 要求：生成3个不同的章节方向，每个方向包含title和description
输出JSON: {"directions":[{"title":"方向标题","description":"100字描述"}]}
`
      const planR = await callLLM(openai('gpt-4o-mini'), buildPlannerPacketPrompt(planCtx, 'brainstorm'), 2000)
      addTrace('planner', '方向生成完成', { tIn: planR.tIn, tOut: planR.tOut, ms: planR.ms })

      const parsed = parseJSON(planR.text)
      const directions = parsed?.directions || parsed?.artifacts?.[0]?.content?.directions || []

      let responseText = `好的！以下是第${nextCh}章的方向建议：\n\n`
      directions.forEach((d: any, i: number) => {
        responseText += `**${String.fromCharCode(65 + i)}. ${d.title}**\n${d.description}\n\n`
      })
      responseText += '选择一个方向，或者告诉我你自己的想法。'

      return c.json({
        assistant_message: responseText,
        intent,
        trace: { steps: trace },
        flowContext: { step: 'directions', chapterNumber: nextCh, directions },
        suggested_actions: directions.map((_: any, i: number) => `选择方向${String.fromCharCode(65 + i)}`),
      })
    }

    // ─── canon_edit / setting_change ─────────────────
    if (intent === 'canon_edit' || intent === 'setting_change') {
      const chatR = await callLLM(openai('gpt-4o-mini'),
        `${CHAT_AGENT_SYSTEM_PROMPT}\n\n用户想修改设定: "${message}"\n请确认修改内容并提醒影响。用中文。`, 500)
      addTrace('chat_agent', '确认修改意图', { tIn: chatR.tIn, tOut: chatR.tOut, ms: chatR.ms })
      return c.json({ assistant_message: chatR.text, intent, trace: { steps: trace }, flowContext: { step: 'idle' } })
    }

    return c.json({ assistant_message: '请告诉我你想做什么。', intent: 'unknown', trace: { steps: trace }, flowContext: { step: 'idle' } })
  })

  return app
}

// ─── Step 2: Generate Blueprint ─────────────────────
async function handleBlueprintGeneration(c: any, projectId: string, project: any, message: string, flowContext: FlowContext, trace: TraceStep[], addTrace: Function, openai: any, deepseek: any, db: Database) {
  const canon = await getCanonHelper(db, projectId)
  const fmt = formatCanonHelper(canon)
  const chapterNum = flowContext.chapterNumber!

  // Determine which direction was selected
  let selectedDirection = message
  if (flowContext.directions && message.match(/[选择]?方向\s*[A-Ca-c]/)) {
    const idx = message.toUpperCase().charCodeAt(message.length - 1) - 65
    if (idx >= 0 && idx < flowContext.directions.length) {
      selectedDirection = flowContext.directions[idx].description
    }
  }

  addTrace('orchestrator', `用户选择方向，生成详细蓝图`)

  const blueprintCtx = `
## 《${project.title}》第${chapterNum}章
## 选定方向: ${selectedDirection}
## 角色: ${fmt.charStr}
## 世界规则: ${fmt.worldStr}
## 前章: ${fmt.prevStr}
## 线索: ${fmt.threadStr}
## 要求：展开为3个场景的详细蓝图
输出JSON: {"summary":"概述","scenes":[{"sceneIndex":0,"sceneKey":"英文标识","objective":"场景目标","beats":["节拍"],"dialogueNotes":"对话要点","combatNotes":"战斗设计","characters":["character_key"]}]}
`
  const bpR = await callLLMHelper(openai('gpt-4o-mini'), buildPlannerPacketPrompt(blueprintCtx, 'expand'), 3000)
  addTrace('planner', '蓝图生成完成', { tIn: bpR.tIn, tOut: bpR.tOut, ms: bpR.ms })

  const parsed = parseJSONHelper(bpR.text)
  const scenes = parsed?.scenes || parsed?.artifacts?.[0]?.content?.scenes || []

  let responseText = `第${chapterNum}章蓝图已生成（${scenes.length}个场景）：\n\n`
  scenes.forEach((s: any, i: number) => {
    responseText += `**场景${i + 1}: ${s.objective}**\n`
    if (s.beats) responseText += `节拍: ${s.beats.join(' → ')}\n`
    if (s.combatNotes) responseText += `战斗: ${s.combatNotes}\n`
    if (s.dialogueNotes) responseText += `对话: ${s.dialogueNotes}\n`
    responseText += '\n'
  })
  responseText += '确认蓝图开始写作，或者告诉我要修改的部分。'

  return c.json({
    assistant_message: responseText,
    intent: 'pipeline_task',
    trace: { steps: trace },
    flowContext: { step: 'blueprint', chapterNumber: chapterNum, blueprint: { scenes } },
    suggested_actions: ['确认蓝图，开始写作', '修改场景1', '修改场景2', '重新生成'],
  })
}

// ─── Step 3: Write Chapter ──────────────────────────
async function handleChapterWriting(c: any, projectId: string, project: any, flowContext: FlowContext, trace: TraceStep[], addTrace: Function, openai: any, deepseek: any, db: Database) {
  const canon = await getCanonHelper(db, projectId)
  const fmt = formatCanonHelper(canon)
  const chapterNum = flowContext.chapterNumber!
  const scenes = flowContext.blueprint?.scenes || []

  addTrace('orchestrator', `蓝图已确认，开始写第${chapterNum}章`)

  // Get characters for packet
  const sceneKeys = [...new Set(scenes.flatMap((s: any) => s.characters || ['lin_fan']))]
  const charsForPacket: CharacterForPacket[] = canon.characters.map(c => ({
    characterKey: c.characterKey, name: c.name,
    tier: c.tier as 'core' | 'important' | 'episodic',
    stateJson: JSON.stringify({ dimensions: c.dimensionsJson, status: c.currentStatusJson, personality: c.personalityJson }),
  }))
  const filtered = filterCharactersByTier(charsForPacket, sceneKeys)

  const writeCtx = `
## 《${project.title}》第${chapterNum}章
## 蓝图（合同）
${JSON.stringify(scenes, null, 2)}
## 出场角色
${filtered.map(ch => `【${ch.name}】${ch.stateJson}`).join('\n\n')}
## 世界规则
${fmt.worldStr}
## 前章摘要
${fmt.prevStr}
`

  // Writer: DeepSeek for quality
  addTrace('writer', 'DeepSeek 写作中...')
  const writeR = await callLLMHelper(deepseek.chat('deepseek-chat'), buildWriterProsePrompt(writeCtx), 16000)
  const chapterText = writeR.text
  const chineseChars = (chapterText.match(/[\u4e00-\u9fff]/g) || []).length
  addTrace('writer', `完成 ${chineseChars} 中文字`, { tIn: writeR.tIn, tOut: writeR.tOut, ms: writeR.ms, model: 'deepseek-chat' })

  // QA: DeepSeek
  addTrace('qa', 'DeepSeek QA审查中...')
  const qaCtx = `
## 章节正文
${chapterText}
## 蓝图
${JSON.stringify(scenes, null, 2)}
## 角色卡
${filtered.map(ch => `【${ch.name}】${ch.stateJson}`).join('\n')}
## 世界规则
${fmt.worldStr}
`
  const qaR = await callLLMHelper(deepseek.chat('deepseek-chat'), buildQAPacketPrompt(qaCtx), 2000)
  const qaResult = parseJSONHelper(qaR.text) || { decision: 'pass', overallNotes: 'QA完成', issues: [] }
  addTrace('qa', `结论: ${qaResult.decision} (${qaResult.issues?.length || 0} issues)`, { tIn: qaR.tIn, tOut: qaR.tOut, ms: qaR.ms, model: 'deepseek-chat' })

  // Build response
  let responseText = `第${chapterNum}章写作完成！\n\n`
  responseText += `📊 **${chineseChars} 中文字**\n\n`
  responseText += `## QA 审查结果: ${qaResult.decision === 'pass' || qaResult.decision === 'pass_with_notes' ? '✅ 通过' : '⚠️ 建议修改'}\n`
  responseText += `${qaResult.overallNotes}\n\n`

  if (qaResult.issues?.length > 0) {
    responseText += '**问题：**\n'
    qaResult.issues.slice(0, 5).forEach((iss: any) => {
      responseText += `- [${iss.severity}] ${iss.description || iss.type}\n`
    })
    responseText += '\n'
  }

  responseText += '确认入典，或者要求修改。'

  // Save draft artifact (not yet canonized)
  const sceneSegments = chapterText.split(/\n-{3,}\n/).filter((s: string) => s.trim()).map((text: string, i: number) => ({
    sceneIndex: i, sceneKey: scenes[i]?.sceneKey || `scene_${i}`, text: text.trim(),
  }))

  const [artifact] = await db.insert(schema.artifacts).values({
    projectId, type: 'chapter_draft',
    title: `第${chapterNum}章草稿`,
    status: 'reviewed',
    contentJson: { text: chapterText },
    sceneSegmentsJson: sceneSegments,
    createdByRole: 'writer',
  }).returning()

  return c.json({
    assistant_message: responseText,
    intent: 'pipeline_task',
    trace: { steps: trace },
    flowContext: {
      step: 'review',
      chapterNumber: chapterNum,
      blueprint: flowContext.blueprint,
      chapterText,
      qaResult,
    },
    created_artifacts: [artifact.id],
    suggested_actions: ['确认入典', '重写', '修改场景1'],
  })
}

// ─── Step 4: Canonize ───────────────────────────────
async function handleCanonize(c: any, projectId: string, project: any, flowContext: FlowContext, trace: TraceStep[], addTrace: Function, deepseek: any, db: Database) {
  const chapterNum = flowContext.chapterNumber!
  const chapterText = flowContext.chapterText!
  const canon = await getCanonHelper(db, projectId)

  addTrace('orchestrator', `开始第${chapterNum}章入典`)

  // Summarize
  addTrace('summarizer', 'DeepSeek 生成摘要...')
  const sumCtx = `
## 章节全文
${chapterText}
## 角色
${canon.characters.map(ch => `${ch.characterKey}: ${ch.name} (${ch.tier})`).join('\n')}
## 线索
${canon.threads.map(t => `- ${t.label}`).join('\n') || '(暂无)'}
## 输出JSON
{"chapterNumber":${chapterNum},"summary":"摘要","keyEvents":[],"characterDeltas":[{"character":"key","change":"变化"}],"newThreads":[],"resolvedThreads":[],"advancedThreads":[],"newWorldFacts":[],"timelineEvents":[{"event":"事件","location":"地点"}],"episodicCharactersToArchive":[]}
`
  const sumR = await callLLMHelper(deepseek.chat('deepseek-chat'), buildSummarizerPacketPrompt(sumCtx), 2000)
  const sumOut = parseJSONHelper(sumR.text) || { chapterNumber: chapterNum, summary: '', keyEvents: [], characterDeltas: [], newThreads: [], resolvedThreads: [], advancedThreads: [], newWorldFacts: [], timelineEvents: [], episodicCharactersToArchive: [] }
  addTrace('summarizer', '摘要完成', { tIn: sumR.tIn, tOut: sumR.tOut, ms: sumR.ms, model: 'deepseek-chat' })

  // Save chapter + summary
  const [chapter] = await db.insert(schema.chapters).values({
    projectId, chapterNumber: chapterNum,
    title: `第${chapterNum}章`,
    status: 'canonized', canonizedAt: new Date(),
  }).returning()

  await db.insert(schema.chapterSummaries).values({
    projectId, chapterId: chapter.id, chapterNumber: chapterNum,
    summaryText: sumOut.summary || '',
    keyEventsJson: sumOut.keyEvents || [],
    characterDeltasJson: sumOut.characterDeltas || [],
    newThreadsJson: sumOut.newThreads || [],
    resolvedThreadsJson: sumOut.resolvedThreads || [],
    advancedThreadsJson: sumOut.advancedThreads || [],
    newWorldFactsJson: sumOut.newWorldFacts || [],
    timelineEventsJson: sumOut.timelineEvents || [],
  })

  // Save timeline events and threads
  for (const ev of (sumOut.timelineEvents || []))
    await db.insert(schema.timelineEvents).values({ projectId, chapterNumber: chapterNum, eventType: 'plot', eventSummary: ev.event, locationKey: ev.location })
  for (const t of (sumOut.newThreads || []))
    await db.insert(schema.unresolvedThreads).values({ projectId, label: typeof t === 'string' ? t : JSON.stringify(t), type: 'plot', originChapter: chapterNum, currentStatus: 'active' })

  // Confirm the draft artifact
  await db.update(schema.artifacts)
    .set({ status: 'confirmed', confirmedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.artifacts.title, `第${chapterNum}章草稿`))

  addTrace('orchestrator', `第${chapterNum}章入典完成！`)

  let responseText = `✅ **第${chapterNum}章已入典！**\n\n`
  responseText += `**摘要:** ${sumOut.summary?.slice(0, 200)}...\n\n`
  if (sumOut.keyEvents?.length > 0) responseText += `**关键事件:** ${sumOut.keyEvents.join(', ')}\n`
  if (sumOut.characterDeltas?.length > 0) responseText += `**角色变化:** ${sumOut.characterDeltas.map((d: any) => `${d.character}: ${d.change}`).join(', ')}\n`
  if (sumOut.newThreads?.length > 0) responseText += `**新线索:** ${sumOut.newThreads.join(', ')}\n`
  responseText += '\n准备好写下一章了吗？'

  return c.json({
    assistant_message: responseText,
    intent: 'pipeline_task',
    trace: { steps: trace },
    flowContext: { step: 'idle', chapterNumber: chapterNum },
    suggested_actions: ['开始写下一章', '查看章节', '修改角色状态'],
  })
}

// ─── Shared helpers (duplicated to avoid closure issues) ──
async function getCanonHelper(db: Database, projectId: string) {
  const characters = await db.select().from(schema.characterStates).where(eq(schema.characterStates.projectId, projectId))
  const worldRules = await db.select().from(schema.storyBibleEntries).where(eq(schema.storyBibleEntries.projectId, projectId))
  const threads = await db.select().from(schema.unresolvedThreads).where(eq(schema.unresolvedThreads.projectId, projectId))
  const summaries = await db.select().from(schema.chapterSummaries).where(eq(schema.chapterSummaries.projectId, projectId))
  const chapters = await db.select().from(schema.chapters).where(eq(schema.chapters.projectId, projectId))
  return { characters, worldRules, threads, summaries, chapters }
}

function formatCanonHelper(canon: Awaited<ReturnType<typeof getCanonHelper>>) {
  return {
    charStr: canon.characters.map(c => `【${c.name}】[${c.characterKey}] ${c.tier} | ${JSON.stringify(c.dimensionsJson)}`).join('\n'),
    worldStr: canon.worldRules.map(r => `【${r.key}】${JSON.stringify(r.valueJson)}`).join('\n'),
    prevStr: canon.summaries.sort((a, b) => a.chapterNumber - b.chapterNumber).map(s => `第${s.chapterNumber}章: ${s.summaryText}`).join('\n') || '(无前章)',
    threadStr: canon.threads.map(t => `- ${t.label} (${t.currentStatus})`).join('\n') || '(暂无)',
  }
}

async function callLLMHelper(model: any, prompt: string, maxTok = 4000) {
  const t0 = Date.now()
  const r = await generateText({ model, prompt, maxTokens: maxTok, temperature: 0.7 })
  return { text: r.text, tIn: r.usage?.inputTokens ?? 0, tOut: r.usage?.outputTokens ?? 0, ms: Date.now() - t0 }
}

function parseJSONHelper(text: string): any {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  if (!m) return null
  try { return JSON.parse(m[1].trim().replace(/[\x00-\x1f\x7f]/g, (c) => c === '\n' || c === '\r' || c === '\t' ? c : ' ')) }
  catch { try { return JSON.parse(m[1].trim().replace(/[\x00-\x1f\x7f]/g, ' ')) } catch { return null } }
}
