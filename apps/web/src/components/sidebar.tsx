'use client'

import { useState, useEffect } from 'react'
import { apiFetch, type Project, type Chapter } from '@/lib/api'
import { useWorkspace } from '@/lib/workspace-context'

const statusColors: Record<string, string> = {
  planned: 'bg-zinc-300',
  drafted: 'bg-yellow-400',
  reviewed: 'bg-blue-400',
  user_approved: 'bg-blue-500',
  canonized: 'bg-green-500',
  published: 'bg-green-600',
}

const statusLabels: Record<string, string> = {
  planned: '计划中',
  drafted: '草稿',
  reviewed: '已审查',
  user_approved: '已批准',
  canonized: '已确认',
  published: '已发布',
}

export function Sidebar() {
  const { selectChapter, goToChat, selectedChapterNumber, view, setView, setProjectId } = useWorkspace()
  const [projects, setProjects] = useState<Project[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load projects on mount
  useEffect(() => {
    apiFetch<Project[]>('/api/projects')
      .then((data) => {
        setProjects(data)
        if (data.length > 0) {
          setSelectedProject(data[0])
          setProjectId(data[0].id)
        }
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  // Load chapters when project changes
  useEffect(() => {
    if (!selectedProject) return
    setProjectId(selectedProject.id)
    apiFetch<Chapter[]>(`/api/projects/${selectedProject.id}/chapters`)
      .then(setChapters)
      .catch(() => setChapters([]))
  }, [selectedProject])

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-zinc-200 bg-white">
      {/* Project Header */}
      <div className="border-b border-zinc-200 p-4">
        <h1 className="text-lg font-bold">Novel Studio</h1>
        {selectedProject ? (
          <p className="mt-1 text-sm text-zinc-500">{selectedProject.title}</p>
        ) : (
          <p className="mt-1 text-sm text-zinc-400">
            {loading ? '加载中...' : error ? '连接失败' : '无项目'}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* Quick Access */}
        <div className="mb-4">
          <p className="px-2 py-1 text-xs font-semibold uppercase text-zinc-400">快速访问</p>
          <button
            onClick={goToChat}
            className={`w-full rounded-md px-3 py-2 text-left text-sm ${view === 'chat' ? 'bg-zinc-100 font-medium' : 'hover:bg-zinc-100'}`}
          >
            💬 创作对话
          </button>
          <button className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100">
            👤 角色面板
          </button>
          <button
            onClick={() => { setView('world-settings') }}
            className={`w-full rounded-md px-3 py-2 text-left text-sm ${view === 'world-settings' ? 'bg-zinc-100 font-medium' : 'hover:bg-zinc-100'}`}
          >
            🌍 世界设定
          </button>
        </div>

        {/* Chapter List */}
        <div>
          <p className="px-2 py-1 text-xs font-semibold uppercase text-zinc-400">
            章节 ({chapters.length})
          </p>
          {error && (
            <p className="px-3 py-2 text-xs text-red-500">API 连接失败: {error}</p>
          )}
          {chapters
            .sort((a, b) => a.chapterNumber - b.chapterNumber)
            .map((ch) => (
              <button
                key={ch.id}
                onClick={() => selectChapter(ch.id, ch.chapterNumber)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  selectedChapterNumber === ch.chapterNumber && view === 'chapter'
                    ? 'bg-zinc-100 font-medium'
                    : 'hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">第{ch.chapterNumber}章</span>
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${statusColors[ch.status] || 'bg-zinc-300'}`}
                    title={statusLabels[ch.status] || ch.status}
                  />
                </div>
                {ch.title && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{ch.title}</p>
                )}
              </button>
            ))}
          {chapters.length === 0 && !loading && !error && (
            <p className="px-3 py-2 text-xs text-zinc-400">暂无章节</p>
          )}
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
