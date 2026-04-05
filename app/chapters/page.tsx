'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Clock, 
  Film,
  Check,
  GripVertical,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useEngineStore } from '@/lib/store'
import { CHARACTER_COLORS, type Chapter } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function ChaptersPage() {
  const router = useRouter()
  const { chapters, scenes, addChapter, updateChapter, deleteChapter } = useEngineStore()
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newChapter, setNewChapter] = useState({
    name: '',
    color: CHARACTER_COLORS[0],
  })

  const handleCreate = () => {
    if (!newChapter.name.trim()) return

    const chapter: Chapter = {
      id: `chapter-${Date.now()}`,
      name: newChapter.name.trim(),
      color: newChapter.color,
      order: chapters.length,
      createdAt: Date.now(),
    }

    addChapter(chapter)
    setNewChapter({ name: '', color: CHARACTER_COLORS[0] })
    setIsCreating(false)
  }

  const getChapterStats = (chapterId: string) => {
    const chapterScenes = scenes.filter(s => s.chapterId === chapterId)
    const totalDuration = chapterScenes.reduce((sum, s) => sum + s.duration, 0)
    const completedScenes = chapterScenes.filter(s => s.isCompleted).length
    const progress = chapterScenes.length > 0 
      ? (completedScenes / chapterScenes.length) * 100 
      : 0

    return {
      sceneCount: chapterScenes.length,
      totalDuration,
      completedScenes,
      progress,
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const navigateToChapter = (chapterId: string) => {
    router.push(`/canvas?chapter=${chapterId}`)
  }

  // Sort chapters by order
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Chapters</h1>
            <p className="text-muted-foreground">
              Organize your narrative into chapters
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Chapter
          </Button>
        </div>

        {/* Overall Progress */}
        {chapters.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Progress 
                  value={
                    scenes.length > 0 
                      ? (scenes.filter(s => s.isCompleted).length / scenes.length) * 100 
                      : 0
                  } 
                  className="flex-1" 
                />
                <span className="text-sm font-medium">
                  {scenes.filter(s => s.isCompleted).length}/{scenes.length} scenes
                </span>
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  <span>{chapters.length} chapters</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDuration(scenes.reduce((sum, s) => sum + s.duration, 0))} total
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chapters Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {sortedChapters.map((chapter, index) => {
              const stats = getChapterStats(chapter.id)
              
              return (
                <motion.div
                  key={chapter.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
                    onClick={() => navigateToChapter(chapter.id)}
                  >
                    {/* Color bar */}
                    <div 
                      className="h-2"
                      style={{ backgroundColor: chapter.color }}
                    />
                    
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                          <div>
                            <h3 className="font-semibold">{chapter.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              Chapter {index + 1}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingId(chapter.id)
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteChapter(chapter.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {stats.completedScenes}/{stats.sceneCount} scenes
                          </span>
                        </div>
                        <Progress value={stats.progress} className="h-1.5" />
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Film className="h-3 w-3" />
                          <span>{stats.sceneCount} scenes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(stats.totalDuration)}</span>
                        </div>
                      </div>

                      {/* Go to canvas link */}
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">View in Canvas</span>
                          <ArrowRight className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Empty state */}
          {chapters.length === 0 && (
            <Card className="col-span-full border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No chapters yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create chapters to organize your scenes
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  Create Chapter
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Chapter</DialogTitle>
              <DialogDescription>
                Add a new chapter to organize your scenes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Input
                placeholder="Chapter name"
                value={newChapter.name}
                onChange={(e) => setNewChapter(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Chapter Color</label>
                <div className="flex gap-2 flex-wrap">
                  {CHARACTER_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewChapter(prev => ({ ...prev, color }))}
                      className={cn(
                        'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                        newChapter.color === color 
                          ? 'border-white scale-110' 
                          : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newChapter.name.trim()}>
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
              <DialogTitle>Edit Chapter</DialogTitle>
              <DialogDescription>
                Update chapter details
              </DialogDescription>
            </DialogHeader>

            {editingId && (() => {
              const chapter = chapters.find(c => c.id === editingId)
              if (!chapter) return null

              return (
                <div className="space-y-4">
                  <Input
                    placeholder="Chapter name"
                    value={chapter.name}
                    onChange={(e) => updateChapter(editingId, { name: e.target.value })}
                  />

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chapter Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {CHARACTER_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => updateChapter(editingId, { color })}
                          className={cn(
                            'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                            chapter.color === color 
                              ? 'border-white scale-110' 
                              : 'border-transparent'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

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
