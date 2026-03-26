import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { schema })

async function seed() {
  console.log('Seeding database...')

  const [template] = await db
    .insert(schema.projectTemplates)
    .values({
      genreJson: { primary: '玄幻', tags: ['升级流', '爽文'] },
      formatJson: {
        chapterLength: { min: 2000, max: 3000, unit: 'chars' },
        volumeSize: 100,
        language: 'zh-CN',
      },
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

  const [project] = await db
    .insert(schema.projects)
    .values({
      title: '吞天魔帝',
      description: '一个少年获得上古魔帝传承，在修仙世界中崛起的故事',
      templateId: template.id,
    })
    .returning()

  await db.insert(schema.modelConfigs).values({
    projectId: project.id,
    configMode: 'simple',
    defaultProvider: 'openai',
    defaultApiKeyRef: 'placeholder-key',
  })

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

  await db.insert(schema.storyBibleEntries).values([
    {
      projectId: project.id,
      entryType: 'world_rule',
      key: '修炼体系',
      valueJson: {
        levels: ['炼气', '筑基', '金丹', '元婴', '化神', '渡劫', '大乘'],
        note: '每层灵力翻倍，三层到七层差16倍',
      },
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
    },
  ])

  await db.insert(schema.artifacts).values({
    projectId: project.id,
    type: 'outline',
    title: '《吞天魔帝》大纲',
    status: 'draft',
    contentJson: {
      chapters: [
        { number: 1, title: '当众羞辱，魔魂初醒' },
        { number: 2, title: '后山修炼，偶遇佳人' },
        { number: 3, title: '药园风波' },
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
