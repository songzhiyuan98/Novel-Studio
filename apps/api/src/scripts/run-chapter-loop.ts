/**
 * M9: 5-Chapter Integration Test
 *
 * Runs the full chapter production loop using real LLM calls (gpt-4o):
 * plan → blueprint confirm → write → QA → canonize
 *
 * Usage:
 *   cd apps/api
 *   OPENAI_API_KEY=sk-... DATABASE_URL=postgresql://... npx tsx src/scripts/run-chapter-loop.ts
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import * as schema from '../db/schema/index.js'
import { filterCharactersByTier, type CharacterForPacket } from '@novel-studio/orchestrator'
import { buildPlannerPacketPrompt, buildWriterPacketPrompt, buildQAPacketPrompt, buildSummarizerPacketPrompt } from '@novel-studio/prompts'
import { plannerOutputSchema, writerOutputSchema, qaOutputSchema, summarizerOutputSchema } from '@novel-studio/prompts'
import { estimateCost } from '@novel-studio/llm-adapter'

// ─── Setup ──────────────────────────────────────────

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
// Use gpt-4o for quality
const MODEL_ID = 'gpt-4o'
const llmModel = openai(MODEL_ID)

// ─── Helpers ────────────────────────────────────────

async function getProject() {
  const projects = await db.select().from(schema.projects)
  return projects[0]
}

async function getCanonContext(projectId: string) {
  const characters = await db.select().from(schema.characterStates).where(eq(schema.characterStates.projectId, projectId))
  const worldRules = await db.select().from(schema.storyBibleEntries).where(eq(schema.storyBibleEntries.projectId, projectId))
  const threads = await db.select().from(schema.unresolvedThreads).where(eq(schema.unresolvedThreads.projectId, projectId))
  const summaries = await db.select().from(schema.chapterSummaries).where(eq(schema.chapterSummaries.projectId, projectId))
  return { characters, worldRules, threads, summaries }
}

async function callLLM(prompt: string, label: string, maxTokens = 8000): Promise<{ text: string; tokensIn: number; tokensOut: number }> {
  console.log(`  [${label}] Calling GPT-4o...`)
  const start = Date.now()

  const result = await generateText({
    model: llmModel,
    prompt,
    maxTokens,
    temperature: 0.7,
  })

  const duration = Date.now() - start
  // AI SDK v4 uses inputTokens/outputTokens (not promptTokens/completionTokens)
  const tokIn = result.usage?.inputTokens ?? 0
  const tokOut = result.usage?.outputTokens ?? 0
  const cost = estimateCost(MODEL_ID, tokIn, tokOut)

  console.log(`  [${label}] Done in ${(duration / 1000).toFixed(1)}s | ${tokIn} in + ${tokOut} out | $${cost.totalCost.toFixed(4)}`)

  return { text: result.text, tokensIn: tokIn, tokensOut: tokOut }
}

function parseJSON<T>(text: string, label: string): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
  if (!jsonMatch) {
    console.error(`  [${label}] No JSON in response. First 300 chars:`, text.slice(0, 300))
    throw new Error(`No JSON found in ${label} response`)
  }
  try {
    return JSON.parse(jsonMatch[1].trim())
  } catch (e) {
    console.error(`  [${label}] JSON parse error:`, (e as Error).message)
    throw e
  }
}

// ─── Chapter outlines (pre-planned for variety) ─────

const CHAPTER_OUTLINES = [
  '第1章：林凡在家族月比中被林浩天当众羞辱，体内封印的吞天魔帝残魂首次觉醒，林凡借助魔帝力量反击，一招噬魂爪击碎林浩天手腕。苏雨晴在远处观察记录。',
  '第2章：当夜，林凡在后山与魔帝残魂第一次正式对话，魔帝教他控制噬魂爪。修炼中偶遇苏雨晴（云霄宗弟子，来评估林家天才），两人首次交谈。',
  '第3章：林浩天勾结管事王胖子断掉林凡的修炼资源。林凡潜入药园偷取灵药突破到炼气四层。林老三暗中帮忙打掩护。',
  '第4章：家族大比预选赛开始。林凡用噬魂爪连败三名旁支弟子，引起灰袍长老关注。苏雨晴私下约见林凡，告知她发现他体内的异常灵力波动。',
  '第5章：灰袍长老设下陷阱试探林凡，林凡在千钧一发之际控制住魔帝力量。林浩天在预选赛中被林凡击败，当众跪地。林老三透露他知道林凡父母失踪的部分真相。',
]

// ─── Chapter Loop ───────────────────────────────────

async function runChapter(chapterNumber: number, projectId: string) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  第 ${chapterNumber} 章`)
  console.log(`${'═'.repeat(60)}`)

  const canon = await getCanonContext(projectId)

  const characterSummary = canon.characters.map(c =>
    `${c.name} [${c.characterKey}] (${c.tier}): ${JSON.stringify(c.dimensionsJson)} | 性格: ${JSON.stringify(c.personalityJson)} | 当前状态: ${JSON.stringify(c.currentStatusJson)}`
  ).join('\n')

  const worldRulesSummary = canon.worldRules.map(r =>
    `【${r.key}】${JSON.stringify(r.valueJson)}`
  ).join('\n')

  const previousSummaries = canon.summaries
    .sort((a, b) => a.chapterNumber - b.chapterNumber)
    .map(s => `第${s.chapterNumber}章: ${s.summaryText}`)
    .join('\n\n')

  const threadsSummary = canon.threads
    .map(t => `- ${t.label} (${t.currentStatus}, 起源第${t.originChapter}章)`)
    .join('\n') || '(暂无活跃线索)'

  const outline = CHAPTER_OUTLINES[chapterNumber - 1]

  // ─── Step 1: Plan ─────────────────────────────────
  console.log('\n  Step 1: 规划蓝图...')

  const plannerContext = `
## 项目：《吞天魔帝》玄幻升级流爽文

## 用户提供的第${chapterNumber}章大纲
${outline}

## 当前所有角色
${characterSummary}

## 世界规则
${worldRulesSummary}

## 前章摘要
${previousSummaries || '(这是第一章，无前章)'}

## 活跃伏笔/线索
${threadsSummary}

## 重要要求
1. 严格基于用户大纲展开，不要偏离大纲内容
2. 必须使用大纲中提到的角色
3. 生成恰好3个场景，每场景包含具体的战斗招式、对话要点、反转设计
4. 不要重复前几章已有的模式和情节
5. 每个场景要有明确的情感节奏和爽点

输出JSON：
{
  "summary": "本章整体规划概述",
  "assumptions": [],
  "questions": [],
  "artifacts": [{
    "type": "scene_card",
    "title": "第${chapterNumber}章蓝图",
    "content": {
      "scenes": [
        {
          "sceneIndex": 0,
          "sceneKey": "场景英文标识",
          "objective": "场景目标（中文）",
          "beats": ["节拍1", "节拍2", "节拍3"],
          "dialogueNotes": "关键对话设计",
          "combatNotes": "战斗设计（如有）",
          "characters": ["character_key1", "character_key2"]
        }
      ]
    }
  }],
  "issues": []
}
`

  const planResult = await callLLM(buildPlannerPacketPrompt(plannerContext, 'expand'), 'Planner')
  const plannerOutput = parseJSON<any>(planResult.text, 'Planner')

  const blueprintContent = plannerOutput.artifacts?.[0]?.content || { scenes: [] }
  const scenes = blueprintContent.scenes || []

  console.log(`  [Planner] 蓝图: ${scenes.length} 个场景`)
  scenes.forEach((s: any, i: number) => console.log(`    场景${i}: ${s.objective || s.sceneKey}`))

  // ─── Step 2: Write ────────────────────────────────
  console.log('\n  Step 2: 写作...')

  const sceneCharKeys = [...new Set(scenes.flatMap((s: any) => s.characters || ['lin_fan']))]
  const charsForPacket: CharacterForPacket[] = canon.characters.map(c => ({
    characterKey: c.characterKey,
    name: c.name,
    tier: c.tier as 'core' | 'important' | 'episodic',
    stateJson: JSON.stringify({ dimensions: c.dimensionsJson, status: c.currentStatusJson, personality: c.personalityJson }),
  }))
  const filteredChars = filterCharactersByTier(charsForPacket, sceneCharKeys)

  const writerContext = `
## 写作任务
你正在写《吞天魔帝》第${chapterNumber}章。这是一本中文玄幻升级流爽文。

## 蓝图（这是合同，必须严格执行每个场景目标、对话要点和战斗设计）
${JSON.stringify(scenes, null, 2)}

## 出场角色详细状态
${filteredChars.map(c => `【${c.name}】${c.stateJson}`).join('\n\n')}

## 世界规则
${worldRulesSummary}

## 前章摘要（保持连续性）
${previousSummaries || '(第一章，无前章)'}

## 写作铁律
1. 字数必须在2000-3000中文字之间，这是硬性要求！
2. 中文玄幻爽文风格，节奏快
3. 每500字至少一个冲突或爽点
4. 战斗要有具体招式名称和效果描写
5. 对话要推动剧情，禁止废话
6. 禁止文艺腔，禁止超过2行的景物/心理描写
7. 每个场景的正文不少于600字

## 输出格式（严格JSON）
{
  "chapterTitle": "第${chapterNumber}章 标题",
  "chapterSummary": "100字以内章节摘要",
  "sceneSegments": [
    {"sceneIndex": 0, "sceneKey": "场景标识", "text": "该场景的完整正文（至少600字）"},
    {"sceneIndex": 1, "sceneKey": "...", "text": "..."},
    {"sceneIndex": 2, "sceneKey": "...", "text": "..."}
  ],
  "chapterText": "所有场景正文拼接的完整章节文本",
  "introducedProvisionalElements": [],
  "risks": []
}
`

  const writeResult = await callLLM(buildWriterPacketPrompt(writerContext), 'Writer', 16000)
  const writerOutput = parseJSON<any>(writeResult.text, 'Writer')

  const chapterText = writerOutput.chapterText ||
    writerOutput.sceneSegments?.map((s: any) => s.text).join('\n\n') || ''
  const charCount = chapterText.length
  console.log(`  [Writer] 生成 ${charCount} 字`)

  if (charCount < 500) {
    console.warn(`  ⚠️ 字数过少！(${charCount} < 500)`)
  }

  // ─── Step 3: QA ───────────────────────────────────
  console.log('\n  Step 3: QA审查...')

  const qaContext = `
## 待审查章节
${chapterText}

## 蓝图（检查是否每个场景目标都被覆盖）
${JSON.stringify(scenes, null, 2)}

## 角色卡（检查行为是否一致）
${filteredChars.map(c => `【${c.name}】${c.stateJson}`).join('\n\n')}

## 世界规则
${worldRulesSummary}

## 前章摘要
${previousSummaries || '(第一章)'}

## 审查要求
检查：一致性、动机合理性、节奏、风格、蓝图覆盖率、角色行为合规性
每个问题必须有具体的description字段描述问题

输出JSON：
{
  "decision": "pass|pass_with_notes|revise|block",
  "overallNotes": "总体评价",
  "issues": [
    {
      "severity": "low|medium|high",
      "type": "continuity|motivation|pacing|style|world_logic",
      "description": "问题的具体描述",
      "evidenceRefs": [],
      "suggestedFix": "建议修复方式"
    }
  ]
}
`

  const qaResult = await callLLM(buildQAPacketPrompt(qaContext), 'QA')
  const qaOutput = parseJSON<any>(qaResult.text, 'QA')

  console.log(`  [QA] 结论: ${qaOutput.decision}`)
  console.log(`  [QA] 评价: ${(qaOutput.overallNotes || '').slice(0, 120)}`)
  if (qaOutput.issues?.length > 0) {
    qaOutput.issues.forEach((issue: any) => {
      console.log(`  [QA] [${issue.severity}] ${issue.type}: ${(issue.description || '无描述').slice(0, 80)}`)
    })
  }

  // ─── Step 4: Summarize + Canonize ─────────────────
  console.log('\n  Step 4: 摘要 + 入典...')

  const summarizerContext = `
## 章节全文
${chapterText}

## 角色列表（含tier）
${canon.characters.map(c => `${c.characterKey}: ${c.name} (${c.tier})`).join('\n')}

## 当前活跃线索
${threadsSummary}

## 输出格式
{
  "chapterNumber": ${chapterNumber},
  "summary": "300-500字的结构化摘要，聚焦关键事件和角色变化",
  "keyEvents": ["事件1", "事件2"],
  "characterDeltas": [{"character": "character_key", "change": "具体变化描述"}],
  "newThreads": ["新开的伏笔/线索名称"],
  "resolvedThreads": ["已解决的线索名称"],
  "advancedThreads": ["推进中的线索名称"],
  "newWorldFacts": ["新的世界设定"],
  "timelineEvents": [{"event": "事件描述", "location": "地点"}],
  "episodicCharactersToArchive": ["character_key"]
}
`

  const sumResult = await callLLM(buildSummarizerPacketPrompt(summarizerContext), 'Summarizer')
  const sumOutput = parseJSON<any>(sumResult.text, 'Summarizer')

  // ─── Save to DB ───────────────────────────────────
  const [chapter] = await db.insert(schema.chapters).values({
    projectId,
    chapterNumber,
    title: writerOutput.chapterTitle || `第${chapterNumber}章`,
    status: 'canonized',
    canonizedAt: new Date(),
  }).returning()

  await db.insert(schema.artifacts).values({
    projectId,
    type: 'chapter_draft',
    title: writerOutput.chapterTitle || `第${chapterNumber}章`,
    status: 'confirmed',
    contentJson: { text: chapterText },
    sceneSegmentsJson: writerOutput.sceneSegments || [],
    confirmedAt: new Date(),
    createdByRole: 'writer',
  })

  await db.insert(schema.chapterSummaries).values({
    projectId,
    chapterId: chapter.id,
    chapterNumber,
    summaryText: sumOutput.summary || '',
    keyEventsJson: sumOutput.keyEvents || [],
    characterDeltasJson: sumOutput.characterDeltas || [],
    newThreadsJson: sumOutput.newThreads || [],
    resolvedThreadsJson: sumOutput.resolvedThreads || [],
    advancedThreadsJson: sumOutput.advancedThreads || [],
    newWorldFactsJson: sumOutput.newWorldFacts || [],
    timelineEventsJson: sumOutput.timelineEvents || [],
  })

  for (const event of (sumOutput.timelineEvents || [])) {
    await db.insert(schema.timelineEvents).values({
      projectId,
      chapterNumber,
      eventType: 'plot',
      eventSummary: event.event,
      locationKey: event.location,
    })
  }

  for (const thread of (sumOutput.newThreads || [])) {
    await db.insert(schema.unresolvedThreads).values({
      projectId,
      label: thread,
      type: 'plot',
      originChapter: chapterNumber,
      currentStatus: 'active',
    })
  }

  console.log(`\n  ✅ 第${chapterNumber}章入典!`)
  console.log(`  摘要: ${(sumOutput.summary || '').slice(0, 120)}...`)

  return {
    chapterNumber,
    title: writerOutput.chapterTitle,
    charCount,
    qaDecision: qaOutput.decision,
    qaIssues: qaOutput.issues?.length || 0,
    tokensIn: planResult.tokensIn + writeResult.tokensIn + qaResult.tokensIn + sumResult.tokensIn,
    tokensOut: planResult.tokensOut + writeResult.tokensOut + qaResult.tokensOut + sumResult.tokensOut,
  }
}

// ─── Main ───────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║     Novel Studio M9: 5-Chapter Test (GPT-4o)           ║')
  console.log('╚══════════════════════════════════════════════════════════╝')

  const project = await getProject()
  if (!project) {
    console.error('No project found. Run seed first.')
    process.exit(1)
  }

  console.log(`\n项目: ${project.title} (${project.id})`)
  console.log(`模型: ${MODEL_ID}`)

  const results: any[] = []

  for (let i = 1; i <= 5; i++) {
    try {
      const result = await runChapter(i, project.id)
      results.push(result)
    } catch (e) {
      console.error(`\n  ❌ 第${i}章失败:`, (e as Error).message)
      results.push({ chapterNumber: i, error: (e as Error).message })
    }
  }

  // ─── Final Report ─────────────────────────────────
  console.log('\n\n' + '═'.repeat(60))
  console.log('  最终报告')
  console.log('═'.repeat(60))

  let totalIn = 0, totalOut = 0
  for (const r of results) {
    if ('error' in r) {
      console.log(`  第${r.chapterNumber}章: ❌ ${r.error}`)
    } else {
      const cost = estimateCost(MODEL_ID, r.tokensIn, r.tokensOut)
      console.log(`  第${r.chapterNumber}章: ✅ ${r.title} | ${r.charCount}字 | QA:${r.qaDecision}(${r.qaIssues}issues) | ${r.tokensIn}+${r.tokensOut}tok | $${cost.totalCost.toFixed(4)}`)
      totalIn += r.tokensIn
      totalOut += r.tokensOut
    }
  }

  const totalCost = estimateCost(MODEL_ID, totalIn, totalOut)
  console.log(`\n  总 tokens: ${totalIn} in + ${totalOut} out = ${totalIn + totalOut}`)
  console.log(`  总费用: $${totalCost.totalCost.toFixed(4)}`)

  // Canon consistency check
  console.log('\n  Canon 一致性检查:')
  const project2 = (await getProject())!
  const finalSummaries = await db.select().from(schema.chapterSummaries).where(eq(schema.chapterSummaries.projectId, project2.id))
  console.log(`  章节摘要: ${finalSummaries.length}`)
  const finalThreads = await db.select().from(schema.unresolvedThreads).where(eq(schema.unresolvedThreads.projectId, project2.id))
  console.log(`  活跃线索: ${finalThreads.length} — ${finalThreads.map(t => t.label).join(', ')}`)
  const finalTimeline = await db.select().from(schema.timelineEvents).where(eq(schema.timelineEvents.projectId, project2.id))
  console.log(`  时间线事件: ${finalTimeline.length}`)

  console.log('\n  完成!')
  await client.end()
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
