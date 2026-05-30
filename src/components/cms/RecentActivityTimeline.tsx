'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, ImagePlus, MessageCircle, UserPlus, ShoppingCart, CheckSquare, Database, Settings, Activity } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Activity {
  id: string
  type: string
  title: string
  description: string
  user: string
  time: string
  icon: string
  color: string
}

const iconMap: Record<string, LucideIcon> = {
  FileText, ImagePlus, MessageCircle, UserPlus, ShoppingCart, CheckSquare, Database, Settings,
}

const colorMap: Record<string, { bg: string; icon: string; ring: string }> = {
  violet: { bg: 'bg-violet-100 dark:bg-violet-900/30', icon: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/20' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', icon: 'text-cyan-600 dark:text-cyan-400', ring: 'ring-cyan-500/20' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/20' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', icon: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500/20' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500/20' },
  sky: { bg: 'bg-sky-100 dark:bg-sky-900/30', icon: 'text-sky-600 dark:text-sky-400', ring: 'ring-sky-500/20' },
  fuchsia: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', icon: 'text-fuchsia-600 dark:text-fuchsia-400', ring: 'ring-fuchsia-500/20' },
}

const typeBadgeMap: Record<string, { label: string; bg: string; text: string }> = {
  create: { label: 'ایجاد', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
  upload: { label: 'آپلود', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
  comment: { label: 'نظر', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  user: { label: 'کاربر', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  order: { label: 'سفارش', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300' },
  task: { label: 'وظیفه', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  backup: { label: 'پشتیبان', bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300' },
  settings: { label: 'تنظیمات', bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-fuchsia-700 dark:text-fuchsia-300' },
}

export default function RecentActivityTimeline() {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const res = await fetch('/api/activity')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json() as Promise<{ activities: Activity[] }>
    },
    staleTime: 30000,
  })

  const activities = data?.activities ?? []

  return (
    <Card className="glass-card card-elevated">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-violet-500" />
          <span>فعالیت‌های اخیر</span>
          <Badge className="badge-gradient text-[10px]">{activities.length} مورد</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-9 w-9 rounded-lg bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-muted rounded" />
                  <div className="h-2.5 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin pr-1">
            {activities.map((activity, idx) => {
              const Icon = iconMap[activity.icon] ?? FileText
              const colors = colorMap[activity.color] ?? colorMap.violet
              const badge = typeBadgeMap[activity.type]

              return (
                <div
                  key={activity.id}
                  className="flex gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-all duration-200 group animate-in"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                >
                  {/* Icon */}
                  <div className={`h-9 w-9 rounded-lg ${colors.bg} ${colors.icon} flex items-center justify-center shrink-0 ring-1 ${colors.ring} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      {badge && (
                        <Badge className={`text-[9px] px-1.5 py-0 ${badge.bg} ${badge.text} border-0 shrink-0`}>
                          {badge.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.description}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">{activity.user}</span>
                      <span className="text-[10px] text-border">•</span>
                      <span className="text-[10px] text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
