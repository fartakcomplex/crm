'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  create: 'ایجاد',
  update: 'بروزرسانی',
  delete: 'حذف',
  login: 'ورود',
  upload: 'بارگذاری',
  publish: 'انتشار',
  comment: 'نظر',
  settings: 'تنظیمات',
}

// ─── Action Type Config ───────────────────────────────────────────────────────

function getActionConfig(action: string) {
  const lower = action.toLowerCase()
  if (lower.includes('create') || lower.includes('ایجاد')) return { icon: <Plus className="h-4 w-4" />, color: 'bg-green-500', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' }
  if (lower.includes('update') || lower.includes('بروزرسانی')) return { icon: <Pencil className="h-4 w-4" />, color: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' }
  if (lower.includes('delete') || lower.includes('حذف')) return { icon: <Trash2 className="h-4 w-4" />, color: 'bg-red-500', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' }
  if (lower.includes('login') || lower.includes('ورود')) return { icon: <LogIn className="h-4 w-4" />, color: 'bg-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' }
  if (lower.includes('upload') || lower.includes('بارگذاری')) return { icon: <Upload className="h-4 w-4" />, color: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' }
  if (lower.includes('comment') || lower.includes('نظر')) return { icon: <MessageCircle className="h-4 w-4" />, color: 'bg-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' }
  return { icon: <Activity className="h-4 w-4" />, color: 'bg-lime-500', bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-300' }
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

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; items: typeof activitiesData }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const todayItems = filtered.filter(a => new Date(a.createdAt) >= today)
    const yesterdayItems = filtered.filter(a => {
      const d = new Date(a.createdAt)
      return d >= yesterday && d < today
    })
    const earlierItems = filtered.filter(a => new Date(a.createdAt) < yesterday)

    if (todayItems.length > 0) groups.push({ label: labels.today, items: todayItems })
    if (yesterdayItems.length > 0) groups.push({ label: labels.yesterday, items: yesterdayItems })
    if (earlierItems.length > 0) groups.push({ label: labels.earlier, items: earlierItems })

    return groups
  }, [filtered])

  // Extract unique action types
  const actionTypes = useMemo(() => {
    const types = new Set<string>()
    activitiesData.forEach(a => {
      const key = a.action.toLowerCase().split(' ')[0]
      if (key) types.add(key)
    })
    return Array.from(types)
  }, [activitiesData])

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-lime-600 to-lime-400 bg-clip-text text-transparent">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
        <Badge variant="secondary" className="bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300 w-fit">
          <Activity className="h-3 w-3 ml-1" />
          {activitiesData.length} فعالیت
        </Badge>
      </div>

      {/* Filter */}
      <Card className="bg-gradient-to-br from-lime-500/5 to-lime-600/5 border-lime-200/30 dark:border-lime-800/30">
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
        <Card className="bg-gradient-to-br from-lime-500/5 to-lime-600/5 border-lime-200/30 dark:border-lime-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Activity className="h-12 w-12 mb-3 opacity-20" />
            <p>{labels.noActivities}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((group, gi) => (
            <div key={gi} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-100 dark:bg-lime-900/30">
                  <Clock className="h-3.5 w-3.5 text-lime-600 dark:text-lime-400" />
                  <span className="text-sm font-medium text-lime-700 dark:text-lime-300">{group.label}</span>
                  <Badge variant="secondary" className="text-[10px] bg-lime-200/50 dark:bg-lime-800/30 text-lime-600 dark:text-lime-400 border-0">
                    {group.items.length}
                  </Badge>
                </div>
                <div className="flex-1 h-px bg-lime-200/50 dark:bg-lime-800/30" />
              </div>

              {/* Activity Items */}
              <div className="space-y-2">
                {group.items.map(a => {
                  const config = getActionConfig(a.action)
                  return (
                    <Card key={a.id} className="bg-gradient-to-br from-lime-500/5 to-lime-600/5 border-lime-200/30 dark:border-lime-800/30 hover:from-lime-500/10 hover:to-lime-600/10 transition-colors">
                      <CardContent className="p-3 flex items-start gap-3">
                        {/* Timeline dot + icon */}
                        <div className={`rounded-lg p-2 ${config.bg} shrink-0`}>
                          <div className={config.text}>{config.icon}</div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{a.action}</p>
                          {a.details && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{a.details}</p>
                          )}
                          {a.user && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <div className="w-5 h-5 rounded-full bg-lime-200 dark:bg-lime-800 flex items-center justify-center text-[10px] font-bold text-lime-700 dark:text-lime-300">
                                {a.user.name.charAt(0)}
                              </div>
                              <span className="text-xs text-muted-foreground">{a.user.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Time */}
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {formatRelativeTime(a.createdAt)}
                        </span>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
