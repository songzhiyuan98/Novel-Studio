'use client'

import { useState } from 'react'

interface TraceStep {
  timestamp: string
  actor: string
  action: string
  tokens?: number
  cost?: string
  duration?: string
}

const mockTrace: TraceStep[] = [
  { timestamp: '10:32:01', actor: 'Chat Agent', action: '意图识别: pipeline_task', duration: '0.3s' },
  { timestamp: '10:32:02', actor: 'Orchestrator', action: '编译 Planner packet (4,200 tokens)', tokens: 4200 },
  { timestamp: '10:32:03', actor: 'Planner', action: '生成蓝图 (3 个场景)', tokens: 1800, cost: '$0.008', duration: '3.2s' },
]

const actorColors: Record<string, string> = {
  'Chat Agent': 'text-purple-600',
  'Orchestrator': 'text-blue-600',
  'Planner': 'text-green-600',
  'Writer': 'text-orange-600',
  'QA': 'text-red-600',
  'Summarizer': 'text-cyan-600',
}

export function TracePanel() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-t border-zinc-200 bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
      >
        <span>🔍 后台追踪 ({mockTrace.length} steps)</span>
        <span>{isOpen ? '▼' : '▲'}</span>
      </button>

      {isOpen && (
        <div className="max-h-48 overflow-y-auto border-t border-zinc-100 px-4 py-2">
          {mockTrace.map((step, i) => (
            <div key={i} className="flex items-start gap-3 py-1 text-xs">
              <span className="w-16 flex-shrink-0 text-zinc-400">{step.timestamp}</span>
              <span className={`w-24 flex-shrink-0 font-medium ${actorColors[step.actor] || 'text-zinc-600'}`}>
                {step.actor}
              </span>
              <span className="flex-1 text-zinc-700">{step.action}</span>
              {step.tokens && (
                <span className="flex-shrink-0 text-zinc-400">{step.tokens} tok</span>
              )}
              {step.cost && (
                <span className="flex-shrink-0 text-zinc-400">{step.cost}</span>
              )}
              {step.duration && (
                <span className="flex-shrink-0 text-zinc-400">{step.duration}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
