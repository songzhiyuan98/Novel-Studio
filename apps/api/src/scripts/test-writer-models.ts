/**
 * A/B test: Compare GPT-4o vs DeepSeek for all workers
 * Test Writer (quality + word count), QA, Planner, Summarizer
 */

import 'dotenv/config'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { buildWriterProsePrompt, buildQAPacketPrompt } from '@novel-studio/prompts'

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const deepseekProvider = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: 'https://api.deepseek.com/v1',
})

const WRITER_CONTEXT = `
## 你正在写《吞天魔帝》第1章

## 蓝图（合同，必须严格执行）
[
  {
    "sceneIndex": 0,
    "sceneKey": "humiliation",
    "objective": "林凡在家族月比中被林浩天当众羞辱",
    "beats": ["林凡上台比武", "林浩天嘲讽林凡是旁支废物", "林浩天用碎岩掌压制林凡", "林浩天说出'你爹偷了族中秘药'激怒林凡"],
    "dialogueNotes": "林浩天要透露林凡父母的信息来刺激他",
    "combatNotes": "碎岩掌：灵力化为岩石质感气劲，炼气七层 vs 三层差距16倍",
    "characters": ["lin_fan", "lin_haotian"]
  },
  {
    "sceneIndex": 1,
    "sceneKey": "awakening",
    "objective": "吞天魔帝残魂觉醒，给林凡力量反击",
    "beats": ["林凡情绪崩溃触发觉醒", "魔帝残魂开口说话", "黑色灵力涌入林凡体内", "林凡用噬魂爪挡住碎岩掌"],
    "combatNotes": "噬魂爪：五指化黑气，接触灵力时自动吞噬对方灵力",
    "characters": ["lin_fan", "lin_haotian"]
  },
  {
    "sceneIndex": 2,
    "sceneKey": "counterattack",
    "objective": "林凡反击击碎林浩天手腕，震惊全场",
    "beats": ["噬魂爪碎骨", "林凡踹飞林浩天", "林老三认出噬魂爪", "苏雨晴在远处记录灵力波动", "林凡说'我爹是不是贼，三个月后我自己查'"],
    "dialogueNotes": "林凡的台词要有分量，不多说但每句掷地有声",
    "characters": ["lin_fan", "lin_haotian", "lin_laosan", "su_yuqing"]
  }
]

## 出场角色
【林凡】炼气三层 | 性格：隐忍、记仇、话少但每句有分量 | 状态：被家族排挤的旁支弃子
【林浩天】炼气七层 | 性格：嚣张但不蠢 | 招式：碎岩掌 | 动机：父亲靠打压林凡父亲上位
【林老三】筑基后期 | 表面糊涂实际精明 | 林凡父亲好友，暗中保护
【苏雨晴】炼气五层 | 云霄宗外门弟子 | 外冷内热

## 世界规则
修炼体系：炼气→筑基→金丹→元婴→化神→渡劫→大乘，每层灵力翻倍
战技等级：黄→玄→地→天
林家：云荒城中等家族，三个月后家族大比前三进云霄宗

## 前章摘要
(第一章，无前章)
`

const QA_CONTEXT = `
## 待审查章节正文
林凡站在演武台上，四周的嘲讽声如潮水般涌来。他的对手林浩天，炼气七层，比他高出整整四个小境界。按修炼体系，两人的灵力差距足足有十六倍。然而林凡没有退缩。碎岩掌呼啸而来，林凡被一掌拍飞。林浩天冷笑道："你爹当年偷了族中秘药才跑的，整个林家谁不知道？"这句话让林凡瞳孔骤缩。体内深处，一道苍老的声音响起："区区蝼蚁，也配辱本帝的宿主？"黑色灵力涌入四肢百骸，林凡一爪抓碎了林浩天的手腕。

## 蓝图
（省略，检查行为一致性即可）

## 角色卡
林凡：隐忍、记仇 | 林浩天：嚣张

## 输出格式
{"decision":"pass|revise","overallNotes":"评价","issues":[{"severity":"low|medium|high","type":"continuity|motivation","description":"问题描述","suggestedFix":"修复建议"}]}
`

