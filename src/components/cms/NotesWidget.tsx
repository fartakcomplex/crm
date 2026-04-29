'use client'

import { useState, useCallback, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  StickyNote,
  Plus,
  Trash2,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  Palette,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────

interface Note {
  id: string
  title: string
  content: string
  color: NoteColor
  pinned: boolean
  createdAt: string
}

type NoteColor = 'yellow' | 'blue' | 'green' | 'pink'

const STORAGE_KEY = 'cms-quick-notes'

const COLOR_MAP: Record<NoteColor, { border: string; bg: string; dot: string; label: string }> = {
  yellow: {
    border: 'border-r-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    dot: 'bg-amber-400',
    label: 'زرد',
  },
  blue: {
    border: 'border-r-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    dot: 'bg-blue-400',
    label: 'آبی',
  },
  green: {
    border: 'border-r-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    dot: 'bg-emerald-400',
    label: 'سبز',
  },
  pink: {
    border: 'border-r-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    dot: 'bg-pink-400',
    label: 'صورتی',
  },
}

const COLOR_OPTIONS: NoteColor[] = ['yellow', 'blue', 'green', 'pink']

// ─── External Store (hydration-safe) ──────────────────────────────────

let noteStoreListeners: Array<() => void> = []
let noteStoreCache: Note[] | null = null

function getNoteSnapshot(): Note[] {
  if (noteStoreCache !== null) return noteStoreCache
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    noteStoreCache = raw ? JSON.parse(raw) : []
  } catch {
    noteStoreCache = []
  }
  return noteStoreCache
}

function getNoteServerSnapshot(): Note[] {
  return []
}

function subscribeToNotes(callback: () => void): () => void {
  noteStoreListeners.push(callback)
  return () => {
    noteStoreListeners = noteStoreListeners.filter(l => l !== callback)
  }
}

function emitNoteChange(): void {
  noteStoreCache = null // invalidate cache
  for (const listener of noteStoreListeners) {
    listener()
  }
}

function persistNotes(notes: Note[]): void {
  noteStoreCache = notes
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function generateId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} روز پیش`
  if (hours > 0) return `${hours} ساعت پیش`
  if (minutes > 0) return `${minutes} دقیقه پیش`
  return 'همین الان'
}

// ─── Component ───────────────────────────────────────────────────────────

export function NotesWidget() {
  const notes = useSyncExternalStore(subscribeToNotes, getNoteSnapshot, getNoteServerSnapshot)
  const [collapsed, setCollapsed] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedColor, setSelectedColor] = useState<NoteColor>('yellow')

  const handleAddNote = useCallback(() => {
    if (!title.trim() && !content.trim()) return
    const current = getNoteSnapshot()
    if (current.length >= 20) return

    const newNote: Note = {
      id: generateId(),
      title: title.trim(),
      content: content.trim(),
      color: selectedColor,
      pinned: false,
      createdAt: new Date().toISOString(),
    }

    persistNotes([newNote, ...current].slice(0, 20))
    emitNoteChange()
    setTitle('')
    setContent('')
    setSelectedColor('yellow')
    setDialogOpen(false)
  }, [title, content, selectedColor])

  const handleDelete = useCallback((id: string) => {
    const updated = getNoteSnapshot().filter((n) => n.id !== id)
    persistNotes(updated)
    emitNoteChange()
  }, [])

  const handleTogglePin = useCallback((id: string) => {
    const updated = getNoteSnapshot().map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned } : n,
    )
    persistNotes(updated)
    emitNoteChange()
  }, [])

  // Sort: pinned first, then by createdAt desc
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="glass-card glass-card-amber rounded-xl overflow-hidden animate-in" dir="rtl">
      {/* ─── Header ─── */}
      <div
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-amber-500/5 transition-colors"
        onClick={() => setCollapsed((p) => !p)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCollapsed((p) => !p) }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <StickyNote className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-amber-700 dark:text-amber-300">
              یادداشت‌ها
            </span>
            <Badge
              variant="secondary"
              className="h-5 min-w-[20px] px-1.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0"
            >
              {notes.length}/۲۰
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-amber-500/10"
            onClick={(e) => {
              e.stopPropagation()
              if (notes.length < 20) {
                setDialogOpen(true)
              }
            }}
            disabled={notes.length >= 20}
          >
            <Plus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </Button>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* ─── Notes List ─── */}
      {!collapsed && (
        <div className="border-t border-amber-200/30 dark:border-amber-800/20">
          {sortedNotes.length === 0 ? (
            <div className="py-8 text-center">
              <StickyNote className="h-10 w-10 mx-auto mb-2 text-amber-300 dark:text-amber-700" />
              <p className="text-sm text-muted-foreground">یادداشتی وجود ندارد</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                اولین یادداشت خود را بسازید
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-72">
              <div className="p-3 space-y-2 stagger-children">
                {sortedNotes.map((note, index) => {
                  const colorStyle = COLOR_MAP[note.color]
                  return (
                    <div
                      key={note.id}
                      className={`rounded-lg border-r-4 ${colorStyle.border} ${colorStyle.bg} p-3 hover-lift card-press group animate-in`}
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {note.title && (
                            <h4 className="text-sm font-medium truncate">
                              {note.title}
                            </h4>
                          )}
                          {note.content && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                              {note.content}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${colorStyle.dot}`}
                            />
                            <span className="text-[10px] text-muted-foreground/70">
                              {formatRelativeDate(note.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/60 dark:hover:bg-black/20 transition-colors cursor-pointer"
                            onClick={() => handleTogglePin(note.id)}
                            title={note.pinned ? 'حذف سنجاق' : 'سنجاق کردن'}
                          >
                            {note.pinned ? (
                              <PinOff className="h-3.5 w-3.5 text-amber-500" />
                            ) : (
                              <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </button>
                          <button
                            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                            onClick={() => handleDelete(note.id)}
                            title="حذف"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* ─── Add Note Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px] glass-card" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <StickyNote className="h-5 w-5" />
              یادداشت جدید
            </DialogTitle>
            <DialogDescription>
              یک یادداشت سریع ایجاد کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-2">
              <label
                htmlFor="note-title"
                className="text-sm font-medium"
              >
                عنوان
              </label>
              <Input
                id="note-title"
                placeholder="عنوان یادداشت..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50"
                maxLength={100}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label
                htmlFor="note-content"
                className="text-sm font-medium"
              >
                متن
              </label>
              <Textarea
                id="note-content"
                placeholder="متن یادداشت را بنویسید..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="bg-background/50 resize-none"
                maxLength={500}
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                رنگ
              </label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((c) => {
                  const style = COLOR_MAP[c]
                  return (
                    <button
                      key={c}
                      className={`w-8 h-8 rounded-full ${style.dot} transition-all cursor-pointer ${
                        selectedColor === c
                          ? 'ring-2 ring-offset-2 ring-offset-background ring-amber-500 scale-110'
                          : 'hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setSelectedColor(c)}
                      title={style.label}
                    />
                  )
                })}
                <span className="text-xs text-muted-foreground mr-1">
                  {COLOR_MAP[selectedColor].label}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="hover:bg-accent/60"
            >
              انصراف
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={!title.trim() && !content.trim()}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              افزودن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default NotesWidget
