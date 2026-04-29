'use client'

import { useSyncExternalStore, useCallback, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import {
  Sun,
  Moon,
  Palette,
  LayoutGrid,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Constants ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cms-theme-switcher-prefs'

const ACCENT_COLORS = [
  { name: 'بنفش', value: 'violet', hex: '#8b5cf6', tailwindBg: 'bg-violet-500' },
  { name: 'فیروزه‌ای', value: 'cyan', hex: '#06b6d4', tailwindBg: 'bg-cyan-500' },
  { name: 'سبز', value: 'emerald', hex: '#10b981', tailwindBg: 'bg-emerald-500' },
  { name: 'صورتی', value: 'rose', hex: '#f43f5e', tailwindBg: 'bg-rose-500' },
  { name: 'کهربایی', value: 'amber', hex: '#f59e0b', tailwindBg: 'bg-amber-500' },
  { name: 'خاکستری', value: 'slate', hex: '#64748b', tailwindBg: 'bg-slate-500' },
]

type SidebarDensity = 'compact' | 'default' | 'comfortable'

const SIDEBAR_DENSITY_OPTIONS: Array<{ value: SidebarDensity; label: string }> = [
  { value: 'compact', label: 'فشرده' },
  { value: 'default', label: 'پیش‌فرض' },
  { value: 'comfortable', label: 'راحت' },
]

interface ThemeSwitcherPrefs {
  accentColor: string
  sidebarDensity: SidebarDensity
}

const DEFAULT_PREFS: ThemeSwitcherPrefs = {
  accentColor: 'violet',
  sidebarDensity: 'default',
}

// ─── External Store (hydration-safe) ──────────────────────────────────────

let prefsListeners: Array<() => void> = []
let prefsCache: ThemeSwitcherPrefs | null = null

function getPrefsSnapshot(): ThemeSwitcherPrefs {
  if (prefsCache !== null) return prefsCache
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    prefsCache = raw ? JSON.parse(raw) : DEFAULT_PREFS
  } catch {
    prefsCache = DEFAULT_PREFS
  }
  return prefsCache
}

function getPrefsServerSnapshot(): ThemeSwitcherPrefs {
  return DEFAULT_PREFS
}

function subscribeToPrefs(callback: () => void): () => void {
  prefsListeners.push(callback)
  return () => {
    prefsListeners = prefsListeners.filter(l => l !== callback)
  }
}

function emitPrefsChange(): void {
  prefsCache = null
  for (const listener of prefsListeners) {
    listener()
  }
}

function applyPrefsToDOM(prefs: ThemeSwitcherPrefs): void {
  if (typeof window === 'undefined') return
  const color = ACCENT_COLORS.find(c => c.value === prefs.accentColor)
  if (color) {
    document.documentElement.style.setProperty('--cms-accent', color.hex)
  }
  document.documentElement.setAttribute('data-sidebar-density', prefs.sidebarDensity)
}

function updateAndApplyPrefs(updater: (prev: ThemeSwitcherPrefs) => ThemeSwitcherPrefs): void {
  const next = updater(getPrefsSnapshot())
  // Persist
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // localStorage full — silently fail
    }
  }
  applyPrefsToDOM(next)
  emitPrefsChange()
}

// Apply stored prefs to DOM on first load (client-side only)
if (typeof window !== 'undefined') {
  applyPrefsToDOM(getPrefsSnapshot())
}

// ─── Component ────────────────────────────────────────────────────────────

