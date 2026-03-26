'use client'

import { useState, useEffect } from 'react'
import { apiFetch, type Character } from '@/lib/api'

const tierLabels: Record<string, string> = {
  core: '核心',
  important: '重要',
  episodic: '过场',
}

const tierColors: Record<string, string> = {
  core: 'bg-amber-100 text-amber-700',
  important: 'bg-blue-100 text-blue-700',
  episodic: 'bg-zinc-100 text-zinc-500',
}

export function CharacterPanel() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get the first project's characters
    apiFetch<Array<{ id: string }>>('/api/projects')
      .then((projects) => {
        if (projects.length === 0) return
        return apiFetch<Character[]>(`/api/projects/${projects[0].id}/characters`)
      })
      .then((chars) => {
        if (chars) setCharacters(chars)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const tiers: Array<'core' | 'important' | 'episodic'> = ['core', 'important', 'episodic']

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold">角色面板</h2>
        <p className="mt-4 text-xs text-zinc-400">加载中...</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold">角色面板</h2>

      {tiers.map((tier) => {
        const chars = characters.filter((c) => c.tier === tier)
        if (chars.length === 0) return null

        return (
          <div key={tier} className="mt-4">
            <p className="text-xs font-semibold uppercase text-zinc-400">
              {tierLabels[tier]} ({chars.length})
            </p>
            <div className="mt-1 space-y-2">
              {chars.map((char) => {
                const dims = char.dimensionsJson as Record<string, unknown> | null
                const personality = char.personalityJson
                const status = char.currentStatusJson as Record<string, unknown> | null

                return (
                  <div
                    key={char.id}
                    className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 hover:border-zinc-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{char.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${tierColors[char.tier]}`}
                      >
                        {tierLabels[char.tier]}
                      </span>
                    </div>
                    {dims?.realm && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {String(dims.realm)}
                      </p>
                    )}
                    {personality?.coreTraits && (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {personality.coreTraits.join('、')}
                      </p>
                    )}
                    {status?.objective && (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        目标: {String(status.objective)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {characters.length === 0 && (
        <p className="mt-4 text-xs text-zinc-400">暂无角色数据</p>
      )}
    </div>
  )
}
