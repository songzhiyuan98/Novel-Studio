'use client'

import { useState } from 'react'
import { apiPost } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  trace?: Array<{ actor: string; action: string; tokens?: number; cost?: string }>
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '欢迎来到 Novel Studio！我是你的创作助手。\n\n你可以：\n- 告诉我你的故事想法\n- 让我帮你规划下一章\n- 修改角色设定\n- 或者直接聊聊创作灵感\n\n有什么想法？',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Try to call real API
      const response = await apiPost<{
        assistant_message: string
        intent: string
        trace?: { steps: Array<{ actor: string; action: string; tokens?: { input: number; output: number }; cost_usd?: number }> }
      }>('/api/projects/chat', { message: userInput })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.assistant_message || '收到你的消息！',
        trace: response.trace?.steps.map((s) => ({
          actor: s.actor,
          action: s.action,
          tokens: s.tokens ? s.tokens.input + s.tokens.output : undefined,
          cost: s.cost_usd ? `$${s.cost_usd.toFixed(4)}` : undefined,
        })),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      // Fallback when API chat endpoint is not yet implemented
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `收到！你说的是："${userInput}"\n\n聊天 API 还在开发中，目前你可以通过侧边栏查看已有的章节和角色数据。`,
      }
      setMessages((prev) => [...prev, fallback])
    }

    setIsLoading(false)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-4 py-3">
        <h2 className="text-sm font-semibold">创作对话</h2>
        <p className="text-xs text-zinc-500">与 AI 助手协作写作</p>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-lg px-4 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 text-white'
                    : 'border border-zinc-200 bg-white text-zinc-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
            {/* Trace info */}
            {msg.trace && msg.trace.length > 0 && (
              <div className="mt-1 ml-2 space-y-0.5">
                {msg.trace.map((t, i) => (
                  <div key={i} className="text-xs text-zinc-400">
                    <span className="font-medium">{t.actor}</span>: {t.action}
                    {t.tokens && <span className="ml-1">({t.tokens} tok)</span>}
                    {t.cost && <span className="ml-1">{t.cost}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-400">
              思考中...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="输入消息..."
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
