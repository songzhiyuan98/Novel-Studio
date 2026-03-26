// State machine
export { WorkflowStateMachine } from './state-machine.js'

// Packet compiler
export { PacketCompiler, estimateTokens, filterCharactersByTier } from './packet-compiler.js'
export type { PacketCompilerOptions, CharacterForPacket, CharacterTier } from './packet-compiler.js'

// Safety
export { SafetyGuard } from './safety.js'

// Task dispatcher
export { TaskDispatcher } from './task-dispatcher.js'

// Types
export type {
  WorkflowPhase,
  IntentType,
  ClassifiedIntent,
  PacketSection,
  CompiledPacket,
  TaskRecord,
  SafetyLimits,
} from './types.js'
export { DEFAULT_SAFETY_LIMITS } from './types.js'

// Pipeline
export { ChapterPipeline } from './pipeline/chapter-pipeline.js'
export type { PipelineCallbacks, PipelineEvent } from './pipeline/chapter-pipeline.js'
export { BlueprintGate, BlueprintNotFoundError, BlueprintNotConfirmedError, BlueprintEmptyError } from './pipeline/blueprint-gate.js'
export type { Blueprint, BlueprintScene } from './pipeline/blueprint-gate.js'
export { mergeRewrittenScene, assembleSurroundingContext, combineScenesToChapter } from './pipeline/scene-rewriter.js'
export type { SceneSegment, RewriteRequest } from './pipeline/scene-rewriter.js'

// Canon projection
export { CanonProjector } from './canon/projector.js'
export type { SummarizerResult, CanonUpdate, CanonRepositories } from './canon/types.js'
