'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCMS } from '@/components/cms/context'
import { CMS_TABS, SIDEBAR_CATEGORIES, type CMSTab } from './types'
import {
  Search, FileText, Users, FolderKanban, UserCircle,
  Image as ImageIcon, MessageCircle, Bot, BarChart3, Settings, Globe,
  Loader2, Clock, X, FileQuestion,
  LayoutDashboard, UserCog, Activity, Bell, CheckSquare,
  CalendarDays, ShoppingBag, Handshake, Receipt, Warehouse, Wallet,
  Plus, ArrowUpLeft, Sparkles, ExternalLink, ChevronLeft,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Icon Map (replicated from page.tsx) ────────────────────────────────

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, FileText, Image: ImageIcon, Users, UserCog, UserCircle,
  FolderKanban, Bot, BarChart3, Activity, MessageCircle, Bell, Globe, Settings,
  CheckSquare, CalendarDays, ShoppingBag, Handshake, Receipt, Warehouse, Wallet,
}

function TabIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconComponents[name]
  return Icon ? <Icon className={className} /> : <Settings className={className} />
}

// ─── Constants ──────────────────────────────────────────────────────────

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (tabId: string) => void
}

// Entity search icon/label maps (kept from original)
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

const typeDotColors: Record<string, string> = {
  post: 'bg-violet-500',
  user: 'bg-purple-500',
  customer: 'bg-fuchsia-500',
  project: 'bg-sky-500',
  media: 'bg-emerald-500',
  comment: 'bg-amber-500',
  team: 'bg-rose-500',
}

const statusMeta: Record<string, Record<string, string>> = {
  post: { published: 'منتشر شده', draft: 'پیش‌نویس', archived: 'بایگانی', pending: 'در انتظار' },
  project: { active: 'فعال', completed: 'تکمیل شده', pending: 'در انتظار', archived: 'بایگانی' },
  user: { active: 'فعال', inactive: 'غیرفعال' },
  customer: { active: 'فعال', inactive: 'غیرفعال' },
  media: { image: 'تصویر', video: 'ویدیو', document: 'سند' },
  comment: { approved: 'تأیید شده', pending: 'در انتظار', spam: 'هرزنامه' },
  team: {},
}

// Quick Access Actions
interface QuickAction {
  id: string
  label: string
  description: string
  tabId: string
  icon: LucideIcon
  gradient: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'new-post', label: 'مطلب جدید', description: 'ایجاد محتوای جدید', tabId: 'content', icon: Plus, gradient: 'from-cyan-500 to-cyan-700' },
  { id: 'new-order', label: 'سفارش جدید', description: 'ثبت سفارش فروشگاه', tabId: 'store', icon: ShoppingBag, gradient: 'from-rose-500 to-rose-700' },
  { id: 'upload-media', label: 'آپلود رسانه', description: 'بارگذاری فایل و تصویر', tabId: 'media', icon: ImageIcon, gradient: 'from-orange-500 to-orange-700' },
  { id: 'ai-assistant', label: 'دستیار هوشمند', description: 'کمک هوش مصنوعی', tabId: 'ai-assistant', icon: Bot, gradient: 'from-violet-500 to-violet-700' },
  { id: 'settings', label: 'تنظیمات', description: 'پیکربندی سیستم', tabId: 'settings', icon: Settings, gradient: 'from-teal-500 to-teal-700' },
  { id: 'reports', label: 'گزارش‌ها', description: 'آمار و گزارش‌ها', tabId: 'reports', icon: BarChart3, gradient: 'from-fuchsia-500 to-fuchsia-700' },
]

// Badge gradient class per module category
const categoryBadgeGradient: Record<string, string> = {
  main: 'badge-gradient-slate',
  content: 'badge-gradient-cyan',
  people: 'badge-gradient-emerald',
  workspace: 'badge-gradient-blue',
  tools: 'badge-gradient-violet',
  system: 'badge-gradient-amber',
  business: 'badge-gradient-rose',
  finance: 'badge-gradient-emerald',
}

