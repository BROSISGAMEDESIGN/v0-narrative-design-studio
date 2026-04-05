import type { Node, Edge } from '@xyflow/react'

export interface Character {
  id: string
  name: string
  avatar: string | null
  bio: string
  voiceProfile: 'male-deep' | 'male-light' | 'female-warm' | 'female-clear' | 'neutral'
  dialogueColor: string
  createdAt: number
}

// Dialogue tree structure
export interface DialogueOption {
  id: string
  characterId: string | null
  text: string
  targetSceneId: string | null // Links to another scene node
}

export interface DialogueTree {
  questionCharacterId: string | null
  questionText: string
  answers: DialogueOption[]
}

export interface Scene {
  id: string
  title: string
  media: {
    type: 'image' | 'video' | null
    url: string | null
    name: string | null
  }
  // New dialogue tree structure (replaces single dialogue)
  dialogueTree: DialogueTree
  // Legacy field for backwards compatibility
  dialogue: string
  characterId: string | null
  duration: number // seconds
  chapterId: string | null
  position: { x: number; y: number }
  createdAt: number
  isCompleted: boolean
}

export interface Chapter {
  id: string
  name: string
  color: string
  order: number
  createdAt: number
}

export interface TeamNote {
  id: string
  author: 'Serkan' | 'Elvan'
  content: string
  status: 'todo' | 'done'
  priority: 'normal' | 'emergency' | 'elvan'
  createdAt: number
}

export interface EngineState {
  projectName: string
  scenes: Scene[]
  chapters: Chapter[]
  characters: Character[]
  teamNotes: TeamNote[]
  lastSaved: number | null
}

export type SceneNode = Node<{ scene: Scene }, 'scene'>
export type SceneEdge = Edge

export interface CinemaModeState {
  isPlaying: boolean
  currentSceneIndex: number
  isPaused: boolean
  selectedAnswerId: string | null
}

// Default values
export const DEFAULT_CHARACTERS: Character[] = []

export const DEFAULT_CHAPTERS: Chapter[] = [
  {
    id: 'chapter-1',
    name: 'Chapter 1',
    color: '#A855F7',
    order: 0,
    createdAt: Date.now()
  }
]

export const DEFAULT_DIALOGUE_TREE: DialogueTree = {
  questionCharacterId: null,
  questionText: '',
  answers: []
}

export const DEFAULT_ENGINE_STATE: EngineState = {
  projectName: 'Untitled Project',
  scenes: [],
  chapters: DEFAULT_CHAPTERS,
  characters: DEFAULT_CHARACTERS,
  teamNotes: [],
  lastSaved: null
}

// Voice profile options for the cast page
export const VOICE_PROFILES = [
  { value: 'male-deep', label: 'Male - Deep' },
  { value: 'male-light', label: 'Male - Light' },
  { value: 'female-warm', label: 'Female - Warm' },
  { value: 'female-clear', label: 'Female - Clear' },
  { value: 'neutral', label: 'Neutral' }
] as const

// Color presets for characters
export const CHARACTER_COLORS = [
  '#A855F7', // Purple (Neon)
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#8B5CF6', // Violet
]

// Helper to create a new dialogue option
export function createDialogueOption(): DialogueOption {
  return {
    id: `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    characterId: null,
    text: '',
    targetSceneId: null
  }
}

// Helper to create a new scene with default dialogue tree
export function createDefaultScene(position: { x: number; y: number }, chapterId?: string): Scene {
  return {
    id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: 'New Scene',
    media: { type: null, url: null, name: null },
    dialogueTree: { ...DEFAULT_DIALOGUE_TREE },
    dialogue: '',
    characterId: null,
    duration: 5,
    chapterId: chapterId || null,
    position,
    createdAt: Date.now(),
    isCompleted: false
  }
}
