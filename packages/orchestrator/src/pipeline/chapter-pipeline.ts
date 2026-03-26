import { WorkflowStateMachine } from '../state-machine.js'
import { TaskDispatcher } from '../task-dispatcher.js'
import { BlueprintGate, type Blueprint } from './blueprint-gate.js'
import { mergeRewrittenScene, combineScenesToChapter, type SceneSegment } from './scene-rewriter.js'
import type { TaskRecord } from '../types.js'

export interface PipelineCallbacks {
  onPlan: (chapterNumber: number) => Promise<Blueprint>
  onWrite: (blueprint: Blueprint) => Promise<{ scenes: SceneSegment[]; taskRecord: TaskRecord }>
  onQA: (chapterText: string, blueprint: Blueprint) => Promise<{ decision: string; issues: unknown[]; taskRecord: TaskRecord }>
  onRewriteScene: (sceneIndex: number, scenes: SceneSegment[], blueprint: Blueprint) => Promise<{ newText: string; taskRecord: TaskRecord }>
  onCanonize: (chapterNumber: number, scenes: SceneSegment[]) => Promise<void>
}

export type PipelineEvent =
  | { type: 'phase_changed'; phase: string }
  | { type: 'blueprint_generated'; blueprint: Blueprint }
  | { type: 'blueprint_confirmed'; blueprint: Blueprint }
  | { type: 'chapter_drafted'; sceneCount: number }
  | { type: 'qa_completed'; decision: string; issueCount: number }
  | { type: 'scene_rewritten'; sceneIndex: number }
  | { type: 'chapter_canonized'; chapterNumber: number }
  | { type: 'error'; message: string }

export class ChapterPipeline {
  private stateMachine: WorkflowStateMachine
  private dispatcher: TaskDispatcher
  private gate: BlueprintGate
  private currentBlueprint: Blueprint | null = null
  private currentScenes: SceneSegment[] = []
  private events: PipelineEvent[] = []

  constructor(initialPhase: 'idle' | 'plan' = 'idle') {
    this.stateMachine = new WorkflowStateMachine(initialPhase)
    this.dispatcher = new TaskDispatcher()
    this.gate = new BlueprintGate()
  }

  getPhase() {
    return this.stateMachine.getPhase()
  }

  getEvents() {
    return [...this.events]
  }

  getBlueprint() {
    return this.currentBlueprint
  }

  getScenes() {
    return [...this.currentScenes]
  }

  private emit(event: PipelineEvent) {
    this.events.push(event)
  }

  async plan(chapterNumber: number, callbacks: Pick<PipelineCallbacks, 'onPlan'>): Promise<Blueprint> {
    this.stateMachine.transition('plan')
    this.dispatcher.startNewAction()
    this.emit({ type: 'phase_changed', phase: 'plan' })

    const blueprint = await callbacks.onPlan(chapterNumber)
    this.currentBlueprint = blueprint
    this.emit({ type: 'blueprint_generated', blueprint })

    this.stateMachine.transition('blueprint_confirm')
    this.emit({ type: 'phase_changed', phase: 'blueprint_confirm' })

    return blueprint
  }

  confirmBlueprint(): void {
    if (!this.currentBlueprint) {
      throw new Error('No blueprint to confirm')
    }
    this.currentBlueprint.status = 'confirmed'
    this.emit({ type: 'blueprint_confirmed', blueprint: this.currentBlueprint })
  }

  async write(callbacks: Pick<PipelineCallbacks, 'onWrite'>): Promise<SceneSegment[]> {
    this.gate.assertConfirmed(this.currentBlueprint)
    this.stateMachine.transition('write')
    this.emit({ type: 'phase_changed', phase: 'write' })

    const result = await callbacks.onWrite(this.currentBlueprint!)
    this.currentScenes = result.scenes
    this.emit({ type: 'chapter_drafted', sceneCount: result.scenes.length })

    return result.scenes
  }

  async qa(callbacks: Pick<PipelineCallbacks, 'onQA'>): Promise<{ decision: string; issues: unknown[] }> {
    this.stateMachine.transition('qa')
    this.emit({ type: 'phase_changed', phase: 'qa' })

    const chapterText = combineScenesToChapter(this.currentScenes)
    const result = await callbacks.onQA(chapterText, this.currentBlueprint!)
    this.emit({ type: 'qa_completed', decision: result.decision, issueCount: result.issues.length })

    return { decision: result.decision, issues: result.issues }
  }

  async rewriteScene(
    sceneIndex: number,
    callbacks: Pick<PipelineCallbacks, 'onRewriteScene'>,
  ): Promise<SceneSegment[]> {
    this.stateMachine.transition('idle')
    this.dispatcher.startNewAction()
    this.stateMachine.transition('plan')
    this.stateMachine.transition('blueprint_confirm')
    this.stateMachine.transition('write')

    const result = await callbacks.onRewriteScene(sceneIndex, this.currentScenes, this.currentBlueprint!)
    this.currentScenes = mergeRewrittenScene({
      chapterScenes: this.currentScenes,
      targetSceneIndex: sceneIndex,
      newText: result.newText,
    })
    this.emit({ type: 'scene_rewritten', sceneIndex })

    return this.currentScenes
  }

  async canonize(
    chapterNumber: number,
    callbacks: Pick<PipelineCallbacks, 'onCanonize'>,
  ): Promise<void> {
    this.stateMachine.transition('canonize')
    this.emit({ type: 'phase_changed', phase: 'canonize' })

    await callbacks.onCanonize(chapterNumber, this.currentScenes)
    this.emit({ type: 'chapter_canonized', chapterNumber })

    this.stateMachine.transition('idle')
    this.currentBlueprint = null
    this.currentScenes = []
  }
}
