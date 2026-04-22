'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCMS } from '@/components/cms/context'
import {
  Search, FileText, Users, FolderKanban, UserCircle,
  Image as ImageIcon, MessageCircle, Bot, BarChart3, Settings, Globe,
  Loader2, Clock, X, FileQuestion, ArrowLeftRight,
} from 'lucide-react'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (tabId: string) => void
}

const iconMap: Record<string, React.ReactNode> = {
  post: <FileText className="h-4 w-4" />,
  user: <Users className="h-4 w-4" />,
  customer: <UserCircle className="h-4 w-4" />,
  project: <FolderKanban className="h-4 w-4" />,
  media: <ImageIcon className="h-4 w-4" />,
  comment: <MessageCircle className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
}

const typeLabels: Record<string, string> = {
  post: 'مقاله',
  user: 'کاربر',
  customer: 'مشتری',
  project: 'پروژه',
  media: 'رسانه',
  comment: 'نظر',
  team: 'تیم',
}

const typeTabs: Record<string, string> = {
  post: 'content',
  user: 'users',
  customer: 'customers',
  project: 'projects',
  media: 'media',
  comment: 'comments',
  team: 'team',
}

// Colored dot for each entity type
const typeDotColors: Record<string, string> = {
  post: 'bg-violet-500',
  user: 'bg-purple-500',
  customer: 'bg-fuchsia-500',
  project: 'bg-sky-500',
  media: 'bg-emerald-500',
  comment: 'bg-amber-500',
  team: 'bg-rose-500',
}

// Status label map for metadata
const statusMeta: Record<string, Record<string, string>> = {
  post: { published: 'منتشر شده', draft: 'پیش‌نویس', archived: 'بایگانی', pending: 'در انتظار' },
  project: { active: 'فعال', completed: 'تکمیل شده', pending: 'در انتظار', archived: 'بایگانی' },
  user: { active: 'فعال', inactive: 'غیرفعال' },
  customer: { active: 'فعال', inactive: 'غیرفعال' },
  media: { image: 'تصویر', video: 'ویدیو', document: 'سند' },
  comment: { approved: 'تأیید شده', pending: 'در انتظار', spam: 'هرزنامه' },
  team: {},
}

// Quick filter definitions
const QUICK_FILTERS = [
  { key: 'all', label: 'همه' },
  { key: 'post', label: 'مطالب' },
  { key: 'user', label: 'کاربران' },
  { key: 'customer', label: 'مشتریان' },
  { key: 'project', label: 'پروژه‌ها' },
  { key: 'media', label: 'رسانه' },
] as const

type FilterKey = (typeof QUICK_FILTERS)[number]['key']

const RECENT_SEARCHES_KEY = 'cms-recent-searches'
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
    return raw ? JSON.parse(raw) as string[] : []
  } catch {
    return []
  }
}

function saveRecentSearches(searches: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches.slice(0, MAX_RECENT)))
  } catch {
    // ignore
  }
}

function addRecentSearch(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return
  const current = getRecentSearches().filter(s => s !== trimmed)
  current.unshift(trimmed)
  saveRecentSearches(current)
}

function removeRecentSearch(query: string) {
  const current = getRecentSearches().filter(s => s !== query)
  saveRecentSearches(current)
}

function clearRecentSearches() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}

interface SearchResult {
  id: string
  type: string
  title: string
  subtitle: string
  meta: string
}

