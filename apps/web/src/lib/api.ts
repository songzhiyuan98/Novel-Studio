const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// Types matching the API responses
export interface Project {
  id: string
  title: string
  description: string | null
  templateId: string
  status: string
  createdAt: string
}

export interface Character {
  id: string
  characterKey: string
  name: string
  tier: 'core' | 'important' | 'episodic'
  basicJson: Record<string, unknown> | null
  personalityJson: { coreTraits?: string[]; speechStyle?: string } | null
  dimensionsJson: Record<string, unknown> | null
  currentStatusJson: Record<string, unknown> | null
  hooksJson: Array<{ hook: string; plantedChapter: number; status: string }> | null
}

export interface Chapter {
  id: string
  chapterNumber: number
  title: string | null
  status: string
  canonizedAt: string | null
}

export interface ChapterSummary {
  summaryText: string
  keyEventsJson: string[]
  characterDeltasJson: Array<{ character: string; change: string }>
}
