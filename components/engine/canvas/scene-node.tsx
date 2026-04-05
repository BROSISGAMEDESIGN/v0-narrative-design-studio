'use client'

import { memo, useRef, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Upload, Sparkles, Clock, User, X, Trash2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useEngineStore } from '@/lib/store'
import type { Scene } from '@/lib/types'

interface SceneNodeData {
  scene: Scene
}

const AI_SUGGESTIONS = [
  { mood: 'Tense', suggestions: [
    'The silence stretched between them like a wire about to snap.',
    'Every shadow seemed to hold a threat waiting to strike.',
    'Time was running out, and they both knew it.'
  ]},
  { mood: 'Dramatic', suggestions: [
    'This changes everything we thought we knew.',
    'After all this time, the truth finally revealed itself.',
    'There was no going back from this moment.'
  ]},
  { mood: 'Action', suggestions: [
    'Move! We have less than thirty seconds!',
    'The explosion rocked the building to its foundation.',
    'They had one chance, and this was it.'
  ]},
]

function SceneNodeComponent({ data, id }: NodeProps<SceneNodeData>) {
  const { scene } = data
  const { updateScene, deleteScene, characters, chapters } = useEngineStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [aiMood, setAiMood] = useState<string | null>(null)

  const character = characters.find(c => c.id === scene.characterId)
  const chapter = chapters.find(c => c.id === scene.chapterId)

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    
    updateScene(scene.id, {
      media: { type, url, name: file.name }
    })
  }

  const handleRemoveMedia = () => {
    if (scene.media.url) {
      URL.revokeObjectURL(scene.media.url)
    }
    updateScene(scene.id, {
      media: { type: null, url: null, name: null }
    })
  }

  const handleApplySuggestion = (suggestion: string) => {
    updateScene(scene.id, {
      dialogue: scene.dialogue ? `${scene.dialogue}\n${suggestion}` : suggestion
    })
    setAiMood(null)
  }

  return (
    <div 
      className={cn(
        'w-80 bg-card rounded-lg border overflow-hidden shadow-lg transition-shadow hover:shadow-xl',
        scene.isCompleted && 'ring-2 ring-green-500/50'
      )}
      style={{ 
        borderColor: chapter?.color || 'var(--border)',
        boxShadow: chapter ? `0 0 20px ${chapter.color}20` : undefined
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary !border-background"
      />

      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b border-border"
        style={{ backgroundColor: chapter ? `${chapter.color}10` : undefined }}
      >
        <div className="flex items-center gap-2">
          <Select 
            value={scene.chapterId || 'none'} 
            onValueChange={(v) => updateScene(scene.id, { chapterId: v === 'none' ? null : v })}
          >
            <SelectTrigger className="h-6 text-xs w-28 border-0 bg-transparent">
              <SelectValue placeholder="No chapter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No chapter</SelectItem>
              {chapters.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: ch.color }}
                    />
                    {ch.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              'h-6 w-6',
              scene.isCompleted && 'text-green-500'
            )}
            onClick={() => updateScene(scene.id, { isCompleted: !scene.isCompleted })}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive"
            onClick={() => deleteScene(scene.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Media Slot - 16:9 aspect ratio */}
      <div className="aspect-video bg-secondary relative group">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaUpload}
          className="hidden"
        />
        
        {scene.media.url ? (
          <>
            {scene.media.type === 'video' ? (
              <video
                src={scene.media.url}
                className="w-full h-full object-cover"
                muted
                loop
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause()
                  e.currentTarget.currentTime = 0
                }}
              />
            ) : (
              <img
                src={scene.media.url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveMedia}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Upload className="h-8 w-8" />
            <span className="text-xs">Upload image or video</span>
          </button>
        )}
      </div>

      {/* Dialogue Section */}
      <div className="p-3 space-y-3">
        {/* Character selector with avatar */}
        <div className="flex items-center gap-2">
          <Select 
            value={scene.characterId || 'none'} 
            onValueChange={(v) => updateScene(scene.id, { characterId: v === 'none' ? null : v })}
          >
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Select character">
                {character && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ 
                        backgroundColor: character.dialogueColor,
                        color: '#000'
                      }}
                    >
                      {character.name.charAt(0)}
                    </div>
                    {character.name}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No character</SelectItem>
              {characters.map((char) => (
                <SelectItem key={char.id} value={char.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ 
                        backgroundColor: char.dialogueColor,
                        color: '#000'
                      }}
                    >
                      {char.name.charAt(0)}
                    </div>
                    {char.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* AI Assistant */}
          <Popover open={!!aiMood} onOpenChange={(open) => !open && setAiMood(null)}>
            <PopoverTrigger asChild>
              <Button 
                size="icon" 
                variant="outline" 
                className="h-8 w-8"
                onClick={() => setAiMood('Tense')}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-3">
                <div className="flex gap-1">
                  {AI_SUGGESTIONS.map(({ mood }) => (
                    <Button
                      key={mood}
                      size="sm"
                      variant={aiMood === mood ? 'default' : 'outline'}
                      className="text-xs flex-1"
                      onClick={() => setAiMood(mood)}
                    >
                      {mood}
                    </Button>
                  ))}
                </div>
                <div className="space-y-2">
                  {AI_SUGGESTIONS.find(s => s.mood === aiMood)?.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="w-full text-left text-xs p-2 rounded-md bg-secondary hover:bg-muted transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Dialogue textarea */}
        <Textarea
          value={scene.dialogue}
          onChange={(e) => updateScene(scene.id, { dialogue: e.target.value })}
          placeholder="Enter dialogue or narration..."
          className="min-h-20 text-sm resize-none"
          style={{ 
            borderColor: character?.dialogueColor ? `${character.dialogueColor}50` : undefined 
          }}
        />

        {/* Duration */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            min={1}
            value={scene.duration}
            onChange={(e) => updateScene(scene.id, { duration: parseInt(e.target.value) || 5 })}
            className="h-7 w-20 text-xs"
          />
          <span className="text-xs text-muted-foreground">seconds</span>
        </div>
      </div>
    </div>
  )
}

export const SceneNode = memo(SceneNodeComponent)
