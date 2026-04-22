'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle,
  CheckCircle, Trash2, Filter, Mail, Clock, ChevronDown, ChevronUp, X,
  Inbox,
} from 'lucide-react'
import { formatRelativeTime } from './types'
import type { Notification } from './types'
import { toast } from 'sonner'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'اعلان‌ها',
  subtitle: 'مرکز اطلاع‌رسانی سیستم',
  markAllRead: 'همه خوانده شد',
  noNotifications: 'اعلانی وجود ندارد',
  noNotificationsDesc: 'تمام اعلان‌ها بررسی شده‌اند. اعلان جدیدی نیست.',
  all: 'همه',
  unread: 'خوانده نشده',
  read: 'خوانده شده',
  filterType: 'فیلتر نوع',
  markRead: 'خوانده شد',
  allReadSuccess: 'همه اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند',
  today: 'امروز',
  yesterday: 'دیروز',
  lastWeek: 'هفته گذشته',
  older: 'بالاتر',
  details: 'جزئیات',
  type: 'نوع',
  time: 'زمان',
  status: 'وضعیت',
  readStatus: 'خوانده شده',
  unreadStatus: 'خوانده نشده',
  close: 'بستن',
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
  const map: Record<string, {
    icon: React.ReactNode; bg: string; border: string; borderAccent: string;
    text: string; iconBg: string; iconGradient: string; dotColor: string;
  }> = {
    info:    { icon: <Mail className="h-4 w-4" />, bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200/50 dark:border-blue-800/30', borderAccent: 'border-r-4 border-r-blue-500', text: 'text-blue-700 dark:text-blue-300', iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600', iconGradient: 'from-blue-400 to-blue-600', dotColor: 'bg-blue-500' },
    success: { icon: <CheckCircle className="h-4 w-4" />, bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-200/50 dark:border-green-800/30', borderAccent: 'border-r-4 border-r-green-500', text: 'text-green-700 dark:text-green-300', iconBg: 'bg-gradient-to-br from-green-400 to-emerald-600', iconGradient: 'from-green-400 to-emerald-600', dotColor: 'bg-green-500' },
    warning: { icon: <AlertTriangle className="h-4 w-4" />, bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200/50 dark:border-amber-800/30', borderAccent: 'border-r-4 border-r-amber-500', text: 'text-amber-700 dark:text-amber-300', iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500', iconGradient: 'from-amber-400 to-orange-500', dotColor: 'bg-amber-500' },
    error:   { icon: <AlertCircle className="h-4 w-4" />, bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200/50 dark:border-red-800/30', borderAccent: 'border-r-4 border-r-red-500', text: 'text-red-700 dark:text-red-300', iconBg: 'bg-gradient-to-br from-red-400 to-rose-600', iconGradient: 'from-red-400 to-rose-600', dotColor: 'bg-red-500' },
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

// ─── Time Grouping ────────────────────────────────────────────────────────────

interface TimeGroup {
  label: string
  items: Notification[]
}

function groupByTime(notifications: Notification[]): TimeGroup[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7)

  const groups: TimeGroup[] = []

  const todayItems = notifications.filter(n => new Date(n.createdAt) >= today)
  const yesterdayItems = notifications.filter(n => { const d = new Date(n.createdAt); return d >= yesterday && d < today })
  const weekItems = notifications.filter(n => { const d = new Date(n.createdAt); return d >= lastWeek && d < yesterday })
  const olderItems = notifications.filter(n => new Date(n.createdAt) < lastWeek)

  if (todayItems.length) groups.push({ label: labels.today, items: todayItems })
  if (yesterdayItems.length) groups.push({ label: labels.yesterday, items: yesterdayItems })
  if (weekItems.length) groups.push({ label: labels.lastWeek, items: weekItems })
  if (olderItems.length) groups.push({ label: labels.older, items: olderItems })

  return groups
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationsPage() {
  useEnsureData(['notifications'])
  const { markAllNotificationsRead } = useCMS()
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const unreadCount = notifications.filter(n => !n.read).length

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

  const timeGroups = useMemo(() => groupByTime(filtered), [filtered])

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    toast.success(labels.markRead)
  }

  const handleMarkAllRead = () => {
    markAllNotificationsRead.mutate(undefined, {
      onSuccess: () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        toast.success(labels.allReadSuccess)
      },
      onError: () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        toast.success(labels.allReadSuccess)
      },
    })
  }

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const typeLabels: Record<string, string> = {
    info: 'اطلاعات', success: 'موفقیت', warning: 'هشدار', error: 'خطا',
  }

  const typeLabelsWithDesc: Record<string, string> = {
    info: 'اطلاعات عمومی سیستم',
    success: 'عملیات موفق',
    warning: 'هشدارهای مهم',
    error: 'خطاهای رخ‌داده',
  }

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter content-area reveal-on-scroll">
      {/* ─── Animated Gradient Header ─── */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8 glass-card shine-effect">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-fuchsia-500/10 pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-purple-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-fuchsia-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/25 animate-in">
              <Bell className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold gradient-text">
                  {labels.title}
                </h1>
                {unreadCount > 0 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-sm badge-pulse h-6 px-2.5 text-xs scale-in">
                    {unreadCount} جدید
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                {labels.subtitle}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="btn-ghost-subtle gap-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
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

      {/* ─── Filter Tabs with Count Badges ─── */}
      <Card className="glass-card shadow-sm card-inner-glow animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Filter className="h-4 w-4" />
            {labels.filterType}
          </div>
          <div className="tab-group flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => {
              const count = tabCounts[tab.key] ?? 0
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    tab-item inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]
                    ${isActive
                      ? 'tab-item-active bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/35'
                      : 'glass-card border border-purple-200/50 dark:border-purple-800/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
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

      {/* ─── Notifications List ─── */}
      {filtered.length === 0 ? (
        <Card className="glass-card card-inner-glow shadow-sm animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 dark:from-purple-900/20 dark:to-fuchsia-800/20 flex items-center justify-center mb-5 float-animation">
              <Inbox className="h-12 w-12 text-purple-300" />
            </div>
            <p className="text-base font-semibold">{labels.noNotifications}</p>
            <p className="text-sm text-muted-foreground mt-1">{labels.noNotificationsDesc}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 stagger-children animate-in" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
          {timeGroups.map((group, gi) => {
            const isCollapsed = collapsedGroups.has(group.label)
            return (
              <div key={group.label}>
                {/* Time group header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center gap-3 mb-3 w-full group cursor-pointer"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-800/30 shadow-sm transition-all duration-200 group-hover:shadow-md">
                    <Clock className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{group.label}</span>
                    <Badge variant="secondary" className="text-[10px] bg-purple-200/50 dark:bg-purple-800/30 text-purple-600 dark:text-purple-400 border-0">
                      {group.items.length}
                    </Badge>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-purple-200/50 to-transparent dark:from-purple-800/30" />
                  <span className="text-muted-foreground transition-transform duration-300">
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                  </span>
                </button>

                {!isCollapsed && (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2 pr-1">
                      {group.items.map((n, idx) => {
                        const config = getTypeConfig(n.type)
                        return (
                          <Card
                            key={n.id}
                            onClick={() => { setSelectedNotification(n); if (!n.read) handleMarkRead(n.id) }}
                            className={`
                              ${config.bg} ${config.border} ${config.borderAccent}
                              glass-card card-inner-glow hover-lift shadow-sm animate-in cursor-pointer
                              transition-all duration-300 scale-in
                              ${!n.read ? 'ring-1 ring-purple-300/50 dark:ring-purple-700/50' : 'opacity-80 hover:opacity-100'}
                            `}
                            style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Gradient icon circle */}
                                <div className={`rounded-xl p-2.5 shrink-0 bg-gradient-to-br ${config.iconGradient} shadow-md transition-all duration-300 hover:scale-110`}>
                                  <div className="text-white">{config.icon}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-semibold ${!n.read ? '' : 'opacity-70'}`}>
                                      {n.title}
                                    </p>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {!n.read && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 badge-pulse" />
                                      )}
                                      <span className="text-xs text-muted-foreground whitespace-nowrap bg-background/30 px-2 py-0.5 rounded-lg">
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
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-xs text-purple-500 hover:text-purple-600 hover:bg-purple-500/10 gap-1 h-6 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
                                        onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id) }}
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
          })}
        </div>
      )}

      {/* ─── Notification Detail Sheet ─── */}
      <Sheet open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <SheetContent side="left" className="w-[400px] sm:max-w-[400px] p-0 dir-rtl" dir="rtl">
          {selectedNotification && (
            <>
              <SheetHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTypeConfig(selectedNotification.type).iconGradient} flex items-center justify-center shadow-lg scale-in`}>
                      <div className="text-white">{getTypeConfig(selectedNotification.type).icon}</div>
                    </div>
                    <div>
                      <SheetTitle className="text-lg">{selectedNotification.title}</SheetTitle>
                      <SheetDescription className="text-xs mt-0.5">
                        {formatRelativeTime(selectedNotification.createdAt)}
                      </SheetDescription>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </SheetHeader>

              <Separator className="mx-6" />

              <div className="p-6 space-y-6">
                {/* Message */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    پیام
                  </h4>
                  <div className="rounded-xl bg-muted/30 p-4 text-sm leading-relaxed">
                    {selectedNotification.message}
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">{labels.type}</p>
                    <Badge variant="outline" className={`text-xs border-0 ${getTypeConfig(selectedNotification.type).bg} ${getTypeConfig(selectedNotification.type).text}`}>
                      {typeLabels[selectedNotification.type]}
                    </Badge>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">{labels.time}</p>
                    <p className="text-xs font-medium">{formatRelativeTime(selectedNotification.createdAt)}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">{labels.status}</p>
                    <Badge variant="outline" className={`text-xs border-0 ${selectedNotification.read ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
                      {selectedNotification.read ? labels.readStatus : labels.unreadStatus}
                    </Badge>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">{labels.details}</p>
                    <p className="text-xs font-medium">{typeLabelsWithDesc[selectedNotification.type]}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {!selectedNotification.read && (
                    <Button
                      onClick={() => { handleMarkRead(selectedNotification.id); setSelectedNotification({ ...selectedNotification, read: true }) }}
                      className="btn-gradient-primary flex-1 gap-2 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:from-purple-600 hover:to-fuchsia-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
                    >
                      <Check className="h-4 w-4" />
                      {labels.markRead}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedNotification(null)}
                    className="btn-ghost-subtle flex-1 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    {labels.close}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
