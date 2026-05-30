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
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  StickyNote,
  Plus,
  Trash2,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  Palette,
  GripVertical,
  Clock,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────────

interface Note {
  id: string
  title: string
  content: string
  color: NoteColor
  pinned: boolean
  createdAt: string
  order: number
}

type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange'

const STORAGE_KEY = 'cms-quick-notes'

const COLOR_MAP: Record<NoteColor, { border: string; bg: string; dot: string; label: string; ring: string }> = {
  yellow: {
    border: 'border-r-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    dot: 'bg-amber-400',
    label: 'زرد',
    ring: 'ring-amber-400',
  },
  blue: {
    border: 'border-r-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    dot: 'bg-blue-400',
    label: 'آبی',
    ring: 'ring-blue-400',
  },
  green: {
    border: 'border-r-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    dot: 'bg-emerald-400',
    label: 'سبز',
    ring: 'ring-emerald-400',
  },
  pink: {
    border: 'border-r-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    dot: 'bg-pink-400',
    label: 'صورتی',
    ring: 'ring-pink-400',
  },
  purple: {
    border: 'border-r-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    dot: 'bg-violet-400',
    label: 'بنفش',
    ring: 'ring-violet-400',
  },
  orange: {
    border: 'border-r-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    dot: 'bg-orange-400',
    label: 'نارنجی',
    ring: 'ring-orange-400',
  },
}

const COLOR_OPTIONS: NoteColor[] = ['yellow', 'blue', 'green', 'pink', 'purple', 'orange']

// ─── External Store (hydration-safe) ──────────────────────────────────────────

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

// ─── Sortable Note Card ────────────────────────────────────────────────────────

function SortableNoteCard({
  note,
  index,
  onTogglePin,
  onDelete,
  onChangeColor,
}: {
  note: Note
  index: number
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
  onChangeColor: (id: string, color: NoteColor) => void
}) {
  const colorStyle = COLOR_MAP[note.color]

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border-r-4 ${colorStyle.border} ${colorStyle.bg} p-3 hover-lift card-press group animate-in relative`}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div className="absolute -top-1 -left-1">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Pin className="h-2.5 w-2.5 text-white" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-1.5">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="drag-handle flex items-center justify-center h-7 w-5 shrink-0 mt-0.5 touch-none"
          aria-label="جابجایی یادداشت"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
        </div>

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
            <Clock className="h-2.5 w-2.5 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/70">
              {formatRelativeDate(note.createdAt)}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${colorStyle.dot}`} />
            <span className="text-[10px] text-muted-foreground/50">{colorStyle.label}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Color picker (inline mini) */}
          <div className="relative">
            <button
              className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/60 dark:hover:bg-black/20 transition-colors cursor-pointer"
              onClick={() => {
                const currentIdx = COLOR_OPTIONS.indexOf(note.color)
                const nextColor = COLOR_OPTIONS[(currentIdx + 1) % COLOR_OPTIONS.length]
                onChangeColor(note.id, nextColor)
              }}
              title="تغییر رنگ"
            >
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          <button
            className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/60 dark:hover:bg-black/20 transition-colors cursor-pointer"
            onClick={() => onTogglePin(note.id)}
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
            onClick={() => onDelete(note.id)}
            title="حذف"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

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

function formatCreationDate(dateStr: string): string {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('fa-IR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// ─── Component ───────────────────────────────────────────────────────────────────

export function NotesWidget() {
  const notes = useSyncExternalStore(subscribeToNotes, getNoteSnapshot, getNoteServerSnapshot)
  const [collapsed, setCollapsed] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedColor, setSelectedColor] = useState<NoteColor>('yellow')

  // DnD sensors with touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

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
      order: 0,
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

  const handleChangeColor = useCallback((id: string, color: NoteColor) => {
    const updated = getNoteSnapshot().map((n) =>
      n.id === id ? { ...n, color } : n,
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

  // Drag end handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const currentNotes = getNoteSnapshot()
    const oldIndex = currentNotes.findIndex((n) => n.id === active.id)
    const newIndex = currentNotes.findIndex((n) => n.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(currentNotes, oldIndex, newIndex).map((n, i) => ({
      ...n,
      order: i,
    }))

    // Preserve pinned sorting: keep pinned notes at top
    const pinned = reordered.filter((n) => n.pinned)
    const unpinned = reordered.filter((n) => !n.pinned)
    const final = [...pinned, ...unpinned]

    persistNotes(final)
    emitNoteChange()
  }, [])

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
            {notes.filter((n) => n.pinned).length > 0 && (
              <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                <Pin className="h-2.5 w-2.5" />
                {notes.filter((n) => n.pinned).length}
              </span>
            )}
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
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedNotes.map((n) => n.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="p-3 space-y-2 stagger-children">
                    {sortedNotes.map((note, index) => (
                      <SortableNoteCard
                        key={note.id}
                        note={note}
                        index={index}
                        onTogglePin={handleTogglePin}
                        onDelete={handleDelete}
                        onChangeColor={handleChangeColor}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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

            {/* Color Picker - Enhanced */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                رنگ
              </label>
              <div className="flex items-center gap-2.5">
                {COLOR_OPTIONS.map((c) => {
                  const style = COLOR_MAP[c]
                  return (
                    <button
                      key={c}
                      className={`w-9 h-9 rounded-full ${style.dot} transition-all cursor-pointer flex items-center justify-center ${
                        selectedColor === c
                          ? `ring-2 ring-offset-2 ring-offset-background ${style.ring} scale-110`
                          : 'hover:scale-105 opacity-70 hover:opacity-100 ring-1 ring-offset-1 ring-offset-background ring-transparent'
                      }`}
                      onClick={() => setSelectedColor(c)}
                      title={style.label}
                    >
                      {selectedColor === c && (
                        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
                <span className="text-xs text-muted-foreground mr-1 font-medium">
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