export function SearchDialog({ open, onOpenChange, onNavigate }: SearchDialogProps) {
  const { posts, users, customers, projects, media, comments, team } = useCMS()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsEndRef = useRef<HTMLDivElement>(null)

  // Sync state when dialog opens — use render-phase pattern (no effect)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setRecentSearches(getRecentSearches())
      setQuery('')
      setActiveFilter('all')
      setSelectedIndex(-1)
    }
  }

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  const allResults = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const items: SearchResult[] = []

    const addItems = (data: Array<Record<string, unknown>>, type: string, titleKey: string, subtitleKey: string) => {
      data.forEach(item => {
        const title = String(item[titleKey] || '')
        if (title.toLowerCase().includes(q)) {
          const rawStatus = String(item[subtitleKey] || '')
          const statusLabelStr = statusMeta[type]?.[rawStatus] || rawStatus
          const metaText = statusLabelStr || typeLabels[type] || ''
          items.push({
            id: String(item.id),
            type,
            title,
            subtitle: subtitleKey === 'content' ? String(item[subtitleKey] || '').slice(0, 60) : String(item[subtitleKey] || ''),
            meta: metaText,
          })
        }
      })
    }

    if (posts.data) addItems(posts.data as unknown as Array<Record<string, unknown>>, 'post', 'title', 'status')
    if (users.data) addItems(users.data as unknown as Array<Record<string, unknown>>, 'user', 'name', 'email')
    if (customers.data) addItems(customers.data as unknown as Array<Record<string, unknown>>, 'customer', 'name', 'company')
    if (projects.data) addItems(projects.data as unknown as Array<Record<string, unknown>>, 'project', 'title', 'status')
    if (media.data) addItems(media.data as unknown as Array<Record<string, unknown>>, 'media', 'name', 'type')
    if (comments.data) addItems(comments.data as unknown as Array<Record<string, unknown>>, 'comment', 'author', 'content')
    if (team.data) addItems(team.data as unknown as Array<Record<string, unknown>>, 'team', 'name', 'department')

    return items.slice(0, 20)
  }, [query, posts.data, users.data, customers.data, projects.data, media.data, comments.data, team.data])

  // Apply active filter
  const results = useMemo(() => {
    if (activeFilter === 'all') return allResults
    return allResults.filter(r => r.type === activeFilter)
  }, [allResults, activeFilter])

  // Reset selected index when query or filter changes — render-phase pattern
  const [prevQuery, setPrevQuery] = useState(query)
  const [prevFilter, setPrevFilter] = useState(activeFilter)
  if (query !== prevQuery || activeFilter !== prevFilter) {
    setPrevQuery(query)
    setPrevFilter(activeFilter)
    setSelectedIndex(-1)
  }

  const isLoading = posts.isLoading || users.isLoading || customers.isLoading || projects.isLoading

  const handleSelect = useCallback((result: SearchResult) => {
    addRecentSearch(query)
    const tabId = typeTabs[result.type]
    if (tabId) onNavigate(tabId)
    onOpenChange(false)
    setQuery('')
  }, [onNavigate, onOpenChange, query])

  const handleRecentClick = useCallback((search: string) => {
    setQuery(search)
    setActiveFilter('all')
    setSelectedIndex(-1)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  const handleRemoveRecent = useCallback((search: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeRecentSearch(search)
    setRecentSearches(getRecentSearches())
  }, [])

  const handleClearHistory = useCallback(() => {
    clearRecentSearches()
    setRecentSearches([])
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelect(results[selectedIndex])
      } else if (query.trim()) {
        // If nothing selected, pick first result
        if (results.length > 0) {
          handleSelect(results[0])
        } else {
          // Save search even if no results
          addRecentSearch(query)
        }
      }
    }
  }, [results, selectedIndex, handleSelect, query])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0) {
      resultsEndRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen)
      if (!newOpen) setQuery('')
    }}>
      <DialogContent className="glass-card sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>جستجو</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
          <Input
            ref={inputRef}
            placeholder="جستجو در مقالات، کاربران، پروژه‌ها..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 h-12 text-sm"
            autoFocus
          />
          <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b overflow-x-auto" style={{ direction: 'rtl' }}>
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`
                shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                ${activeFilter === filter.key
                  ? 'bg-gradient-to-l from-violet-600 to-purple-600 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="mr-2 text-sm text-muted-foreground">در حال بارگذاری...</span>
            </div>
          ) : query.trim() && results.length === 0 ? (
            /* No results state */
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <FileQuestion className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">نتیجه‌ای یافت نشد</p>
              <p className="text-xs mt-1 opacity-70">عبارت جستجو را تغییر دهید.</p>
            </div>
          ) : !query.trim() && recentSearches.length > 0 ? (
            /* Recent Searches */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-muted-foreground font-medium">جستجوهای اخیر</span>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  پاک کردن تاریخچه
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => handleRecentClick(search)}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs text-foreground hover:bg-accent/50 transition-colors group"
                  >
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{search}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemoveRecent(search, e)}
                      className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-destructive transition-opacity"
                      aria-label={`حذف ${search}`}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : !query.trim() ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <div className="h-14 w-14 rounded-full bg-violet-500/10 flex items-center justify-center mb-3">
                <Search className="h-6 w-6 opacity-40 text-violet-500" />
              </div>
              <p className="text-sm">عبارت مورد نظر را تایپ کنید...</p>
              <p className="text-xs mt-1 opacity-70">می‌توانید از فیلترها برای محدود کردن نتایج استفاده کنید</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((result, idx) => (
                <button
                  key={`${result.type}-${result.id}`}
                  className={`
                    w-full flex items-center gap-3 rounded-md px-3 py-2 text-right transition-colors
                    ${idx === selectedIndex
                      ? 'bg-accent/80 ring-1 ring-violet-500/30'
                      : 'hover:bg-accent/50'
                    }
                  `}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  title="رفتن به صفحه"
                >
                  {/* Colored type dot */}
                  <span className="relative flex shrink-0">
                    <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${typeDotColors[result.type] || 'bg-muted-foreground'}`} />
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      {iconMap[result.type] || <Search className="h-4 w-4" />}
                    </span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{typeLabels[result.type]}</span>
                    {result.meta && (
                      <span className="text-[10px] text-muted-foreground/70">{result.meta}</span>
                    )}
                  </div>
                </button>
              ))}
              <div ref={resultsEndRef} />
            </div>
          )}
        </div>
        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1">↑↓</kbd> حرکت</span>
          <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1">↵</kbd> انتخاب</span>
          <span className="flex items-center gap-1"><ArrowLeftRight className="h-3 w-3" /> فیلتر</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
