'use client'

import { useState, useEffect } from 'react'
import { Save, Play, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEngineStore } from '@/lib/store'

interface HeaderProps {
  onPlay: () => void
}

export function Header({ onPlay }: HeaderProps) {
  const { projectName, setProjectName, save, lastSaved, scenes, characters, chapters } = useEngineStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(projectName)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    setEditName(projectName)
  }, [projectName])

  const handleSave = () => {
    save()
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const handleNameSubmit = () => {
    if (editName.trim()) {
      setProjectName(editName.trim())
    } else {
      setEditName(projectName)
    }
    setIsEditing(false)
  }

  const canPlay = scenes.length > 0

  // Export to Unity JSON format
  const handleExportToUnity = () => {
    // Build nodes array (scenes)
    const nodes = scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      chapterId: scene.chapterId,
      chapterName: chapters.find(ch => ch.id === scene.chapterId)?.name || null,
      position: scene.position,
      duration: scene.duration,
      isCompleted: scene.isCompleted,
      media: {
        type: scene.media.type,
        fileName: scene.media.name
      },
      audio: {
        fileName: scene.music?.name || null
      },
      dialogue: {
        questionCharacterId: scene.dialogueTree.questionCharacterId,
        questionCharacterName: characters.find(c => c.id === scene.dialogueTree.questionCharacterId)?.name || null,
        questionText: scene.dialogueTree.questionText,
        answers: scene.dialogueTree.answers.map((answer, index) => ({
          id: answer.id,
          label: `A${index + 1}`,
          characterId: answer.characterId,
          characterName: characters.find(c => c.id === answer.characterId)?.name || null,
          text: answer.text,
          targetSceneId: answer.targetSceneId,
          targetSceneTitle: scenes.find(s => s.id === answer.targetSceneId)?.title || null
        }))
      }
    }))

    // Build edges array (connections between scenes via answers)
    const edges: Array<{
      id: string
      source: string
      sourceHandle: string
      target: string
      label: string
    }> = []

    scenes.forEach((scene) => {
      scene.dialogueTree.answers.forEach((answer, index) => {
        if (answer.targetSceneId) {
          edges.push({
            id: `edge-${scene.id}-${answer.id}`,
            source: scene.id,
            sourceHandle: answer.id,
            target: answer.targetSceneId,
            label: `A${index + 1}`
          })
        }
      })
    })

    // Build characters array
    const charactersExport = characters.map((char) => ({
      id: char.id,
      name: char.name,
      bio: char.bio,
      voiceProfile: char.voiceProfile,
      dialogueColor: char.dialogueColor
    }))

    // Build chapters array
    const chaptersExport = chapters.map((ch) => ({
      id: ch.id,
      name: ch.name,
      color: ch.color,
      order: ch.order
    }))

    // Final Unity-ready JSON structure
    const unityExport = {
      projectName,
      exportedAt: new Date().toISOString(),
      version: '1.0',
      nodes,
      edges,
      characters: charactersExport,
      chapters: chaptersExport
    }

    // Create and download the JSON file
    const blob = new Blob([JSON.stringify(unityExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/\s+/g, '_')}_unity_export.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">BE</span>
          </div>
          <span className="text-xs font-mono text-muted-foreground tracking-widest">BROSIS ENGINE</span>
        </div>
        
        <div className="h-6 w-px bg-border" />
        
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            className="h-8 w-48 bg-secondary border-border text-sm"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            {projectName}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {lastSaved && (
          <span className="text-xs text-muted-foreground mr-2">
            Last saved: {new Date(lastSaved).toLocaleTimeString()}
          </span>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          className="gap-2"
        >
          {showSaved ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExportToUnity}
          disabled={scenes.length === 0}
          className="gap-2 border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10"
        >
          <Download className="h-4 w-4" />
          Export to Unity
        </Button>
        
        <Button
          size="sm"
          onClick={onPlay}
          disabled={!canPlay}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Play className="h-4 w-4" />
          Play
        </Button>
      </div>
    </header>
  )
}
