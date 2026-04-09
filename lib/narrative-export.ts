import type { EngineState } from './types'

type ExportCharacter = {
  id: string
  name: string
  color: string
  voice_id: string
  sprite_neutral: string | null
  sprite_happy: string | null
  sprite_sad: string | null
  sprite_angry: string | null
}

type ExportChoice = {
  id: string
  text: string
  character_id: string | null
  next_scene_id: string | null
}

type ExportScene = {
  id: string
  order_index: number
  title: string
  background_image: string | null
  duration_seconds: number
  active_characters: string[]
  dialogue: string
  choices: ExportChoice[]
  next_scene_id: string | null
}

type NarrativeExport = {
  chapter: {
    id: string | null
    title: string
    order_index: number
    estimated_duration_seconds: number
  }
  characters: ExportCharacter[]
  scenes: ExportScene[]
  metadata: {
    export_date: string
    total_scenes: number
    total_dialogues: number
    total_choices: number
  }
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

export function buildNarrativeExport(state: EngineState): NarrativeExport {
  const sortedScenes = [...state.scenes].sort((a, b) => a.createdAt - b.createdAt)
  const sortedChapters = [...state.chapters].sort((a, b) => a.order - b.order)
  const chapter = sortedChapters[0]

  const scenes: ExportScene[] = sortedScenes.map((scene, index) => {
    const choices: ExportChoice[] = (scene.dialogueTree?.answers ?? []).map((answer) => ({
      id: answer.id,
      text: answer.text,
      character_id: answer.characterId,
      next_scene_id: answer.targetSceneId,
    }))

    const activeCharacters = unique([
      scene.characterId,
      scene.dialogueTree?.questionCharacterId ?? null,
      ...choices.map((choice) => choice.character_id),
    ])

    const dialogue = scene.dialogueTree?.questionText?.trim() || scene.dialogue || ''

    return {
      id: scene.id,
      order_index: index,
      title: scene.title,
      background_image: scene.media.url,
      duration_seconds: scene.duration,
      active_characters: activeCharacters,
      dialogue,
      choices,
      next_scene_id: choices[0]?.next_scene_id ?? null,
    }
  })

  const characters: ExportCharacter[] = state.characters.map((character) => ({
    id: character.id,
    name: character.name,
    color: character.dialogueColor,
    voice_id: character.voiceProfile,
    sprite_neutral: character.avatar,
    sprite_happy: null,
    sprite_sad: null,
    sprite_angry: null,
  }))

  const totalChoices = scenes.reduce((sum, scene) => sum + scene.choices.length, 0)
  const totalDialogues = scenes.reduce((sum, scene) => sum + (scene.dialogue ? 1 : 0), 0)

  const chapterDuration = state.scenes
    .filter((scene) => (chapter ? scene.chapterId === chapter.id : true))
    .reduce((sum, scene) => sum + scene.duration, 0)

  return {
    chapter: {
      id: chapter?.id ?? null,
      title: chapter?.name ?? state.projectName,
      order_index: chapter?.order ?? 0,
      estimated_duration_seconds: chapterDuration,
    },
    characters,
    scenes,
    metadata: {
      export_date: new Date().toISOString(),
      total_scenes: scenes.length,
      total_dialogues: totalDialogues,
      total_choices: totalChoices,
    },
  }
}

export function downloadNarrativeExport(state: EngineState): void {
  const payload = buildNarrativeExport(state)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `narrative-export-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
