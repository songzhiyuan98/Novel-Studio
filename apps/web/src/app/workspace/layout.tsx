import { Sidebar } from '@/components/sidebar'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
