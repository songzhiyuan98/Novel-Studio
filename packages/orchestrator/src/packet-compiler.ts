import type { PacketSection, CompiledPacket } from './types.js'

export function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars * 1.5 + otherChars * 0.4)
}

export interface PacketCompilerOptions {
  tokenBudget: number
  workerType: string
}

export class PacketCompiler {
  private sections: PacketSection[] = []
  private options: PacketCompilerOptions

  constructor(options: PacketCompilerOptions) {
    this.options = options
  }

  addSection(key: string, content: string, priority: number): this {
    const estimatedTokens = estimateTokens(content)
    this.sections.push({ key, content, priority, estimatedTokens })
    return this
  }

  compile(): CompiledPacket {
    const sorted = [...this.sections].sort((a, b) => a.priority - b.priority)
    const included: PacketSection[] = []
    let totalTokens = 0
    const includedCharacters: string[] = []

    for (const section of sorted) {
      if (totalTokens + section.estimatedTokens > this.options.tokenBudget) {
        break
      }
      included.push(section)
      totalTokens += section.estimatedTokens
      if (section.key.startsWith('character:')) {
        includedCharacters.push(section.key.replace('character:', ''))
      }
    }

    return {
      sections: included,
      totalTokens,
      budgetUsed: totalTokens,
      budgetLimit: this.options.tokenBudget,
      includedCharacters,
      workerType: this.options.workerType,
    }
  }

  toPromptString(): string {
    const packet = this.compile()
    return packet.sections.map((s) => `## ${s.key}\n${s.content}`).join('\n\n')
  }
}

export type CharacterTier = 'core' | 'important' | 'episodic'

export interface CharacterForPacket {
  characterKey: string
  name: string
  tier: CharacterTier
  stateJson: string
}

export function filterCharactersByTier(
  characters: CharacterForPacket[],
  sceneCharacterKeys: string[],
): CharacterForPacket[] {
  return characters.filter((c) => {
    switch (c.tier) {
      case 'core':
        return true
      case 'important':
        return sceneCharacterKeys.includes(c.characterKey)
      case 'episodic':
        return sceneCharacterKeys.includes(c.characterKey)
      default:
        return false
    }
  })
}
