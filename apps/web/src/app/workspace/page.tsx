'use client'

import { ChatPanel } from '@/components/chat-panel'
import { CharacterPanel } from '@/components/character-panel'
import { TracePanel } from '@/components/trace-panel'
import { ChapterViewer } from '@/components/chapter-viewer'
import { WorldSettings } from '@/components/world-settings'
import { ProjectSetup } from '@/components/project-setup'
import { useWorkspace } from '@/lib/workspace-context'

function CenterPanel() {
  const { view, goToChat, triggerRefresh } = useWorkspace()
  switch (view) {
    case 'chat':
      return <ChatPanel />
    case 'chapter':
      return <ChapterViewer />
    case 'world-settings':
      return <WorldSettings />
    case 'new-project':
      return (
        <ProjectSetup
          onCreated={() => {
            triggerRefresh()
            goToChat()
          }}
        />
      )
    default:
      return <ChatPanel />
  }
}

export default function WorkspacePage() {
  const { view } = useWorkspace()
  const showRightPanel = view !== 'new-project'

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col">
          <CenterPanel />
        </div>
        {showRightPanel && (
          <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-zinc-200 bg-white">
            <CharacterPanel />
          </div>
        )}
      </div>
      {showRightPanel && <TracePanel />}
    </div>
  )
}
