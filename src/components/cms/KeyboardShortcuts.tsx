'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  LayoutDashboard, FileText, Image as ImageIcon, Users, Search, Keyboard,
  Moon, Sun, Bot, CheckSquare, CalendarDays, Sparkles, Zap, ChevronLeft,
} from 'lucide-react'

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ShortcutItem {
  keys: string[]
  label: string
  icon: React.ReactNode
  discovered?: boolean
}

interface ShortcutGroup {
  title: string
  description: string
  gradient: string
  shortcuts: ShortcutItem[]
}

// ─── Shortcut Groups ─────────────────────────────────────────────────────────

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'ناوبری سریع',
    description: 'دسترسی سریع به بخش‌های اصلی',
    gradient: 'from-violet-500 to-purple-600',
    shortcuts: [
      { keys: ['⌘K', 'Ctrl+K'], label: 'جستجوی سریع', icon: <Search className="h-4 w-4" /> },
      { keys: ['⌘1'], label: 'داشبورد', icon: <LayoutDashboard className="h-4 w-4" /> },
      { keys: ['⌘2'], label: 'محتوا', icon: <FileText className="h-4 w-4" /> },
      { keys: ['⌘3'], label: 'رسانه', icon: <ImageIcon className="h-4 w-4" /> },
      { keys: ['⌘4'], label: 'کاربران', icon: <Users className="h-4 w-4" /> },
      { keys: ['⌘5'], label: 'وظایف', icon: <CheckSquare className="h-4 w-4" /> },
      { keys: ['⌘6'], label: 'تقویم', icon: <CalendarDays className="h-4 w-4" /> },
    ],
  },
  {
    title: 'عملیات هوشمند',
    description: 'ابزارهای هوشمند و تنظیمات سریع',
    gradient: 'from-cyan-500 to-teal-600',
    shortcuts: [
      { keys: ['⌘D'], label: 'تغییر حالت تاریک/روشن', icon: <Moon className="h-4 w-4" /> },
      { keys: ['⌘J'], label: 'دستیار هوشمند AI', icon: <Bot className="h-4 w-4" /> },
    ],
  },
  {
    title: 'نمایش و راهنما',
    description: 'دسترسی به راهنمای کلیدهای میانبر',
    gradient: 'from-rose-500 to-pink-600',
    shortcuts: [
      { keys: ['⌘/', 'Ctrl+/'], label: 'راهنمای کلیدهای میانبر', icon: <Keyboard className="h-4 w-4" /> },
      { keys: ['?'], label: 'نمایش میانبرها', icon: <Keyboard className="h-4 w-4" /> },
    ],
  },
]

// ─── Keyboard Key Component (Mac-style keycap) ─────────────────────────────────

function KeyCap({ children, size = 'sm' }: { children: React.ReactNode; size?: 'sm' | 'md' }) {
  const sizeClasses = size === 'md' ? 'min-w-[32px] h-[32px] px-3 text-xs' : 'min-w-[24px] h-[24px] px-2 text-[11px]'

  return (
    <kbd className={`inline-flex items-center justify-center ${sizeClasses} font-mono font-medium
      rounded-md border border-border/80
      bg-gradient-to-b from-white to-gray-100
      dark:from-gray-800 dark:to-gray-900
      text-foreground/80 dark:text-foreground/70
      shadow-[0_1px_0_0_rgb(0_0_0/0.08),0_1px_2px_rgb(0_0_0/0.06),inset_0_-1px_0_0_rgb(0_0_0/0.1)]
      dark:shadow-[0_1px_0_0_rgb(0_0_0/0.3),inset_0_-1px_0_0_rgb(0_0_0/0.15)]
      transition-all duration-150
      select-none
    `}>
      {children}
    </kbd>
  )
}

function KbdGroup({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {keys.map((key, i) => {
        // Parse compound keys like "Ctrl+K" or "⌘K"
        const parts = key.includes('+')
          ? key.split('+')
          : [key]

        return (
          <span key={i} className="kbd-group flex items-center">
            {parts.map((part, j) => (
              <span key={j} className="flex items-center">
                {j > 0 && (
                  <span className="kbd-separator text-[10px] text-muted-foreground/60 mx-0.5">+</span>
                )}
                <KeyCap>{part}</KeyCap>
              </span>
            ))}
            {i < keys.length - 1 && (
              <span className="text-[10px] text-muted-foreground/40 mx-1">/</span>
            )}
          </span>
        )
      })}
    </div>
  )
}

// ─── Recently Used Shortcuts Tracker ────────────────────────────────────────────

const RECENT_SHORTCUTS_KEY = 'cms-recent-shortcuts'

