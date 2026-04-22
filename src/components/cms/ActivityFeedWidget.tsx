'use client'

import { useMemo } from 'react'
import { useCMS } from './context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity } from 'lucide-react'
import { formatRelativeTime } from './types'
import type { ActivityLog } from './types'

// Activity type configuration with Persian labels and colors
const ACTIVITY_TYPES: Record<string, { label: string; color: string; dotClass: string }> = {
  create: { label: 'ایجاد', color: '#10b981', dotClass: 'bg-emerald-500' },
  edit: { label: 'ویرایش', color: '#06b6d4', dotClass: 'bg-cyan-500' },
  delete: { label: 'حذف', color: '#f43f5e', dotClass: 'bg-rose-500' },
  comment: { label: 'نظر', color: '#f59e0b', dotClass: 'bg-amber-500' },
  login: { label: 'ورود', color: '#8b5cf6', dotClass: 'bg-violet-500' },
}

// Default activity type
const DEFAULT_TYPE = { label: 'فعالیت', color: '#6b7280', dotClass: 'bg-gray-500' }

function getActivityType(action: string) {
  const lower = action.toLowerCase()
  for (const [key, val] of Object.entries(ACTIVITY_TYPES)) {
    if (lower.includes(key)) return val
  }
  return DEFAULT_TYPE
}

function getInitialLetter(name?: string | null): string {
  if (!name) return '؟'
  return name.charAt(0)
}

export default function ActivityFeedWidget() {
  const { activities } = useCMS()
  const activitiesData = (activities.data ?? []) as ActivityLog[]

  const recentActivities = useMemo(() => {
    return activitiesData.slice(0, 8)
  }, [activitiesData])

  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base text-violet-700 dark:text-violet-300">
              فید فعالیت‌ها
            </CardTitle>
            {/* Auto-refresh indicator */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {recentActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">فعالیتی یافت نشد</p>
          </div>
        ) : (
          <div className="space-y-1 stagger-children">
            {recentActivities.map((activity) => {
              const actType = getActivityType(activity.action)
              const userName = activity.user?.name ?? null

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-violet-500/5 transition-all duration-200 group"
                >
                  {/* Avatar circle with colored indicator */}
                  <div className="relative shrink-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-background"
                      style={{ backgroundColor: actType.color }}
                    >
                      {getInitialLetter(userName)}
                    </div>
                    {/* Colored dot overlay */}
                    <span
                      className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full ${actType.dotClass} border-2 border-background`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: actType.color }}
                      >
                        {actType.label}
                      </span>
                      <p className="text-sm font-medium truncate">
                        {activity.details || activity.action}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {userName ?? 'سیستم'}
                      </span>
                      <span className="text-xs text-muted-foreground/70 tabular-nums">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* View All button */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <Button
            variant="ghost"
            className="w-full text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-500/10 gap-2 h-8 transition-all duration-200"
          >
            مشاهده همه
            <span className="text-xs opacity-60">←</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
