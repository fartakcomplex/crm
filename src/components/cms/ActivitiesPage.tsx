'use client'

import { useState, useMemo, useCallback } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity, Plus, Pencil, Trash2, UserPlus, FileText,
  Settings, Upload, MessageCircle, LogIn, Shield, Clock,
  Filter, Bell, AlertTriangle, Wrench, RefreshCw, Inbox,
} from 'lucide-react'
import { formatRelativeTime, formatDate } from './types'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'فعالیت‌ها',
  subtitle: 'لاگ فعالیت‌های سیستم',
  filter: 'فیلتر بر اساس نوع',
  all: 'همه',
  noActivities: 'فعالیتی یافت نشد',
  noActivitiesDesc: 'هنوز فعالیتی در سیستم ثبت نشده است.',
  today: 'امروز',
  yesterday: 'دیروز',
  earlier: 'قبلاً',
  reload: 'بارگذاری مجدد',
  notification: 'اطلاع‌رسانی',
  warning: 'هشدار',
  operation: 'عملیات',
  system: 'سیستم',
}

const actionLabels: Record<string, string> = {
  create: 'ایجاد', update: 'بروزرسانی', delete: 'حذف', login: 'ورود',
  upload: 'بارگذاری', publish: 'انتشار', comment: 'نظر', settings: 'تنظیمات',
}

// ─── Filter Chip Config ───────────────────────────────────────────────────────

const FILTER_CHIPS = [
  { key: 'all', label: labels.all, icon: <Activity className="h-3.5 w-3.5" />, matchAction: null },
  { key: 'notification', label: labels.notification, icon: <Bell className="h-3.5 w-3.5" />, matchAction: ['create', 'publish'] },
  { key: 'warning', label: labels.warning, icon: <AlertTriangle className="h-3.5 w-3.5" />, matchAction: ['delete'] },
  { key: 'operation', label: labels.operation, icon: <Wrench className="h-3.5 w-3.5" />, matchAction: ['update', 'upload', 'comment'] },
  { key: 'system', label: labels.system, icon: <Settings className="h-3.5 w-3.5" />, matchAction: ['login', 'settings'] },
]

// ─── Action Type Config ───────────────────────────────────────────────────────

