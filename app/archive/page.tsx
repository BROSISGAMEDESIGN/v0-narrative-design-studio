'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Clock, 
  User, 
  Film,
  Check,
  X,
  Calendar,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEngineStore } from '@/lib/store'
import { cn } from '@/lib/utils'

type SortField = 'createdAt' | 'duration' | 'position'
type SortOrder = 'asc' | 'desc'

export default function ArchivePage() {
  const router = useRouter()
  const { scenes, chapters, characters } = useEngineStore()
  const [search, setSearch] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState<string | 'all'>('all')
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | 'all'>('all')
  const [showCompleted, setShowCompleted] = useState(true)
  const [showIncomplete, setShowIncomplete] = useState(true)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Filter and sort scenes
  const filteredScenes = useMemo(() => {
    let result = [...scenes]

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(scene => {
        const character = characters.find(c => c.id === scene.characterId)
        const chapter = chapters.find(c => c.id === scene.chapterId)
        return (
          scene.dialogue.toLowerCase().includes(searchLower) ||
          character?.name.toLowerCase().includes(searchLower) ||
          chapter?.name.toLowerCase().includes(searchLower)
        )
      })
    }

    // Chapter filter
    if (selectedChapterId !== 'all') {
      result = result.filter(scene => scene.chapterId === selectedChapterId)
    }

    // Character filter
    if (selectedCharacterId !== 'all') {
      result = result.filter(scene => scene.characterId === selectedCharacterId)
    }

    // Completion filter
    if (!showCompleted) {
      result = result.filter(scene => !scene.isCompleted)
    }
    if (!showIncomplete) {
      result = result.filter(scene => scene.isCompleted)
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'createdAt':
          comparison = a.createdAt - b.createdAt
          break
        case 'duration':
          comparison = a.duration - b.duration
          break
        case 'position':
          comparison = a.position.x - b.position.x
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [scenes, chapters, characters, search, selectedChapterId, selectedCharacterId, showCompleted, showIncomplete, sortField, sortOrder])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scene Archive</h1>
            <p className="text-muted-foreground">
              Browse and search all scenes in your project
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {filteredScenes.length} scenes
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dialogue, characters, chapters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Chapter filter */}
          <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
            <SelectTrigger className="w-40">
              <Film className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All chapters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All chapters</SelectItem>
              {chapters.map(chapter => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: chapter.color }}
                    />
                    {chapter.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Character filter */}
          <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
            <SelectTrigger className="w-40">
              <User className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All characters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All characters</SelectItem>
              {characters.map(character => (
                <SelectItem key={character.id} value={character.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: character.dialogueColor }}
                    />
                    {character.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* More filters dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={showCompleted}
                onCheckedChange={setShowCompleted}
              >
                <Check className="h-3 w-3 mr-2 text-green-500" />
                Completed
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showIncomplete}
                onCheckedChange={setShowIncomplete}
              >
                <X className="h-3 w-3 mr-2 text-muted-foreground" />
                Incomplete
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={sortField === 'createdAt'}
                onCheckedChange={() => toggleSort('createdAt')}
              >
                <Calendar className="h-3 w-3 mr-2" />
                Date Created
                {sortField === 'createdAt' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-auto" /> : <SortDesc className="h-3 w-3 ml-auto" />
                )}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortField === 'duration'}
                onCheckedChange={() => toggleSort('duration')}
              >
                <Clock className="h-3 w-3 mr-2" />
                Duration
                {sortField === 'duration' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-auto" /> : <SortDesc className="h-3 w-3 ml-auto" />
                )}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortField === 'position'}
                onCheckedChange={() => toggleSort('position')}
              >
                <Film className="h-3 w-3 mr-2" />
                Canvas Order
                {sortField === 'position' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-auto" /> : <SortDesc className="h-3 w-3 ml-auto" />
                )}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Scenes list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredScenes.map((scene, index) => {
              const character = characters.find(c => c.id === scene.characterId)
              const chapter = chapters.find(c => c.id === scene.chapterId)

              return (
                <motion.div
                  key={scene.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card 
                    className={cn(
                      'overflow-hidden cursor-pointer hover:border-primary/50 transition-colors',
                      scene.isCompleted && 'opacity-70'
                    )}
                    onClick={() => router.push(`/canvas?scene=${scene.id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Media thumbnail */}
                        <div className="w-32 h-20 bg-secondary shrink-0">
                          {scene.media.url && (
                            scene.media.type === 'video' ? (
                              <video
                                src={scene.media.url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={scene.media.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {chapter && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{ 
                                    borderColor: chapter.color,
                                    color: chapter.color
                                  }}
                                >
                                  {chapter.name}
                                </Badge>
                              )}
                              {character && (
                                <Badge 
                                  variant="secondary"
                                  className="text-xs"
                                  style={{ 
                                    backgroundColor: `${character.dialogueColor}20`,
                                    color: character.dialogueColor
                                  }}
                                >
                                  {character.name}
                                </Badge>
                              )}
                              {scene.isCompleted && (
                                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                                  <Check className="h-2.5 w-2.5 mr-1" />
                                  Done
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(scene.duration)}</span>
                            </div>
                          </div>

                          {scene.dialogue ? (
                            <p className="text-sm text-foreground line-clamp-2">
                              {scene.dialogue}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No dialogue
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground">
                            Created {formatDate(scene.createdAt)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Empty state */}
          {filteredScenes.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">
                  {scenes.length === 0 ? 'No scenes yet' : 'No scenes match your filters'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {scenes.length === 0 
                    ? 'Create scenes in the Canvas to see them here'
                    : 'Try adjusting your search or filters'
                  }
                </p>
                {scenes.length > 0 && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearch('')
                      setSelectedChapterId('all')
                      setSelectedCharacterId('all')
                      setShowCompleted(true)
                      setShowIncomplete(true)
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ScrollArea>
  )
}