function getRecentShortcuts(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_SHORTCUTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function trackShortcut(label: string): void {
  if (typeof window === 'undefined') return
  try {
    const current = getRecentShortcuts().filter((s) => s !== label)
    current.unshift(label)
    localStorage.setItem(RECENT_SHORTCUTS_KEY, JSON.stringify(current.slice(0, 6)))
  } catch { /* ignore */ }
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  const [discoveredSet, setDiscoveredSet] = useState<Set<string>>(new Set())
  const [newlyDiscovered, setNewlyDiscovered] = useState<string | null>(null)
  const prevOpenRef = useRef(false)

  // Track dialog open for recent shortcuts
  const recentShortcuts = useMemo(() => {
    if (open) return getRecentShortcuts()
    return []
  }, [open])

  // Listen for keyboard shortcuts and mark them as discovered
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      let discovered: string | null = null

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        discovered = 'جستجوی سریع'
        trackShortcut('جستجوی سریع')
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        discovered = 'تغییر حالت تاریک/روشن'
        trackShortcut('تغییر حالت تاریک/روشن')
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        discovered = 'دستیار هوشمند AI'
        trackShortcut('دستیار هوشمند AI')
      } else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        discovered = 'راهنمای کلیدهای میانبر'
        trackShortcut('راهنمای کلیدهای میانبر')
      } else if (e.key === '?') {
        discovered = 'نمایش میانبرها'
        trackShortcut('نمایش میانبرها')
      } else if ((e.metaKey || e.ctrlKey) && ['1','2','3','4','5','6'].includes(e.key)) {
        const labels: Record<string, string> = {
          '1': 'داشبورد', '2': 'محتوا', '3': 'رسانه', '4': 'کاربران', '5': 'وظایف', '6': 'تقویم',
        }
        discovered = labels[e.key] || ''
        if (discovered) trackShortcut(discovered)
      }

      if (discovered) {
        setDiscoveredSet((prev) => {
          const next = new Set(prev)
          if (!prev.has(discovered)) {
            next.add(discovered)
            setNewlyDiscovered(discovered)
            setTimeout(() => setNewlyDiscovered(null), 2000)
          }
          return next
        })
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Reset newly discovered when dialog closes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) setNewlyDiscovered(null)
  }, [onOpenChange])

  // Find all shortcut labels for recent section
  const allShortcutLabels = shortcutGroups.flatMap((g) => g.shortcuts.map((s) => s.label))
  const recentFiltered = recentShortcuts.filter((label) => allShortcutLabels.includes(label))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg glass-card shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 fade-in duration-200" dir="rtl">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-6 py-5 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-lg font-bold flex items-center gap-2.5 text-white">
              <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Keyboard className="h-4.5 w-4.5 text-white" />
              </div>
              کلیدهای میانبر
            </DialogTitle>
            <DialogDescription className="text-white/80 text-xs mt-1">
              برای افزایش سرعت کار از کلیدهای میانبر استفاده کنید
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Shortcuts content */}
        <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-modal">

          {/* ─── Recently Used Section ─── */}
          {recentFiltered.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                <h3 className="text-sm font-semibold">اخیراً استفاده شده</h3>
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="grid gap-1.5">
                {recentFiltered.map((label) => {
                  const shortcut = shortcutGroups
                    .flatMap((g) => g.shortcuts)
                    .find((s) => s.label === label)
                  if (!shortcut) return null

                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/40 dark:border-amber-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">
                          {shortcut.icon}
                        </div>
                        <span className="text-sm font-medium">{shortcut.label}</span>
                      </div>
                      <KbdGroup keys={shortcut.keys} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── All Shortcuts by Category ─── */}
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              {/* Group header */}
              <div className="flex items-center gap-2">
                <div className={`h-1 w-4 rounded-full bg-gradient-to-r ${group.gradient}`} />
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <span className="text-xs text-muted-foreground">{group.description}</span>
              </div>

              {/* Group shortcuts */}
              <div className="grid gap-1.5">
                {group.shortcuts.map((shortcut) => {
                  const isDiscovered = discoveredSet.has(shortcut.label)
                  const isNewlyDiscovered = newlyDiscovered === shortcut.label

                  return (
                    <div
                      key={shortcut.label}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group/item
                        ${isNewlyDiscovered
                          ? 'bg-gradient-to-br from-violet-100/60 to-fuchsia-100/60 dark:from-violet-900/20 dark:to-fuchsia-900/20 border border-violet-300/50 dark:border-violet-700/30 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                          : 'bg-gradient-to-br from-muted/50 to-muted/30 hover:from-muted/80 hover:to-muted/60 border border-border/40 hover:border-border/70'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`text-muted-foreground group-hover/item:text-foreground transition-colors ${isNewlyDiscovered ? 'text-violet-500' : ''}`}>
                          {shortcut.icon}
                        </div>
                        <span className="text-sm font-medium">{shortcut.label}</span>
                        {/* Discovery badge */}
                        {isDiscovered && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium">
                            استفاده شده
                          </span>
                        )}
                        {isNewlyDiscovered && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 font-medium animate-pulse">
                            جدید!
                          </span>
                        )}
                      </div>
                      <KbdGroup keys={shortcut.keys} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-border/40 bg-muted/20">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <KeyCap size="md">Esc</KeyCap>
            <span>برای بستن</span>
            <span className="mx-2 text-border">|</span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>میانبرهای کشف شده</span>
              <span className="font-bold text-violet-500">{discoveredSet.size}/{allShortcutLabels.length}</span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function KeyboardShortcutsTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="w-full flex items-center gap-2.5 rounded-lg h-9 transition-all duration-200 cursor-pointer hover:bg-accent/60 px-3 text-muted-foreground hover:text-foreground btn-depth"
      onClick={onClick}
      aria-label="راهنمای کلیدهای میانبر"
    >
      <Keyboard className="h-[18px] w-[18px]" />
      <span className="text-sm flex-1 text-right">کلیدهای میانبر</span>
      <div className="kbd-group flex items-center">
        <KeyCap>⌘/</KeyCap>
      </div>
    </button>
  )
}
