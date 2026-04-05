'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutGrid, 
  Users, 
  BookOpen, 
  Archive,
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  AlertTriangle,
  Check,
  X,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEngineStore } from '@/lib/store'
import type { TeamNote } from '@/lib/types'

const navItems = [
  { href: '/canvas', label: 'Canvas', icon: LayoutGrid },
  { href: '/cast', label: 'Cast', icon: Users },
  { href: '/chapters', label: 'Chapters', icon: BookOpen },
  { href: '/archive', label: 'Archive', icon: Archive },
]

export function Sidebar() {
  const pathname = usePathname()
  const { chapters, teamNotes, addNote, updateNote, deleteNote } = useEngineStore()
  const [chaptersOpen, setChaptersOpen] = useState(true)
  const [teamHubOpen, setTeamHubOpen] = useState(true)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteAuthor, setNewNoteAuthor] = useState<'Serkan' | 'Elvan'>('Serkan')
  const [newNotePriority, setNewNotePriority] = useState<'normal' | 'emergency' | 'elvan'>('normal')

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return
    
    const note: TeamNote = {
      id: `note-${Date.now()}`,
      author: newNoteAuthor,
      content: newNoteContent.trim(),
      status: 'todo',
      priority: newNotePriority,
      createdAt: Date.now()
    }
    
    addNote(note)
    setNewNoteContent('')
    setNewNotePriority('normal')
  }

  return (
    <aside className="w-64 border-r border-border bg-sidebar flex flex-col shrink-0">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/canvas' && pathname === '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Chapters List */}
          <Collapsible open={chaptersOpen} onOpenChange={setChaptersOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <span>Chapters</span>
              {chaptersOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/canvas?chapter=${chapter.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent rounded-md ml-2"
                >
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: chapter.color }}
                  />
                  {chapter.name}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Team Hub */}
          <Collapsible open={teamHubOpen} onOpenChange={setTeamHubOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Team Hub
              </span>
              {teamHubOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-3">
              {/* Add Note Form */}
              <div className="px-2 space-y-2">
                <Input
                  placeholder="Add a note..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  className="h-8 text-xs bg-secondary"
                />
                <div className="flex gap-2">
                  <Select 
                    value={newNoteAuthor} 
                    onValueChange={(v) => setNewNoteAuthor(v as 'Serkan' | 'Elvan')}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Serkan">Serkan</SelectItem>
                      <SelectItem value="Elvan">Elvan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={newNotePriority} 
                    onValueChange={(v) => setNewNotePriority(v as 'normal' | 'emergency' | 'elvan')}
                  >
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="elvan">Elvan</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7"
                    onClick={handleAddNote}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-2 px-2">
                {teamNotes
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .map((note) => (
                    <div
                      key={note.id}
                      className={cn(
                        'p-2 rounded-md border text-xs',
                        note.status === 'done' && 'opacity-50',
                        note.priority === 'emergency' && 'border-engine-emergency bg-engine-emergency/10',
                        note.priority === 'elvan' && 'border-primary bg-primary/10',
                        note.priority === 'normal' && 'border-border bg-secondary'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{note.author}</span>
                            {note.priority === 'emergency' && (
                              <Badge variant="destructive" className="h-4 text-[10px] px-1">
                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                Emergency
                              </Badge>
                            )}
                            {note.priority === 'elvan' && (
                              <Badge className="h-4 text-[10px] px-1 bg-primary text-primary-foreground">
                                Elvan
                              </Badge>
                            )}
                          </div>
                          <p className={cn(
                            'text-muted-foreground',
                            note.status === 'done' && 'line-through'
                          )}>
                            {note.content}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => updateNote(note.id, { 
                              status: note.status === 'done' ? 'todo' : 'done' 
                            })}
                          >
                            {note.status === 'done' ? (
                              <X className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 text-destructive"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </aside>
  )
}
