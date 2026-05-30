'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Search, FileText, Users, FolderKanban, Bot, BarChart3, Settings,
  CheckSquare, ImagePlus, ShoppingCart, MessageCircle, LayoutDashboard,
  CalendarDays, Activity, Bell, Globe, Handshake, Receipt, Warehouse, Wallet,
  UserCircle, Sparkles, Command, Pencil,
  Settings2, UserCog, ShoppingBag, ImageIcon,
} from 'lucide-react'
import { CMS_TABS } from '@/components/cms/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (tabId: string) => void
  onOpenSearchDialog?: () => void
  onOpenShortcuts?: () => void
}

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  action: () => void
  shortcut?: string
}

// ─── Icon Map (aligned with CMS_TABS icons) ──────────────────────────────────

const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, FileText, Image: ImagePlus, Users, UserCog, UserCircle,
  FolderKanban, Bot, BarChart3, Activity, MessageCircle, Bell, Globe, Settings, Settings2,
  CheckSquare, CalendarDays, ShoppingBag: ShoppingCart, Handshake, Receipt, Warehouse, Wallet,
  Sparkles,
}

// ─── Category Labels ────────────────────────────────────────────────────────

const categoryLabels: Record<string, string> = {
  navigation: 'صفحات',
  actions: 'عملیات سریع',
  help: 'راهنما',
}

const categoryOrder: string[] = ['actions', 'navigation', 'help']

// ─── Main Component ────────────────────────────────────────────────────────

export default function CommandPalette({
  open,
  onOpenChange,
  onNavigate,
  onOpenSearchDialog,
  onOpenShortcuts,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // ─── Build commands ────────────────────────────────────────────────────

  const allCommands = useMemo((): CommandItem[] => {
    // Navigation items from CMS tabs
    const navItems: CommandItem[] = CMS_TABS.map(tab => ({
      id: `nav-${tab.id}`,
      title: tab.name,
      description: `رفتن به صفحه ${tab.name}`,
      icon: iconComponents[tab.icon] ?? Settings,
      category: 'navigation',
      action: () => {
        onNavigate(tab.id)
        onOpenChange(false)
      },
    }))

    // Quick action items
    const actions: CommandItem[] = [
      {
        id: 'action-new-post',
        title: 'ایجاد مطلب جدید',
        description: 'شروع نوشتن مطلب جدید',
        icon: Pencil,
        category: 'actions',
        action: () => {
          onNavigate('content')
          onOpenChange(false)
        },
        shortcut: '⌘N',
      },
      {
        id: 'action-new-task',
        title: 'وظیفه جدید',
        description: 'اضافه کردن وظیفه',
        icon: CheckSquare,
        category: 'actions',
        action: () => {
          onNavigate('tasks')
          onOpenChange(false)
        },
        shortcut: '⌘T',
      },
      {
        id: 'action-upload',
        title: 'آپلود رسانه',
        description: 'بارگذاری فایل جدید',
        icon: ImagePlus,
        category: 'actions',
        action: () => {
          onNavigate('media')
          onOpenChange(false)
        },
      },
      {
        id: 'action-ai',
        title: 'دستیار هوشمند',
        description: 'کمک هوش مصنوعی',
        icon: Bot,
        category: 'actions',
        action: () => {
          onNavigate('ai-assistant')
          onOpenChange(false)
        },
        shortcut: '⌘J',
      },
    ]

    // Help items
    const help: CommandItem[] = [
      {
        id: 'help-shortcuts',
        title: 'میانبرهای کلیدی',
        description: 'مشاهده تمام میانبرها',
        icon: Command,
        category: 'help',
        action: () => {
          onOpenShortcuts?.()
          onOpenChange(false)
        },
        shortcut: '⌘/',
      },
      {
        id: 'help-search',
        title: 'جستجوی پیشرفته در محتوا',
        description: 'جستجوی عمیق در مطالب و داده‌ها',
        icon: Search,
        category: 'help',
        action: () => {
          onOpenSearchDialog?.()
          onOpenChange(false)
        },
      },
    ]

    return [...actions, ...navItems, ...help]
  }, [onNavigate, onOpenChange, onOpenSearchDialog, onOpenShortcuts])

  // ─── Filter commands ──────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands
    const q = query.toLowerCase()
    return allCommands.filter(
      cmd =>
        cmd.title.includes(q) ||
        cmd.description?.includes(q) ||
        cmd.category.includes(q) ||
        categoryLabels[cmd.category]?.includes(q),
    )
  }, [allCommands, query])

  // ─── Reset selection on query change ───────────────────────────────────

  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setSelectedIndex(0)
  }

  // ─── Focus input on open ──────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // ─── Keyboard navigation ──────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault()
        filtered[selectedIndex].action()
      }
    },
    [filtered, selectedIndex],
  )

  // ─── Handle select ────────────────────────────────────────────────────

  const handleSelect = useCallback(
    (cmd: CommandItem) => {
      cmd.action()
      setQuery('')
    },
    [],
  )

  // ─── Group by category (maintaining order) ────────────────────────────

  const grouped = useMemo(() => {
    const groups: { category: string; label: string; items: CommandItem[] }[] = []
    const catMap = new Map<string, CommandItem[]>()

    filtered.forEach(cmd => {
      if (!catMap.has(cmd.category)) catMap.set(cmd.category, [])
      catMap.get(cmd.category)!.push(cmd)
    })

    for (const cat of categoryOrder) {
      const items = catMap.get(cat)
      if (items) {
        groups.push({ category: cat, label: categoryLabels[cat] ?? cat, items })
      }
    }

    // Any remaining categories not in the order
    for (const [cat, items] of catMap) {
      if (!categoryOrder.includes(cat)) {
        groups.push({ category: cat, label: categoryLabels[cat] ?? cat, items })
      }
    }

    return groups
  }, [filtered])

  // ─── Compute flat index for a given item ──────────────────────────────

  const getFlatIndex = useCallback(
    (category: string, itemIdx: number) => {
      let idx = 0
      for (const group of grouped) {
        if (group.category === category) {
          return idx + itemIdx
        }
        idx += group.items.length
      }
      return 0
    },
    [grouped],
  )

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        onOpenChange(v)
        if (!v) setQuery('')
      }}
    >
      <DialogContent
        className="glass-card sm:max-w-xl p-0 gap-0 overflow-hidden max-h-[80vh]"
        dir="rtl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>پالت فرمان</DialogTitle>
        </DialogHeader>

        {/* ─── Search Input ─────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-sm shrink-0">
            <Command className="h-4 w-4 text-white" />
          </div>
          <Input
            ref={inputRef}
            placeholder="جستجوی فرمان یا صفحه..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto p-0 text-sm placeholder:text-muted-foreground/50"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* ─── Results ──────────────────────────────────────────────── */}
        <ScrollArea className="max-h-[50vh]" dir="rtl">
          <div className="p-2" onKeyDown={handleKeyDown}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Search className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm">نتیجه‌ای یافت نشد</p>
                <p className="text-xs mt-1 opacity-60">عبارت دیگری را جستجو کنید</p>
              </div>
            ) : (
              grouped.map(group => (
                <div key={group.category} className="mb-1">
                  {/* Category header */}
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
                    <div className={`h-1 w-3 rounded-full ${
                      group.category === 'actions'
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                        : group.category === 'navigation'
                          ? 'bg-gradient-to-r from-cyan-500 to-sky-500'
                          : 'bg-gradient-to-r from-amber-400 to-orange-500'
                    }`} />
                    {group.label}
                  </div>

                  {/* Items */}
                  {group.items.map((item, itemIdx) => {
                    const flatIdx = getFlatIndex(group.category, itemIdx)
                    const isSelected = flatIdx === selectedIndex
                    const Icon = item.icon

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(flatIdx)}
                        className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-right transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 shadow-sm'
                            : 'hover:bg-accent/60 text-foreground'
                        }`}
                      >
                        <div
                          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150 ${
                            isSelected
                              ? 'bg-violet-500/20 text-violet-600 dark:text-violet-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          {item.description && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        {item.shortcut && (
                          <kbd className="hidden sm:inline-flex items-center rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* ─── Footer ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border/30 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-mono">↑↓</kbd>
            {' '}ناوبری
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-mono">↵</kbd>
            {' '}انتخاب
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border/60 bg-muted/50 px-1 py-0.5 font-mono">ESC</kbd>
            {' '}بستن
          </span>
          <Badge className="badge-gradient text-[9px] ml-auto">{filtered.length} فرمان</Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}
