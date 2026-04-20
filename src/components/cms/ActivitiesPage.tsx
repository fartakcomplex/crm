'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Activity, Plus, Pencil, Trash2, UserPlus, FileText,
  Settings, Upload, MessageCircle, LogIn, Shield, Clock,
  Filter,
} from 'lucide-react'
import { formatRelativeTime, formatDate } from './types'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'فعالیت‌ها',
  subtitle: 'لاگ فعالیت‌های سیستم',
  filter: 'فیلتر بر اساس نوع',
  all: 'همه',
  noActivities: 'فعالیتی یافت نشد',
  today: 'امروز',
  yesterday: 'دیروز',
  earlier: 'قبلاً',
}

const actionLabels: Record<string, string> = {
  create: 'ایجاد', update: 'بروزرسانی', delete: 'حذف', login: 'ورود',
  upload: 'بارگذاری', publish: 'انتشار', comment: 'نظر', settings: 'تنظیمات',
}

// ─── Action Type Config ───────────────────────────────────────────────────────

function getActionConfig(action: string) {
  const lower = action.toLowerCase()
  if (lower.includes('create') || lower.includes('ایجاد')) return { icon: <Plus className="h-4 w-4" />, color: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', ring: 'ring-green-200 dark:ring-green-800' }
  if (lower.includes('update') || lower.includes('بروزرسانی')) return { icon: <Pencil className="h-4 w-4" />, color: 'bg-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', ring: 'ring-cyan-200 dark:ring-cyan-800' }
  if (lower.includes('delete') || lower.includes('حذف')) return { icon: <Trash2 className="h-4 w-4" />, color: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', ring: 'ring-red-200 dark:ring-red-800' }
  if (lower.includes('login') || lower.includes('ورود')) return { icon: <LogIn className="h-4 w-4" />, color: 'bg-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', ring: 'ring-purple-200 dark:ring-purple-800' }
  if (lower.includes('upload') || lower.includes('بارگذاری')) return { icon: <Upload className="h-4 w-4" />, color: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', ring: 'ring-amber-200 dark:ring-amber-800' }
  if (lower.includes('comment') || lower.includes('نظر')) return { icon: <MessageCircle className="h-4 w-4" />, color: 'bg-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', ring: 'ring-orange-200 dark:ring-orange-800' }
  return { icon: <Activity className="h-4 w-4" />, color: 'bg-lime-500', bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-300', ring: 'ring-lime-200 dark:ring-lime-800' }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ActivitiesPage() {
  useEnsureData(['activities', 'users'])
  const { activities } = useCMS()
  const activitiesData = activities.data ?? []

  const [actionFilter, setActionFilter] = useState('all')

  const filtered = useMemo(() => {
    if (actionFilter === 'all') return activitiesData
    return activitiesData.filter(a => a.action.toLowerCase().includes(actionFilter.toLowerCase()))
  }, [activitiesData, actionFilter])

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

  const actionTypes = useMemo(() => {
    const types = new Set<string>()
    activitiesData.forEach(a => { const key = a.action.toLowerCase().split(' ')[0]; if (key) types.add(key) })
    return Array.from(types)
  }, [activitiesData])

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <Badge variant="secondary" className="bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300 w-fit shadow-sm">
          <Activity className="h-3 w-3 ml-1" />
          {activitiesData.length} فعالیت
        </Badge>
      </div>

      {/* Filter */}
      <Card className="glass-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              {labels.filter}:
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.all}</SelectItem>
                {actionTypes.map(type => (
                  <SelectItem key={type} value={type}>{actionLabels[type] ?? type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {grouped.length === 0 ? (
        <Card className="glass-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-lime-100 to-lime-200 dark:from-lime-900/20 dark:to-lime-800/20 flex items-center justify-center mb-4">
              <Activity className="h-10 w-10 text-lime-300" />
            </div>
            <p className="text-base font-medium">{labels.noActivities}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map((group, gi) => (
            <div key={gi} className="animate-in" style={{ animationDelay: `${gi * 100}ms`, animationFillMode: 'both' }}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-lime-100 dark:bg-lime-900/30 shadow-sm">
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
                <div className="absolute right-[19px] top-0 bottom-0 w-px bg-lime-200/50 dark:bg-lime-800/30" />

                <div className="space-y-3">
                  {group.items.map((a, ai) => {
                    const config = getActionConfig(a.action)
                    return (
                      <div key={a.id} className="flex gap-4 animate-in" style={{ animationDelay: `${ai * 50}ms`, animationFillMode: 'both' }}>
                        {/* Timeline dot */}
                        <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0 ring-2 ${config.ring} ring-offset-2 ring-offset-background shadow-sm z-10`}>
                          <div className={config.text}>{config.icon}</div>
                        </div>

                        {/* Content card */}
                        <Card className="flex-1 hover-lift shadow-sm hover:shadow-md transition-all duration-300 glass-card">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">{a.action}</p>
                                {a.details && (
                                  <p className="text-xs text-muted-foreground mt-1">{a.details}</p>
                                )}
                                {a.user && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                                      {a.user.name.charAt(0)}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{a.user.name}</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 bg-background/50 px-2 py-1 rounded-md">
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
