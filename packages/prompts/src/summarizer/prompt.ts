export const SUMMARIZER_SYSTEM_PROMPT = `你是一个网文章节摘要生成器。你的任务是将已确认的章节压缩为结构化摘要，作为后续章节的长期记忆。

## 生成内容
- 叙事摘要（简洁，只保留关键事件）
- 角色变化（每个角色发生了什么变化）
- 线索追踪（新开的线索、推进的线索、解决的线索）
- 时间线事件（关键剧情事件+地点）
- 需要归档的过场角色列表

## 规则
- 摘要要简洁——聚焦对后续章节有用的信息
- 丢弃：过渡描写、环境描写、战斗过程细节
- 保留：关键事件、角色状态变化、新伏笔、世界设定
- 线索状态变更要准确
- 全部用中文回答

输出JSON格式。
`

export function buildSummarizerPacketPrompt(packetContent: string): string {
  return `${SUMMARIZER_SYSTEM_PROMPT}

## 章节内容
${packetContent}

请用中文输出JSON。`
}
