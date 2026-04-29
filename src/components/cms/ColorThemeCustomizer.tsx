'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, Palette, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Types ───────────────────────────────────────────────────────────────

interface ColorTheme {
  id: string
  label: string
  value: string
  gradient: string
  ringClass: string
  textClass: string
  swatchClass: string
  previewBg: string
  previewBorder: string
}

const STORAGE_KEY = 'cms-accent-color'

// ─── 8 Preset Color Themes ───────────────────────────────────────────────

const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'violet',
    label: 'بنفش',
    value: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
    ringClass: 'ring-violet-500',
    textClass: 'text-violet-700 dark:text-violet-300',
    swatchClass: 'bg-violet-500',
    previewBg: 'bg-violet-50 dark:bg-violet-950/30',
    previewBorder: 'border-violet-200 dark:border-violet-800/30',
  },
  {
    id: 'blue',
    label: 'آبی',
    value: '#3b82f6',
    gradient: 'from-blue-500 to-blue-600',
    ringClass: 'ring-blue-500',
    textClass: 'text-blue-700 dark:text-blue-300',
    swatchClass: 'bg-blue-500',
    previewBg: 'bg-blue-50 dark:bg-blue-950/30',
    previewBorder: 'border-blue-200 dark:border-blue-800/30',
  },
  {
    id: 'green',
    label: 'سبز',
    value: '#10b981',
    gradient: 'from-emerald-500 to-green-600',
    ringClass: 'ring-emerald-500',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    swatchClass: 'bg-emerald-500',
    previewBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    previewBorder: 'border-emerald-200 dark:border-emerald-800/30',
  },
  {
    id: 'orange',
    label: 'نارنجی',
    value: '#f97316',
    gradient: 'from-orange-500 to-orange-600',
    ringClass: 'ring-orange-500',
    textClass: 'text-orange-700 dark:text-orange-300',
    swatchClass: 'bg-orange-500',
    previewBg: 'bg-orange-50 dark:bg-orange-950/30',
    previewBorder: 'border-orange-200 dark:border-orange-800/30',
  },
  {
    id: 'pink',
    label: 'صورتی',
    value: '#ec4899',
    gradient: 'from-pink-500 to-pink-600',
    ringClass: 'ring-pink-500',
    textClass: 'text-pink-700 dark:text-pink-300',
    swatchClass: 'bg-pink-500',
    previewBg: 'bg-pink-50 dark:bg-pink-950/30',
    previewBorder: 'border-pink-200 dark:border-pink-800/30',
  },
  {
    id: 'red',
    label: 'قرمز',
    value: '#ef4444',
    gradient: 'from-red-500 to-red-600',
    ringClass: 'ring-red-500',
    textClass: 'text-red-700 dark:text-red-300',
    swatchClass: 'bg-red-500',
    previewBg: 'bg-red-50 dark:bg-red-950/30',
    previewBorder: 'border-red-200 dark:border-red-800/30',
  },
  {
    id: 'teal',
    label: 'آبی‌تیز',
    value: '#14b8a6',
    gradient: 'from-teal-500 to-teal-600',
    ringClass: 'ring-teal-500',
    textClass: 'text-teal-700 dark:text-teal-300',
    swatchClass: 'bg-teal-500',
    previewBg: 'bg-teal-50 dark:bg-teal-950/30',
    previewBorder: 'border-teal-200 dark:border-teal-800/30',
  },
  {
    id: 'amber',
    label: 'زرد',
    value: '#f59e0b',
    gradient: 'from-amber-500 to-amber-600',
    ringClass: 'ring-amber-500',
    textClass: 'text-amber-700 dark:text-amber-300',
    swatchClass: 'bg-amber-500',
    previewBg: 'bg-amber-50 dark:bg-amber-950/30',
    previewBorder: 'border-amber-200 dark:border-amber-800/30',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ─── Component ───────────────────────────────────────────────────────────

export function ColorThemeCustomizer() {
  const [selectedId, setSelectedId] = useState(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY)
      if (val) return val
    } catch {
      // ignore
    }
    return 'violet'
  })
  const [isAnimating, setIsAnimating] = useState(false)

  const applyTheme = useCallback((themeId: string) => {
    const theme = COLOR_THEMES.find((t) => t.id === themeId)
    if (!theme) return

    const root = document.documentElement
    root.style.setProperty('--accent', theme.value)
    root.style.setProperty(
      '--accent-rgb',
      hexToRgba(theme.value, 1).replace('rgba(', '').replace(', 1)', ''),
    )
    root.style.setProperty(
      '--accent-glow',
      hexToRgba(theme.value, 0.3),
    )
  }, [])

  // Apply theme on mount
  useEffect(() => {
    applyTheme(selectedId)
  }, [applyTheme, selectedId])

  const handleSelect = useCallback(
    (themeId: string) => {
      if (themeId === selectedId) return
      setIsAnimating(true)
      setSelectedId(themeId)
      applyTheme(themeId)
      try {
        localStorage.setItem(STORAGE_KEY, themeId)
      } catch {
        // ignore
      }
      setTimeout(() => setIsAnimating(false), 500)
    },
    [selectedId, applyTheme],
  )

  const activeTheme = COLOR_THEMES.find((t) => t.id === selectedId)!

  return (
    <div
      className="glass-card glass-card-violet rounded-xl overflow-hidden animate-in"
      dir="rtl"
    >
      {/* ─── Header ─── */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/30">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-sm">
          <Palette className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-semibold block leading-tight">
            رنگ تم
          </span>
          <span className="text-[10px] text-muted-foreground">
            رنگ اصلی سیستم را تغییر دهید
          </span>
        </div>
      </div>

      {/* ─── Color Swatches ─── */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3 stagger-children">
          {COLOR_THEMES.map((theme) => {
            const isSelected = theme.id === selectedId
            return (
              <button
                key={theme.id}
                className="flex flex-col items-center gap-2 group cursor-pointer"
                onClick={() => handleSelect(theme.id)}
              >
                {/* Swatch circle */}
                <div
                  className={`w-10 h-10 rounded-full ${theme.swatchClass} transition-all duration-300 flex items-center justify-center ${
                    isSelected
                      ? `ring-2 ring-offset-2 ring-offset-background ${theme.ringClass} scale-110 shadow-lg`
                      : 'opacity-60 group-hover:opacity-100 group-hover:scale-105'
                  }`}
                >
                  {isSelected && (
                    <Check
                      className={`h-4 w-4 text-white ${isAnimating ? 'scale-in' : ''}`}
                    />
                  )}
                </div>
                {/* Label */}
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isSelected
                      ? theme.textClass
                      : 'text-muted-foreground'
                  }`}
                >
                  {theme.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* ─── Preview Card ─── */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">
              پیش‌نمایش
            </span>
          </div>
          <div
            className={`rounded-lg p-3 border transition-all duration-500 ${activeTheme.previewBg} ${activeTheme.previewBorder}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-md bg-gradient-to-br ${activeTheme.gradient} flex items-center justify-center shadow-sm transition-all duration-500`}
              >
                <Palette className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1">
                <p className={`text-xs font-semibold ${activeTheme.textClass}`}>
                  نمونه کارت
                </p>
                <p className="text-[10px] text-muted-foreground">
                  رنگ {activeTheme.label} فعال است
                </p>
              </div>
              <Button
                size="sm"
                className={`h-6 px-3 text-[10px] bg-gradient-to-r ${activeTheme.gradient} text-white border-0 shadow-sm hover:opacity-90 transition-all duration-500`}
              >
                دکمه
              </Button>
            </div>
            {/* Decorative gradient bar */}
            <div
              className={`mt-2 h-1 rounded-full bg-gradient-to-l ${activeTheme.gradient} transition-all duration-500`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColorThemeCustomizer
