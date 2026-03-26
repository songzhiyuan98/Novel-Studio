import { describe, it, expect } from 'vitest'
import { BlueprintGate, type Blueprint } from '../../src/pipeline/blueprint-gate.js'

describe('BlueprintGate', () => {
  const gate = new BlueprintGate()

  const validBlueprint: Blueprint = {
    id: 'bp-1',
    chapterNumber: 1,
    status: 'confirmed',
    scenes: [
      {
        sceneIndex: 0,
        sceneKey: 'opening',
        objective: 'Introduce hero',
        beats: ['Hero enters', 'Conflict begins'],
        characters: ['lin_fan'],
      },
    ],
  }

  it('passes for confirmed blueprint with scenes', () => {
    expect(() => gate.assertConfirmed(validBlueprint)).not.toThrow()
  })

  it('throws for null blueprint', () => {
    expect(() => gate.assertConfirmed(null)).toThrow('No blueprint found')
  })

  it('throws for draft blueprint', () => {
    const draft = { ...validBlueprint, status: 'draft' as const }
    expect(() => gate.assertConfirmed(draft)).toThrow('must be confirmed')
  })

  it('throws for rejected blueprint', () => {
    const rejected = { ...validBlueprint, status: 'rejected' as const }
    expect(() => gate.assertConfirmed(rejected)).toThrow('must be confirmed')
  })

  it('throws for blueprint with no scenes', () => {
    const empty = { ...validBlueprint, scenes: [] }
    expect(() => gate.assertConfirmed(empty)).toThrow('no scenes')
  })
})
