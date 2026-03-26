'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { ProjectSetup } from '@/components/project-setup'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [hasProject, setHasProject] = useState<boolean | null>(null)
  const router = useRouter()

  const checkProjects = () => {
    apiFetch<Array<{ id: string }>>('/api/projects')
      .then((projects) => {
        if (projects.length > 0) {
          router.push('/workspace')
        } else {
          setHasProject(false)
        }
      })
      .catch(() => setHasProject(false))
  }

  useEffect(() => {
    checkProjects()
  }, [])

  if (hasProject === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-zinc-400">加载中...</p>
      </div>
    )
  }

  return <ProjectSetup onCreated={checkProjects} />
}
