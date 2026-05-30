'use client'

import { useState, useMemo, useCallback } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { History, CheckCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { formatRelativeTime } from './types'

// ---------------------------------------------------------------------------
// Type-specific dot colors
// ---------------------------------------------------------------------------

function getTypeDotClass(type: string): string {
  switch (type) {
    case 'info':    return 'bg-blue-500'
    case 'success': return 'bg-emerald-500'
    case 'warning': return 'bg-amber-500'
    case 'error':   return 'bg-red-500'
    default:        return 'bg-gray-400'
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationHistoryWidget() {
  const [isOpen, setIsOpen] = useState(false)

  useEnsureData(['notifications'])
  const { notifications, markAllNotificationsRead } = useCMS()

  const notifs = notifications.data ?? []
  const unreadCount = useMemo(() => notifs.filter(n => !n.read).length, [notifs])
  const recentNotifs = useMemo(() => notifs.slice(0, 8), [notifs])

  const handleMarkAllRead = useCallback(() => {
    markAllNotificationsRead.mutate(undefined, {
      onSuccess: () => {
        toast.success('همه اعلان‌ها به عنوان خوانده علامت‌گذاری شدند')
      },
      onError: () => {
        toast.error('خطا در علامت‌گذاری اعلان‌ها')
      },
    })
  }, [markAllNotificationsRead])

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      {/* ── Trigger Button ── */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative flex items-center gap-2 px-4 py-2 rounded-full glass-card card-elevated hover-lift border border-border/50 shadow-lg transition-all duration-300 cursor-pointer group"
        aria-label="تاریخچه اعلان‌ها"
      >
        <History className="h-4 w-4 text-violet-500 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
          تاریخچه اعلان‌ها
        </span>
        {unreadCount > 0 && (
          <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-violet-500 text-white border-0 shadow-sm shadow-violet-500/30">
            {unreadCount > 9 ? '۹+' : unreadCount}
          </Badge>
        )}
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground transition-transform" />
        )}
      </button>

      {/* ── Sliding Panel ── */}
      <div
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[340px] sm:w-[400px] transition-all duration-300 origin-bottom ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        }`}
      >
        <div className="glass-card card-elevated rounded-2xl border border-border/50 shadow-2xl overflow-hidden" dir="rtl">
          {/* ── Header ── */}
          <div className="px-5 pt-5 pb-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gradient-violet">
                تاریخچه اعلان‌ها
              </h3>
              {unreadCount > 0 && (
                <Badge className="h-5 text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0">
                  {unreadCount} خوانده‌نشده
                </Badge>
              )}
            </div>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllNotificationsRead.isPending}
                className="mt-3 text-xs text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 animated-underline transition-colors cursor-pointer disabled:opacity-50"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCheck className="h-3.5 w-3.5" />
                  خواندن همه
                </span>
              </button>
            )}
          </div>

          {/* ── Notification List ── */}
          <ScrollArea className="max-h-[340px]">
            <div className="p-2">
              {recentNotifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <History className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">اعلانی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentNotifs.map((notif, idx) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer hover:bg-accent/40 ${
                        notif.read
                          ? 'opacity-70'
                          : 'bg-violet-50/40 dark:bg-violet-900/10'
                      }`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Colored dot by type */}
                      <div className="relative mt-2 shrink-0">
                        <span className={`block w-2.5 h-2.5 rounded-full ${getTypeDotClass(notif.type)}`} />
                        {!notif.read && (
                          <span className={`absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full ${getTypeDotClass(notif.type)} opacity-40 animate-ping`} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate leading-tight ${notif.read ? 'text-foreground/60' : 'text-foreground'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* ── Footer ── */}
          <div className="px-4 py-3 border-t border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground">
              {notifs.length} اعلان در مجموع · {unreadCount} خوانده‌نشده
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
