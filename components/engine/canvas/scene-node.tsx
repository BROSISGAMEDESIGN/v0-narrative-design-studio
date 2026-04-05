'use client'

import { memo, useRef, useState, useCallback } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { 
  Upload, Sparkles, Clock, X, Trash2, Check, Plus, 
  Volume2, Link, GripVertical, User, Music, Play, Pause
} from 'lucide-react'
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
import type { Scene, DialogueOption } from '@/lib/types'
import { createDialogueOption, DEFAULT_DIALOGUE_TREE } from '@/lib/types'

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

// Simple voice preview beep
function playVoicePreview(voiceProfile: string) {
  const ctx = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  
  // Different frequencies for different voice profiles
  const frequencies: Record<string, number> = {
    'male-deep': 120,
    'male-light': 180,
    'female-warm': 280,
    'female-clear': 350,
    'neutral': 220,
  }
  
  oscillator.frequency.value = frequencies[voiceProfile] || 220
  oscillator.type = 'sine'
  gainNode.gain.value = 0.3
  
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)
  
  oscillator.start()
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  oscillator.stop(ctx.currentTime + 0.3)
}

function SceneNodeComponent({ data, id }: NodeProps<SceneNodeData>) {
  const { scene } = data
  const { 
    updateScene, deleteScene, characters, chapters,
    updateDialogueTree, addDialogueOption, updateDialogueOption, deleteDialogueOption
  } = useEngineStore()
  const { setEdges, getEdges } = useReactFlow()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const musicInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [aiMood, setAiMood] = useState<string | null>(null)
  const [linkingOptionId, setLinkingOptionId] = useState<string | null>(null)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)

  // Ensure dialogueTree exists
  const dialogueTree = scene.dialogueTree || DEFAULT_DIALOGUE_TREE
  
  const questionCharacter = characters.find(c => c.id === dialogueTree.questionCharacterId)
  const chapter = chapters.find(c => c.id === scene.chapterId)

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const type = file.type.startsWith('video/') ? 'video' : 'image'
    
    // Convert to base64 for localStorage persistence
    const reader = new FileReader()
    reader.onload = () => {
      const base64Url = reader.result as string
      updateScene(scene.id, {
        media: { type, url: base64Url, name: file.name }
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveMedia = () => {
    updateScene(scene.id, {
      media: { type: null, url: null, name: null }
    })
  }

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Convert to base64 for localStorage persistence
    const reader = new FileReader()
    reader.onload = () => {
      const base64Url = reader.result as string
      updateScene(scene.id, {
        music: { url: base64Url, name: file.name }
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveMusic = () => {
    setIsMusicPlaying(false)
    updateScene(scene.id, {
      music: { url: null, name: null }
    })
  }

  const toggleMusicPlayback = () => {
    if (!audioRef.current || !scene.music?.url) return
    
    if (isMusicPlaying) {
      audioRef.current.pause()
      setIsMusicPlaying(false)
    } else {
      audioRef.current.play()
      setIsMusicPlaying(true)
    }
  }

  const handleApplySuggestion = (suggestion: string, target: 'question' | string) => {
    if (target === 'question') {
      updateDialogueTree(scene.id, { 
        questionText: dialogueTree.questionText ? `${dialogueTree.questionText}\n${suggestion}` : suggestion 
      })
    } else {
      // target is an option id
      const option = dialogueTree.answers.find(a => a.id === target)
      if (option) {
        updateDialogueOption(scene.id, target, {
          text: option.text ? `${option.text}\n${suggestion}` : suggestion
        })
      }
    }
    setAiMood(null)
  }

  const handleAddOption = () => {
    addDialogueOption(scene.id, createDialogueOption())
  }

  const handleLinkOption = useCallback((optionId: string) => {
    setLinkingOptionId(optionId)
    // Visual feedback - the user will click on another node
    // We'll listen for that in the parent canvas component
  }, [])

  const handlePlayVoice = (characterId: string | null) => {
    const char = characters.find(c => c.id === characterId)
    if (char) {
      playVoicePreview(char.voiceProfile)
    }
  }

  return (
    <div 
      className={cn(
        'w-96 bg-card rounded-lg border overflow-hidden shadow-lg transition-shadow hover:shadow-xl',
        scene.isCompleted && 'ring-2 ring-green-500/50',
        linkingOptionId && 'ring-2 ring-primary animate-pulse'
      )}
      style={{ 
        borderColor: chapter?.color || 'var(--border)',
        boxShadow: chapter ? `0 0 20px ${chapter.color}20` : undefined
      }}
    >
      {/* Main Input Handle (Left side) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !border-background !w-3 !h-3"
        style={{ top: '50%' }}
      />
      
      {/* Default Source Handle (Right side - for linear flow) */}
      <Handle
        type="source"
        position={Position.Right}
        id="default"
        className="!bg-primary !border-background !w-3 !h-3"
        style={{ top: 60 }}
      />
      
      {/* Dynamic handles for each answer option */}
      {dialogueTree.answers.map((option, index) => (
        <Handle
          key={option.id}
          type="source"
          position={Position.Right}
          id={option.id}
          className="!bg-cyan-500 !border-background !w-3 !h-3"
          style={{ 
            top: `calc(65% + ${index * 52}px)`,
          }}
        />
      ))}

      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b border-border"
        style={{ backgroundColor: chapter ? `${chapter.color}10` : undefined }}
      >
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={scene.title || 'Untitled Scene'}
            onChange={(e) => updateScene(scene.id, { title: e.target.value })}
            className="h-6 text-xs font-medium bg-transparent border-0 px-1"
            placeholder="Scene title..."
          />
        </div>
        <div className="flex items-center gap-1">
          <Select 
            value={scene.chapterId || 'none'} 
            onValueChange={(v) => updateScene(scene.id, { chapterId: v === 'none' ? null : v })}
          >
            <SelectTrigger className="h-6 text-xs w-24 border-0 bg-transparent">
              <SelectValue placeholder="Chapter" />
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

      {/* Music Layer */}
      <div className="px-3 py-2 border-b border-border bg-secondary/30">
        <input
          ref={musicInputRef}
          type="file"
          accept="audio/*"
          onChange={handleMusicUpload}
          className="hidden"
        />
        {scene.music?.url && (
          <audio 
            ref={audioRef} 
            src={scene.music.url} 
            onEnded={() => setIsMusicPlaying(false)}
          />
        )}
        
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-muted-foreground" />
          
          {scene.music?.url ? (
            <>
              <span className="flex-1 text-xs truncate">{scene.music.name}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={toggleMusicPlayback}
              >
                {isMusicPlaying ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                onClick={handleRemoveMusic}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <button
              onClick={() => musicInputRef.current?.click()}
              className="flex-1 text-xs text-muted-foreground hover:text-foreground text-left"
            >
              Add scene music...
            </button>
          )}
        </div>
      </div>

      {/* Dialogue Tree Section */}
      <div className="p-3 space-y-3">
        
        {/* Q - Root Question */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 rounded">Q</span>
            <Select 
              value={dialogueTree.questionCharacterId || 'none'} 
              onValueChange={(v) => updateDialogueTree(scene.id, { 
                questionCharacterId: v === 'none' ? null : v 
              })}
            >
              <SelectTrigger className="flex-1 h-7 text-xs">
                <SelectValue placeholder="Select speaker">
                  {questionCharacter && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ 
                          backgroundColor: questionCharacter.dialogueColor,
                          color: '#000'
                        }}
                      >
                        {questionCharacter.name.charAt(0)}
                      </div>
                      {questionCharacter.name}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Narrator</SelectItem>
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

            {/* Voice Preview */}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => handlePlayVoice(dialogueTree.questionCharacterId)}
              disabled={!dialogueTree.questionCharacterId}
            >
              <Volume2 className="h-3 w-3" />
            </Button>

            {/* AI Assistant */}
            <Popover open={aiMood === 'question'} onOpenChange={(open) => !open && setAiMood(null)}>
              <PopoverTrigger asChild>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-7 w-7"
                  onClick={() => setAiMood('question')}
                >
                  <Sparkles className="h-3 w-3" />
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
                        onClick={() => handleApplySuggestion(suggestion, 'question')}
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
          
          <Textarea
            value={dialogueTree.questionText}
            onChange={(e) => updateDialogueTree(scene.id, { questionText: e.target.value })}
            placeholder="Enter the main dialogue or narration..."
            className="min-h-16 text-sm resize-none"
            style={{ 
              borderColor: questionCharacter?.dialogueColor ? `${questionCharacter.dialogueColor}50` : undefined 
            }}
          />
        </div>

        {/* A - Answer Options */}
        {dialogueTree.answers.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Branching Options</span>
            {dialogueTree.answers.map((option, index) => {
              const optionCharacter = characters.find(c => c.id === option.characterId)
              return (
                <div 
                  key={option.id} 
                  className="space-y-1.5 p-2 rounded-md bg-secondary/50 border border-border"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-400/20 px-2 py-0.5 rounded">
                      A{index + 1}
                    </span>
                    <Select 
                      value={option.characterId || 'none'} 
                      onValueChange={(v) => updateDialogueOption(scene.id, option.id, { 
                        characterId: v === 'none' ? null : v 
                      })}
                    >
                      <SelectTrigger className="flex-1 h-6 text-xs">
                        <SelectValue placeholder="Speaker">
                          {optionCharacter && (
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: optionCharacter.dialogueColor }}
                              />
                              {optionCharacter.name}
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Player Choice</SelectItem>
                        {characters.map((char) => (
                          <SelectItem key={char.id} value={char.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: char.dialogueColor }}
                              />
                              {char.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Voice Preview */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handlePlayVoice(option.characterId)}
                      disabled={!option.characterId}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>

                    {/* Link Edge Button */}
                    <Button
                      size="icon"
                      variant={option.targetSceneId ? 'default' : 'outline'}
                      className={cn(
                        'h-6 w-6',
                        option.targetSceneId && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => handleLinkOption(option.id)}
                      title="Link to another scene"
                    >
                      <Link className="h-3 w-3" />
                    </Button>

                    {/* Delete Option */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive"
                      onClick={() => deleteDialogueOption(scene.id, option.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  <Input
                    value={option.text}
                    onChange={(e) => updateDialogueOption(scene.id, option.id, { text: e.target.value })}
                    placeholder="Enter option text..."
                    className="h-7 text-xs"
                    style={{ 
                      borderColor: optionCharacter?.dialogueColor ? `${optionCharacter.dialogueColor}50` : undefined 
                    }}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Add Option Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={handleAddOption}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Option
        </Button>

        {/* Duration */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
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
