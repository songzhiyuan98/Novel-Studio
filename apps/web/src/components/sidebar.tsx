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
  const { selectChapter, goToChat, selectedChapterNumber, view, setView, setProjectId, refreshKey } = useWorkspace()
  const [projects, setProjects] = useState<Project[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load projects
  useEffect(() => {
    apiFetch<Project[]>('/api/projects')
      .then((data) => {
        setProjects(data)
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0])
          setProjectId(data[0].id)
        } else if (data.length > 0 && selectedProject) {
          // Keep current selection but update list
          const still = data.find((p) => p.id === selectedProject.id)
          if (!still) {
            setSelectedProject(data[0])
            setProjectId(data[0].id)
          }
        }
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [refreshKey])

  // Load chapters when project changes
  useEffect(() => {
    if (!selectedProject) return
    setProjectId(selectedProject.id)
    apiFetch<Chapter[]>(`/api/projects/${selectedProject.id}/chapters`)
      .then(setChapters)
      .catch(() => setChapters([]))
  }, [selectedProject, refreshKey])

  const switchProject = (project: Project) => {
    setSelectedProject(project)
    setProjectId(project.id)
    goToChat()
  }

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-zinc-200 bg-white">
      {/* Project Header */}
      <div className="border-b border-zinc-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Novel Studio</h1>
          <button
            onClick={() => setView('new-project')}
            className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800"
            title="新建项目"
          >
            +
          </button>
        </div>

        {/* Project selector */}
        {projects.length > 1 ? (
          <select
            className="mt-2 w-full rounded border border-zinc-200 px-2 py-1 text-sm"
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const p = projects.find((p) => p.id === e.target.value)
              if (p) switchProject(p)
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        ) : selectedProject ? (
          <p className="mt-1 text-sm text-zinc-500">{selectedProject.title}</p>
        ) : (
          <p className="mt-1 text-sm text-zinc-400">
            {loading ? '加载中...' : error ? '连接失败' : '无项目，点击 + 创建'}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <p className="px-2 py-1 text-xs font-semibold uppercase text-zinc-400">导航</p>
          <button
            onClick={goToChat}
            className={`w-full rounded-md px-3 py-2 text-left text-sm ${view === 'chat' ? 'bg-zinc-100 font-medium' : 'hover:bg-zinc-100'}`}
          >
            💬 创作对话
          </button>
          <button
            onClick={() => setView('world-settings')}
            className={`w-full rounded-md px-3 py-2 text-left text-sm ${view === 'world-settings' ? 'bg-zinc-100 font-medium' : 'hover:bg-zinc-100'}`}
          >
            🌍 世界设定
          </button>
        </div>

        {/* Chapter List */}
        {selectedProject && (
          <div>
            <p className="px-2 py-1 text-xs font-semibold uppercase text-zinc-400">
              章节 ({chapters.length})
            </p>
            {error && (
              <p className="px-3 py-2 text-xs text-red-500">连接失败</p>
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
            {chapters.length === 0 && !loading && (
              <p className="px-3 py-2 text-xs text-zinc-400">暂无章节，在对话中输入&ldquo;开始写下一章&rdquo;</p>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <p className="text-xs text-zinc-400">Novel Studio MVP v0.1</p>
      </div>
    </aside>
  )
}
