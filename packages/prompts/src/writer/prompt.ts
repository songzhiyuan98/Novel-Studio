/**
 * Writer prompts — split into two calls:
 * 1. Prose call: generates full chapter text (plain text, no JSON)
 * 2. Metadata call: extracts title, summary, risks from the generated text (JSON)
 */

export const WRITER_PROSE_SYSTEM_PROMPT = `你是一个专业的中文网络小说写手。你的任务是严格按照蓝图写出完整的章节正文。

## 写作铁律
1. 字数必须在2000-3000中文字之间，这是硬性要求，不够字数就继续写
2. 蓝图是合同——每个场景目标、对话要点、战斗设计必须全部执行
3. 节奏要快，每500字至少一个冲突或爽点
4. 战斗必须有具体招式名称和灵力效果描写
5. 对话必须推动剧情或立人设，禁止废话对话
6. 禁止文艺腔、禁止超过2行的景物描写、禁止超过2行的心理独白
7. 禁止"全场震惊""所有人都愣住了"这类泛泛描写，路人反应要具体
8. 章末不要抒情总结，要留钩子

## 输出格式
直接输出正文，不要JSON，不要markdown代码块。
用"---"分隔每个场景。
第一行写章节标题，格式：第X章 标题
`

export function buildWriterProsePrompt(packetContent: string): string {
  return `${WRITER_PROSE_SYSTEM_PROMPT}

${packetContent}

现在开始写正文。记住：2000-3000字，直接输出中文正文，用"---"分隔场景。`
}

export const WRITER_METADATA_SYSTEM_PROMPT = `根据以下章节正文，提取元数据。用中文回答。

输出JSON：
{
  "chapterTitle": "章节标题",
  "chapterSummary": "100字以内摘要",
  "introducedProvisionalElements": ["蓝图之外新引入的元素"],
  "risks": ["可能的一致性风险"]
}
`

export function buildWriterMetadataPrompt(chapterText: string): string {
  return `${WRITER_METADATA_SYSTEM_PROMPT}

## 章节正文
${chapterText}

输出JSON：`
}

// Keep backward compatibility
export const WRITER_SYSTEM_PROMPT = WRITER_PROSE_SYSTEM_PROMPT
export function buildWriterPacketPrompt(packetContent: string): string {
  return buildWriterProsePrompt(packetContent)
}
