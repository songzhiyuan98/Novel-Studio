import { describe, it, expect } from 'vitest'
import {
  PacketCompiler,
  estimateTokens,
  filterCharactersByTier,
  type CharacterForPacket,
} from '../src/packet-compiler.js'

describe('estimateTokens', () => {
  it('estimates Chinese text tokens', () => {
    const tokens = estimateTokens('林凡站在演武场上')
    expect(tokens).toBeGreaterThan(0)
    expect(tokens).toBeLessThan(50)
  })

  it('estimates English text tokens', () => {
    const tokens = estimateTokens('The hero stood in the arena')
    expect(tokens).toBeGreaterThan(0)
  })

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })
})

describe('PacketCompiler', () => {
  it('compiles sections by priority', () => {
    const compiler = new PacketCompiler({ tokenBudget: 10000, workerType: 'writer' })
    compiler
      .addSection('blueprint', 'Scene 1: Hero fights villain', 0)
      .addSection('style', 'Write in third person past tense', 0)
      .addSection('canon', 'The world has magic systems', 1)
      .addSection('summary', 'Previous chapter summary here', 2)

    const packet = compiler.compile()
    expect(packet.sections.length).toBe(4)
    expect(packet.sections[0].key).toBe('blueprint')
    expect(packet.totalTokens).toBeGreaterThan(0)
    expect(packet.workerType).toBe('writer')
  })

  it('respects token budget', () => {
    const compiler = new PacketCompiler({ tokenBudget: 10, workerType: 'writer' })
    compiler
      .addSection('small', 'hi', 0)
      .addSection('large', 'a'.repeat(1000), 1)

    const packet = compiler.compile()
    expect(packet.sections.length).toBe(1)
    expect(packet.sections[0].key).toBe('small')
  })

  it('tracks included characters', () => {
    const compiler = new PacketCompiler({ tokenBudget: 10000, workerType: 'writer' })
    compiler
      .addSection('character:lin_fan', '林凡 state data', 1)
      .addSection('character:su_yuqing', '苏雨晴 state data', 1)
      .addSection('blueprint', 'scene details', 0)

    const packet = compiler.compile()
    expect(packet.includedCharacters).toContain('lin_fan')
    expect(packet.includedCharacters).toContain('su_yuqing')
  })

  it('generates prompt string', () => {
    const compiler = new PacketCompiler({ tokenBudget: 10000, workerType: 'writer' })
    compiler.addSection('blueprint', 'Fight scene', 0)
    compiler.addSection('style', 'Third person', 0)

    const prompt = compiler.toPromptString()
    expect(prompt).toContain('## blueprint')
    expect(prompt).toContain('## style')
    expect(prompt).toContain('Fight scene')
  })
})

describe('filterCharactersByTier', () => {
  const characters: CharacterForPacket[] = [
    { characterKey: 'lin_fan', name: '林凡', tier: 'core', stateJson: '{}' },
    { characterKey: 'su_yuqing', name: '苏雨晴', tier: 'core', stateJson: '{}' },
    { characterKey: 'lin_haotian', name: '林浩天', tier: 'important', stateJson: '{}' },
    { characterKey: 'herb_guard', name: '药园守卫', tier: 'episodic', stateJson: '{}' },
    { characterKey: 'lin_laosan', name: '林老三', tier: 'important', stateJson: '{}' },
  ]

  it('always includes core characters', () => {
    const result = filterCharactersByTier(characters, [])
    expect(result.map((c) => c.characterKey)).toContain('lin_fan')
    expect(result.map((c) => c.characterKey)).toContain('su_yuqing')
  })

  it('includes important characters only if in scene', () => {
    const result = filterCharactersByTier(characters, ['lin_haotian'])
    expect(result.map((c) => c.characterKey)).toContain('lin_haotian')
    expect(result.map((c) => c.characterKey)).not.toContain('lin_laosan')
  })

  it('includes episodic characters only if in scene', () => {
    const result = filterCharactersByTier(characters, ['herb_guard'])
    expect(result.map((c) => c.characterKey)).toContain('herb_guard')
  })

  it('excludes episodic characters not in scene', () => {
    const result = filterCharactersByTier(characters, ['lin_haotian'])
    expect(result.map((c) => c.characterKey)).not.toContain('herb_guard')
  })

  it('returns only core when scene list is empty', () => {
    const result = filterCharactersByTier(characters, [])
    expect(result.length).toBe(2)
  })
})
