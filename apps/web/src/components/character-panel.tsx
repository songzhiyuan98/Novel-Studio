'use client'

import { useState, useEffect } from 'react'
import { apiFetch, type Character } from '@/lib/api'
import { useWorkspace } from '@/lib/workspace-context'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
  const { projectId, refreshKey } = useWorkspace()
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const loadCharacters = (pid: string) => {
    apiFetch<Character[]>(`/api/projects/${pid}/characters`)
      .then(setCharacters)
      .catch(() => setCharacters([]))
  }

  useEffect(() => {
    if (!projectId) {
      setCharacters([])
      setLoading(false)
      return
    }
    setLoading(true)
    setEditingId(null)
    loadCharacters(projectId)
    setLoading(false)
  }, [projectId, refreshKey])

  const startEdit = (char: Character) => {
    const dims = char.dimensionsJson as Record<string, unknown> | null
    const personality = char.personalityJson
    const status = char.currentStatusJson as Record<string, unknown> | null
    setEditingId(char.id)
    setEditForm({
      name: char.name,
      tier: char.tier,
      realm: dims?.realm ? String(dims.realm) : '',
      techniques: dims?.techniques ? (dims.techniques as string[]).join(', ') : '',
      coreTraits: personality?.coreTraits ? personality.coreTraits.join(', ') : '',
      speechStyle: personality?.speechStyle || '',
      objective: status?.objective ? String(status.objective) : '',
      location: status?.location ? String(status.location) : '',
    })
  }

  const handleSave = async () => {
    if (!editingId || !projectId) return
    setSaving(true)

    const char = characters.find((c) => c.id === editingId)
    if (!char) return

    const body: Record<string, unknown> = {
      name: editForm.name,
      tier: editForm.tier,
      personalityJson: {
        ...(char.personalityJson || {}),
        coreTraits: editForm.coreTraits.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
        speechStyle: editForm.speechStyle,
      },
      dimensionsJson: {
        ...(char.dimensionsJson as Record<string, unknown> || {}),
        realm: editForm.realm,
        techniques: editForm.techniques.split(/[,，、]/).map((s) => s.trim()).filter(Boolean),
      },
      currentStatusJson: {
        ...(char.currentStatusJson as Record<string, unknown> || {}),
        objective: editForm.objective,
        location: editForm.location,
      },
    }

    try {
      await fetch(`${API_BASE}/api/projects/${projectId}/characters/${char.characterKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      loadCharacters(projectId)
      setEditingId(null)
    } catch (e) {
      console.error('Save failed:', e)
    }
    setSaving(false)
  }

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
                const isEditing = editingId === char.id

                if (isEditing) {
                  return (
                    <div key={char.id} className="rounded-lg border-2 border-zinc-400 bg-white p-3">
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-zinc-500">名字</label>
                          <input
                            className="w-full rounded border border-zinc-200 px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none"
                            value={editForm.name || ''}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500">Tier</label>
                          <select
                            className="w-full rounded border border-zinc-200 px-2 py-1 text-sm"
                            value={editForm.tier || 'important'}
                            onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                          >
                            <option value="core">核心</option>
                            <option value="important">重要</option>
                            <option value="episodic">过场</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500">境界</label>
                          <input
                            className="w-full rounded border border-zinc-200 px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none"
                            value={editForm.realm || ''}
                            onChange={(e) => setEditForm({ ...editForm, realm: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500">技能（逗号分隔）</label>
                          <input
                            className="w-full rounded border border-zinc-200 px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none"
                            value={editForm.techniques || ''}
                            onChange={(e) => setEditForm({ ...editForm, techniques: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500">性格特征（逗号分隔）</label>
                          <input
                            className="w-full rounded border border-zinc-200 px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none"
                            value={editForm.coreTraits || ''}
                            onChange={(e) => setEditForm({ ...editForm, coreTraits: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500">说话风格</label>
                          <input
                            className="w-full rounded border border-zinc-200 px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none"
                            value={editForm.speechStyle || ''}
                            onChange={(e) => setEditForm({ ...editForm, speechStyle: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500">当前目标</label>
                          <input
                            className="w-full rounded border border-zinc-200 px-2 py-1 text-sm focus:border-zinc-400 focus:outline-none"
                            value={editForm.objective || ''}
                            onChange={(e) => setEditForm({ ...editForm, objective: e.target.value })}
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 rounded bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                          >
                            {saving ? '保存中...' : '保存'}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 rounded border border-zinc-200 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={char.id}
                    onClick={() => startEdit(char)}
                    className="cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 hover:border-zinc-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{char.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${tierColors[char.tier]}`}>
                        {tierLabels[char.tier]}
                      </span>
                    </div>
                    {dims?.realm && (
                      <p className="mt-1 text-xs text-zinc-500">{String(dims.realm)}</p>
                    )}
                    {personality?.coreTraits && (
                      <p className="mt-0.5 text-xs text-zinc-400">{personality.coreTraits.join('、')}</p>
                    )}
                    {status?.objective && (
                      <p className="mt-0.5 text-xs text-zinc-400">目标: {String(status.objective)}</p>
                    )}
                    <p className="mt-1 text-xs text-zinc-300">点击编辑</p>
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
