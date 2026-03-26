export interface Blueprint {
  id: string
  chapterNumber: number
  status: 'draft' | 'confirmed' | 'rejected'
  scenes: BlueprintScene[]
}

export interface BlueprintScene {
  sceneIndex: number
  sceneKey: string
  objective: string
  beats: string[]
  dialogueNotes?: string
  combatNotes?: string
  characters: string[]
}

export class BlueprintGate {
  assertConfirmed(blueprint: Blueprint | null): asserts blueprint is Blueprint {
    if (!blueprint) {
      throw new BlueprintNotFoundError()
    }
    if (blueprint.status !== 'confirmed') {
      throw new BlueprintNotConfirmedError(blueprint.status)
    }
    if (blueprint.scenes.length === 0) {
      throw new BlueprintEmptyError()
    }
  }
}

export class BlueprintNotFoundError extends Error {
  constructor() {
    super('No blueprint found. Generate a blueprint before writing.')
    this.name = 'BlueprintNotFoundError'
  }
}

export class BlueprintNotConfirmedError extends Error {
  constructor(currentStatus: string) {
    super(`Blueprint must be confirmed before writing. Current status: ${currentStatus}`)
    this.name = 'BlueprintNotConfirmedError'
  }
}

export class BlueprintEmptyError extends Error {
  constructor() {
    super('Blueprint has no scenes. Add at least one scene before writing.')
    this.name = 'BlueprintEmptyError'
  }
}
