import { Sidebar } from '@/components/sidebar'
import { WorkspaceProvider } from '@/lib/workspace-context'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex flex-1 overflow-hidden">{children}</main>
      </div>
    </WorkspaceProvider>
  )
}
