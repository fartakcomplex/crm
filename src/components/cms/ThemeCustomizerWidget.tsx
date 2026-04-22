'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Palette, RotateCcw, LayoutGrid, Square } from 'lucide-react'
import { toast } from 'sonner'

// Storage key
const STORAGE_KEY = 'cms-theme-prefs'

// Accent color options
const ACCENT_COLORS = [
  { name: 'بنفش', value: '#8b5cf6', cssVar: '--accent-violet' },
  { name: 'فیروزه‌ای', value: '#06b6d4', cssVar: '--accent-cyan' },
  { name: 'سبز', value: '#10b981', cssVar: '--accent-emerald' },
  { name: 'صورتی', value: '#f43f5e', cssVar: '--accent-rose' },
  { name: 'کهربایی', value: '#f59e0b', cssVar: '--accent-amber' },
  { name: 'آبی', value: '#3b82f6', cssVar: '--accent-blue' },
]

// Layout density options
type Density = 'compact' | 'default' | 'spacious'
const DENSITY_OPTIONS: Array<{ value: Density; label: string; description: string }> = [
  { value: 'compact', label: 'فشرده', description: 'فاصله کمتر' },
  { value: 'default', label: 'پیش‌فرض', description: 'معمولی' },
  { value: 'spacious', label: 'جادار', description: 'فاصله بیشتر' },
]

// Border radius presets
type Radius = 'low' | 'medium' | 'high'
const RADIUS_OPTIONS: Array<{ value: Radius; label: string; size: string }> = [
  { value: 'low', label: 'کم', size: '0.375rem' },
  { value: 'medium', label: 'متوسط', size: '0.625rem' },
  { value: 'high', label: 'زیاد', size: '1rem' },
]

interface ThemePrefs {
  accentColor: string
  density: Density
  borderRadius: Radius
}

function loadPrefs(): ThemePrefs {
  if (typeof window === 'undefined') {
    return { accentColor: '#8b5cf6', density: 'default', borderRadius: 'medium' }
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return { accentColor: '#8b5cf6', density: 'default', borderRadius: 'medium' }
}

function savePrefs(prefs: ThemePrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch { /* ignore */ }
}

export default function ThemeCustomizerWidget() {
  const [prefs, setPrefs] = useState<ThemePrefs>(loadPrefs)

  // Apply accent color on mount and when changed
  useEffect(() => {
    document.documentElement.style.setProperty('--cms-accent', prefs.accentColor)
  }, [prefs.accentColor])

  // Apply density class
  useEffect(() => {
    const contentArea = document.querySelector('[data-content-area]') || document.documentElement
    // Remove all density classes first
    contentArea.classList.remove('density-compact', 'density-default', 'density-spacious')
    contentArea.classList.add(`density-${prefs.density}`)
  }, [prefs.density])

  // Apply border radius
  useEffect(() => {
    const radiusSize = RADIUS_OPTIONS.find(r => r.value === prefs.borderRadius)?.size ?? '0.625rem'
    document.documentElement.style.setProperty('--radius', radiusSize)
  }, [prefs.borderRadius])

  const setAccent = useCallback((color: string) => {
    setPrefs(prev => {
      const next = { ...prev, accentColor: color }
      savePrefs(next)
      return next
    })
  }, [])

  const setDensity = useCallback((density: Density) => {
    setPrefs(prev => {
      const next = { ...prev, density }
      savePrefs(next)
      return next
    })
    const labels: Record<Density, string> = { compact: 'فشرده', default: 'پیش‌فرض', spacious: 'جادار' }
    toast.success(`فاصله‌گذاری: ${labels[density]}`)
  }, [])

  const setRadius = useCallback((radius: Radius) => {
    setPrefs(prev => {
      const next = { ...prev, borderRadius: radius }
      savePrefs(next)
      return next
    })
  }, [])

  const handleReset = useCallback(() => {
    const defaults: ThemePrefs = { accentColor: '#8b5cf6', density: 'default', borderRadius: 'medium' }
    setPrefs(defaults)
    savePrefs(defaults)
    document.documentElement.style.setProperty('--cms-accent', '#8b5cf6')
    document.documentElement.style.setProperty('--radius', '0.625rem')
    const contentArea = document.querySelector('[data-content-area]') || document.documentElement
    contentArea.classList.remove('density-compact', 'density-default', 'density-spacious')
    contentArea.classList.add('density-default')
    toast.success('تنظیمات بازنشانی شد')
  }, [])

  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Palette className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <CardTitle className="text-base text-violet-700 dark:text-violet-300">
              سفارشی‌سازی
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-violet-500/10 gap-1 transition-all duration-200"
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3" />
            بازنشانی
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-5">
        {/* Accent Color Picker */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            رنگ تأکید
          </p>
          <div className="flex items-center gap-2.5">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setAccent(color.value)}
                className={`w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 focus-glow ${
                  prefs.accentColor === color.value
                    ? 'ring-2 ring-offset-2 ring-offset-background ring-violet-500 scale-110'
                    : 'hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:ring-gray-300 dark:hover:ring-gray-600'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                aria-label={`رنگ ${color.name}`}
              >
                {prefs.accentColor === color.value && (
                  <svg className="w-4 h-4 mx-auto text-white drop-shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Density */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <LayoutGrid className="h-3 w-3" />
            فاصله‌گذاری
          </p>
          <div className="flex gap-2">
            {DENSITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDensity(opt.value)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  prefs.density === opt.value
                    ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="block">{opt.label}</span>
                <span className={`block text-[9px] mt-0.5 ${prefs.density === opt.value ? 'text-white/70' : 'text-muted-foreground/60'}`}>
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Border Radius */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <Square className="h-3 w-3" />
            گردی گوشه
          </p>
          <div className="flex gap-2">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRadius(opt.value)}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  prefs.borderRadius === opt.value
                    ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                style={{ borderRadius: opt.size }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
