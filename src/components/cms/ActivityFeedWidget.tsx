'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, LogIn, MessageCircle, Upload, Settings,
  AlertTriangle, Activity,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'

// ─── Types ──────────────────────────────────────────────────────────

interface ActivityItem {
  id: string
  action: string
  details: string
  userId: string | null
  createdAt: string
  user?: { id: string; name: string; email: string; avatar: string } | null
}

// ─── Persian relative time ─────────────────────────────────────────

function formatPersianRelativeTime(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'همین الان'
  if (minutes < 2) return '۱ دقیقه پیش'
  if (minutes < 60) return `${toPersianNum(minutes)} دقیقه پیش`
  if (hours < 2) return '۱ ساعت پیش'
  if (hours < 24) return `${toPersianNum(hours)} ساعت پیش`
  if (days < 2) return 'دیروز'
  if (days < 7) return `${toPersianNum(days)} روز پیش`
  if (weeks < 4) return `${toPersianNum(weeks)} هفته پیش`
  if (months < 12) return `${toPersianNum(months)} ماه پیش`
  return d.toLocaleDateString('fa-IR')
}

function toPersianNum(n: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)])
}

// ─── Activity type detection ────────────────────────────────────────

type ActivityType = 'create' | 'update' | 'delete' | 'login' | 'comment' | 'upload' | 'system' | 'warning'

function detectActivityType(action: string): ActivityType {
  const lower = action.toLowerCase()
  if (lower.includes('create') || lower.includes('add') || lower.includes('ایجاد') || lower.includes('جدید'))
    return 'create'
  if (lower.includes('update') || lower.includes('edit') || lower.includes('ویرایش') || lower.includes('به‌روز'))
    return 'update'
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('حذف'))
    return 'delete'
  if (lower.includes('login') || lower.includes('ورود') || lower.includes('sign'))
    return 'login'
  if (lower.includes('comment') || lower.includes('نظر') || lower.includes('reply') || lower.includes('پاسخ'))
    return 'comment'
  if (lower.includes('upload') || lower.includes('بارگذاری') || lower.includes('media'))
    return 'upload'
  if (lower.includes('warn') || lower.includes('هشدار') || lower.includes('error') || lower.includes('خطا'))
    return 'warning'
  return 'system'
}

function getActivityIcon(type: ActivityType) {
  const icons: Record<ActivityType, React.ReactNode> = {
    create: <Plus className="h-3.5 w-3.5" />,
    update: <Pencil className="h-3.5 w-3.5" />,
    delete: <Trash2 className="h-3.5 w-3.5" />,
    login: <LogIn className="h-3.5 w-3.5" />,
    comment: <MessageCircle className="h-3.5 w-3.5" />,
    upload: <Upload className="h-3.5 w-3.5" />,
    system: <Settings className="h-3.5 w-3.5" />,
    warning: <AlertTriangle className="h-3.5 w-3.5" />,
  }
  return icons[type]
}

function getActivityLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    create: 'ایجاد',
    update: 'ویرایش',
    delete: 'حذف',
    login: 'ورود',
    comment: 'نظر',
    upload: 'بارگذاری',
    system: 'سیستم',
    warning: 'هشدار',
  }
  return labels[type]
}

// ─── Activity Feed Widget ───────────────────────────────────────────

interface ActivityFeedWidgetProps {
  maxItems?: number
  showHeader?: boolean
  compact?: boolean
  className?: string
  refreshInterval?: number // ms
}

export default function ActivityFeedWidget({
  maxItems = 10,
  showHeader = true,
  compact = false,
  className = '',
  refreshInterval = 30000,
}: ActivityFeedWidgetProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/activities?limit=${maxItems}`)
      if (!res.ok) throw new Error('خطا در دریافت فعالیت‌ها')
      const data: ActivityItem[] = await res.json()
      setActivities(data)
      setError(null)
    } catch {
      setError('خطا در بارگذاری فعالیت‌ها')
    } finally {
      setLoading(false)
    }
  }, [maxItems])

  useEffect(() => {
    fetchActivities()
    if (refreshInterval > 0) {
      const interval = setInterval(fetchActivities, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchActivities, refreshInterval])

  return (
    <Card className={`glass-card overflow-hidden ${className}`} dir="rtl">
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
              <Activity className="h-4 w-4 text-violet-500" />
            </div>
            <h3 className="text-sm font-semibold">فعالیت‌های اخیر</h3>
          </div>
          {!loading && activities.length > 0 && (
            <span className="text-[10px] text-muted-foreground tabular-nums font-persian-nums">
              {toPersianNum(activities.length)} فعالیت
            </span>
          )}
        </div>
      )}

      <ScrollArea className={`${compact ? 'max-h-72' : 'max-h-96'} scrollbar-feed`}>
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full skeleton-circle shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4 skeleton-text-md" />
                  <Skeleton className="h-3 w-1/2 skeleton-text-sm" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">فعالیتی ثبت نشده</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {activities.map((activity, index) => {
              const type = detectActivityType(activity.action)
              const icon = getActivityIcon(type)
              const label = getActivityLabel(type)

              return (
                <div
                  key={activity.id}
                  className="feed-item-enter px-4 py-3 hover:bg-muted/30 transition-colors duration-150 cursor-default"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 mt-0.5 activity-icon-${type}`}>
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium activity-icon-${type}`}>
                          {label}
                        </span>
                        {activity.user && (
                          <span className="text-xs font-medium text-foreground truncate">
                            {activity.user.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed truncate">
                        {activity.details}
                      </p>
                    </div>

                    {/* Time */}
                    <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap mt-0.5 font-persian-nums tabular-nums">
                      {formatPersianRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {!loading && activities.length > 0 && (
        <div className="px-4 py-2.5 border-t border-border/30 bg-muted/20">
          <div className="flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              به‌روزرسانی خودکار
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
