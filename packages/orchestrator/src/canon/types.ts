export interface SummarizerResult {
  chapterNumber: number
  summary: string
  keyEvents: string[]
  characterDeltas: Array<{ character: string; change: string; dimensionUpdates?: Record<string, unknown> }>
  newThreads: string[]
  resolvedThreads: string[]
  advancedThreads: string[]
  newWorldFacts: string[]
  timelineEvents: Array<{ event: string; location?: string }>
  episodicCharactersToArchive: string[]
}

export interface CanonUpdate {
  type: 'chapter_summary' | 'character_delta' | 'timeline_event' | 'thread_new' | 'thread_resolved' | 'thread_advanced' | 'character_archived' | 'world_fact'
  target: string
  data: Record<string, unknown>
  sourceArtifactId: string
  chapterNumber: number
}

export interface CanonRepositories {
  saveChapterSummary: (summary: {
    projectId: string
    chapterId: string
    chapterNumber: number
    summaryText: string
    keyEventsJson: string[]
    characterDeltasJson: Array<{ character: string; change: string }>
    newThreadsJson: string[]
    resolvedThreadsJson: string[]
    advancedThreadsJson: string[]
    newWorldFactsJson: string[]
    timelineEventsJson: Array<{ event: string; location?: string }>
    sourceArtifactId: string
  }) => Promise<void>
  updateCharacterState: (projectId: string, characterKey: string, delta: {
    change: string
    dimensionUpdates?: Record<string, unknown>
    chapterNumber: number
    sourceArtifactId: string
  }) => Promise<void>
  addTimelineEvent: (event: {
    projectId: string
    chapterNumber: number
    eventType: string
    eventSummary: string
    locationKey?: string
    sourceArtifactId: string
  }) => Promise<void>
  createThread: (thread: { projectId: string; label: string; originChapter: number }) => Promise<void>
  resolveThread: (projectId: string, threadLabel: string) => Promise<void>
  advanceThread: (projectId: string, threadLabel: string) => Promise<void>
  archiveCharacter: (projectId: string, characterKey: string) => Promise<void>
  writeAuditLog: (log: {
    projectId: string
    eventType: string
    actor: string
    targetType: string
    targetId: string
    detailsJson: Record<string, unknown>
  }) => Promise<void>
}
