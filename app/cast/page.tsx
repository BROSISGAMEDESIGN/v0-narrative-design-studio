'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Upload, 
  Trash2, 
  Volume2, 
  X,
  Edit2,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEngineStore } from '@/lib/store'
import { VOICE_PROFILES, CHARACTER_COLORS, type Character } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function CastPage() {
  const { characters, addCharacter, updateCharacter, deleteCharacter, scenes } = useEngineStore()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newCharacter, setNewCharacter] = useState<Partial<Character>>({
    name: '',
    bio: '',
    avatar: null,
    voiceProfile: 'male-deep',
    dialogueColor: CHARACTER_COLORS[0],
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const handleCreate = () => {
    if (!newCharacter.name?.trim()) return

    const character: Character = {
      id: `char-${Date.now()}`,
      name: newCharacter.name.trim(),
      bio: newCharacter.bio || '',
      avatar: newCharacter.avatar || null,
      voiceProfile: newCharacter.voiceProfile || 'male-deep',
      dialogueColor: newCharacter.dialogueColor || CHARACTER_COLORS[0],
      createdAt: Date.now(),
    }

    addCharacter(character)
    setNewCharacter({
      name: '',
      bio: '',
      avatar: null,
      voiceProfile: 'male-deep',
      dialogueColor: CHARACTER_COLORS[0],
    })
    setIsCreating(false)
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    
    if (isEdit && editingId) {
      updateCharacter(editingId, { avatar: url })
    } else {
      setNewCharacter(prev => ({ ...prev, avatar: url }))
    }
  }

  const getSceneCount = (characterId: string) => {
    return scenes.filter(s => s.characterId === characterId).length
  }

  const playVoicePreview = (voiceProfile: string) => {
    // Mock voice preview - in production this would use a TTS API
    const utterance = new SpeechSynthesisUtterance('Hello, this is a voice preview.')
    const voices = speechSynthesis.getVoices()
    
    // Try to match voice profile to available voices
    const voiceMap: Record<string, string> = {
      'male-deep': 'Daniel',
      'male-light': 'Alex',
      'female-warm': 'Samantha',
      'female-clear': 'Victoria',
      'neutral': 'Google US English',
    }
    
    const preferredVoice = voices.find(v => v.name.includes(voiceMap[voiceProfile] || ''))
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    speechSynthesis.speak(utterance)
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Character Cast</h1>
            <p className="text-muted-foreground">
              Create and manage your story&apos;s characters
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Character
          </Button>
        </div>

        {/* Characters Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {characters.map((character) => (
              <motion.div
                key={character.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="overflow-hidden group">
                  <CardContent className="p-0">
                    {/* Avatar */}
                    <div 
                      className="aspect-square relative"
                      style={{ backgroundColor: `${character.dialogueColor}20` }}
                    >
                      {character.avatar ? (
                        <img
                          src={character.avatar}
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span 
                            className="text-6xl font-bold"
                            style={{ color: character.dialogueColor }}
                          >
                            {character.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => setEditingId(character.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => deleteCharacter(character.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{character.name}</h3>
                        <div 
                          className="h-4 w-4 rounded-full border-2 border-background"
                          style={{ backgroundColor: character.dialogueColor }}
                        />
                      </div>
                      {character.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {character.bio}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {VOICE_PROFILES.find(v => v.value === character.voiceProfile)?.label}
                        </span>
                        <span>{getSceneCount(character.id)} scenes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {characters.length === 0 && (
            <Card className="col-span-full border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No characters yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first character to get started
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  Create Character
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Character</DialogTitle>
              <DialogDescription>
                Add a new character to your cast
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Avatar upload */}
              <div className="flex justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAvatarUpload(e)}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors"
                  style={{ backgroundColor: `${newCharacter.dialogueColor}20` }}
                >
                  {newCharacter.avatar ? (
                    <>
                      <img
                        src={newCharacter.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Upload className="h-6 w-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Avatar</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Name */}
              <Input
                placeholder="Character name"
                value={newCharacter.name || ''}
                onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
              />

              {/* Bio */}
              <Textarea
                placeholder="Character bio (optional)"
                value={newCharacter.bio || ''}
                onChange={(e) => setNewCharacter(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />

              {/* Voice Profile */}
              <div className="flex gap-2">
                <Select
                  value={newCharacter.voiceProfile}
                  onValueChange={(v) => setNewCharacter(prev => ({ 
                    ...prev, 
                    voiceProfile: v as Character['voiceProfile'] 
                  }))}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Voice profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_PROFILES.map((profile) => (
                      <SelectItem key={profile.value} value={profile.value}>
                        {profile.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => playVoicePreview(newCharacter.voiceProfile || 'male-deep')}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Dialogue Color */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Dialogue Color</label>
                <div className="flex gap-2 flex-wrap">
                  {CHARACTER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewCharacter(prev => ({ ...prev, dialogueColor: color }))}
                      className={cn(
                        'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                        newCharacter.dialogueColor === color 
                          ? 'border-white scale-110' 
                          : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newCharacter.name?.trim()}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Character</DialogTitle>
              <DialogDescription>
                Update character details
              </DialogDescription>
            </DialogHeader>

            {editingId && (() => {
              const character = characters.find(c => c.id === editingId)
              if (!character) return null

              return (
                <div className="space-y-4">
                  {/* Avatar upload */}
                  <div className="flex justify-center">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarUpload(e, true)}
                      className="hidden"
                    />
                    <button
                      onClick={() => editFileInputRef.current?.click()}
                      className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-border hover:border-primary transition-colors"
                      style={{ backgroundColor: `${character.dialogueColor}20` }}
                    >
                      {character.avatar ? (
                        <>
                          <img
                            src={character.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Upload className="h-6 w-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <span 
                            className="text-3xl font-bold"
                            style={{ color: character.dialogueColor }}
                          >
                            {character.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Name */}
                  <Input
                    placeholder="Character name"
                    value={character.name}
                    onChange={(e) => updateCharacter(editingId, { name: e.target.value })}
                  />

                  {/* Bio */}
                  <Textarea
                    placeholder="Character bio (optional)"
                    value={character.bio}
                    onChange={(e) => updateCharacter(editingId, { bio: e.target.value })}
                    rows={3}
                  />

                  {/* Voice Profile */}
                  <div className="flex gap-2">
                    <Select
                      value={character.voiceProfile}
                      onValueChange={(v) => updateCharacter(editingId, { 
                        voiceProfile: v as Character['voiceProfile'] 
                      })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Voice profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICE_PROFILES.map((profile) => (
                          <SelectItem key={profile.value} value={profile.value}>
                            {profile.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => playVoicePreview(character.voiceProfile)}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Dialogue Color */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dialogue Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {CHARACTER_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateCharacter(editingId, { dialogueColor: color })}
                          className={cn(
                            'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                            character.dialogueColor === color 
                              ? 'border-white scale-110' 
                              : 'border-transparent'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end">
                    <Button onClick={() => setEditingId(null)}>
                      <Check className="h-4 w-4 mr-2" />
                      Done
                    </Button>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}
