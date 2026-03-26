'use client'

import { useState } from 'react'

interface Chapter {
  number: number
  title: string
  status: 'planned' | 'drafted' | 'reviewed' | 'canonized'
}

const mockChapters: Chapter[] = [
  { number: 1, title: '当众羞辱，魔魂初醒', status: 'canonized' },
  { number: 2, title: '后山修炼，偶遇佳人', status: 'canonized' },
  { number: 3, title: '药园风波', status: 'drafted' },
]

const statusColors: Record<string, string> = {
  planned: 'bg-zinc-300',
  drafted: 'bg-yellow-400',
  reviewed: 'bg-blue-400',
  canonized: 'bg-green-500',
}

const statusLabels: Record<string, string> = {
  planned: '计划中',
  drafted: '草稿',
  reviewed: '已审查',
  canonized: '已确认',
}

export function Sidebar() {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(3)

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-zinc-200 bg-white">
      {/* Project Header */}
      <div className="border-b border-zinc-200 p-4">
        <h1 className="text-lg font-bold">Novel Studio</h1>
        <p className="mt-1 text-sm text-zinc-500">吞天魔帝</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* Quick Access */}
        <div className="mb-4">
          <p className="px-2 py-1 text-xs font-semibold uppercase text-zinc-400">快速访问</p>
          <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100">
            👤 角色面板
          </button>
          <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100">
            🌍 世界设定
          </button>
          <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100">
            ⚙️ 项目设置
          </button>
        </div>

        {/* Chapter List */}
        <div>
          <p className="px-2 py-1 text-xs font-semibold uppercase text-zinc-400">章节</p>
          {mockChapters.map((ch) => (
            <button
              key={ch.number}
              onClick={() => setSelectedChapter(ch.number)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                selectedChapter === ch.number ? 'bg-zinc-100 font-medium' : 'hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">第{ch.number}章</span>
                <span className={`inline-block h-2 w-2 rounded-full ${statusColors[ch.status]}`}
                  title={statusLabels[ch.status]}
                />
              </div>
              <p className="mt-0.5 truncate text-xs text-zinc-500">{ch.title}</p>
            </button>
          ))}
          <button className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600">
            + 新章节
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-3">
        <p className="text-xs text-zinc-400">MVP v0.1</p>
      </div>
    </aside>
  )
}
