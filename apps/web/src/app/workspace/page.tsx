import { ChatPanel } from '@/components/chat-panel'
import { CharacterPanel } from '@/components/character-panel'
import { TracePanel } from '@/components/trace-panel'

export default function WorkspacePage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Center: Chat */}
        <div className="flex flex-1 flex-col border-r border-zinc-200">
          <ChatPanel />
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
