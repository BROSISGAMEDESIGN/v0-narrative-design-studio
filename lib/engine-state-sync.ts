import type { Chapter, Character, EngineState, Scene, TeamNote } from './types'
import { DEFAULT_CHAPTERS, DEFAULT_ENGINE_STATE } from './types'

export const LEGACY_ZUSTAND_STORAGE_KEY = 'brosis-engine-storage'

export function pickEngineState(store: EngineState): EngineState {
  return {
    projectName: store.projectName,
    scenes: store.scenes,
    chapters: store.chapters,
    characters: store.characters,
    teamNotes: store.teamNotes,
    lastSaved: store.lastSaved,
  }
}

export function mergeEngineState(raw: unknown): EngineState {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_ENGINE_STATE, chapters: [...DEFAULT_CHAPTERS] }
  }
  const o = raw as Record<string, unknown>
  const chaptersRaw = o.chapters
  const chapters: Chapter[] =
    Array.isArray(chaptersRaw) && chaptersRaw.length > 0
      ? (chaptersRaw as Chapter[])
      : [...DEFAULT_CHAPTERS]

  const lastSavedVal = o.lastSaved
  const lastSaved: number | null =
    typeof lastSavedVal === 'number'
      ? lastSavedVal
      : lastSavedVal === null || lastSavedVal === undefined
        ? null
        : null

  return {
    projectName: typeof o.projectName === 'string' ? o.projectName : DEFAULT_ENGINE_STATE.projectName,
    scenes: Array.isArray(o.scenes) ? (o.scenes as Scene[]) : [],
    chapters,
    characters: Array.isArray(o.characters) ? (o.characters as Character[]) : [],
    teamNotes: Array.isArray(o.teamNotes) ? (o.teamNotes as TeamNote[]) : [],
    lastSaved,
  }
}

/** True when the cloud row looks like an empty studio (safe to overwrite from legacy local data). */
export function isLikelyEmptyProject(state: EngineState): boolean {
  if (state.scenes.length > 0 || state.characters.length > 0 || state.teamNotes.length > 0) {
    return false
  }
  const name = state.projectName.trim()
  return name === '' || name === 'Untitled Project'
}

export function hasMeaningfulLocalData(state: EngineState): boolean {
  return (
    state.scenes.length > 0 ||
    state.characters.length > 0 ||
    state.teamNotes.length > 0 ||
    (state.projectName.trim() !== '' && state.projectName !== 'Untitled Project')
  )
}

export function readLegacyZustandPersist(): EngineState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LEGACY_ZUSTAND_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: unknown }
    if (!parsed.state || typeof parsed.state !== 'object') return null
    return mergeEngineState(parsed.state)
  } catch {
    return null
  }
}

export function clearLegacyZustandPersist(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LEGACY_ZUSTAND_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
