export interface SceneSegment {
  sceneIndex: number
  sceneKey: string
  text: string
}

export interface RewriteRequest {
  chapterScenes: SceneSegment[]
  targetSceneIndex: number
  newText: string
}

export function mergeRewrittenScene(request: RewriteRequest): SceneSegment[] {
  const { chapterScenes, targetSceneIndex, newText } = request

  const sceneExists = chapterScenes.some((s) => s.sceneIndex === targetSceneIndex)
  if (!sceneExists) {
    throw new Error(`Scene index ${targetSceneIndex} not found in chapter`)
  }

  return chapterScenes.map((scene) => {
    if (scene.sceneIndex === targetSceneIndex) {
      return { ...scene, text: newText }
    }
    return scene
  })
}

export function assembleSurroundingContext(
  scenes: SceneSegment[],
  targetIndex: number,
  contextRadius: number = 1,
): { before: string; after: string } {
  const before = scenes
    .filter((s) => s.sceneIndex >= targetIndex - contextRadius && s.sceneIndex < targetIndex)
    .map((s) => s.text)
    .join('\n\n')

  const after = scenes
    .filter((s) => s.sceneIndex > targetIndex && s.sceneIndex <= targetIndex + contextRadius)
    .map((s) => s.text)
    .join('\n\n')

  return { before, after }
}

export function combineScenesToChapter(scenes: SceneSegment[]): string {
  return scenes
    .sort((a, b) => a.sceneIndex - b.sceneIndex)
    .map((s) => s.text)
    .join('\n\n')
}