export default function ThemeSwitcherWidget() {
  const { theme, setTheme } = useTheme()
  const prefs = useSyncExternalStore(subscribeToPrefs, getPrefsSnapshot, getPrefsServerSnapshot)

  const handleAccentChange = useCallback((value: string) => {
    updateAndApplyPrefs(prev => ({ ...prev, accentColor: value }))
    const colorName = ACCENT_COLORS.find(c => c.value === value)?.name ?? value
    toast.success(`رنگ تأکید: ${colorName}`)
  }, [])

  const handleDensityChange = useCallback((value: SidebarDensity) => {
    updateAndApplyPrefs(prev => ({ ...prev, sidebarDensity: value }))
    const labels: Record<SidebarDensity, string> = { compact: 'فشرده', default: 'پیش‌فرض', comfortable: 'راحت' }
    toast.success(`تراکم نوار کناری: ${labels[value]}`)
  }, [])

  const handleThemeToggle = useCallback((target: 'light' | 'dark') => {
    setTheme(target)
    toast.success(target === 'dark' ? 'حالت تاریک فعال شد' : 'حالت روشن فعال شد')
  }, [setTheme])

  const isDark = theme === 'dark'

  return (
    <div className="fixed bottom-20 right-6 z-40" dir="rtl">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            className={`
              h-11 w-11 rounded-full shadow-lg hover:shadow-xl
              transition-all duration-300 hover:scale-110 active:scale-95
              cursor-pointer relative
              ${
                isDark
                  ? 'bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700'
                  : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600'
              }
              text-white
            `}
            aria-label="تغییر ظاهر"
          >
            <span className="absolute inset-0 rounded-full border-2 border-violet-400/40 animate-ping opacity-30" />
            <Palette className="h-5 w-5 relative" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="end"
          sideOffset={12}
          className="w-[300px] p-0 rounded-xl glass-card card-elevated border-border/60 overflow-hidden"
          dir="rtl"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-l from-violet-50/80 to-white/80 dark:from-violet-900/20 dark:to-gray-900/80">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-violet-500/25">
                <Palette className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">تنظیمات ظاهر</h3>
                <p className="text-[11px] text-muted-foreground">شخصی‌سازی نمایش سیستم</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* ─── Light / Dark Mode Toggle ─── */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                {isDark ? (
                  <Moon className="h-3.5 w-3.5 text-violet-400" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                )}
                حالت نمایش
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { if (isDark) handleThemeToggle('light') }}
                  className={`
                    flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium
                    transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer
                    ${
                      !isDark
                        ? 'bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-sm shadow-amber-400/30 ring-2 ring-amber-400/30'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Sun className="h-4 w-4" />
                  <span>روشن</span>
                </button>
                <button
                  onClick={() => { if (!isDark) handleThemeToggle('dark') }}
                  className={`
                    flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium
                    transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer
                    ${
                      isDark
                        ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-sm shadow-slate-500/30 ring-2 ring-slate-500/30'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Moon className="h-4 w-4" />
                  <span>تاریک</span>
                </button>
              </div>
            </div>

            {/* ─── Accent Color Picker ─── */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ACCENT_COLORS.find(c => c.value === prefs.accentColor)?.hex ?? '#8b5cf6' }}
                />
                رنگ تأکید
              </Label>
              <div className="flex items-center gap-2.5">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleAccentChange(color.value)}
                    className={`
                      group relative w-9 h-9 rounded-full transition-all duration-200
                      hover:scale-110 active:scale-95 cursor-pointer
                      ${color.tailwindBg}
                      ${
                        prefs.accentColor === color.value
                          ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/40 scale-110'
                          : 'hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:ring-foreground/20'
                      }
                    `}
                    title={color.name}
                    aria-label={`رنگ ${color.name}`}
                  >
                    {prefs.accentColor === color.value && (
                      <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-sm" />
                    )}
                    {/* Tooltip on hover */}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-medium text-foreground bg-popover border border-border rounded-md px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm">
                      {color.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Sidebar Density ─── */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                تراکم نوار کناری
              </Label>
              <div className="flex gap-2">
                {SIDEBAR_DENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleDensityChange(opt.value)}
                    className={`
                      flex-1 py-2.5 px-2 rounded-xl text-xs font-medium
                      transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer
                      ${
                        prefs.sidebarDensity === opt.value
                          ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm shadow-violet-500/30'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <span className="block">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-border/40 bg-muted/30">
            <p className="text-[10px] text-muted-foreground/70 text-center">
              تنظیمات به‌صورت خودکار ذخیره می‌شوند
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