function getActionConfig(action: string) {
  const lower = action.toLowerCase()
  if (lower.includes('create') || lower.includes('ایجاد')) return { icon: <Plus className="h-4 w-4" />, color: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', ring: 'ring-green-200 dark:ring-green-800', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', gradientFrom: '#22c55e', gradientTo: '#10b981' }
  if (lower.includes('update') || lower.includes('بروزرسانی')) return { icon: <Pencil className="h-4 w-4" />, color: 'bg-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', ring: 'ring-cyan-200 dark:ring-cyan-800', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300', gradientFrom: '#06b6d4', gradientTo: '#14b8a6' }
  if (lower.includes('delete') || lower.includes('حذف')) return { icon: <Trash2 className="h-4 w-4" />, color: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', ring: 'ring-red-200 dark:ring-red-800', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', gradientFrom: '#ef4444', gradientTo: '#f97316' }
  if (lower.includes('login') || lower.includes('ورود')) return { icon: <LogIn className="h-4 w-4" />, color: 'bg-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', ring: 'ring-purple-200 dark:ring-purple-800', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', gradientFrom: '#a855f7', gradientTo: '#8b5cf6' }
  if (lower.includes('upload') || lower.includes('بارگذاری')) return { icon: <Upload className="h-4 w-4" />, color: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-200 dark:ring-amber-800', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', gradientFrom: '#f59e0b', gradientTo: '#eab308' }
  if (lower.includes('comment') || lower.includes('نظر')) return { icon: <MessageCircle className="h-4 w-4" />, color: 'bg-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', ring: 'ring-orange-200 dark:ring-orange-800', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', gradientFrom: '#f97316', gradientTo: '#fb923c' }
  return { icon: <Activity className="h-4 w-4" />, color: 'bg-lime-500', bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-300', ring: 'ring-lime-200 dark:ring-lime-800', badge: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300', gradientFrom: '#84cc16', gradientTo: '#22c55e' }
}

// ─── Time Badge Config ────────────────────────────────────────────────────────

function getTimeBadgeClass(createdAt: string) {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const diffMin = diffMs / 60000
  if (diffMin < 60) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200/50'
  if (diffMin < 24 * 60) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/50'
  return 'bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400 border-slate-200/50'
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActivitiesPage() {
  useEnsureData(['activities', 'users'])
  const { activities } = useCMS()
  const activitiesData = activities.data ?? []

  const [activeChip, setActiveChip] = useState('all')

  const filtered = useMemo(() => {
    if (activeChip === 'all') return activitiesData
    const chipConfig = FILTER_CHIPS.find(c => c.key === activeChip)
    if (!chipConfig?.matchAction) return activitiesData
    return activitiesData.filter(a => {
      const actionKey = a.action.toLowerCase().split(' ')[0]
      return chipConfig.matchAction!.includes(actionKey)
    })
  }, [activitiesData, activeChip])

  const grouped = useMemo(() => {
    const groups: { label: string; items: typeof activitiesData }[] = []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

    const todayItems = filtered.filter(a => new Date(a.createdAt) >= today)
    const yesterdayItems = filtered.filter(a => { const d = new Date(a.createdAt); return d >= yesterday && d < today })
    const earlierItems = filtered.filter(a => new Date(a.createdAt) < yesterday)

    if (todayItems.length > 0) groups.push({ label: labels.today, items: todayItems })
    if (yesterdayItems.length > 0) groups.push({ label: labels.yesterday, items: yesterdayItems })
    if (earlierItems.length > 0) groups.push({ label: labels.earlier, items: earlierItems })
    return groups
  }, [filtered])

  const handleReload = useCallback(() => {
    activities.refetch?.()
  }, [activities])

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter content-area reveal-on-scroll">
      {/* ─── Gradient Header ─── */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8 glass-card shine-effect">
        <div className="absolute inset-0 bg-gradient-to-br from-lime-500/10 via-emerald-500/5 to-cyan-500/10 pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-lime-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-lime-500/25 animate-in">
              <Activity className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient-violet">
                {labels.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                {labels.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300 border-0 shadow-sm badge-pulse h-8 px-3">
              <Activity className="h-3.5 w-3.5 ml-1.5" />
              {activitiesData.length} فعالیت
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReload}
              className="btn-ghost-subtle gap-2 border-lime-300 dark:border-lime-700 text-lime-600 dark:text-lime-400 hover:bg-lime-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {labels.reload}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Filter Chips ─── */}
      <div className="tab-group flex flex-wrap items-center gap-2 animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
          <Filter className="h-4 w-4" />
          {labels.filter}:
        </div>
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeChip === chip.key
          return (
            <button
              key={chip.key}
              onClick={() => setActiveChip(chip.key)}
              className={`
                tab-item inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]
                ${isActive
                  ? 'tab-item-active bg-gradient-to-r from-lime-500 to-emerald-500 text-white shadow-lg shadow-lime-500/25 hover:shadow-lime-500/35'
                  : 'glass-card border border-lime-200/50 dark:border-lime-800/30 text-lime-700 dark:text-lime-400 hover:bg-lime-500/10 hover:border-lime-300/50'
                }
              `}
            >
              {chip.icon}
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* ─── Activity Timeline ─── */}
      {grouped.length === 0 ? (
        <Card className="glass-card card-inner-glow shadow-sm animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-lime-100 to-emerald-100 dark:from-lime-900/20 dark:to-emerald-800/20 flex items-center justify-center mb-5 float-animation">
              <Inbox className="h-12 w-12 text-lime-300" />
            </div>
            <p className="text-base font-semibold">{labels.noActivities}</p>
            <p className="text-sm text-muted-foreground mt-1">{labels.noActivitiesDesc}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReload}
              className="btn-ghost-subtle mt-4 gap-2 border-lime-300 dark:border-lime-700 text-lime-600 dark:text-lime-400 hover:bg-lime-500/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {labels.reload}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 card-gradient-border p-4 md:p-6 rounded-xl">
          {grouped.map((group, gi) => (
            <div key={gi} className="animate-in" style={{ animationDelay: `${(gi + 1) * 120}ms`, animationFillMode: 'both' }}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-lime-100 to-emerald-100 dark:from-lime-900/30 dark:to-emerald-800/30 shadow-sm">
                  <Clock className="h-3.5 w-3.5 text-lime-600 dark:text-lime-400" />
                  <span className="text-sm font-medium text-lime-700 dark:text-lime-300">{group.label}</span>
                  <Badge variant="secondary" className="text-[10px] bg-lime-200/50 dark:bg-lime-800/30 text-lime-600 dark:text-lime-400 border-0">
                    {group.items.length}
                  </Badge>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-lime-200/50 to-transparent dark:from-lime-800/30" />
              </div>

              {/* Timeline Items */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute right-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-lime-300/40 via-emerald-300/30 to-transparent dark:from-lime-700/30 dark:via-emerald-700/20" />

                <div className="space-y-3 stagger-children">
                  {group.items.map((a, ai) => {
                    const config = getActionConfig(a.action)
                    const timeBadgeClass = getTimeBadgeClass(a.createdAt)
                    return (
                      <div key={a.id} className="flex gap-4 animate-in" style={{ animationDelay: `${ai * 60}ms`, animationFillMode: 'both' }}>
                        {/* Timeline dot with gradient circle */}
                        <div className="relative shrink-0 z-10">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-background shadow-md transition-all duration-300 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
                              ringColor: config.gradientFrom,
                              boxShadow: `0 4px 12px ${config.gradientFrom}33`,
                            }}
                          >
                            <div className="text-white">{config.icon}</div>
                          </div>
                        </div>

                        {/* Content card */}
                        <Card className="flex-1 hover-lift card-elevated shadow-sm glass-card card-inner-glow shine-effect transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-semibold">{a.action}</p>
                                  <Badge variant="secondary" className={`badge-gradient text-[10px] border px-1.5 py-0 ${config.badge}`}>
                                    {actionLabels[a.action.toLowerCase().split(' ')[0]] ?? ''}
                                  </Badge>
                                </div>
                                {a.details && (
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.details}</p>
                                )}
                                {a.user && (
                                  <div className="flex items-center gap-2 mt-2.5">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                      {a.user.name.charAt(0)}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{a.user.name}</span>
                                  </div>
                                )}
                              </div>
                              <span className={`text-xs whitespace-nowrap shrink-0 px-2.5 py-1 rounded-lg border font-medium ${timeBadgeClass}`}>
                                {formatRelativeTime(a.createdAt)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
