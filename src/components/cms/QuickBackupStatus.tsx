'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Clock,
  Database,
  CalendarDays,
  ArrowDownToLine,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────

interface BackupInfo {
  lastBackupTime: number | null
  backupSize: string
  nextScheduledTime: string
  status: 'recent' | 'old' | 'never'
}

type TabContext = 'content' | 'store' | 'settings' | 'dashboard' | 'other'

// ─── Helpers ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cms-quick-backup-status'

function loadBackupInfo(): BackupInfo {
  if (typeof window === 'undefined') {
    return {
      lastBackupTime: null,
      backupSize: '—',
      nextScheduledTime: '—',
      status: 'never',
    }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        lastBackupTime: null,
        backupSize: '—',
        nextScheduledTime: '—',
        status: 'never',
      }
    }
    const parsed = JSON.parse(raw)
    const lastTime = parsed.lastBackupTime ?? null
    const now = Date.now()
    const isRecent = lastTime !== null && (now - lastTime) < 24 * 60 * 60 * 1000
    const isOld = lastTime !== null && (now - lastTime) >= 24 * 60 * 60 * 1000

    return {
      lastBackupTime: lastTime,
      backupSize: parsed.backupSize || '—',
      nextScheduledTime: parsed.nextScheduledTime || '—',
      status: lastTime === null ? 'never' : isRecent ? 'recent' : 'old',
    }
  } catch {
    return {
      lastBackupTime: null,
      backupSize: '—',
      nextScheduledTime: '—',
      status: 'never',
    }
  }
}

function saveBackupInfo(info: BackupInfo) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
  } catch {
    // Storage full — silently fail
  }
}

function relativeTime(timestamp: number | null): string {
  if (timestamp === null) return 'هرگز'
  const now = Date.now()
  const diffMs = now - timestamp
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'همین الان'
  if (diffMin < 60) return `${diffMin} دقیقه پیش`
  if (diffHour < 24) return `${diffHour} ساعت پیش`
  if (diffDay < 7) return `${diffDay} روز پیش`
  return new Intl.DateTimeFormat('fa-IR').format(new Date(timestamp))
}

function persianDate(timestamp: number | null): string {
  if (timestamp === null) return '—'
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function QuickBackupStatus() {
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load backup info from localStorage on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBackupInfo(loadBackupInfo())
  }, [])

  // Simulate backup creation (updates localStorage)
  const handleCreateBackup = useCallback(() => {
    setCreatingBackup(true)
    setTimeout(() => {
      const newInfo: BackupInfo = {
        lastBackupTime: Date.now(),
        backupSize: `${(Math.random() * 10 + 5).toFixed(1)} MB`,
        nextScheduledTime: new Intl.DateTimeFormat('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
          weekday: 'long',
        }).format(new Date(Date.now() + 24 * 60 * 60 * 1000)),
        status: 'recent',
      }
      setBackupInfo(newInfo)
      saveBackupInfo(newInfo)
      setCreatingBackup(false)
      toast.success('بکاپ سریع ایجاد شد')
    }, 1500)
  }, [])

  // Status text and icon
  const statusConfig = {
    recent: {
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      label: `آخرین بکاپ: ${relativeTime(backupInfo?.lastBackupTime ?? null)}`,
      badgeClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dotClass: 'bg-emerald-500',
    },
    old: {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
      label: `آخرین بکاپ: ${relativeTime(backupInfo?.lastBackupTime ?? null)}`,
      badgeClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      dotClass: 'bg-amber-500',
    },
    never: {
      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />,
      label: 'بکاپی ایجاد نشده',
      badgeClass: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      dotClass: 'bg-rose-500',
    },
  }

  const status = backupInfo?.status ?? 'never'
  const config = statusConfig[status]

  if (!backupInfo) return null

  return (
    <div ref={containerRef} className="fixed bottom-2 left-1/2 -translate-x-1/2 z-30" dir="rtl">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-full
              glass-card card-elevated
              border border-border/50
              text-xs font-medium
              cursor-pointer
              hover:scale-[1.02] active:scale-[0.98]
              transition-all duration-200
              ${config.badgeClass}
            `}
            aria-label="وضعیت بکاپ"
          >
            <span className={`w-2 h-2 rounded-full ${config.dotClass} animate-pulse`} />
            {config.icon}
            <span>{config.label}</span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="center"
          sideOffset={8}
          className="w-[320px] p-0 overflow-hidden glass-card card-elevated rounded-xl"
          dir="rtl"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/50 bg-gradient-to-l from-emerald-50/60 to-transparent dark:from-emerald-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Database className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">وضعیت بکاپ</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
                    <span className="text-[10px] text-muted-foreground">
                      {status === 'recent' ? 'بروزرسانی شده' : status === 'old' ? 'نیاز به بکاپ' : 'بدون بکاپ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-4 space-y-3">
            {/* Last Backup */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground">آخرین بکاپ</p>
                <p className="text-xs font-medium truncate">
                  {backupInfo.lastBackupTime !== null
                    ? persianDate(backupInfo.lastBackupTime)
                    : '—'}
                </p>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Backup Size */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground">حجم بکاپ</p>
                <p className="text-xs font-medium">{backupInfo.backupSize}</p>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Next Scheduled */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-background border border-border/50 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground">بکاپ بعدی</p>
                <p className="text-xs font-medium">{backupInfo.nextScheduledTime}</p>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="px-4 py-3 border-t border-border/50 bg-background/30">
            <Button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              size="sm"
              className={`
                w-full gap-2 text-xs
                bg-gradient-to-l from-emerald-600 to-teal-500
                hover:from-emerald-700 hover:to-teal-600
                text-white shadow-sm
                hover:scale-[1.01] active:scale-[0.99]
                transition-all duration-200
                cursor-pointer
              `}
            >
              {creatingBackup ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  در حال ایجاد...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  بکاپ سریع
                </>
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
