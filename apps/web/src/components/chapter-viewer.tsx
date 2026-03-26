'use client'

import { useState, useEffect } from 'react'
import { apiFetch, type ChapterSummary } from '@/lib/api'
import { useWorkspace } from '@/lib/workspace-context'

interface Artifact {
  id: string
  type: string
  title: string
  status: string
  contentJson: { text?: string } | null
  sceneSegmentsJson: Array<{ sceneIndex: number; sceneKey: string; text: string }> | null
}

export function ChapterViewer() {
  const { selectedChapterId, selectedChapterNumber, projectId, goToChat } = useWorkspace()
  const [chapterText, setChapterText] = useState<string | null>(null)
  const [summary, setSummary] = useState<ChapterSummary | null>(null)
  const [scenes, setScenes] = useState<Array<{ sceneIndex: number; sceneKey: string; text: string }>>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'text' | 'summary'>('text')

  useEffect(() => {
    if (!selectedChapterId || !projectId) return
    setLoading(true)

    // Load chapter artifacts (get the chapter_draft)
    Promise.all([
      apiFetch<Artifact[]>(`/api/projects/${projectId}/artifacts?type=chapter_draft`)
        .catch(() => [] as Artifact[]),
      apiFetch<ChapterSummary>(`/api/projects/chapters/${selectedChapterId}/summary`)
        .catch(() => null),
    ]).then(([artifacts, sum]) => {
      // Find the artifact for this chapter number
      const draft = artifacts.find((a) =>
        a.status === 'confirmed' && a.contentJson?.text
      )

      if (draft?.contentJson?.text) {
        setChapterText(draft.contentJson.text)
      } else {
        setChapterText(null)
      }

      if (draft?.sceneSegmentsJson) {
        setScenes(draft.sceneSegmentsJson)
      } else {
        setScenes([])
      }

      setSummary(sum)
      setLoading(false)
    })
  }, [selectedChapterId, projectId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-400">加载章节内容...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">第{selectedChapterNumber}章</h2>
          <p className="text-xs text-zinc-500">已确认 · 只读模式</p>
        </div>
        <button
          onClick={goToChat}
          className="rounded-md border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
        >
          返回对话
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 bg-white px-4">
        <button
          onClick={() => setActiveTab('text')}
          className={`px-3 py-2 text-xs font-medium ${
            activeTab === 'text'
              ? 'border-b-2 border-zinc-900 text-zinc-900'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          正文
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-2 text-xs font-medium ${
            activeTab === 'summary'
              ? 'border-b-2 border-zinc-900 text-zinc-900'
              : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          摘要
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'text' && (
          <div>
            {chapterText ? (
              <div className="prose prose-zinc prose-sm max-w-none">
                {scenes.length > 0 ? (
                  scenes.map((scene, i) => (
                    <div key={i} className="mb-6">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                          场景 {scene.sceneIndex + 1}
                        </span>
                        <span className="text-xs text-zinc-400">{scene.sceneKey}</span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-800">
                        {scene.text}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-800">
                    {chapterText}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-400">暂无章节正文</p>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="space-y-4">
            {summary ? (
              <>
                <div>
                  <h3 className="text-xs font-semibold uppercase text-zinc-400">章节摘要</h3>
                  <p className="mt-1 text-sm text-zinc-700">{summary.summaryText}</p>
                </div>

                {summary.keyEventsJson.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-zinc-400">关键事件</h3>
                    <ul className="mt-1 space-y-1">
                      {summary.keyEventsJson.map((event, i) => (
                        <li key={i} className="text-sm text-zinc-600">• {event}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.characterDeltasJson.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-zinc-400">角色变化</h3>
                    <ul className="mt-1 space-y-1">
                      {summary.characterDeltasJson.map((delta, i) => (
                        <li key={i} className="text-sm text-zinc-600">
                          <span className="font-medium">{delta.character}</span>: {delta.change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-zinc-400">暂无摘要数据</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
