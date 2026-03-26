import type { SummarizerResult, CanonUpdate, CanonRepositories } from './types.js'

export class CanonProjector {
  private repos: CanonRepositories

  constructor(repos: CanonRepositories) {
    this.repos = repos
  }

  async project(params: {
    projectId: string
    chapterId: string
    chapterNumber: number
    summarizerResult: SummarizerResult
    sourceArtifactId: string
  }): Promise<CanonUpdate[]> {
    const { projectId, chapterId, chapterNumber, summarizerResult, sourceArtifactId } = params
    const updates: CanonUpdate[] = []

    await this.repos.saveChapterSummary({
      projectId, chapterId, chapterNumber,
      summaryText: summarizerResult.summary,
      keyEventsJson: summarizerResult.keyEvents,
      characterDeltasJson: summarizerResult.characterDeltas.map((d) => ({ character: d.character, change: d.change })),
      newThreadsJson: summarizerResult.newThreads,
      resolvedThreadsJson: summarizerResult.resolvedThreads,
      advancedThreadsJson: summarizerResult.advancedThreads,
      newWorldFactsJson: summarizerResult.newWorldFacts,
      timelineEventsJson: summarizerResult.timelineEvents,
      sourceArtifactId,
    })
    updates.push({ type: 'chapter_summary', target: `chapter_${chapterNumber}`, data: { summary: summarizerResult.summary }, sourceArtifactId, chapterNumber })

    for (const delta of summarizerResult.characterDeltas) {
      await this.repos.updateCharacterState(projectId, delta.character, { change: delta.change, dimensionUpdates: delta.dimensionUpdates, chapterNumber, sourceArtifactId })
      updates.push({ type: 'character_delta', target: delta.character, data: { change: delta.change, dimensionUpdates: delta.dimensionUpdates }, sourceArtifactId, chapterNumber })
    }

    for (const event of summarizerResult.timelineEvents) {
      await this.repos.addTimelineEvent({ projectId, chapterNumber, eventType: 'plot', eventSummary: event.event, locationKey: event.location, sourceArtifactId })
      updates.push({ type: 'timeline_event', target: event.event, data: { location: event.location }, sourceArtifactId, chapterNumber })
    }

    for (const thread of summarizerResult.newThreads) {
      await this.repos.createThread({ projectId, label: thread, originChapter: chapterNumber })
      updates.push({ type: 'thread_new', target: thread, data: {}, sourceArtifactId, chapterNumber })
    }

    for (const thread of summarizerResult.resolvedThreads) {
      await this.repos.resolveThread(projectId, thread)
      updates.push({ type: 'thread_resolved', target: thread, data: {}, sourceArtifactId, chapterNumber })
    }

    for (const thread of summarizerResult.advancedThreads) {
      await this.repos.advanceThread(projectId, thread)
      updates.push({ type: 'thread_advanced', target: thread, data: {}, sourceArtifactId, chapterNumber })
    }

    for (const charKey of summarizerResult.episodicCharactersToArchive) {
      await this.repos.archiveCharacter(projectId, charKey)
      updates.push({ type: 'character_archived', target: charKey, data: {}, sourceArtifactId, chapterNumber })
    }

    await this.repos.writeAuditLog({
      projectId, eventType: 'canon_projected', actor: 'orchestrator', targetType: 'chapter', targetId: chapterId,
      detailsJson: { chapterNumber, updatesCount: updates.length, characterDeltasCount: summarizerResult.characterDeltas.length, timelineEventsCount: summarizerResult.timelineEvents.length, threadsNew: summarizerResult.newThreads.length, threadsResolved: summarizerResult.resolvedThreads.length, episodicArchived: summarizerResult.episodicCharactersToArchive.length },
    })

    return updates
  }
}