// localStorage keys
const RECENT_SEARCHES_KEY = 'cms-recent-searches'
const RECENT_TABS_KEY = 'cms-recent-tabs'
const MAX_RECENT = 5
const MAX_RECENT_TABS = 3

// ─── localStorage helpers ───────────────────────────────────────────────

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
  } catch { /* ignore */ }
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

function getRecentTabs(): CMSTab[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_TABS_KEY)
    if (!raw) return []
    const ids = JSON.parse(raw) as string[]
    return ids
      .map(id => CMS_TABS.find(t => t.id === id))
      .filter((t): t is CMSTab => t !== undefined)
      .slice(0, MAX_RECENT_TABS)
  } catch {
    return []
  }
}

function addRecentTab(tabId: string) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(RECENT_TABS_KEY)
    const current: string[] = raw ? JSON.parse(raw) : []
    const filtered = current.filter(id => id !== tabId)
    filtered.unshift(tabId)
    localStorage.setItem(RECENT_TABS_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT_TABS)))
  } catch { /* ignore */ }
}

// ─── Entity search result type ──────────────────────────────────────────

interface SearchResult {
  id: string
  type: string
  title: string
  subtitle: string
  meta: string
}

// ─── Command palette unified item type ──────────────────────────────────

interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  tabId: string
  category: string
  gradient: string
  badgeClass: string
}

// ─── Main Component ─────────────────────────────────────────────────────

