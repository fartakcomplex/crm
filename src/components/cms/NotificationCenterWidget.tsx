'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck, AlertTriangle, Info, X, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
}

const typeConfig = {
  info: { icon: Info, bg: 'bg-sky-100 dark:bg-sky-900/30', iconColor: 'text-sky-600 dark:text-sky-400', badgeBg: 'bg-sky-100 dark:bg-sky-900/30', badgeText: 'text-sky-700 dark:text-sky-300', label: 'اطلاع' },
  success: { icon: CheckCheck, bg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-100 dark:bg-emerald-900/30', badgeText: 'text-emerald-700 dark:text-emerald-300', label: 'موفقیت' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400', badgeBg: 'bg-amber-100 dark:bg-amber-900/30', badgeText: 'text-amber-700 dark:text-amber-300', label: 'هشدار' },
  error: { icon: X, bg: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600 dark:text-rose-400', badgeBg: 'bg-rose-100 dark:bg-rose-900/30', badgeText: 'text-rose-700 dark:text-rose-300', label: 'خطا' },
}

export default function NotificationCenterWidget() {
  const [showAll, setShowAll] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-widget'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/notifications')
        if (!res.ok) throw new Error('Failed')
        return res.json() as Promise<{ notifications: Notification[] }>
      } catch {
        // Fallback mock data
        return {
          notifications: [
            { id: '1', title: 'پشتیبان‌گیری انجام شد', message: 'پشتیبان‌گیری خودکار پایگاه داده با موفقیت انجام شد', type: 'success', read: false, createdAt: new Date(Date.now() - 300000).toISOString() },
            { id: '2', title: 'سفارش جدید', message: 'سفارش #۱۰۲۴ از مشتری جدید ثبت شد', type: 'info', read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
            { id: '3', title: 'موجودی کم', message: 'موجودی جاروبرقی رباتیک کمتر از حداقل است', type: 'warning', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
            { id: '4', title: 'خطای ارسال ایمیل', message: 'خطا در ارسال ایمیل به ۳ مشتری', type: 'error', read: true, createdAt: new Date(Date.now() - 7200000).toISOString() },
            { id: '5', title: 'به‌روزرسانی سیستم', message: 'سیستم به نسخه ۲.۱ به‌روزرسانی شد', type: 'info', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: '6', title: 'وظیفه تکمیل شد', message: 'وظیفه "بهینه‌سازی SEO" با موفقیت تکمیل شد', type: 'success', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
          ]
        }
      }
    },
    staleTime: 60000,
    refetchInterval: 30000,
  })

  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter(n => !n.read).length
  const displayed = showAll ? notifications : notifications.slice(0, 4)

  const formatTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (diff < 1) return 'همین الان'
    if (diff < 60) return `${diff} دقیقه پیش`
    const hours = Math.floor(diff / 60)
    if (hours < 24) return `${hours} ساعت پیش`
    return `${Math.floor(hours / 24)} روز پیش`
  }

  return (
    <Card className="glass-card card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-violet-500" />
            <span>اعلان‌ها</span>
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 animate-pulse border-0 min-w-[20px] flex items-center justify-center">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {notifications.length > 4 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-muted-foreground"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'کمتر' : 'همه'}
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAll && 'rotate-180')} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-9 w-9 rounded-lg bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-muted rounded" />
                  <div className="h-2.5 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm opacity-60">اعلانی موجود نیست</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((notification, idx) => {
              const config = typeConfig[notification.type]
              const Icon = config.icon
              return (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 p-2.5 rounded-lg transition-all duration-200 animate-in',
                    !notification.read ? 'bg-violet-50/50 dark:bg-violet-900/10' : 'hover:bg-accent/40'
                  )}
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', config.bg, config.iconColor)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <Badge className={cn('text-[9px] px-1.5 py-0 border-0 shrink-0', config.badgeBg, config.badgeText)}>
                        {config.label}
                      </Badge>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{notification.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTime(notification.createdAt)}</p>
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
