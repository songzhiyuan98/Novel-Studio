'use client'

import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface TraceStep {
  actor: string
  action: string
  tokens?: number
  cost?: string
  duration?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: string
  trace?: TraceStep[]
  suggestedActions?: string[]
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '欢迎来到 Novel Studio！我是你的创作助手。\n\n你可以试试：\n- "帮我想几个角色名字"\n- "开始写下一章"\n- "修改林凡的境界"\n\n有什么想法？',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get first project ID on mount
  useEffect(() => {
    apiFetch<Array<{ id: string }>>('/api/projects')
      .then((projects) => {
        if (projects.length > 0) setProjectId(projects[0].id)
      })
      .catch(() => {})
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    if (!projectId) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'user', content: input.trim() },
        { id: (Date.now() + 1).toString(), role: 'assistant', content: '无法连接到项目，请确认后端 API 正在运行。' },
      ])
      return
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    const userInput = input.trim()
    setInput('')
    setIsLoading(true)
    setStreamingText('')

    try {
      // Try streaming first
      const res = await fetch(`${API_BASE}/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput, stream: true }),
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        // Handle SSE streaming
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = decoder.decode(value, { stream: true })
            const lines = text.split('\n')

            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const data = JSON.parse(line.slice(5).trim())
                  if (data.type === 'chunk') {
                    accumulated += data.content
                    setStreamingText(accumulated)
                  } else if (data.type === 'done') {
                    // Final message with trace
                    const assistantMsg: Message = {
                      id: (Date.now() + 1).toString(),
                      role: 'assistant',
                      content: data.assistant_message || accumulated,
                      intent: data.intent,
                      trace: data.trace?.steps?.map((s: any) => ({
                        actor: s.actor,
                        action: s.action,
                        tokens: s.tokens ? s.tokens.input + s.tokens.output : undefined,
                        cost: s.cost_usd ? `$${s.cost_usd.toFixed(4)}` : undefined,
                        duration: s.duration_ms ? `${(s.duration_ms / 1000).toFixed(1)}s` : undefined,
                      })),
                    }
                    setMessages((prev) => [...prev, assistantMsg])
                    setStreamingText('')
                  }
                } catch {
                  // Ignore malformed SSE lines
                }
              }
            }
          }
        }
      } else {
        // Handle regular JSON response
        const data = await res.json()
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.assistant_message || '收到你的消息！',
          intent: data.intent,
          trace: data.trace?.steps?.map((s: any) => ({
            actor: s.actor,
            action: s.action,
            tokens: s.tokens ? s.tokens.input + s.tokens.output : undefined,
            cost: s.cost_usd ? `$${s.cost_usd.toFixed(4)}` : undefined,
            duration: s.duration_ms ? `${(s.duration_ms / 1000).toFixed(1)}s` : undefined,
          })),
          suggestedActions: data.suggested_actions,
        }
        setMessages((prev) => [...prev, assistantMsg])
      }
    } catch (e) {
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `连接失败: ${(e as Error).message}\n\n请确保后端 API 在 ${API_BASE} 运行。`,
      }
      setMessages((prev) => [...prev, fallback])
    }

    setIsLoading(false)
    setStreamingText('')
  }

  const handleSuggestedAction = (action: string) => {
    setInput(action)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">创作对话</h2>
            <p className="text-xs text-zinc-500">与 AI 助手协作写作</p>
          </div>
          <div className={`h-2 w-2 rounded-full ${projectId ? 'bg-green-500' : 'bg-red-400'}`} title={projectId ? '已连接' : '未连接'} />
        </div>
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
            {/* Intent badge */}
            {msg.intent && (
              <div className="mt-1 ml-2">
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                  {msg.intent}
                </span>
              </div>
            )}
            {/* Trace info */}
            {msg.trace && msg.trace.length > 0 && (
              <div className="mt-1 ml-2 rounded-md bg-zinc-50 p-2 space-y-0.5">
                <p className="text-xs font-medium text-zinc-500">后台追踪:</p>
                {msg.trace.map((t, i) => (
                  <div key={i} className="text-xs text-zinc-400">
                    <span className="font-medium text-zinc-600">{t.actor}</span>: {t.action}
                    {t.tokens && <span className="ml-1 text-zinc-300">({t.tokens} tok)</span>}
                    {t.cost && <span className="ml-1 text-zinc-300">{t.cost}</span>}
                    {t.duration && <span className="ml-1 text-zinc-300">{t.duration}</span>}
                  </div>
                ))}
              </div>
            )}
            {/* Suggested actions */}
            {msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div className="mt-2 ml-2 flex gap-2 flex-wrap">
                {msg.suggestedActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedAction(action)}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                  >
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Streaming text */}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] whitespace-pre-wrap rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800">
              {streamingText}
              <span className="animate-pulse">▌</span>
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && !streamingText && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-400">
              思考中...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
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
