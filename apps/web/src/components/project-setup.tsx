'use client'

import { useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const PRESET_TEMPLATES = [
  {
    label: '玄幻爽文',
    genre: { primary: '玄幻', tags: ['升级流', '爽文'] },
    format: { chapterLength: { min: 2000, max: 3000, unit: 'chars' }, volumeSize: 100, language: 'zh-CN' },
    characterDimensions: [
      { key: 'realm', label: '境界', type: 'string' },
      { key: 'techniques', label: '技能', type: 'list' },
      { key: 'combatStyle', label: '战斗风格', type: 'string' },
    ],
    relationshipDimensions: [
      { key: 'trust', label: '信任', type: 'number' },
      { key: 'tension', label: '张力', type: 'number' },
    ],
    styleProfile: {
      base: { pov: 'third_limited', tense: 'past', prose_density: 'light' },
      custom: [{ key: '爽点密度', value: 'high' }],
    },
    writingRules: ['每500字至少一个冲突', '战斗有招式名', '禁止文艺腔'],
    qaCustomDimensions: ['power_scaling'],
  },
  {
    label: '都市神豪',
    genre: { primary: '都市', tags: ['神豪', '装逼'] },
    format: { chapterLength: { min: 2000, max: 3000, unit: 'chars' }, volumeSize: 100, language: 'zh-CN' },
    characterDimensions: [
      { key: 'netWorth', label: '身家', type: 'string' },
      { key: 'companies', label: '名下产业', type: 'list' },
      { key: 'socialCircle', label: '社交圈', type: 'string' },
    ],
    relationshipDimensions: [
      { key: 'trust', label: '信任', type: 'number' },
      { key: 'interest', label: '利益绑定', type: 'number' },
    ],
    styleProfile: {
      base: { pov: 'third_limited', tense: 'past', prose_density: 'light' },
      custom: [{ key: '装逼频率', value: 'extreme' }],
    },
    writingRules: ['炫富有具体数字', '每章至少一次打脸'],
    qaCustomDimensions: ['wealth_consistency'],
  },
  {
    label: '自定义',
    genre: { primary: '', tags: [] },
    format: { chapterLength: { min: 2000, max: 3000, unit: 'chars' }, volumeSize: 50, language: 'zh-CN' },
    characterDimensions: [],
    relationshipDimensions: [{ key: 'trust', label: '信任', type: 'number' }],
    styleProfile: { base: { pov: 'third_limited', tense: 'past', prose_density: 'medium' }, custom: [] },
    writingRules: [],
    qaCustomDimensions: [],
  },
]

interface ProjectSetupProps {
  onCreated: () => void
}

export function ProjectSetup({ onCreated }: ProjectSetupProps) {
  const [step, setStep] = useState<'template' | 'details' | 'config'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [apiProvider, setApiProvider] = useState('openai')
  const [apiKey, setApiKey] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!title.trim()) { setError('请输入书名'); return }
    setCreating(true)
    setError('')

    try {
      const template = PRESET_TEMPLATES[selectedTemplate]

      // 1. Create template
      const tmplRes = await fetch(`${API_BASE}/api/projects/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          genreJson: template.genre,
          formatJson: template.format,
          characterDimensionsJson: template.characterDimensions,
          relationshipDimensionsJson: template.relationshipDimensions,
          styleProfileJson: template.styleProfile,
          writingRulesJson: template.writingRules,
          qaCustomDimensionsJson: template.qaCustomDimensions,
        }),
      })
      const tmpl = await tmplRes.json()

      // 2. Create project
      await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), templateId: tmpl.id }),
      })

      onCreated()
    } catch (e) {
      setError(`创建失败: ${(e as Error).message}`)
    }
    setCreating(false)
  }

  return (
    <div className="flex h-full items-center justify-center bg-zinc-50">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold">创建新项目</h1>
        <p className="mt-1 text-sm text-zinc-500">选择模板，填写信息，开始创作</p>

        {step === 'template' && (
          <div className="mt-6">
            <p className="text-sm font-medium text-zinc-700">选择类型模板</p>
            <div className="mt-3 space-y-2">
              {PRESET_TEMPLATES.map((tmpl, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTemplate(i)}
                  className={`w-full rounded-lg border p-3 text-left ${
                    selectedTemplate === i ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <span className="text-sm font-medium">{tmpl.label}</span>
                  {tmpl.genre.primary && (
                    <span className="ml-2 text-xs text-zinc-400">{tmpl.genre.tags.join(' · ')}</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('details')}
              className="mt-4 w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              下一步
            </button>
          </div>
        )}

        {step === 'details' && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">书名</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：吞天魔帝"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700">简介（可选）</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="一句话描述你的故事"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setStep('template')}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                上一步
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {creating ? '创建中...' : '创建项目'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
