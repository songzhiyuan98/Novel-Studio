'use client'

import { ChatPanel } from '@/components/chat-panel'
import { CharacterPanel } from '@/components/character-panel'
import { TracePanel } from '@/components/trace-panel'
import { ChapterViewer } from '@/components/chapter-viewer'
import { useWorkspace } from '@/lib/workspace-context'

export default function WorkspacePage() {
  const { view } = useWorkspace()

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Center: switches between chat and chapter viewer */}
        <div className="flex flex-1 flex-col">
          {view === 'chat' ? <ChatPanel /> : <ChapterViewer />}
        </div>
        {/* Right: Characters */}
        <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-zinc-200 bg-white">
          <CharacterPanel />
        </div>
      </div>
      {/* Bottom: Trace */}
      <TracePanel />
    </div>
  )
}
