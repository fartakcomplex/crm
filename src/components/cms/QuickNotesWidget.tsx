'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Pin, PinOff, X, Plus, StickyNote, Search, GripVertical } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

// ── Types ──────────────────────────────────────────────────────────────
interface Note {
  id: string
  content: string
  color: NoteColor
  pinned: boolean
  createdAt: string
}

type NoteColor = 'yellow' | 'green' | 'blue' | 'pink'

// ── Color maps ─────────────────────────────────────────────────────────
const NOTE_COLORS: { key: NoteColor; bg: string; border: string; ring: string; label: string; dot: string }[] = [
  { key: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-950/40', border: 'border-yellow-200 dark:border-yellow-800/50', ring: 'ring-yellow-400', label: 'زرد', dot: 'bg-yellow-400' },
  { key: 'green',  bg: 'bg-green-50 dark:bg-green-950/40',  border: 'border-green-200 dark:border-green-800/50',  ring: 'ring-green-400',  label: 'سبز', dot: 'bg-green-400' },
  { key: 'blue',   bg: 'bg-blue-50 dark:bg-blue-950/40',   border: 'border-blue-200 dark:border-blue-800/50',   ring: 'ring-blue-400',   label: 'آبی', dot: 'bg-blue-400' },
  { key: 'pink',   bg: 'bg-pink-50 dark:bg-pink-950/40',   border: 'border-pink-200 dark:border-pink-800/50',   ring: 'ring-pink-400',   label: 'صورتی', dot: 'bg-pink-400' },
]

const getColorClasses = (color: NoteColor) => {
  const found = NOTE_COLORS.find(c => c.key === color)
  return found ?? NOTE_COLORS[0]
}

// ── Sample notes ───────────────────────────────────────────────────────
const INITIAL_NOTES: Note[] = [
  { id: '1', content: 'جلسه با تیم طراحی ساعت ۱۰ صبح — بررسی وایرفریم‌های جدید', color: 'yellow', pinned: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', content: 'پروپوزال پروژه مشتری نهایی شد — ارسال تا پایان هفته', color: 'green', pinned: false, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: '3', content: 'یادآوری: بکاپ از دیتابیس سرور اصلی انجام نشده', color: 'blue', pinned: true, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '4', content: 'ایده: افزودن قابلیت خروجی PDF به گزارش‌های مالی', color: 'pink', pinned: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
]

// ── Relative time ──────────────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'همین الان'
  if (mins < 60) return `${mins} دقیقه پیش`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} ساعت پیش`
  const days = Math.floor(hrs / 24)
  return `${days} روز پیش`
}

// ── Component ──────────────────────────────────────────────────────────
export default function QuickNotesWidget() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES)
  const [newContent, setNewContent] = useState('')
  const [selectedColor, setSelectedColor] = useState<NoteColor>('yellow')
  const [isAdding, setIsAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // Drag state
  const [dragItemIndex, setDragItemIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // ── Actions ──────────────────────────────────────────────────────────
  const addNote = () => {
    const trimmed = newContent.trim()
    if (!trimmed) {
      toast.error('یادداشت نمی‌تواند خالی باشد')
      return
    }
    const note: Note = {
      id: crypto.randomUUID(),
      content: trimmed,
      color: selectedColor,
      pinned: false,
      createdAt: new Date().toISOString(),
    }
    setNotes(prev => [note, ...prev])
    setNewContent('')
    setIsAdding(false)
    toast.success('یادداشت جدید اضافه شد')
  }

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    toast.success('یادداشت حذف شد')
  }

  const togglePin = (id: string) => {
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    )
    const note = notes.find(n => n.id === id)
    if (note) {
      toast.success(note.pinned ? 'سنجاق برداشته شد' : 'یادداشت سنجاق شد')
    }
  }

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  const saveEdit = (id: string) => {
    const trimmed = editContent.trim()
    if (!trimmed) {
      toast.error('یادداشت نمی‌تواند خالی باشد')
      return
    }
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content: trimmed } : n))
    setEditingId(null)
    setEditContent('')
    toast.success('یادداشت ویرایش شد')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  // ── Drag handlers ────────────────────────────────────────────────────
  const handleDragStart = useCallback((index: number) => {
    setDragItemIndex(index)
  }, [])

  const handleDragEnter = useCallback((index: number) => {
    setDragOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragItemIndex === null || dragOverIndex === null) {
      setDragItemIndex(null)
      setDragOverIndex(null)
      return
    }
    if (dragItemIndex !== dragOverIndex) {
      const updated = [...notes]
      const dragged = updated.splice(dragItemIndex, 1)[0]
      updated.splice(dragOverIndex, 0, dragged)
      setNotes(updated)
    }
    setDragItemIndex(null)
    setDragOverIndex(null)
  }, [notes, dragItemIndex, dragOverIndex])

  // ── Filter notes ─────────────────────────────────────────────────────
  const filtered = searchQuery.trim()
    ? notes.filter(n => n.content.includes(searchQuery.trim()))
    : notes

  // Sort: pinned first
  const sorted = [...filtered].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <StickyNote className="h-4 w-4 text-violet-500" />
          یادداشت‌های سریع
          <span className="mr-auto text-xs text-muted-foreground font-normal">
            {notes.length} یادداشت
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Search / Filter input */}
        <div className="relative">
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجو در یادداشت‌ها..."
            className="h-8 text-xs pr-8 pl-3 bg-background/50 border-border/50"
            dir="rtl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Notes list */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {sorted.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-4">
              {searchQuery ? 'یادداشتی یافت نشد' : 'هنوز یادداشتی ندارید'}
            </p>
          )}
          {sorted.map((note, index) => {
            const colorClasses = getColorClasses(note.color)
            const isEditing = editingId === note.id
            return (
              <div
                key={note.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`
                  group relative rounded-lg border p-3 transition-all duration-200 hover:shadow-md
                  ${colorClasses.bg} ${colorClasses.border}
                  ${dragItemIndex === index ? 'opacity-50 scale-95' : ''}
                  ${dragOverIndex === index && dragItemIndex !== index ? 'ring-2 ring-violet-400/30' : ''}
                  cursor-default
                `}
              >
                {/* Drag handle + Action buttons */}
                <div className="absolute top-2 left-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="drag-handle p-1 rounded-md text-muted-foreground/40">
                    <GripVertical className="h-3 w-3" />
                  </div>
                  <button
                    onClick={() => togglePin(note.id)}
                    className={`p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                      note.pinned ? 'text-violet-500' : 'text-muted-foreground'
                    }`}
                    aria-label={note.pinned ? 'برداشتن سنجاق' : 'سنجاق کردن'}
                  >
                    {note.pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => startEdit(note)}
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-violet-500 transition-colors cursor-pointer"
                    aria-label="ویرایش یادداشت"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                    aria-label="حذف یادداشت"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Color dot indicator */}
                <div className={`absolute top-2.5 right-2 w-2 h-2 rounded-full ${colorClasses.dot} opacity-60`} />

                {/* Pin indicator */}
                {note.pinned && (
                  <Pin className="absolute top-2 right-7 h-3 w-3 text-violet-400 opacity-60" />
                )}

                {/* Content */}
                {isEditing ? (
                  <div className="space-y-2 pr-6">
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="min-h-[40px] text-xs resize-none"
                      autoFocus
                      dir="rtl"
                    />
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => saveEdit(note.id)} className="h-6 text-[10px] px-2">
                        ذخیره
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 text-[10px] px-2">
                        انصراف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-xs leading-relaxed text-foreground/90 pr-6 pl-10 line-clamp-3 cursor-text"
                    onDoubleClick={() => startEdit(note)}
                    title="برای ویرایش دابل‌کلیک کنید"
                  >
                    {note.content}
                  </p>
                )}

                {/* Time + Color label */}
                <div className="flex items-center justify-between mt-1.5 pr-6 pl-10">
                  <p className="text-[10px] text-muted-foreground">
                    {relativeTime(note.createdAt)}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${colorClasses.dot}`} />
                    <span className="text-[9px] text-muted-foreground/60">{colorClasses.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add new note */}
        {isAdding ? (
          <div className="space-y-2 animate-in">
            <Textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="متن یادداشت..."
              className="min-h-[60px] text-xs resize-none"
              autoFocus
              dir="rtl"
            />
            {/* Color picker */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">رنگ:</span>
              {NOTE_COLORS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setSelectedColor(c.key)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    selectedColor === c.key
                      ? `border-foreground scale-110 ${c.ring} ring-2`
                      : 'border-transparent hover:scale-110'
                  } ${
                    c.key === 'yellow' ? 'bg-yellow-300 dark:bg-yellow-600' :
                    c.key === 'green'  ? 'bg-green-300 dark:bg-green-600'  :
                    c.key === 'blue'   ? 'bg-blue-300 dark:bg-blue-600'    :
                                         'bg-pink-300 dark:bg-pink-600'
                  }`}
                  aria-label={c.label}
                />
              ))}
            </div>
            {/* Action buttons */}
            <div className="flex gap-2">
              <Button size="sm" onClick={addNote} className="h-7 text-xs">
                <Plus className="h-3 w-3 ml-1" />
                افزودن
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setIsAdding(false); setNewContent('') }} className="h-7 text-xs">
                انصراف
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="w-full h-8 text-xs border-dashed"
          >
            <Plus className="h-3 w-3 ml-1" />
            یادداشت جدید
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
