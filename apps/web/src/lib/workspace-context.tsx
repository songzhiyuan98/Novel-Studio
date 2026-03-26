'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type WorkspaceView = 'chat' | 'chapter'

interface WorkspaceState {
  view: WorkspaceView
  selectedChapterId: string | null
  selectedChapterNumber: number | null
  projectId: string | null
  setView: (view: WorkspaceView) => void
  selectChapter: (id: string, number: number) => void
  goToChat: () => void
  setProjectId: (id: string) => void
}

const WorkspaceContext = createContext<WorkspaceState | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<WorkspaceView>('chat')
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)

  const selectChapter = (id: string, number: number) => {
    setSelectedChapterId(id)
    setSelectedChapterNumber(number)
    setView('chapter')
  }

  const goToChat = () => {
    setView('chat')
    setSelectedChapterId(null)
    setSelectedChapterNumber(null)
  }

  return (
    <WorkspaceContext.Provider
      value={{ view, selectedChapterId, selectedChapterNumber, projectId, setView, selectChapter, goToChat, setProjectId }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
