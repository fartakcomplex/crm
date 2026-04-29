'use client'

import { useState, useMemo, useCallback } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Info, CheckCircle2, AlertTriangle, XCircle, CheckCheck, Filter, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { formatRelativeTime } from './types'
import type { Notification } from './types'

type TabKey = 'all' | 'unread' | 'system'
type FilterType = 'all' | 'info' | 'success' | 'warning' | 'error'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'همه' },
  { key: 'unread', label: 'خوانده نشده' },
  { key: 'system', label: 'سیستم' },
]

const TYPE_FILTERS: { key: FilterType; label: string; color: string; activeColor: string }[] = [
  { key: 'all', label: 'همه', color: 'bg-muted text-muted-foreground', activeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-300 dark:border-violet-700' },
  { key: 'info', label: 'اطلاعات', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400', activeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700' },
  { key: 'success', label: 'موفق', color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400', activeColor: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-700' },
  { key: 'warning', label: 'هشدار', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400', activeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700' },
  { key: 'error', label: 'خطا', color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400', activeColor: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700' },
]

function getTypeIcon(type: string) {
  switch (type) {
    case 'info': return <Info className="h-4 w-4 text-blue-500" />
    case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />
    case 'error': return <XCircle className="h-4 w-4 text-red-500" />
    default: return <Bell className="h-4 w-4 text-gray-500" />
  }
}

function getTypeBg(type: string) {
  switch (type) {
    case 'info': return 'bg-blue-50 dark:bg-blue-900/20'
    case 'success': return 'bg-green-50 dark:bg-green-900/20'
    case 'warning': return 'bg-amber-50 dark:bg-amber-900/20'
    case 'error': return 'bg-red-50 dark:bg-red-900/20'
    default: return 'bg-gray-50 dark:bg-gray-900/20'
  }
}

function getSystemTypes(): Notification['type'][] {
  return ['info', 'warning', 'error']
}

interface NotificationCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  unreadCount: number
}

export function NotificationCenter({ open, onOpenChange, unreadCount }: NotificationCenterProps) {
  useEnsureData(['notifications'])
  const { notifications, markNotificationRead, markAllNotificationsRead } = useCMS()

  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')

  const notifs = notifications.data ?? []

  const filteredNotifications = useMemo(() => {
    let result = notifs

    // Tab filter
    if (activeTab === 'unread') {
      result = result.filter(n => !n.read)
    } else if (activeTab === 'system') {
      const systemTypes = getSystemTypes()
      result = result.filter(n => systemTypes.includes(n.type))
    }

    // Type filter
    if (activeFilter !== 'all') {
      result = result.filter(n => n.type === activeFilter)
    }

    return result
  }, [notifs, activeTab, activeFilter])

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

  const handleMarkRead = useCallback((id: string) => {
    markNotificationRead.mutate(id)
  }, [markNotificationRead])

  const tabUnreadCount = useMemo(() => {
    if (activeTab === 'all') return notifs.filter(n => !n.read).length
    if (activeTab === 'unread') return notifs.filter(n => !n.read).length
    if (activeTab === 'system') {
      const systemTypes = getSystemTypes()
      return notifs.filter(n => systemTypes.includes(n.type) && !n.read).length
    }
    return 0
  }, [notifs, activeTab])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 bg-card/95 backdrop-blur-xl" dir="rtl">
        {/* Gradient Header */}
        <div className="bg-gradient-to-l from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white">
          <SheetHeader className="text-right">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold flex items-center gap-2 text-white">
                <Bell className="h-5 w-5" />
                اعلان‌ها
              </SheetTitle>
              {unreadCount > 0 && (
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors text-xs">
                  {unreadCount} جدید
                </Badge>
              )}
            </div>
            <SheetDescription className="text-white/70 text-xs mt-1">
              مدیریت و مشاهده اعلان‌های سیستم
            </SheetDescription>
          </SheetHeader>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-white/90 hover:text-white hover:bg-white/10 gap-1.5 text-xs transition-colors"
              onClick={handleMarkAllRead}
              disabled={markAllNotificationsRead.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              خواندن همه
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-4 border-b border-border/50">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`relative px-3 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? 'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === activeTab && tabUnreadCount > 0 && (
                <Badge className="absolute -top-1 -left-1 h-4 min-w-[16px] px-1 text-[9px] bg-violet-500 text-white border-0">
                  {tabUnreadCount}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-none">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {TYPE_FILTERS.map(filter => (
            <button
              key={filter.key}
              className={`shrink-0 text-[10px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 ${
                activeFilter === filter.key
                  ? filter.activeColor
                  : `${filter.color} border-transparent hover:border-border/50`
              }`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Notification List */}
        <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
          <div className="p-3">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 flex items-center justify-center mb-3">
                  <BellOff className="h-7 w-7 text-violet-300 dark:text-violet-700" />
                </div>
                <p className="text-sm font-medium">اعلانی یافت نشد</p>
                <p className="text-xs mt-1 opacity-60">
                  {activeTab === 'unread' ? 'همه اعلان‌ها خوانده شده‌اند' : 'در این دسته‌بندی اعلانی وجود ندارد'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNotifications.map((notif, idx) => (
                  <button
                    key={notif.id}
                    className={`w-full text-right rounded-xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-in overflow-hidden ${
                      notif.read
                        ? 'border-border/40 bg-background/50 hover:bg-accent/30'
                        : 'border-violet-200/60 dark:border-violet-700/40 bg-violet-50/50 dark:bg-violet-900/10 shadow-sm'
                    }`}
                    style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    <div className="flex items-start gap-3 p-3">
                      {/* Icon */}
                      <div className={`shrink-0 h-9 w-9 rounded-lg flex items-center justify-center ${getTypeBg(notif.type)}`}>
                        {getTypeIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${notif.read ? 'text-foreground/70' : 'text-foreground'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && (
                            <span className="shrink-0 w-2 h-2 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted-foreground/60">
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                          {notif.type !== 'info' && (
                            <Badge
                              className={`text-[9px] px-1.5 py-0 border-0 ${
                                notif.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                notif.type === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                notif.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}
                            >
                              {notif.type === 'success' ? 'موفقیت' : notif.type === 'warning' ? 'هشدار' : notif.type === 'error' ? 'خطا' : 'اطلاعات'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{notifs.length} اعلان در مجموع</span>
          <span>{notifs.filter(n => !n.read).length} خوانده نشده</span>
        </div>
      </SheetContent>
    </Sheet>
  )
}
