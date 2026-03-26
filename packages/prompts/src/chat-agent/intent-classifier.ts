import { z } from 'zod'

export const intentSchema = z.object({
  type: z.enum(['casual', 'canon_edit', 'pipeline_task', 'blueprint_edit', 'setting_change']),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
})

export type ClassifiedIntent = z.infer<typeof intentSchema>

export const INTENT_CLASSIFICATION_PROMPT = `You are an intent classifier for a serial fiction writing workbench.

Classify the user's message into exactly one of these types:

- "casual": Lightweight creative request, general chat, brainstorming names, asking questions. Does NOT change any story data.
- "canon_edit": User wants to modify an existing character, setting, or world rule. Examples: "把林凡改名", "苏雨晴性格改一下", "修改世界规则".
- "pipeline_task": User wants to trigger the writing pipeline. Examples: "开始写下一章", "帮我规划第5章", "生成蓝图".
- "blueprint_edit": User wants to modify the current chapter blueprint. Examples: "这段战斗换成智斗", "加一个反转", "改一下场景2".
- "setting_change": User wants to change a fundamental project setting that may affect existing content. Examples: "把修炼体系改了", "换一种世界观", "删掉这条主线".

Respond with JSON: { "type": "...", "confidence": 0.0-1.0, "explanation": "..." }
`
