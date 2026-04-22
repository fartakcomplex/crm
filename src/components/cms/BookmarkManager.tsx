'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bookmark,
  Plus,
  Trash2,
  Search,
  BookmarkX,
  FileText,
  Wrench,
  BarChart3,
  MoreHorizontal,
  ExternalLink,
  Globe,
  Zap,
  FolderOpen,
  LayoutDashboard,
 ChevronDown,
  ChevronUp,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────

interface BookmarkItem {
  id: string
  name: string
  url: string
  category: BookmarkCategory
  icon: string
  createdAt: string
}

type BookmarkCategory = 'pages' | 'tools' | 'reports' | 'other'

const STORAGE_KEY = 'cms-bookmarks'

const CATEGORIES: Record<BookmarkCategory, { label: string; icon: React.ReactNode; color: string }> = {
  pages: {
    label: 'صفحات',
    icon: <FileText className="h-3.5 w-3.5" />,
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  },
  tools: {
    label: 'ابزارها',
    icon: <Wrench className="h-3.5 w-3.5" />,
    color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
  reports: {
    label: 'گزارش‌ها',
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  other: {
    label: 'سایر',
    icon: <MoreHorizontal className="h-3.5 w-3.5" />,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300',
  },
}

// ─── Auto-detect icon from URL/path ──────────────────────────────────────

function detectIcon(url: string): string {
  const lower = url.toLowerCase()
  if (lower.includes('dashboard') || lower === '/dashboard') return 'LayoutDashboard'
  if (lower.includes('content') || lower.includes('post')) return 'FileText'
  if (lower.includes('media') || lower.includes('image')) return 'Globe'
  if (lower.includes('ai') || lower.includes('assist')) return 'Zap'
  if (lower.includes('report')) return 'BarChart3'
  if (lower.includes('project')) return 'FolderOpen'
  return 'Bookmark'
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  Globe,
  Zap,
  BarChart3,
  FolderOpen,
  Bookmark,
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function loadBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveBookmarks(bookmarks: BookmarkItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
}

function generateId(): string {
  return `bm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── Component ───────────────────────────────────────────────────────────

export function BookmarkManager() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => loadBookmarks())
  const [collapsed, setCollapsed] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState<BookmarkCategory>('pages')

  // Persist
  useEffect(() => {
    saveBookmarks(bookmarks)
  }, [bookmarks])

  const handleAdd = useCallback(() => {
    if (!name.trim() || !url.trim()) return
    const newBookmark: BookmarkItem = {
      id: generateId(),
      name: name.trim(),
      url: url.trim().startsWith('/') ? url.trim() : `/${url.trim()}`,
      category,
      icon: detectIcon(url),
      createdAt: new Date().toISOString(),
    }
    setBookmarks((prev) => [newBookmark, ...prev])
    setName('')
    setUrl('')
    setCategory('pages')
    setDialogOpen(false)
  }, [name, url, category])

  const handleDelete = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }, [])

  // Filter by search query
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) return bookmarks
    const q = searchQuery.toLowerCase()
    return bookmarks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        CATEGORIES[b.category].label.includes(q),
    )
  }, [bookmarks, searchQuery])

  return (
    <div className="glass-card glass-card-cyan rounded-xl overflow-hidden animate-in" dir="rtl">
      {/* ─── Header ─── */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-cyan-500/5 transition-colors"
        onClick={() => setCollapsed((p) => !p)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shadow-sm">
            <Bookmark className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-cyan-700 dark:text-cyan-300">
              نشانک‌ها
            </span>
            <Badge
              variant="secondary"
              className="h-5 min-w-[20px] px-1.5 text-[10px] bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-0"
            >
              {bookmarks.length}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-cyan-500/10"
            onClick={(e) => {
              e.stopPropagation()
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </Button>
          {collapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* ─── Content ─── */}
      {!collapsed && (
        <div className="border-t border-cyan-200/30 dark:border-cyan-800/20">
          {/* Search Bar */}
          {bookmarks.length > 0 && (
            <div className="px-3 pt-3">
              <div className="relative">
                <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="جستجو نشانک..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-xs pr-8 bg-background/50"
                />
              </div>
            </div>
          )}

          {/* Empty State */}
          {bookmarks.length === 0 ? (
            <div className="py-10 text-center animate-in">
              <div className="w-14 h-14 rounded-full bg-cyan-100 dark:bg-cyan-900/20 flex items-center justify-center mx-auto mb-3">
                <BookmarkX className="h-7 w-7 text-cyan-400 dark:text-cyan-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                نشانکی ذخیره نشده
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                صفحات و ابزارهای مورد علاقه را ذخیره کنید
              </p>
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="py-8 text-center">
              <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                نتیجه‌ای یافت نشد
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 stagger-children">
                {filteredBookmarks.map((bookmark, index) => {
                  const catInfo = CATEGORIES[bookmark.category]
                  const IconComp = ICON_MAP[bookmark.icon] ?? Bookmark
                  return (
                    <div
                      key={bookmark.id}
                      className="flex items-center gap-3 rounded-lg p-2.5 bg-background/40 border border-border/50 hover-lift card-press group animate-in"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center shrink-0 shadow-sm">
                        <IconComp className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {bookmark.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/50" />
                          <span
                            className="text-[10px] text-muted-foreground truncate"
                            dir="ltr"
                          >
                            {bookmark.url}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          variant="secondary"
                          className={`h-5 px-1.5 text-[9px] border-0 ${catInfo.color}`}
                        >
                          {catInfo.label}
                        </Badge>
                        <button
                          className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          onClick={() => handleDelete(bookmark.id)}
                          title="حذف"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* ─── Add Bookmark Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px] glass-card" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
              <Bookmark className="h-5 w-5" />
              افزودن نشانک
            </DialogTitle>
            <DialogDescription>
              صفحه یا ابزار مورد علاقه خود را ذخیره کنید.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="bm-name" className="text-sm font-medium">
                نام
              </label>
              <Input
                id="bm-name"
                placeholder="نام نشانک..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background/50"
                maxLength={80}
              />
            </div>

            {/* URL / Path */}
            <div className="space-y-2">
              <label htmlFor="bm-url" className="text-sm font-medium">
                مسیر
              </label>
              <Input
                id="bm-url"
                placeholder="/dashboard"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-background/50 font-mono text-sm"
                dir="ltr"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">دسته‌بندی</label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as BookmarkCategory)}
              >
                <SelectTrigger className="w-full bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {cat.icon}
                        <span>{cat.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              onClick={handleAdd}
              disabled={!name.trim() || !url.trim()}
              className="gap-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white shadow-sm"
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

export default BookmarkManager
