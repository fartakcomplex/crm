'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Info, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────

type AnnouncementType = 'info' | 'warning' | 'success' | 'update'

export interface Announcement {
  id: string
  message: string
  type: AnnouncementType
}

// ─── Style Configurations ───────────────────────────────────────────────

const TYPE_STYLES: Record<
  AnnouncementType,
  {
    bg: string
    darkBg: string
    icon: React.ComponentType<{ className?: string }>
    iconColor: string
    progressBg: string
    progressTrack: string
  }
> = {
  info: {
    bg: 'bg-blue-600',
    darkBg: 'dark:bg-blue-500',
    icon: Info,
    iconColor: 'text-blue-100 dark:text-blue-100',
    progressBg: 'bg-blue-300',
    progressTrack: 'bg-blue-800',
  },
  warning: {
    bg: 'bg-amber-600',
    darkBg: 'dark:bg-amber-500',
    icon: AlertTriangle,
    iconColor: 'text-amber-100 dark:text-amber-100',
    progressBg: 'bg-amber-300',
    progressTrack: 'bg-amber-800',
  },
  success: {
    bg: 'bg-emerald-600',
    darkBg: 'dark:bg-emerald-500',
    icon: CheckCircle2,
    iconColor: 'text-emerald-100 dark:text-emerald-100',
    progressBg: 'bg-emerald-300',
    progressTrack: 'bg-emerald-800',
  },
  update: {
    bg: 'bg-violet-600',
    darkBg: 'dark:bg-violet-500',
    icon: Sparkles,
    iconColor: 'text-violet-100 dark:text-violet-100',
    progressBg: 'bg-violet-300',
    progressTrack: 'bg-violet-800',
  },
}

// ─── Sample Announcements ───────────────────────────────────────────────

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'v2.1-release',
    message: 'نسخه ۲.۱ Smart CMS منتشر شد! 🎉',
    type: 'update',
  },
  {
    id: 'backup-success',
    message: 'پشتیبان‌گیری خودکار با موفقیت انجام شد',
    type: 'success',
  },
  {
    id: 'security-update',
    message: 'بروزرسانی امنیتی جدید در دسترس است',
    type: 'warning',
  },
]

// ─── Constants ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'cms-dismissed-announcements'
const CYCLE_DURATION_MS = 6000 // 6 seconds per announcement

// ─── Helpers ────────────────────────────────────────────────────────────

function getDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function saveDismissedIds(ids: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

// ─── Component ──────────────────────────────────────────────────────────

export default function AnnouncementBanner({
  announcements = DEFAULT_ANNOUNCEMENTS,
  cycleDuration = CYCLE_DURATION_MS,
}: {
  announcements?: Announcement[]
  cycleDuration?: number
}) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Filter out dismissed announcements
  const activeAnnouncements = announcements.filter(a => !dismissedIds.has(a.id))

  // Mount: load dismissed state from localStorage, animate in
  useEffect(() => {
    const ids = getDismissedIds()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time localStorage hydration
    setDismissedIds(ids)
    setMounted(true)
    // Trigger slide-down entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    })
  }, [])

  // Reset progress when announcement changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset progress on announcement change
    setProgress(0)

    // Start progress bar interval
    const tickMs = 50
    const increment = (tickMs / cycleDuration) * 100

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment
        if (next >= 100) return 100
        return next
      })
    }, tickMs)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [currentIndex, cycleDuration, activeAnnouncements.length])

  // Auto-cycle to next announcement
  useEffect(() => {
    if (activeAnnouncements.length <= 1) return

    if (cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current)
    }

    cycleTimeoutRef.current = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % activeAnnouncements.length)
    }, cycleDuration)

    return () => {
      if (cycleTimeoutRef.current) {
        clearTimeout(cycleTimeoutRef.current)
      }
    }
  }, [currentIndex, cycleDuration, activeAnnouncements.length])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current)
    }
  }, [])

  const handleDismiss = useCallback(
    (id: string) => {
      setIsExiting(true)

      setTimeout(() => {
        const nextDismissed = new Set(dismissedIds)
        nextDismissed.add(id)
        setDismissedIds(nextDismissed)
        saveDismissedIds(nextDismissed)
        setIsExiting(false)

        // Move to next if the current one was dismissed
        const remaining = announcements.filter(a => !nextDismissed.has(a.id))
        if (remaining.length === 0) {
          // All dismissed — hide banner
          setIsVisible(false)
          return
        }

        // Adjust currentIndex if needed
        setCurrentIndex(prev => {
          const maxIdx = remaining.length - 1
          return prev > maxIdx ? 0 : prev
        })
      }, 300)
    },
    [dismissedIds, announcements],
  )

  // Don't render on server
  if (!mounted) return null

  // No active announcements
  if (activeAnnouncements.length === 0) return null

  const current = activeAnnouncements[currentIndex]
  if (!current) return null

  const styles = TYPE_STYLES[current.type]
  const Icon = styles.icon

  return (
    <div
      className={`w-full transition-all duration-300 ease-out ${
        isVisible && !isExiting
          ? 'max-h-20 opacity-100 translate-y-0'
          : 'max-h-0 opacity-0 -translate-y-3'
      } overflow-hidden`}
    >
      <div
        className={`relative ${styles.bg} ${styles.darkBg} text-white px-4 py-2.5`}
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="shrink-0 flex items-center justify-center">
            <Icon className={`h-4 w-4 ${styles.iconColor}`} />
          </div>

          {/* Message */}
          <p className="flex-1 text-sm font-medium text-white leading-relaxed min-w-0">
            {current.message}
          </p>

          {/* Counter dots (if multiple) */}
          {activeAnnouncements.length > 1 && (
            <div className="hidden sm:flex items-center gap-1.5">
              {activeAnnouncements.map((_, idx) => (
                <button
                  key={activeAnnouncements[idx].id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex
                      ? 'w-4 bg-white/80'
                      : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`اعلان ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Dismiss button */}
          <button
            onClick={() => handleDismiss(current.id)}
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/20 active:bg-white/30 transition-colors duration-150 cursor-pointer"
            aria-label="بستن اعلان"
          >
            <X className="h-3.5 w-3.5 text-white/80 hover:text-white" />
          </button>
        </div>

        {/* Progress bar */}
        {activeAnnouncements.length > 1 && (
          <div
            className={`absolute bottom-0 inset-x-0 h-0.5 ${styles.progressTrack}`}
          >
            <div
              className={`h-full ${styles.progressBg} transition-[width] duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