export function SearchDialog({ open, onOpenChange, onNavigate }: SearchDialogProps) {
  const { posts, users, customers, projects, media, comments, team } = useCMS()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [recentTabs, setRecentTabs] = useState<CMSTab[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsEndRef = useRef<HTMLDivElement>(null)

  // Sync state when dialog opens
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setRecentSearches(getRecentSearches())
      setRecentTabs(getRecentTabs())
      setQuery('')
      setSelectedIndex(-1)
    }
  }

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
        setIsFocused(true)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // ─── Build command palette items (when search is empty) ─────────────

  const commandItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = []

    // Quick Access items
    QUICK_ACTIONS.forEach(action => {
      items.push({
        id: `action-${action.id}`,
        label: action.label,
        description: action.description,
        icon: <action.icon className="h-4 w-4" />,
        tabId: action.tabId,
        category: 'دسترسی سریع',
        gradient: action.gradient,
        badgeClass: 'badge-gradient-violet',
      })
    })

    // All modules
    CMS_TABS.forEach(tab => {
      const cat = tab.category ?? 'main'
      items.push({
        id: `module-${tab.id}`,
        label: tab.name,
        description: SIDEBAR_CATEGORIES[cat] ?? cat,
        icon: <TabIcon name={tab.icon} className="h-4 w-4" />,
        tabId: tab.id,
        category: 'ماژول‌ها',
        gradient: tab.gradient,
        badgeClass: categoryBadgeGradient[cat] ?? 'badge-gradient-violet',
      })
    })

    // Recent tabs
    recentTabs.forEach(tab => {
      items.push({
        id: `recent-${tab.id}`,
        label: tab.name,
        description: 'بازدید اخیر',
        icon: <Clock className="h-4 w-4" />,
        tabId: tab.id,
        category: 'عملیات اخیر',
        gradient: tab.gradient,
        badgeClass: 'badge-gradient-amber',
      })
    })

    return items
  }, [recentTabs])

  // ─── Build search results (when query is non-empty) ─────────────────

  const entityResults = useMemo<SearchResult[]>(() => {
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

  // Search module/quick actions
  const commandSearchResults = useMemo<CommandItem[]>(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return commandItems.filter(item =>
      item.label.includes(q) ||
      item.description.includes(q)
    )
  }, [query, commandItems])

  // ─── Flat list for keyboard navigation ───────────────────────────────

  const allFlatItems = useMemo(() => {
    if (query.trim()) {
      // When searching, combine command search results and entity results
      return [
        ...commandSearchResults.map(item => ({
          kind: 'command' as const,
          item,
        })),
        ...entityResults.map(result => ({
          kind: 'entity' as const,
          item: result,
        })),
      ]
    }
    // When empty, show command palette items
    return commandItems.map(item => ({
      kind: 'command' as const,
      item,
    }))
  }, [query, commandSearchResults, entityResults, commandItems])

  // Reset selected index when query changes
  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setSelectedIndex(-1)
  }

  const isLoading = posts.isLoading || users.isLoading || customers.isLoading || projects.isLoading

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleSelectCommand = useCallback((item: CommandItem) => {
    addRecentTab(item.tabId)
    onNavigate(item.tabId)
    onOpenChange(false)
    setQuery('')
  }, [onNavigate, onOpenChange])

  const handleSelectEntity = useCallback((result: SearchResult) => {
    addRecentSearch(query)
    const tabId = typeTabs[result.type]
    if (tabId) {
      addRecentTab(tabId)
      onNavigate(tabId)
    }
    onOpenChange(false)
    setQuery('')
  }, [onNavigate, onOpenChange, query])

  const handleSelect = useCallback((index: number) => {
    if (index < 0 || index >= allFlatItems.length) return
    const entry = allFlatItems[index]
    if (entry.kind === 'command') {
      handleSelectCommand(entry.item)
    } else {
      handleSelectEntity(entry.item)
    }
  }, [allFlatItems, handleSelectCommand, handleSelectEntity])

  const handleRecentClick = useCallback((search: string) => {
    setQuery(search)
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
      setSelectedIndex(prev => Math.min(prev + 1, allFlatItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < allFlatItems.length) {
        handleSelect(selectedIndex)
      } else if (query.trim()) {
        if (allFlatItems.length > 0) {
          handleSelect(0)
        } else {
          addRecentSearch(query)
        }
      }
    }
  }, [allFlatItems, selectedIndex, handleSelect, query])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0) {
      resultsEndRef.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // ─── Category badge gradient per result type ──────────────────────────

  const entityBadgeClass: Record<string, string> = {
    post: 'badge-gradient-violet',
    user: 'badge-gradient-emerald',
    customer: 'badge-gradient-amber',
    project: 'badge-gradient-cyan',
    media: 'badge-gradient-rose',
    comment: 'badge-gradient-amber',
    team: 'badge-gradient-violet',
  }

  // Track running index for flat list navigation
  let runningIdx = 0

  // ─── Render ───────────────────────────────────────────────────────────

  const isSearching = query.trim().length > 0

  // Group command search results by category
  const groupedCommandResults = useMemo(() => {
    if (!isSearching || commandSearchResults.length === 0) return null
    const groups: Record<string, CommandItem[]> = {}
    commandSearchResults.forEach(item => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    return groups
  }, [isSearching, commandSearchResults])

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen)
      if (!newOpen) setQuery('')
      setIsFocused(false)
    }}>
      <DialogContent className="glass-card sm:max-w-2xl p-0 gap-0 overflow-hidden" dir="rtl">
        <DialogHeader className="sr-only">
          <DialogTitle>جستجوی سریع</DialogTitle>
        </DialogHeader>

        {/* ─── Header with gradient icon ──────────────────────────── */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">جستجوی سریع</h2>
              <p className="text-xs text-muted-foreground">ماژول‌ها، مطالب، کاربران و عملیات</p>
            </div>
          </div>

          {/* Search Input */}
          <div className={`relative flex items-center rounded-xl border-2 transition-all duration-300 ${
            isFocused
              ? 'border-violet-500/60 shadow-[0_0_0_3px_rgba(139,92,246,0.12)]'
              : 'border-border/60'
          } bg-background/80`}>
            <Search className="h-4 w-4 text-muted-foreground mr-3 ml-2 shrink-0" />
            <Input
              ref={inputRef}
              placeholder="جستجو در مقالات، کاربران، ماژول‌ها..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="border-0 focus-visible:ring-0 h-11 text-sm shadow-none"
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('')
                  setTimeout(() => inputRef.current?.focus(), 0)
                }}
                className="ml-3 p-1 rounded-md hover:bg-muted/80 transition-colors"
                aria-label="پاک کردن"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* ─── Content Area ───────────────────────────────────────── */}
        <div className="max-h-96 overflow-y-auto" style={{ direction: 'rtl' }}>

          {/* Loading State */}
          {isLoading && isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="mr-2 text-sm text-muted-foreground">در حال بارگذاری...</span>
            </div>
          ) : isSearching ? (
            <>
              {/* ─── Search Results Mode ──────────────────────────── */}

              {/* No results state */}
              {allFlatItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <FileQuestion className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">نتیجه‌ای یافت نشد</p>
                  <p className="text-xs mt-1 opacity-70">عبارت جستجو را تغییر دهید یا از پیشنهادات استفاده کنید.</p>
                </div>
              ) : (
                <div className="p-3 space-y-4">

                  {/* Grouped Command/Module Results */}
                  {groupedCommandResults && Object.entries(groupedCommandResults).map(([category, items]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center gap-2 px-2 pt-1 pb-1.5">
                        <span className="badge-gradient badge-gradient-violet text-[10px]">{category}</span>
                        <span className="text-[10px] text-muted-foreground">{items.length} نتیجه</span>
                      </div>
                      {items.map((item) => {
                        const idx = runningIdx++
                        const isActive = idx === selectedIndex
                        return (
                          <button
                            key={item.id}
                            className={`
                              w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-right transition-all duration-200
                              card-elevated hover-lift
                              ${isActive
                                ? 'bg-accent/80 ring-1 ring-violet-500/30 shadow-sm'
                                : 'hover:bg-accent/40'
                              }
                            `}
                            onClick={() => handleSelectCommand(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <span className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient} text-white shadow-sm`}>
                              {item.icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isActive ? 'animated-underline' : ''}`}>
                                {item.label}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                            </div>
                            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          </button>
                        )
                      })}
                    </div>
                  ))}

                  {/* Entity Search Results */}
                  {entityResults.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-2 pt-1 pb-1.5">
                        <span className="badge-gradient badge-gradient-cyan text-[10px]">نتایج محتوا</span>
                        <span className="text-[10px] text-muted-foreground">{entityResults.length} نتیجه</span>
                      </div>
                      {entityResults.map((result) => {
                        const idx = runningIdx++
                        const isActive = idx === selectedIndex
                        return (
                          <button
                            key={`${result.type}-${result.id}`}
                            className={`
                              w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-right transition-all duration-200
                              card-elevated hover-lift
                              ${isActive
                                ? 'bg-accent/80 ring-1 ring-violet-500/30 shadow-sm'
                                : 'hover:bg-accent/40'
                              }
                            `}
                            onClick={() => handleSelectEntity(result)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            {/* Colored type dot */}
                            <span className="relative flex shrink-0">
                              <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${typeDotColors[result.type] || 'bg-muted-foreground'}`} />
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                {iconMap[result.type] || <Search className="h-4 w-4" />}
                              </span>
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${isActive ? 'animated-underline' : ''}`}>
                                {result.title}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                              <span className={`badge-gradient ${entityBadgeClass[result.type] || 'badge-gradient-violet'} text-[10px]`}>
                                {typeLabels[result.type]}
                              </span>
                              {result.meta && (
                                <span className="text-[10px] text-muted-foreground/70">{result.meta}</span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* ─── Command Palette Mode (empty search) ───────────── */}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="px-5 py-3 border-b border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-medium">جستجوهای اخیر</span>
                    </div>
                    <button
                      onClick={handleClearHistory}
                      className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                    >
                      پاک کردن تاریخچه
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleRecentClick(search)}
                        className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-xs text-foreground hover:bg-accent/50 transition-colors group"
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
              )}

              {/* Quick Access */}
              <div className="px-5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                  <span className="text-xs text-muted-foreground font-semibold">دسترسی سریع</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {QUICK_ACTIONS.map((action) => {
                    const idx = runningIdx++
                    const isActive = idx === selectedIndex
                    return (
                      <button
                        key={action.id}
                        className={`
                          flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-right transition-all duration-200
                          card-elevated hover-lift
                          ${isActive
                            ? 'bg-accent/80 ring-1 ring-violet-500/30 shadow-sm'
                            : 'hover:bg-accent/40'
                          }
                        `}
                        onClick={() => handleSelectCommand(commandItems.find(ci => ci.id === `action-${action.id}`)!)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${action.gradient} text-white shadow-sm`}>
                          <action.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${isActive ? 'animated-underline' : ''}`}>
                            {action.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{action.description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Recent Actions (visited tabs) */}
              {recentTabs.length > 0 && (
                <div className="px-5 py-3 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs text-muted-foreground font-semibold">عملیات اخیر</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentTabs.map((tab) => {
                      const idx = runningIdx++
                      const isActive = idx === selectedIndex
                      return (
                        <button
                          key={`recent-${tab.id}`}
                          className={`
                            inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all duration-200
                            border ${isActive ? 'border-violet-500/40 bg-violet-500/5' : 'bg-background/80 hover:bg-accent/50'}
                          `}
                          onClick={() => handleSelectCommand(commandItems.find(ci => ci.id === `recent-${tab.id}`)!)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <span className={`flex h-4 w-4 items-center justify-center rounded bg-gradient-to-br ${tab.gradient} text-white`}>
                            <TabIcon name={tab.icon} className="h-2.5 w-2.5" />
                          </span>
                          <span className="font-medium">{tab.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* All Modules */}
              <div className="px-5 py-3 border-t border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutDashboard className="h-3.5 w-3.5 text-cyan-500" />
                  <span className="text-xs text-muted-foreground font-semibold">ماژول‌ها</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {CMS_TABS.map((tab) => {
                    const idx = runningIdx++
                    const isActive = idx === selectedIndex
                    const cat = tab.category ?? 'main'
                    return (
                      <button
                        key={tab.id}
                        className={`
                          flex items-center gap-2 rounded-lg px-2.5 py-2 text-right transition-all duration-200
                          card-elevated hover-lift
                          ${isActive
                            ? 'bg-accent/80 ring-1 ring-violet-500/30 shadow-sm'
                            : 'hover:bg-accent/40'
                          }
                        `}
                        onClick={() => handleSelectCommand(commandItems.find(ci => ci.id === `module-${tab.id}`)!)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br ${tab.gradient} text-white shadow-sm`}>
                          <TabIcon name={tab.icon} className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-[11px] font-semibold truncate ${isActive ? 'animated-underline' : ''}`}>
                            {tab.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground/70 truncate">
                            {SIDEBAR_CATEGORIES[cat] ?? cat}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Placeholder when nothing to show */}
              {recentSearches.length === 0 && recentTabs.length === 0 && (
                <div className="px-5 py-6 text-center text-muted-foreground">
                  <div className="h-12 w-12 mx-auto rounded-full bg-violet-500/10 flex items-center justify-center mb-3">
                    <Search className="h-5 w-5 text-violet-500/60" />
                  </div>
                  <p className="text-sm">عبارت مورد نظر را تایپ کنید...</p>
                  <p className="text-xs mt-1 opacity-70">ماژول‌ها، عملیات سریع و مطالب جستجو می‌شوند</p>
                </div>
              )}
            </>
          )}

          <div ref={resultsEndRef} />
        </div>

        {/* ─── Footer ─────────────────────────────────────────────── */}
        <div className="border-t border-border/50 px-5 py-2.5 flex items-center justify-between">
          {/* Keyboard hints */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-5 items-center rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">↑↓</kbd>
              <span>حرکت</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-5 items-center rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">↵</kbd>
              <span>انتخاب</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-5 items-center rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">Esc</kbd>
              <span>بستن</span>
            </span>
          </div>

          {/* Google search link */}
          {isSearching && query.trim() && (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors animated-underline"
              onClick={() => addRecentSearch(query)}
            >
              <ExternalLink className="h-3 w-3" />
              <span>جستجو در گوگل</span>
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
