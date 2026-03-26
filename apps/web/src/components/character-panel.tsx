'use client'

interface Character {
  key: string
  name: string
  tier: 'core' | 'important' | 'episodic'
  realm?: string
  status?: string
}

const mockCharacters: Character[] = [
  { key: 'lin_fan', name: '林凡', tier: 'core', realm: '炼气三层', status: '魔帝觉醒' },
  { key: 'su_yuqing', name: '苏雨晴', tier: 'core', realm: '炼气五层', status: '观察林凡' },
  { key: 'lin_haotian', name: '林浩天', tier: 'important', realm: '炼气七层', status: '右手骨折' },
  { key: 'lin_laosan', name: '林老三', tier: 'important', realm: '筑基后期', status: '暗中保护' },
  { key: 'herb_guard', name: '药园守卫', tier: 'episodic', realm: '炼气六层' },
]

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
  const tiers: Array<'core' | 'important' | 'episodic'> = ['core', 'important', 'episodic']

  return (
    <div className="p-4">
      <h2 className="text-sm font-semibold">角色面板</h2>

      {tiers.map((tier) => {
        const chars = mockCharacters.filter((c) => c.tier === tier)
        if (chars.length === 0) return null

        return (
          <div key={tier} className="mt-4">
            <p className="text-xs font-semibold uppercase text-zinc-400">
              {tierLabels[tier]} ({chars.length})
            </p>
            <div className="mt-1 space-y-2">
              {chars.map((char) => (
                <div
                  key={char.key}
                  className="rounded-lg border border-zinc-200 bg-white p-3 hover:border-zinc-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{char.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${tierColors[char.tier]}`}>
                      {tierLabels[char.tier]}
                    </span>
                  </div>
                  {char.realm && (
                    <p className="mt-1 text-xs text-zinc-500">{char.realm}</p>
                  )}
                  {char.status && (
                    <p className="mt-0.5 text-xs text-zinc-400">{char.status}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
