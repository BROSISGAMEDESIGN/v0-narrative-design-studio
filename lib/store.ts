import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EngineState, Scene, Chapter, Character, TeamNote } from './types'
import { DEFAULT_ENGINE_STATE } from './types'

interface EngineStore extends EngineState {
  // Project
  setProjectName: (name: string) => void
  
  // Scenes
  addScene: (scene: Scene) => void
  updateScene: (id: string, updates: Partial<Scene>) => void
  deleteScene: (id: string) => void
  
  // Chapters
  addChapter: (chapter: Chapter) => void
  updateChapter: (id: string, updates: Partial<Chapter>) => void
  deleteChapter: (id: string) => void
  
  // Characters
  addCharacter: (character: Character) => void
  updateCharacter: (id: string, updates: Partial<Character>) => void
  deleteCharacter: (id: string) => void
  
  // Team Notes
  addNote: (note: TeamNote) => void
  updateNote: (id: string, updates: Partial<TeamNote>) => void
  deleteNote: (id: string) => void
  
  // Actions
  save: () => void
  reset: () => void
}

export const useEngineStore = create<EngineStore>()(
  persist(
    (set) => ({
      ...DEFAULT_ENGINE_STATE,
      
      // Project
      setProjectName: (name) => set({ projectName: name }),
      
      // Scenes
      addScene: (scene) => set((state) => ({ 
        scenes: [...state.scenes, scene] 
      })),
      updateScene: (id, updates) => set((state) => ({
        scenes: state.scenes.map((s) => 
          s.id === id ? { ...s, ...updates } : s
        )
      })),
      deleteScene: (id) => set((state) => ({
        scenes: state.scenes.filter((s) => s.id !== id)
      })),
      
      // Chapters
      addChapter: (chapter) => set((state) => ({ 
        chapters: [...state.chapters, chapter] 
      })),
      updateChapter: (id, updates) => set((state) => ({
        chapters: state.chapters.map((c) => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),
      deleteChapter: (id) => set((state) => ({
        chapters: state.chapters.filter((c) => c.id !== id),
        scenes: state.scenes.map((s) => 
          s.chapterId === id ? { ...s, chapterId: null } : s
        )
      })),
      
      // Characters
      addCharacter: (character) => set((state) => ({ 
        characters: [...state.characters, character] 
      })),
      updateCharacter: (id, updates) => set((state) => ({
        characters: state.characters.map((c) => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),
      deleteCharacter: (id) => set((state) => ({
        characters: state.characters.filter((c) => c.id !== id),
        scenes: state.scenes.map((s) => 
          s.characterId === id ? { ...s, characterId: null } : s
        )
      })),
      
      // Team Notes
      addNote: (note) => set((state) => ({ 
        teamNotes: [...state.teamNotes, note] 
      })),
      updateNote: (id, updates) => set((state) => ({
        teamNotes: state.teamNotes.map((n) => 
          n.id === id ? { ...n, ...updates } : n
        )
      })),
      deleteNote: (id) => set((state) => ({
        teamNotes: state.teamNotes.filter((n) => n.id !== id)
      })),
      
      // Actions
      save: () => set({ lastSaved: Date.now() }),
      reset: () => set(DEFAULT_ENGINE_STATE)
    }),
    {
      name: 'brosis-engine-storage',
    }
  )
)
