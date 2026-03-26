/**
 * M9 v3: 5-Chapter Test — DeepSeek Writer + GPT-4o-mini Planner
 *
 * Model allocation:
 *   Planner:    GPT-4o-mini (fast, cheap, JSON reliable)
 *   Writer:     DeepSeek-Chat (best Chinese output, 3000+ chars)
 *   QA:         DeepSeek-Chat (detailed Chinese reviews)
 *   Summarizer: DeepSeek-Chat (cheap, good Chinese)
 *   Metadata:   GPT-4o-mini (simple JSON extraction)
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import * as schema from '../db/schema/index.js'
import { filterCharactersByTier, type CharacterForPacket } from '@novel-studio/orchestrator'
import { buildPlannerPacketPrompt, buildWriterProsePrompt, buildWriterMetadataPrompt, buildQAPacketPrompt, buildSummarizerPacketPrompt } from '@novel-studio/prompts'
import { estimateCost } from '@novel-studio/llm-adapter'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

// Providers
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const deepseekProvider = createOpenAI({ apiKey: process.env.DEEPSEEK_API_KEY!, baseURL: 'https://api.deepseek.com/v1' })

// Model assignments
const plannerModel = openai('gpt-4o-mini')
const writerModel = deepseekProvider.chat('deepseek-chat')
const qaModel = deepseekProvider.chat('deepseek-chat')
const summarizerModel = deepseekProvider.chat('deepseek-chat')
const metadataModel = openai('gpt-4o-mini')

async function getProject() {
  const projects = await db.select().from(schema.projects)
  return projects[0]
}

async function getCanon(projectId: string) {
  const characters = await db.select().from(schema.characterStates).where(eq(schema.characterStates.projectId, projectId))
  const worldRules = await db.select().from(schema.storyBibleEntries).where(eq(schema.storyBibleEntries.projectId, projectId))
  const threads = await db.select().from(schema.unresolvedThreads).where(eq(schema.unresolvedThreads.projectId, projectId))
  const summaries = await db.select().from(schema.chapterSummaries).where(eq(schema.chapterSummaries.projectId, projectId))
  return { characters, worldRules, threads, summaries }
}

async function callLLM(model: any, modelName: string, prompt: string, label: string, maxTok = 8000) {
  console.log(`  [${label}] ${modelName}...`)
  const t0 = Date.now()
  const r = await generateText({ model, prompt, maxTokens: maxTok, temperature: 0.7 })
  const ms = Date.now() - t0
  const tIn = r.usage?.inputTokens ?? 0
  const tOut = r.usage?.outputTokens ?? 0
  const cost = estimateCost(modelName, tIn, tOut)
  console.log(`  [${label}] ${(ms/1000).toFixed(1)}s | ${tIn}+${tOut}tok | $${cost.totalCost.toFixed(4)}`)
  return { text: r.text, tIn, tOut, model: modelName }
}

function parseJSON<T>(text: string, label: string): T {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  if (!m) throw new Error(`[${label}] No JSON found`)
  // Clean control characters that break JSON.parse (common with DeepSeek)
  const cleaned = m[1].trim()
    .replace(/[\x00-\x1f\x7f]/g, (ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\t') return ch
      return ''
    })
    // Fix unescaped newlines inside JSON string values
    .replace(/(?<=": "(?:[^"\\]|\\.)*)(?:\r?\n)(?=(?:[^"\\]|\\.)*")/g, '\\n')
  try {
    return JSON.parse(cleaned)
  } catch (e) {
    // Fallback: more aggressive cleaning
    const aggressive = m[1].trim().replace(/[\x00-\x1f\x7f]/g, ' ')
    return JSON.parse(aggressive)
  }
}

const OUTLINES = [
  '第1章：林凡在家族月比中被林浩天当众羞辱。林浩天用碎岩掌压制林凡后说"你爹偷了族中秘药才跑的"。林凡情绪崩溃，体内吞天魔帝残魂觉醒，给了他噬魂爪。林凡反击一招击碎林浩天手腕，踹飞他。苏雨晴在远处记录灵力波动。林老三在人群中认出噬魂爪但不说破。',
  '第2章：当夜林凡在后山，魔帝残魂正式开口自我介绍。魔帝教他控制噬魂爪但警告反噬风险——用越多暴虐情绪越强。修炼中苏雨晴出现（她也在调查灵力异常），两人首次正式交谈。苏雨晴毒舌但暗中对林凡产生兴趣。',
  '第3章：林浩天指使管事王胖子断掉林凡月例资源。林凡决定夜闯药园偷取灵药。药园守卫炼气六层，林凡用噬魂爪配合战斗智慧击败他。林老三暗中打掩护。林凡炼化灵药突破到炼气四层。',
  '第4章：家族大比预选赛。林凡连败三名旁支弟子，每战展现不同招式变化。灰袍长老注意到异常气息。赛后苏雨晴私下约见林凡，告诉他她检测到他体内有非正常灵力波动，提醒他小心灰袍长老。',
  '第5章：灰袍长老在林凡修炼时设下灵力陷阱。林凡险些暴露魔帝力量但最后一刻控制住。预选赛决赛对林浩天，林凡用噬魂爪碾压获胜，林浩天当众跪地。夜晚林老三约见林凡，透露父母失踪跟家族上层有关。',
]

async function runChapter(ch: number, projectId: string) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  第 ${ch} 章`)
  console.log(`${'═'.repeat(60)}`)

  const canon = await getCanon(projectId)
  const charStr = canon.characters.map(c =>
    `【${c.name}】[${c.characterKey}] ${c.tier} | ${JSON.stringify(c.dimensionsJson)} | 性格:${JSON.stringify(c.personalityJson)} | 状态:${JSON.stringify(c.currentStatusJson)}`
  ).join('\n')
  const worldStr = canon.worldRules.map(r => `【${r.key}】${JSON.stringify(r.valueJson)}`).join('\n')
  const prevStr = canon.summaries.sort((a,b) => a.chapterNumber - b.chapterNumber)
    .map(s => `第${s.chapterNumber}章: ${s.summaryText}`).join('\n\n') || '(第一章，无前章)'
  const threadStr = canon.threads.map(t => `- ${t.label} (${t.currentStatus})`).join('\n') || '(暂无)'

  let totalIn = 0, totalOut = 0

  // ── Plan (GPT-4o-mini) ─────────────────────────
  console.log('\n  Step 1: 规划...')
  const planCtx = `
## 《吞天魔帝》第${ch}章大纲
${OUTLINES[ch-1]}
## 角色
${charStr}
## 世界规则
${worldStr}
## 前章摘要
${prevStr}
## 线索
${threadStr}
## 要求：基于大纲生成3个场景的蓝图JSON
{"summary":"...","assumptions":[],"questions":[],"artifacts":[{"type":"scene_card","title":"蓝图","content":{"scenes":[{"sceneIndex":0,"sceneKey":"...","objective":"...","beats":["..."],"dialogueNotes":"...","combatNotes":"...","characters":["..."]}]}}],"issues":[]}
`
  const planR = await callLLM(plannerModel, 'gpt-4o-mini', buildPlannerPacketPrompt(planCtx, 'expand'), '规划师')
  totalIn += planR.tIn; totalOut += planR.tOut
  const scenes = parseJSON<any>(planR.text, 'Planner').artifacts?.[0]?.content?.scenes || []
  console.log(`  蓝图: ${scenes.length} 场景`)

  // ── Write (DeepSeek) ───────────────────────────
  console.log('\n  Step 2: 写作 (DeepSeek)...')
  const sceneKeys = [...new Set(scenes.flatMap((s: any) => s.characters || ['lin_fan']))]
  const charsForPacket: CharacterForPacket[] = canon.characters.map(c => ({
    characterKey: c.characterKey, name: c.name,
    tier: c.tier as 'core'|'important'|'episodic',
    stateJson: JSON.stringify({ dimensions: c.dimensionsJson, status: c.currentStatusJson, personality: c.personalityJson }),
  }))
  const filtered = filterCharactersByTier(charsForPacket, sceneKeys)

  const writeCtx = `
## 《吞天魔帝》第${ch}章
## 蓝图（合同）
${JSON.stringify(scenes, null, 2)}
## 出场角色
${filtered.map(c => `【${c.name}】${c.stateJson}`).join('\n\n')}
## 世界规则
${worldStr}
## 前章摘要
${prevStr}
`
  const writeR = await callLLM(writerModel, 'deepseek-chat', buildWriterProsePrompt(writeCtx), '写手', 16000)
  totalIn += writeR.tIn; totalOut += writeR.tOut
  const proseText = writeR.text
  const charCount = proseText.length
  const chineseChars = (proseText.match(/[\u4e00-\u9fff]/g) || []).length
  console.log(`  生成 ${charCount} 字符 / ${chineseChars} 中文字`)

  // ── Metadata (GPT-4o-mini) ─────────────────────
  const metaR = await callLLM(metadataModel, 'gpt-4o-mini', buildWriterMetadataPrompt(proseText.slice(0, 2000)), '元数据', 500)
  totalIn += metaR.tIn; totalOut += metaR.tOut
  let meta: any = {}
  try { meta = parseJSON<any>(metaR.text, 'meta') } catch { meta = { chapterTitle: `第${ch}章` } }

  // ── QA (DeepSeek) ──────────────────────────────
  console.log('\n  Step 3: QA (DeepSeek)...')
  const qaCtx = `
## 章节正文
${proseText}
## 蓝图
${JSON.stringify(scenes, null, 2)}
## 角色卡
${filtered.map(c => `【${c.name}】${c.stateJson}`).join('\n\n')}
## 世界规则
${worldStr}
`
  const qaR = await callLLM(qaModel, 'deepseek-chat', buildQAPacketPrompt(qaCtx), 'QA')
  totalIn += qaR.tIn; totalOut += qaR.tOut
  const qaOut = parseJSON<any>(qaR.text, 'QA')
  console.log(`  结论: ${qaOut.decision}`)
  console.log(`  评价: ${(qaOut.overallNotes || '').slice(0, 120)}`)
  if (qaOut.issues?.length > 0) {
    qaOut.issues.slice(0, 3).forEach((iss: any) => console.log(`  [${iss.severity}] ${(iss.description||'').slice(0, 80)}`))
  }

  // ── Summarize (DeepSeek) ───────────────────────
  console.log('\n  Step 4: 摘要 (DeepSeek)...')
  const sumCtx = `
## 章节全文
${proseText}
## 角色
${canon.characters.map(c => `${c.characterKey}: ${c.name} (${c.tier})`).join('\n')}
## 线索
${threadStr}
## 输出JSON
{"chapterNumber":${ch},"summary":"300-500字摘要","keyEvents":[],"characterDeltas":[{"character":"key","change":"变化"}],"newThreads":[],"resolvedThreads":[],"advancedThreads":[],"newWorldFacts":[],"timelineEvents":[{"event":"事件","location":"地点"}],"episodicCharactersToArchive":[]}
`
  const sumR = await callLLM(summarizerModel, 'deepseek-chat', buildSummarizerPacketPrompt(sumCtx), '摘要')
  totalIn += sumR.tIn; totalOut += sumR.tOut
  const sumOut = parseJSON<any>(sumR.text, 'Sum')

  // ── Save to DB ─────────────────────────────────
  const [chapter] = await db.insert(schema.chapters).values({
    projectId, chapterNumber: ch, title: meta.chapterTitle || `第${ch}章`,
    status: 'canonized', canonizedAt: new Date(),
  }).returning()

  await db.insert(schema.artifacts).values({
    projectId, type: 'chapter_draft', title: meta.chapterTitle || `第${ch}章`,
    status: 'confirmed', contentJson: { text: proseText },
    sceneSegmentsJson: proseText.split(/\n-{3,}\n/).filter((s: string) => s.trim()).map((text: string, i: number) => ({
      sceneIndex: i, sceneKey: scenes[i]?.sceneKey || `scene_${i}`, text: text.trim(),
    })),
    confirmedAt: new Date(), createdByRole: 'writer',
  })

  await db.insert(schema.chapterSummaries).values({
    projectId, chapterId: chapter.id, chapterNumber: ch,
    summaryText: sumOut.summary || '', keyEventsJson: sumOut.keyEvents || [],
    characterDeltasJson: sumOut.characterDeltas || [], newThreadsJson: sumOut.newThreads || [],
    resolvedThreadsJson: sumOut.resolvedThreads || [], advancedThreadsJson: sumOut.advancedThreads || [],
    newWorldFactsJson: sumOut.newWorldFacts || [], timelineEventsJson: sumOut.timelineEvents || [],
  })

  for (const ev of (sumOut.timelineEvents || []))
    await db.insert(schema.timelineEvents).values({ projectId, chapterNumber: ch, eventType: 'plot', eventSummary: ev.event, locationKey: ev.location })
  for (const t of (sumOut.newThreads || []))
    await db.insert(schema.unresolvedThreads).values({ projectId, label: t, type: 'plot', originChapter: ch, currentStatus: 'active' })

  console.log(`\n  ✅ 第${ch}章入典! ${chineseChars} 中文字`)

  return { ch, title: meta.chapterTitle, charCount, chineseChars, qa: qaOut.decision, qaIssues: qaOut.issues?.length||0, totalIn, totalOut }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   M9 v3: DeepSeek Writer + GPT-4o-mini Planner         ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log('  Writer/QA/Summarizer: DeepSeek-Chat')
  console.log('  Planner/Metadata: GPT-4o-mini')

  const project = await getProject()
  if (!project) { console.error('No project.'); process.exit(1) }
  console.log(`\n  项目: ${project.title}`)

  const results: any[] = []
  for (let i = 1; i <= 5; i++) {
    try { results.push(await runChapter(i, project.id)) }
    catch (e) { console.error(`\n  ❌ 第${i}章:`, (e as Error).message); results.push({ ch: i, error: (e as Error).message }) }
  }

  console.log('\n' + '═'.repeat(60))
  console.log('  最终报告')
  console.log('═'.repeat(60))

  let allIn = 0, allOut = 0
  for (const r of results) {
    if ('error' in r) { console.log(`  第${r.ch}章: ❌ ${r.error}`) }
    else {
      // Estimate mixed cost: roughly 60% deepseek tokens, 40% openai tokens
      const dsCost = estimateCost('deepseek-chat', r.totalIn * 0.7, r.totalOut * 0.7)
      const oaiCost = estimateCost('gpt-4o-mini', r.totalIn * 0.3, r.totalOut * 0.3)
      const cost = dsCost.totalCost + oaiCost.totalCost
      console.log(`  第${r.ch}章: ✅ ${r.title || ''} | ${r.chineseChars}中文字 | QA:${r.qa}(${r.qaIssues}) | ${r.totalIn}+${r.totalOut}tok | ~$${cost.toFixed(4)}`)
      allIn += r.totalIn; allOut += r.totalOut
    }
  }

  const dsCostAll = estimateCost('deepseek-chat', allIn * 0.7, allOut * 0.7)
  const oaiCostAll = estimateCost('gpt-4o-mini', allIn * 0.3, allOut * 0.3)
  console.log(`\n  总tokens: ${allIn}+${allOut} = ${allIn+allOut}`)
  console.log(`  总费用: ~$${(dsCostAll.totalCost + oaiCostAll.totalCost).toFixed(4)}`)

  const p = (await getProject())!
  const sums = await db.select().from(schema.chapterSummaries).where(eq(schema.chapterSummaries.projectId, p.id))
  const thrds = await db.select().from(schema.unresolvedThreads).where(eq(schema.unresolvedThreads.projectId, p.id))
  const tl = await db.select().from(schema.timelineEvents).where(eq(schema.timelineEvents.projectId, p.id))
  console.log(`\n  Canon: ${sums.length}摘要 | ${thrds.length}线索 | ${tl.length}事件`)
  if (thrds.length > 0) console.log(`  线索: ${thrds.map(t => typeof t.label === 'string' ? t.label : JSON.stringify(t.label)).join(', ')}`)

  await client.end()
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
