'use client'

import { useState, useEffect } from 'react'
import { Save, Play, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEngineStore } from '@/lib/store'

interface HeaderProps {
  onPlay: () => void
}

export function Header({ onPlay }: HeaderProps) {
  const { projectName, setProjectName, save, lastSaved, scenes } = useEngineStore()
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
