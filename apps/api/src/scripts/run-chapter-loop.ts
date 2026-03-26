/**
 * M9: 5-Chapter Integration Test (v2 — split Writer calls)
 *
 * Writer now uses two LLM calls:
 *   Call 1: Pure prose (plain text, 2000-3000 chars)
 *   Call 2: Extract metadata JSON (title, summary, risks)
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
import { plannerOutputSchema, qaOutputSchema, summarizerOutputSchema } from '@novel-studio/prompts'
import { estimateCost } from '@novel-studio/llm-adapter'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const MODEL_ID = 'gpt-4o'
const llm = openai(MODEL_ID)

// ─── Helpers ────────────────────────────────────────

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

async function callLLM(prompt: string, label: string, maxTok = 8000) {
  console.log(`  [${label}] 调用 GPT-4o...`)
  const t0 = Date.now()
  const r = await generateText({ model: llm, prompt, maxTokens: maxTok, temperature: 0.7 })
  const ms = Date.now() - t0
  const tIn = r.usage?.inputTokens ?? 0
  const tOut = r.usage?.outputTokens ?? 0
  const c = estimateCost(MODEL_ID, tIn, tOut)
  console.log(`  [${label}] ${(ms/1000).toFixed(1)}s | ${tIn}+${tOut} tok | $${c.totalCost.toFixed(4)}`)
  return { text: r.text, tIn, tOut }
}

function parseJSON<T>(text: string, label: string): T {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  if (!m) throw new Error(`[${label}] No JSON found`)
  return JSON.parse(m[1].trim())
}

const OUTLINES = [
  '第1章：林凡在家族月比中被林浩天当众羞辱和殴打。林浩天说出"你爹当年偷了族中秘药才被赶走的"激怒林凡。体内吞天魔帝残魂觉醒，给了林凡噬魂爪，林凡反击一招击碎林浩天手腕。苏雨晴在远处记录灵力波动。林老三在人群中认出噬魂爪。',
  '第2章：当夜林凡在后山与魔帝残魂第一次正式对话。魔帝教他控制噬魂爪但警告反噬风险。修炼中遇到苏雨晴（来调查异常灵力波动），两人首次正式交谈，互相试探。苏雨晴对林凡产生兴趣。',
  '第3章：林浩天指使管事王胖子断掉林凡月例资源。林凡决定夜闯药园偷取突破用的灵药。药园有炼气六层守卫，林凡用噬魂爪配合战斗智慧打败守卫。林老三暗中帮林凡打掩护，确保没人追来。林凡成功突破到炼气四层。',
  '第4章：家族大比预选赛。林凡连败三名旁支弟子展现实力。灰袍长老注意到林凡体内异常气息。赛后苏雨晴私下约见林凡，告诉他她检测到他体内有非正常灵力波动，提醒他小心灰袍长老。两人关系推进。',
  '第5章：灰袍长老在林凡修炼时设下灵力陷阱试探。林凡险些暴露魔帝力量但最后一刻控制住。预选赛决赛林凡对战林浩天，用噬魂爪彻底击败他，林浩天当众跪地。夜晚林老三约见林凡，透露林凡父母失踪跟家族上层有关，但不敢说更多。',
]

// ─── Chapter Loop ───────────────────────────────────

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

  const threadStr = canon.threads.map(t => `- ${t.label} (${t.currentStatus}, 起源第${t.originChapter}章)`).join('\n') || '(暂无)'

  let totalIn = 0, totalOut = 0

  // ─── Step 1: Plan ─────────────────────────────────
  console.log('\n  Step 1: 规划蓝图...')
  const planCtx = `
## 项目：《吞天魔帝》玄幻升级流爽文
## 第${ch}章大纲
${OUTLINES[ch-1]}
## 角色
${charStr}
## 世界规则
${worldStr}
## 前章摘要
${prevStr}
## 活跃线索
${threadStr}
## 要求
严格基于大纲展开3个场景。每场景含 sceneIndex/sceneKey/objective/beats/dialogueNotes/combatNotes/characters。
输出JSON：{"summary":"...","assumptions":[],"questions":[],"artifacts":[{"type":"scene_card","title":"第${ch}章蓝图","content":{"scenes":[...]}}],"issues":[]}
`
  const planR = await callLLM(buildPlannerPacketPrompt(planCtx, 'expand'), '规划师')
  totalIn += planR.tIn; totalOut += planR.tOut
  const planOut = parseJSON<any>(planR.text, 'Planner')
  const scenes = planOut.artifacts?.[0]?.content?.scenes || []
  console.log(`  蓝图: ${scenes.length} 场景`)
  scenes.forEach((s: any, i: number) => console.log(`    ${i}: ${s.objective}`))

  // ─── Step 2: Write (TWO CALLS) ────────────────────
  console.log('\n  Step 2: 写作（纯文本模式）...')

  const sceneKeys = [...new Set(scenes.flatMap((s: any) => s.characters || ['lin_fan']))]
  const charsForPacket: CharacterForPacket[] = canon.characters.map(c => ({
    characterKey: c.characterKey, name: c.name,
    tier: c.tier as 'core'|'important'|'episodic',
    stateJson: JSON.stringify({ dimensions: c.dimensionsJson, status: c.currentStatusJson, personality: c.personalityJson }),
  }))
  const filtered = filterCharactersByTier(charsForPacket, sceneKeys)

  const writeCtx = `
## 你正在写《吞天魔帝》第${ch}章

## 蓝图（合同，必须严格执行）
${JSON.stringify(scenes, null, 2)}

## 出场角色
${filtered.map(c => `【${c.name}】${c.stateJson}`).join('\n\n')}

## 世界规则
${worldStr}

## 前章摘要
${prevStr}
`
  const writeR = await callLLM(buildWriterProsePrompt(writeCtx), '写手', 16000)
  totalIn += writeR.tIn; totalOut += writeR.tOut
  const proseText = writeR.text
  const charCount = proseText.length
  console.log(`  生成 ${charCount} 字`)

  // Call 2: Extract metadata
  console.log('  提取元数据...')
  const metaR = await callLLM(buildWriterMetadataPrompt(proseText), '元数据', 500)
  totalIn += metaR.tIn; totalOut += metaR.tOut
  let meta: any = {}
  try { meta = parseJSON<any>(metaR.text, 'metadata') } catch { meta = { chapterTitle: `第${ch}章`, chapterSummary: '' } }

  // Split prose into scene segments by "---"
  const rawScenes = proseText.split(/\n---\n|\n---|\n-{3,}\n/).filter(s => s.trim())
  const sceneSegments = rawScenes.map((text, i) => ({
    sceneIndex: i,
    sceneKey: scenes[i]?.sceneKey || `scene_${i}`,
    text: text.trim(),
  }))

  // ─── Step 3: QA ───────────────────────────────────
  console.log('\n  Step 3: QA审查...')
  const qaCtx = `
## 待审查章节正文
${proseText}

## 蓝图（检查覆盖率）
${JSON.stringify(scenes, null, 2)}

## 角色卡
${filtered.map(c => `【${c.name}】${c.stateJson}`).join('\n\n')}

## 世界规则
${worldStr}

## 前章摘要
${prevStr}
`
  const qaR = await callLLM(buildQAPacketPrompt(qaCtx), 'QA')
  totalIn += qaR.tIn; totalOut += qaR.tOut
  const qaOut = parseJSON<any>(qaR.text, 'QA')
  console.log(`  结论: ${qaOut.decision}`)
  console.log(`  评价: ${(qaOut.overallNotes || '').slice(0, 120)}`)
  if (qaOut.issues?.length > 0) {
    qaOut.issues.forEach((iss: any) => console.log(`  [${iss.severity}] ${iss.type}: ${(iss.description||'').slice(0,80)}`))
  }

  // ─── Step 4: Summarize + Canonize ─────────────────
  console.log('\n  Step 4: 摘要入典...')
  const sumCtx = `
## 章节全文
${proseText}
## 角色列表
${canon.characters.map(c => `${c.characterKey}: ${c.name} (${c.tier})`).join('\n')}
## 活跃线索
${threadStr}
## 输出格式
{"chapterNumber":${ch},"summary":"300-500字摘要","keyEvents":[],"characterDeltas":[{"character":"character_key","change":"变化"}],"newThreads":[],"resolvedThreads":[],"advancedThreads":[],"newWorldFacts":[],"timelineEvents":[{"event":"事件","location":"地点"}],"episodicCharactersToArchive":[]}
`
  const sumR = await callLLM(buildSummarizerPacketPrompt(sumCtx), '摘要')
  totalIn += sumR.tIn; totalOut += sumR.tOut
  const sumOut = parseJSON<any>(sumR.text, 'Summarizer')

  // Save to DB
  const [chapter] = await db.insert(schema.chapters).values({
    projectId, chapterNumber: ch,
    title: meta.chapterTitle || `第${ch}章`,
    status: 'canonized', canonizedAt: new Date(),
  }).returning()

  await db.insert(schema.artifacts).values({
    projectId, type: 'chapter_draft',
    title: meta.chapterTitle || `第${ch}章`,
    status: 'confirmed', contentJson: { text: proseText },
    sceneSegmentsJson: sceneSegments,
    confirmedAt: new Date(), createdByRole: 'writer',
  })

  await db.insert(schema.chapterSummaries).values({
    projectId, chapterId: chapter.id, chapterNumber: ch,
    summaryText: sumOut.summary || '',
    keyEventsJson: sumOut.keyEvents || [],
    characterDeltasJson: sumOut.characterDeltas || [],
    newThreadsJson: sumOut.newThreads || [],
    resolvedThreadsJson: sumOut.resolvedThreads || [],
    advancedThreadsJson: sumOut.advancedThreads || [],
    newWorldFactsJson: sumOut.newWorldFacts || [],
    timelineEventsJson: sumOut.timelineEvents || [],
  })

  for (const ev of (sumOut.timelineEvents || [])) {
    await db.insert(schema.timelineEvents).values({
      projectId, chapterNumber: ch, eventType: 'plot',
      eventSummary: ev.event, locationKey: ev.location,
    })
  }
  for (const t of (sumOut.newThreads || [])) {
    await db.insert(schema.unresolvedThreads).values({
      projectId, label: t, type: 'plot', originChapter: ch, currentStatus: 'active',
    })
  }

  console.log(`\n  ✅ 第${ch}章入典! ${charCount}字`)
  console.log(`  摘要: ${(sumOut.summary||'').slice(0,120)}...`)

  return { ch, title: meta.chapterTitle, charCount, qa: qaOut.decision, qaIssues: qaOut.issues?.length||0, totalIn, totalOut }
}

// ─── Main ───────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   Novel Studio M9 v2: 5-Chapter Test (Split Writer)    ║')
  console.log('╚══════════════════════════════════════════════════════════╝')

  const project = await getProject()
  if (!project) { console.error('No project. Run seed.'); process.exit(1) }
  console.log(`\n项目: ${project.title} | 模型: ${MODEL_ID}`)

  const results: any[] = []
  for (let i = 1; i <= 5; i++) {
    try {
      results.push(await runChapter(i, project.id))
    } catch (e) {
      console.error(`\n  ❌ 第${i}章失败:`, (e as Error).message)
      results.push({ ch: i, error: (e as Error).message })
    }
  }

  console.log('\n\n' + '═'.repeat(60))
  console.log('  最终报告')
  console.log('═'.repeat(60))

  let allIn = 0, allOut = 0
  for (const r of results) {
    if ('error' in r) {
      console.log(`  第${r.ch}章: ❌ ${r.error}`)
    } else {
      const c = estimateCost(MODEL_ID, r.totalIn, r.totalOut)
      console.log(`  第${r.ch}章: ✅ ${r.title} | ${r.charCount}字 | QA:${r.qa}(${r.qaIssues}) | ${r.totalIn}+${r.totalOut}tok | $${c.totalCost.toFixed(4)}`)
      allIn += r.totalIn; allOut += r.totalOut
    }
  }

  const totalCost = estimateCost(MODEL_ID, allIn, allOut)
  console.log(`\n  总tokens: ${allIn}+${allOut} = ${allIn+allOut}`)
  console.log(`  总费用: $${totalCost.totalCost.toFixed(4)}`)

  const p = (await getProject())!
  const sums = await db.select().from(schema.chapterSummaries).where(eq(schema.chapterSummaries.projectId, p.id))
  const thrds = await db.select().from(schema.unresolvedThreads).where(eq(schema.unresolvedThreads.projectId, p.id))
  const tl = await db.select().from(schema.timelineEvents).where(eq(schema.timelineEvents.projectId, p.id))
  console.log(`\n  Canon: ${sums.length}摘要 | ${thrds.length}线索 | ${tl.length}事件`)
  if (thrds.length > 0) console.log(`  线索: ${thrds.map(t=>t.label).join(', ')}`)

  await client.end()
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
