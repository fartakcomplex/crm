'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
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
  allReadSuccess: 'همه اعلان‌ها به عنوان خوانده شده علامت‌گذاری شدند.',
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
  const map: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string; iconBg: string }> = {
    info:    { icon: <Info className="h-4 w-4" />, bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200/50 dark:border-blue-800/30', text: 'text-blue-700 dark:text-blue-300', iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
    success: { icon: <CheckCircle className="h-4 w-4" />, bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200/50 dark:border-green-800/30', text: 'text-green-700 dark:text-green-300', iconBg: 'bg-green-100 dark:bg-green-900/40' },
    warning: { icon: <AlertTriangle className="h-4 w-4" />, bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200/50 dark:border-yellow-800/30', text: 'text-yellow-700 dark:text-yellow-300', iconBg: 'bg-yellow-100 dark:bg-yellow-900/40' },
    error:   { icon: <AlertCircle className="h-4 w-4" />, bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200/50 dark:border-red-800/30', text: 'text-red-700 dark:text-red-300', iconBg: 'bg-red-100 dark:bg-red-900/40' },
  }
  return map[type] ?? map.info
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filterType, setFilterType] = useState('all')
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const matchType = filterType === 'all' || n.type === filterType
      const matchRead = filterRead === 'all' ||
        (filterRead === 'unread' && !n.read) ||
        (filterRead === 'read' && n.read)
      return matchType && matchRead
    })
  }, [notifications, filterType, filterRead])

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    toast.success(labels.markRead)
  }

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success(labels.allReadSuccess)
  }

  const typeLabels: Record<string, string> = {
    info: 'اطلاعات',
    success: 'موفقیت',
    warning: 'هشدار',
    error: 'خطا',
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0">
              <Bell className="h-3 w-3 ml-1" />
              {unreadCount} خوانده نشده
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="gap-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
          >
            <CheckCheck className="h-4 w-4" />
            {labels.markAllRead}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 border-purple-200/30 dark:border-purple-800/30">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            {labels.filterType}:
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={filterRead === 'all' ? 'default' : 'outline'}
              className={`cursor-pointer ${filterRead === 'all' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'}`}
              onClick={() => setFilterRead('all')}
            >
              {labels.all}
            </Badge>
            <Badge
              variant={filterRead === 'unread' ? 'default' : 'outline'}
              className={`cursor-pointer ${filterRead === 'unread' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'}`}
              onClick={() => setFilterRead('unread')}
            >
              {labels.unread}
            </Badge>
            <Badge
              variant={filterRead === 'read' ? 'default' : 'outline'}
              className={`cursor-pointer ${filterRead === 'read' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'}`}
              onClick={() => setFilterRead('read')}
            >
              {labels.read}
            </Badge>
            <div className="w-px h-6 bg-purple-200 dark:bg-purple-800 mx-1" />
            {['info', 'success', 'warning', 'error'].map(type => (
              <Badge
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                className={`cursor-pointer ${filterType === type ? 'bg-purple-600 text-white hover:bg-purple-700' : 'border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'}`}
                onClick={() => setFilterType(filterType === type ? 'all' : type)}
              >
                {typeLabels[type]}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 border-purple-200/30 dark:border-purple-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bell className="h-12 w-12 mb-3 opacity-20" />
            <p>{labels.noNotifications}</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-2">
            {filtered.map(n => {
              const config = getTypeConfig(n.type)
              return (
                <Card
                  key={n.id}
                  className={`${config.bg} ${config.border} border transition-all hover:shadow-sm ${!n.read ? 'ring-1 ring-purple-300/50 dark:ring-purple-700/50' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`rounded-lg p-2 shrink-0 ${config.iconBg} ${config.text}`}>
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold ${!n.read ? '' : 'opacity-70'}`}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {!n.read && (
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                            )}
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm mt-1 ${!n.read ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                          {n.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-[10px] ${config.bg} ${config.text} border-0`}>
                            {typeLabels[n.type]}
                          </Badge>
                          {!n.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-purple-500 hover:text-purple-600 hover:bg-purple-500/10 gap-1 h-6"
                              onClick={() => handleMarkRead(n.id)}
                            >
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