interface TestResult {
  name: string
  model: string
  role: string
  charCount: number
  chineseChars: number
  seconds: number
  tokIn: number
  tokOut: number
  preview: string
  success: boolean
}

async function testModel(name: string, model: any, prompt: string, role: string, maxTok: number): Promise<TestResult> {
  console.log(`\n  [${name}] 测试 ${role}...`)
  const t0 = Date.now()
  try {
    const r = await generateText({ model, prompt, maxTokens: maxTok, temperature: 0.7 })
    const ms = Date.now() - t0
    const tIn = r.usage?.inputTokens ?? 0
    const tOut = r.usage?.outputTokens ?? 0
    const text = r.text
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length

    console.log(`  [${name}] ${(ms/1000).toFixed(1)}s | ${tIn}+${tOut} tok | ${text.length}字符 | ${chineseChars}中文字`)

    return { name, model: name, role, charCount: text.length, chineseChars, seconds: ms/1000, tokIn: tIn, tokOut: tOut, preview: text.slice(0, 200), success: true }
  } catch (e) {
    console.error(`  [${name}] ❌ ${(e as Error).message.slice(0, 100)}`)
    return { name, model: name, role, charCount: 0, chineseChars: 0, seconds: 0, tokIn: 0, tokOut: 0, preview: '', success: false }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   GPT-4o vs DeepSeek: Writer + QA 对比测试              ║')
  console.log('╚══════════════════════════════════════════════════════════╝')

  const writerPrompt = buildWriterProsePrompt(WRITER_CONTEXT)
  const qaPrompt = buildQAPacketPrompt(QA_CONTEXT)

  const results: TestResult[] = []

  // Writer tests
  console.log('\n═══ Writer 对比 ═══')
  results.push(await testModel('GPT-4o', openai('gpt-4o'), writerPrompt, 'writer', 16000))
  results.push(await testModel('DeepSeek-Chat', deepseekProvider.chat('deepseek-chat'), writerPrompt, 'writer', 16000))

  // QA tests
  console.log('\n═══ QA 对比 ═══')
  results.push(await testModel('GPT-4o', openai('gpt-4o'), qaPrompt, 'qa', 2000))
  results.push(await testModel('DeepSeek-Chat', deepseekProvider.chat('deepseek-chat'), qaPrompt, 'qa', 2000))

  // Summary
  console.log('\n\n' + '═'.repeat(60))
  console.log('  对比总结')
  console.log('═'.repeat(60))

  console.log('\n  Writer 对比:')
  const writers = results.filter(r => r.role === 'writer')
  for (const r of writers) {
    if (r.success) {
      console.log(`  ${r.name.padEnd(15)} | ${r.chineseChars} 中文字 | ${r.seconds.toFixed(1)}s | ${r.tokIn}+${r.tokOut} tok`)
    } else {
      console.log(`  ${r.name.padEnd(15)} | FAILED`)
    }
  }

  console.log('\n  QA 对比:')
  const qas = results.filter(r => r.role === 'qa')
  for (const r of qas) {
    if (r.success) {
      console.log(`  ${r.name.padEnd(15)} | ${r.charCount} 字符 | ${r.seconds.toFixed(1)}s | ${r.tokIn}+${r.tokOut} tok`)
      console.log(`  ${''.padEnd(15)}   预览: ${r.preview.slice(0, 100)}`)
    } else {
      console.log(`  ${r.name.padEnd(15)} | FAILED`)
    }
  }

  // Cost comparison
  console.log('\n  成本对比 (按每章4次调用估算):')
  console.log('  GPT-4o:        ~$0.05/章')
  console.log('  DeepSeek-Chat: ~$0.002/章 (便宜25倍)')
}

main().catch(e => { console.error('Error:', e); process.exit(1) })
