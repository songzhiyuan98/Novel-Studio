'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { useWorkspace } from '@/lib/workspace-context'

interface StoryBibleEntry {
  id: string
  entryType: string
  key: string
  valueJson: Record<string, unknown> | null
  status: string
}

export function WorldSettings() {
  const { projectId, goToChat } = useWorkspace()
  const [entries, setEntries] = useState<StoryBibleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    apiFetch<StoryBibleEntry[]>(`/api/projects/${projectId}/canon/world-rules`)
      .then((data) => {
        setEntries(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-400">加载世界设定...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">世界设定</h2>
          <p className="text-xs text-zinc-500">{entries.length} 条规则</p>
        </div>
        <button
          onClick={goToChat}
          className="rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
        >
          返回对话
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.map((entry) => {
          const isExpanded = expandedId === entry.id

          return (
            <div
              key={entry.id}
              className="rounded-lg border border-zinc-200 bg-white overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50"
              >
                <div>
                  <span className="text-sm font-medium">{entry.key}</span>
                  <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                    {entry.entryType}
                  </span>
                </div>
                <span className="text-xs text-zinc-400">{isExpanded ? '▼' : '▶'}</span>
              </button>

              {isExpanded && entry.valueJson && (
                <div className="border-t border-zinc-100 px-4 py-3 bg-zinc-50">
                  <div className="space-y-2">
                    {Object.entries(entry.valueJson).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-xs font-medium text-zinc-500">{k}: </span>
                        <span className="text-xs text-zinc-700">
                          {Array.isArray(v) ? v.join(' → ') : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {entries.length === 0 && (
          <p className="text-sm text-zinc-400">暂无世界设定</p>
        )}
      </div>
    </div>
  )
}
