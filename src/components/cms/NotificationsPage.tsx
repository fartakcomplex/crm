'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle,
  CheckCircle, Trash2, Filter,
} from 'lucide-react'
import { formatRelativeTime } from './types'
import type { Notification } from './types'
import { toast } from 'sonner'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'اعلان‌ها',
  subtitle: 'مرکز اطلاع‌رسانی سیستم',
  markAllRead: 'خواندن همه',
  noNotifications: 'اعلانی وجود ندارد',
  all: 'همه',
  unread: 'خوانده نشده',
  read: 'خوانده شده',
  filterType: 'فیلتر نوع',
  markRead: 'خوانده شد',
  allReadSuccess: 'همه اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند',
}

// ─── Mock Notification Data ───────────────────────────────────────────────────

const mockNotifications: Notification[] = [
  { id: '1', title: 'مطلب جدید منتشر شد', message: 'مطلب "آموزش Next.js 16" با موفقیت منتشر شد.', type: 'success', read: false, createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: '2', title: 'نظر جدید در انتظار تأیید', message: 'کاربر "علی محمدی" نظر جدیدی روی مطلب "React Tips" ثبت کرده است.', type: 'info', read: false, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: '3', title: 'هشدار امنیتی', message: 'تلاش ناموفق ورود از IP ناشناس ثبت شد.', type: 'warning', read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '4', title: 'خطا در پشتیبان‌گیری', message: 'پشتیبان‌گیری خودکار پایگاه‌داده با خطا مواجه شد.', type: 'error', read: false, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: '5', title: 'بروزرسانی سیستم', message: 'نسخه جدید CMS با ویژگی‌های جدید در دسترس است.', type: 'info', read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: '6', title: 'پروژه تکمیل شد', message: 'پروژه "طراحی وب‌سایت شرکت" با موفقیت تکمیل شد.', type: 'success', read: true, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '7', title: 'محدودیت ذخیره‌سازی', message: 'فضای ذخیره‌سازی رسانه‌ها به ۸۵٪ ظرفیت رسیده است.', type: 'warning', read: true, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '8', title: 'کاربر جدید ثبت‌نام', message: 'کاربر "سارا احمدی" با نقش نویسنده ثبت‌نام کرد.', type: 'info', read: true, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '9', title: 'همگام‌سازی WordPress', message: 'همگام‌سازی با سایت WordPress با موفقیت انجام شد. ۵ مطلب همگام شد.', type: 'success', read: true, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: '10', title: 'خطای API', message: 'درخواست API به AI سرویس با خطای timeout مواجه شد.', type: 'error', read: false, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
]

// ─── Notification Type Config ─────────────────────────────────────────────────

function getTypeConfig(type: string) {
  const map: Record<string, { icon: React.ReactNode; bg: string; border: string; borderAccent: string; text: string; iconBg: string }> = {
    info:    { icon: <Info className="h-4 w-4" />, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200/50 dark:border-blue-800/30', borderAccent: 'border-l-4 border-l-blue-500', text: 'text-blue-700 dark:text-blue-300', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
    success: { icon: <CheckCircle className="h-4 w-4" />, bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200/50 dark:border-green-800/30', borderAccent: 'border-l-4 border-l-green-500', text: 'text-green-700 dark:text-green-300', iconBg: 'bg-green-100 dark:bg-green-900/40' },
    warning: { icon: <AlertTriangle className="h-4 w-4" />, bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200/50 dark:border-yellow-800/30', borderAccent: 'border-l-4 border-l-yellow-500', text: 'text-yellow-700 dark:text-yellow-300', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40' },
    error:   { icon: <AlertCircle className="h-4 w-4" />, bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200/50 dark:border-red-800/30', borderAccent: 'border-l-4 border-l-red-500', text: 'text-red-700 dark:text-red-300', iconBg: 'bg-red-100 dark:bg-red-900/40' },
  }
  return map[type] ?? map.info
}

// ─── Filter Tab Definition ────────────────────────────────────────────────────

type FilterTab = 'all' | 'unread' | 'info' | 'success' | 'warning' | 'error'

const FILTER_TABS: Array<{ key: FilterTab; label: string; typeFilter?: Notification['type']; readFilter?: boolean | null }> = [
  { key: 'all',     label: 'همه' },
  { key: 'unread',  label: 'خوانده نشده' },
  { key: 'info',    label: 'اطلاعات',  typeFilter: 'info' },
  { key: 'success', label: 'موفقیت',   typeFilter: 'success' },
  { key: 'warning', label: 'هشدار',    typeFilter: 'warning' },
  { key: 'error',   label: 'خطا',      typeFilter: 'error' },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationsPage() {
  useEnsureData(['notifications'])
  const { markAllNotificationsRead } = useCMS()
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const unreadCount = notifications.filter(n => !n.read).length

  // Compute count badges per tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: notifications.length, unread: 0, info: 0, success: 0, warning: 0, error: 0 }
    for (const n of notifications) {
      if (!n.read) counts.unread++
      if (counts[n.type] !== undefined) counts[n.type]++
    }
    return counts
  }, [notifications])

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const tabConfig = FILTER_TABS.find(t => t.key === activeTab)
      if (!tabConfig) return true

      if (tabConfig.key === 'all') return true
      if (tabConfig.key === 'unread') return !n.read
      if (tabConfig.typeFilter) return n.type === tabConfig.typeFilter

      return true
    })
  }, [notifications, activeTab])

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    toast.success(labels.markRead)
  }

  const handleMarkAllRead = () => {
    // Use the CMS mutation for backend, and also update local state
    markAllNotificationsRead.mutate(undefined, {
      onSuccess: () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        toast.success(labels.allReadSuccess)
      },
      onError: () => {
        // Still update local state as fallback
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        toast.success(labels.allReadSuccess)
      },
    })
  }

  const typeLabels: Record<string, string> = {
    info: 'اطلاعات', success: 'موفقیت', warning: 'هشدار', error: 'خطا',
  }

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
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0 shadow-sm">
              <Bell className="h-3 w-3 ml-1" />
              {unreadCount} خوانده نشده
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="gap-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            {markAllNotificationsRead.isPending ? (
              <div className="h-4 w-4 border-2 border-purple-400/30 border-t-purple-500 rounded-full animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            {labels.markAllRead}
          </Button>
        </div>
      </div>

      {/* Filter Tabs with Count Badges */}
      <Card className="glass-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Filter className="h-4 w-4" />
            {labels.filterType}
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => {
              const count = tabCounts[tab.key] ?? 0
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]
                    ${isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 hover:bg-purple-700'
                      : 'border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
                    }
                  `}
                >
                  {tab.label}
                  <span className={`
                    min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-bold px-1.5
                    ${isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    }
                  `}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <Card className="glass-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 flex items-center justify-center mb-4">
              <Bell className="h-10 w-10 text-purple-300" />
            </div>
            <p className="text-base font-medium">{labels.noNotifications}</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-2 pr-1">
            {filtered.map((n, idx) => {
              const config = getTypeConfig(n.type)
              return (
                <Card
                  key={n.id}
                  className={`${config.bg} ${config.border} ${config.borderAccent} transition-all duration-300 hover-lift shadow-sm animate-in ${!n.read ? 'ring-1 ring-purple-300/50 dark:ring-purple-700/50' : ''}`}
                  style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-xl p-2.5 shrink-0 ${config.iconBg} ${config.text} shadow-sm`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${!n.read ? '' : 'opacity-70'}`}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {!n.read && (
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap bg-background/30 px-2 py-0.5 rounded-md">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm mt-1.5 ${!n.read ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                          {n.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2.5">
                          <Badge variant="outline" className={`text-[10px] ${config.bg} ${config.text} border-0 shadow-sm`}>
                            {typeLabels[n.type]}
                          </Badge>
                          {!n.read && (
                            <Button size="sm" variant="ghost" className="text-xs text-purple-500 hover:text-purple-600 hover:bg-purple-500/10 gap-1 h-6 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200" onClick={() => handleMarkRead(n.id)}>
                              <Check className="h-3 w-3" />
                              {labels.markRead}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
