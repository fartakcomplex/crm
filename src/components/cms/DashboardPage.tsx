'use client'

import { useState, useMemo, useEffect, useRef, useSyncExternalStore } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { ModuleStatsOverview, CrossModuleSyncStatus } from '@/components/CrossModulePanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3, FileText, Users, UserCircle, FolderKanban, Eye,
  DollarSign, TrendingUp, Plus, UserPlus, Clock, Activity,
  Lightbulb, MessageCircle, ChevronDown, Sparkles, Star, Zap,
  CalendarDays, ArrowUpRight, ArrowDownRight, Target, Flame,
  Save, PenLine, X, Upload, Wand2, Database, Server, HardDrive,
  Wifi, MessageSquare, StickyNote, Pin, PinOff, Timer, BarChart2,
  MousePointerClick, ShoppingCart, ImagePlus, ZapIcon, Bell, FolderPlus, CreditCard, Download,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'
import { formatRelativeTime } from './types'
import type { QuickNote } from './types'
import { MiniSparkline } from './MiniSparkline'
import { NotesWidget } from './NotesWidget'
import { PerformanceMonitor } from './PerformanceMonitor'
import { BookmarkManager } from './BookmarkManager'
import { NotificationSoundToggle } from './NotificationSoundToggle'
import { ColorThemeCustomizer } from './ColorThemeCustomizer'
import { QuickStatsRow } from './QuickStatsRow'
import { DataExportWidget } from './DataExportWidget'
import { SystemStatusWidget } from './SystemStatusWidget'
import ActivityFeedWidget from './ActivityFeedWidget'
import AnalyticsOverviewWidget from './AnalyticsOverviewWidget'
import ThemeCustomizerWidget from './ThemeCustomizerWidget'
import DataExportDialog from '@/components/cms/DataExportDialog'

// Persian labels
const labels = {
  title: 'داشبورد',
  subtitle: 'نمای کلی سیستم مدیریت محتوا',
  totalPosts: 'کل مطالب',
  totalUsers: 'کاربران',
  totalCustomers: 'مشتریان',
  totalProjects: 'پروژه‌ها',
  totalViews: 'بازدیدها',
  revenue: 'درآمد',
  quickActions: 'عملیات سریع',
  recentActivities: 'فعالیت‌های اخیر',
  valueMetrics: 'شاخص‌های ارزش',
  aiSuggestions: 'پیشنهادات هوش مصنوعی',
  recentComments: 'نظرات اخیر',
  monthlyViews: 'بازدید ماهانه',
  categoryDist: 'توزیع دسته‌بندی‌ها',
  weeklyActivity: 'فعالیت هفتگی',
  contentStatus: 'وضعیت محتوا',
  popularArticles: 'مقالات پربازدید',
  monthlyViewsTrend: 'روند بازدید ماهانه',
  quickDraft: 'پیش‌نویس سریع',
  quickDraftTitle: 'عنوان مطلب',
  quickDraftContent: 'محتوای مطلب...',
  quickDraftCategory: 'انتخاب دسته‌بندی',
  quickDraftSave: 'ذخیره به عنوان پیش‌نویس',
  quickDraftSaved: 'پیش‌نویس با موفقیت ذخیره شد',
  quickDraftPlaceholder: 'محتوای مطلب را اینجا بنویسید...',
  createPost: 'ایجاد مطلب',
  addUser: 'افزودن کاربر',
  newProject: 'پروژه جدید',
  addCustomer: 'مشتری جدید',
  mediaUpload: 'بارگذاری رسانه',
  aiGenerate: 'تولید با AI',
  collapsed: 'باز/بسته',
  views: 'بازدید',
  comments: 'نظرات',
  posts: 'مطالب',
  published: 'منتشر شده',
  draft: 'پیش‌نویس',
  archived: 'بایگانی',
  noActivities: 'فعالیتی یافت نشد',
  noComments: 'نظری یافت نشد',
  noArticles: 'مقاله‌ای یافت نشد',
  improveSeo: 'بهبود سئو',
  schedulePost: 'زمان‌بندی انتشار',
  repurposeContent: 'استفاده مجدد از محتوا',
  updateMeta: 'بروزرسانی متا داده‌ها',
  optimizeImages: 'بهینه‌سازی تصاویر',
  noCategory: 'بدون دسته‌بندی',
  // New widget labels
  quickActionsNew: 'دسترسی سریع',
  newPostAction: 'مطلب جدید',
  uploadMediaAction: 'بارگذاری رسانه',
  viewCommentsAction: 'مشاهده نظرات',
  aiWriterAction: 'نویسنده هوشمند',
  addUserAction: 'افزودن کاربر',
  newProjectAction: 'پروژه جدید',
  activityTimeline: 'خط زمان فعالیت‌ها',
  popularPostsNew: 'محبوب‌ترین مطالب',
  systemHealth: 'سلامت سیستم',
  databaseConnected: 'متصل',
  apiActive: 'فعال',
  storageLabel: 'فضای ذخیره‌سازی',
  serverOnline: 'آنلاین',
  miniCalendar: 'تقویم',
  quickNotes: 'یادداشت‌های سریع',
  addNote: 'یادداشت جدید',
  notePlaceholder: 'متن یادداشت خود را بنویسید...',
  noteCreated: 'یادداشت با موفقیت ایجاد شد',
  noteDeleted: 'یادداشت حذف شد',
  noNotes: 'یادداشتی وجود ندارد',
  noNotesDesc: 'با کلیک روی دکمه + یک یادداشت جدید ایجاد کنید',
  // Clock widget labels
  clockWidgetTitle: 'ساعت و تاریخ',
  // Quick stats summary
  quickStatsSummary: 'خلاصه آمار',
  totalOrders: 'سفارشات',
  // Floating action bar
  floatingBarTitle: 'دسترسی سریع',
  newPostBtn: 'مطلب جدید',
  newOrderBtn: 'سفارش جدید',
  uploadMediaBtn: 'بارگذاری رسانه',
}

const statusLabel: Record<string, string> = {
  published: 'منتشر شده',
  draft: 'پیش‌نویس',
  archived: 'بایگانی',
  pending: 'در انتظار',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  spam: 'هرزنامه',
}

const aiSuggestions = [
  { icon: <Lightbulb className="h-4 w-4" />, text: labels.improveSeo, desc: '۳ مطلب شما سئوی ضعیف دارند' },
  { icon: <Clock className="h-4 w-4" />, text: labels.schedulePost, desc: '۲ پیش‌نویس آماده انتشار هستند' },
  { icon: <Zap className="h-4 w-4" />, text: labels.repurposeContent, desc: 'محتوای محبوب را دوباره استفاده کنید' },
  { icon: <FileText className="h-4 w-4" />, text: labels.updateMeta, desc: 'متا توضیحات ۵ مطلب خالی است' },
  { icon: <Sparkles className="h-4 w-4" />, text: labels.optimizeImages, desc: 'تصاویر ۴ مطلب نیاز به بهینه‌سازی دارند' },
]

// ─────────────── Recharts Color Constants ───────────────────────

const VIOLET_MAIN = '#8b5cf6'
const VIOLET_LIGHT = '#a78bfa'
const VIOLET_DARK = '#7c3aed'
const PURPLE_MAIN = '#a855f7'
const PURPLE_LIGHT = '#c084fc'
const FUCHSIA_MAIN = '#d946ef'

// Content status colors
const CONTENT_STATUS_COLORS: Record<string, string> = {
  published: '#22c55e',
  draft: '#eab308',
  archived: '#9ca3af',
}

// ──────────────────── useCountUp Hook ──────────────────────────

function useCountUp(target: number, duration = 800, enabled = true) {
  const [value, setValue] = useState(enabled ? 0 : target)
  useEffect(() => {
    if (!enabled) return
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    return () => {}
  }, [target, duration, enabled])
  return value
}

// ─────────────────────── Stat Card ───────────────────────────────

function StatCard({ icon, label, value, color, delay, numericValue, sparklineData, sparklineColor, trend }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; delay?: number; numericValue?: number
  sparklineData?: number[]; sparklineColor?: string; trend?: 'up' | 'down' | 'flat'
}) {
  const animatedValue = useCountUp(numericValue ?? 0, 1000, numericValue !== undefined)
  const displayValue = numericValue !== undefined ? animatedValue : value

  return (
    <Card
      className={`bg-gradient-to-br ${color} border-0 text-white stat-card stat-card-gradient card-elevated hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in`}
      style={{ animationDelay: `${delay ?? 0}ms`, animationFillMode: 'both' }}
    >
      {/* Shine overlay */}
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 ease-out" />
      </div>
      <CardContent className="p-4 flex items-center gap-3 relative z-10">
        <div className="bg-white/20 rounded-lg p-2.5 backdrop-blur-sm">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm opacity-80">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{displayValue}</p>
          {sparklineData && sparklineData.length >= 2 && (
            <div className="mt-1 opacity-70">
              <MiniSparkline
                data={sparklineData}
                color={sparklineColor ?? 'rgba(255,255,255,0.8)'}
                fillColor={sparklineColor ?? 'rgba(255,255,255,0.6)'}
                trend={trend}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ────────────────── Collapsible Section ──────────────────────────

function Section({ title, defaultOpen, children, delay }: {
  title: string; defaultOpen: boolean; children: React.ReactNode; delay?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in" style={{ animationDelay: `${delay ?? 0}ms`, animationFillMode: 'both' }}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-violet-500/5 transition-colors rounded-t-lg py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-violet-700 dark:text-violet-300">{title}</CardTitle>
              <ChevronDown className={`h-5 w-5 text-violet-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

// ──────────────── Real-time Persian Clock Widget ────────────────

const emptySubscribe = (_callback: () => void) => () => {}

function usePersianClock(interval = 1000) {
  const [time, setTime] = useState({ hours: '', minutes: '', seconds: '', date: '', weekday: '' })

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime({
        hours: now.toLocaleTimeString('fa-IR', { hour: '2-digit', hour12: false }),
        minutes: now.toLocaleTimeString('fa-IR', { minute: '2-digit' }),
        seconds: now.toLocaleTimeString('fa-IR', { second: '2-digit' }),
        date: now.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }),
        weekday: now.toLocaleDateString('fa-IR', { weekday: 'long' }),
      })
    }
    update()
    const id = setInterval(update, interval)
    return () => clearInterval(id)
  }, [interval])

  return time
}

function PersianClockWidget() {
  const { hours, minutes, seconds, date, weekday } = usePersianClock()
  const colonVisible = useSyncExternalStore(
    emptySubscribe,
    () => new Date().getMilliseconds() < 500,
    () => true,
  )

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Digital Clock */}
      <div className="flex items-center gap-0.5 font-mono" dir="ltr">
        <span className="inline-flex items-center justify-center bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-lg px-2 py-1 text-xl font-bold tabular-nums min-w-[2.5rem] text-center shadow-sm">
          {hours}
        </span>
        <span className={`text-violet-500 dark:text-violet-400 text-xl font-bold transition-opacity duration-100 ${colonVisible ? 'opacity-100' : 'opacity-30'}`}>
          :
        </span>
        <span className="inline-flex items-center justify-center bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-lg px-2 py-1 text-xl font-bold tabular-nums min-w-[2.5rem] text-center shadow-sm">
          {minutes}
        </span>
        <span className={`text-violet-500 dark:text-violet-400 text-xl font-bold transition-opacity duration-100 ${colonVisible ? 'opacity-100' : 'opacity-30'}`}>
          :
        </span>
        <span className="inline-flex items-center justify-center bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300 rounded-lg px-2 py-1 text-xl font-bold tabular-nums min-w-[2.5rem] text-center shadow-sm animate-pulse">
          {seconds}
        </span>
      </div>
      {/* Jalali Date */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5" />
        <span className="font-medium">{weekday}</span>
        <span className="text-border">|</span>
        <span>{date}</span>
      </div>
    </div>
  )
}

// Legacy PersianDate (kept for backward compatibility with other references)
function PersianDate() {
  const date = useSyncExternalStore(
    emptySubscribe,
    () => new Date().toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    () => '',
  )
  return <span>{date}</span>
}

// ──────────────────── Mini Trend Card ────────────────────────────

function MiniTrendCard({ icon, label, value, change, trend, color, bgColor, delay }: {
  icon: React.ReactNode; label: string; value: string; change: string; trend: 'up' | 'down' | 'flat';
  color: string; bgColor: string; delay?: number
}) {
  return (
    <Card className={`hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in`} style={{ animationDelay: `${delay ?? 0}ms`, animationFillMode: 'both' }}>
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className={`h-8 w-8 rounded-lg ${bgColor} flex items-center justify-center ${color}`}>
            {icon}
          </div>
          {trend !== 'flat' && (
            <Badge className={`text-[10px] gap-0.5 border-0 px-1.5 py-0 ${
              trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {change}
            </Badge>
          )}
        </div>
        <p className="text-lg font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

// ────────────────────── Skeleton Loader ──────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6 animate-in">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ────────────── Custom Tooltip for Charts ───────────────────────

function PersianTooltip({ active, payload, label: tooltipLabel, labelKey }: {
  active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string; name: string }>;
  label?: string; labelKey?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="glass-card border border-violet-200/50 dark:border-violet-700/50 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">{tooltipLabel ?? ''}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">
            {labelKey === 'comments' && entry.dataKey === 'comments' ? labels.comments :
             labelKey === 'comments' && entry.dataKey === 'posts' ? labels.posts :
             labels.views}
          </span>
          <span className="font-bold tabular-nums">{entry.value.toLocaleString('fa-IR')}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: {
  active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string; name: string } }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  return (
    <div className="glass-card border border-violet-200/50 dark:border-violet-700/50 rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.payload.fill }} />
        <span className="font-medium">{entry.name}</span>
        <span className="font-bold tabular-nums">{entry.value.toLocaleString('fa-IR')}</span>
      </div>
    </div>
  )
}

// ──────────────── Pie Label Renderer ─────────────────────────────

const RADIAN = Math.PI / 180

function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}): React.ReactNode {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.05) return null

  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-background text-[11px] font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ──────────────────── Quick Draft Widget ─────────────────────────

function QuickDraftWidget({ categories }: { categories: Array<{ id: string; name: string }> }) {
  const { createPost } = useCMS()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('لطفاً عنوان مطلب را وارد کنید')
      return
    }
    createPost.mutate({
      title: title.trim(),
      content: content.trim(),
      status: 'draft',
      categoryId: categoryId || null,
      slug: title.trim().replace(/\s+/g, '-').toLowerCase().slice(0, 80),
      excerpt: content.trim().slice(0, 160),
      featured: false,
    }, {
      onSuccess: () => {
        toast.success(labels.quickDraftSaved)
        setTitle('')
        setContent('')
        setCategoryId('')
      },
      onError: () => {
        toast.error('خطا در ذخیره پیش‌نویس')
      },
    })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="quick-draft-title" className="text-sm text-muted-foreground">
          {labels.quickDraftTitle}
        </Label>
        <Input
          id="quick-draft-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={labels.quickDraftTitle}
          className="border-violet-200/60 dark:border-violet-800/40 focus:border-violet-400 dark:focus:border-violet-500"
          dir="rtl"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quick-draft-content" className="text-sm text-muted-foreground sr-only">
          {labels.quickDraftContent}
        </Label>
        <Textarea
          id="quick-draft-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={labels.quickDraftPlaceholder}
          rows={4}
          className="border-violet-200/60 dark:border-violet-800/40 focus:border-violet-400 dark:focus:border-violet-500 resize-none"
          dir="rtl"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm text-muted-foreground sr-only">{labels.quickDraftCategory}</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="border-violet-200/60 dark:border-violet-800/40">
            <SelectValue placeholder={labels.quickDraftCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{labels.noCategory}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={handleSave}
        disabled={createPost.isPending || !title.trim()}
        className="w-full bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      >
        {createPost.isPending ? (
          <>
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            در حال ذخیره...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            {labels.quickDraftSave}
          </>
        )}
      </Button>
    </div>
  )
}

// ──────────────── Onboarding Tip Banner ──────────────────────────

const TIPS = [
  '💡 با Ctrl+K می‌توانید سریعاً هر چیزی را جستجو کنید',
  '🚀 با دستیار هوش مصنوعی، محتوای خود را سریع‌تر تولید کنید',
  '📊 نمودارهای داشبورد را با کلیک بر روی هر بخش باز و بسته کنید',
  '📎 فایل‌های خود را با drag & drop در صفحه رسانه آپلود کنید',
  '🌙 از حالت تاریک برای کار راحت‌تر در شب استفاده کنید',
]

// ─── Tip Banner External Store ──────────────────────────────────────

interface TipBannerState { dismissed: boolean; tip: string }

let tipBannerListeners: Array<() => void> = []
let tipBannerCache: TipBannerState | null = null

function getTipBannerSnapshot(): TipBannerState {
  if (tipBannerCache !== null) return tipBannerCache
  if (typeof window === 'undefined') return { dismissed: false, tip: TIPS[0] }
  tipBannerCache = {
    dismissed: localStorage.getItem('cms-tip-dismissed') !== null,
    tip: TIPS[Math.floor(Math.random() * TIPS.length)],
  }
  return tipBannerCache
}

function getTipBannerServerSnapshot(): TipBannerState {
  return { dismissed: false, tip: TIPS[0] }
}

function subscribeToTipBanner(callback: () => void): () => void {
  tipBannerListeners.push(callback)
  return () => { tipBannerListeners = tipBannerListeners.filter(l => l !== callback) }
}

function updateTipBanner(partial: Partial<TipBannerState>): void {
  tipBannerCache = null
  if (typeof window !== 'undefined' && partial.dismissed) {
    localStorage.setItem('cms-tip-dismissed', 'true')
  }
  for (const listener of tipBannerListeners) listener()
}

function OnboardingTipBanner() {
  const { dismissed, tip } = useSyncExternalStore(
    subscribeToTipBanner,
    getTipBannerSnapshot,
    getTipBannerServerSnapshot,
  )
  const [visible, setVisible] = useState(true)

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => {
      updateTipBanner({ dismissed: true })
    }, 300)
  }

  if (dismissed) return null

  return (
    <div
      className={`card-elevated rounded-xl border border-violet-200/60 dark:border-violet-700/40 overflow-hidden transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-8px]'
      }`}
      style={{
        animation: 'content-fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        borderRight: '4px solid transparent',
        borderImage: 'linear-gradient(to bottom, #8b5cf6, #d946ef) 1',
        borderRightWidth: '4px',
        borderImageSlice: '1',
      }}
    >
      <div className="flex items-center justify-between p-3.5 pr-5 bg-gradient-to-l from-violet-500/5 via-purple-500/5 to-transparent dark:from-violet-500/10 dark:via-purple-500/8">
        <p className="text-sm text-foreground/80">{tip}</p>
        <button
          onClick={handleDismiss}
          className="shrink-0 ml-3 p-1 rounded-md hover:bg-violet-500/10 transition-colors text-muted-foreground hover:text-foreground focus-glow"
          aria-label="بستن نکته"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ────────────── Quick Actions Widget (Gradient Cards) ──────────────

const quickActionItems = [
  { icon: <Plus className="h-5 w-5" />, label: labels.newPostAction, gradient: 'from-violet-500 to-purple-600', hoverShadow: 'hover:shadow-violet-500/25' },
  { icon: <Upload className="h-5 w-5" />, label: labels.uploadMediaAction, gradient: 'from-rose-500 to-pink-600', hoverShadow: 'hover:shadow-rose-500/25' },
  { icon: <MessageSquare className="h-5 w-5" />, label: labels.viewCommentsAction, gradient: 'from-amber-500 to-orange-600', hoverShadow: 'hover:shadow-amber-500/25' },
  { icon: <Wand2 className="h-5 w-5" />, label: labels.aiWriterAction, gradient: 'from-emerald-500 to-teal-600', hoverShadow: 'hover:shadow-emerald-500/25' },
  { icon: <UserPlus className="h-5 w-5" />, label: labels.addUserAction, gradient: 'from-cyan-500 to-sky-600', hoverShadow: 'hover:shadow-cyan-500/25' },
  { icon: <FolderKanban className="h-5 w-5" />, label: labels.newProjectAction, gradient: 'from-fuchsia-500 to-purple-600', hoverShadow: 'hover:shadow-fuchsia-500/25' },
]

function QuickActionsWidget() {
  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-base text-violet-700 dark:text-violet-300">{labels.quickActionsNew}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2.5">
          {quickActionItems.map((action, i) => (
            <button
              key={i}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-md ${action.hoverShadow} hover:scale-105 active:scale-[0.97] transition-all duration-200 hover-lift`}
            >
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">{action.icon}</div>
              <span className="text-[11px] font-medium leading-tight text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ────────────── Recent Activity Timeline Widget ──────────────

const ACTIVITY_COLORS = ['#8b5cf6', '#a855f7', '#d946ef', '#f59e0b', '#22c55e', '#06b6d4']

function ActivityTimelineWidget({ activities }: { activities: Array<{ id: string; action: string; details: string; createdAt: string; user?: Pick<import('./types').User, 'id' | 'name' | 'email' | 'avatar'> | null }> }) {
  const recent = activities.slice(0, 5)
  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-base text-violet-700 dark:text-violet-300">{labels.activityTimeline}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">{labels.noActivities}</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-2 bottom-2 start-[11px] w-0.5 bg-gradient-to-b from-violet-300 via-purple-300 to-fuchsia-300 dark:from-violet-700 dark:via-purple-700 dark:to-fuchsia-700" />
            <div className="space-y-3">
              {recent.map((a, i) => (
                <div key={a.id} className="flex items-start gap-3 relative">
                  {/* Colored dot */}
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-background"
                    style={{ backgroundColor: ACTIVITY_COLORS[i % ACTIVITY_COLORS.length] }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium truncate">{a.details || a.action}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</span>
                      {a.user?.name && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 text-[9px] font-bold">
                            {a.user.name.charAt(0)}
                          </div>
                          <span className="text-xs text-muted-foreground truncate max-w-[80px]">{a.user.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ────────────── Popular Posts Widget ──────────────

const POPULARITY_GRADIENTS = [
  'from-violet-500 to-fuchsia-500',
  'from-purple-500 to-violet-500',
  'from-fuchsia-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
]

function PopularPostsWidget({ popularPosts }: { popularPosts: Array<{ title: string; views: number; id: string }> }) {
  const posts = popularPosts.slice(0, 5)
  const maxViews = posts.length > 0 ? Math.max(...posts.map(p => p.views), 1) : 1
  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-base text-violet-700 dark:text-violet-300">{labels.popularPostsNew}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <Star className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">{labels.noArticles}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((p, i) => (
              <div key={p.id} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-md bg-gradient-to-br ${POPULARITY_GRADIENTS[i % POPULARITY_GRADIENTS.length]} text-white text-[10px] font-bold flex items-center justify-center shrink-0`}>
                      {i + 1}
                    </span>
                    <p className="text-sm font-medium truncate">{p.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 mr-2">
                    <Eye className="h-3 w-3" />
                    <span className="tabular-nums">{p.views.toLocaleString('fa-IR')}</span>
                  </div>
                </div>
                {/* Gradient popularity bar */}
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-l ${POPULARITY_GRADIENTS[i % POPULARITY_GRADIENTS.length]} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.max((p.views / maxViews) * 100, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ────────────── System Health Widget ──────────────

function SystemHealthWidget() {
  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-base text-violet-700 dark:text-violet-300">{labels.systemHealth}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-4">
          {/* Database */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">دیتابیس</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">{labels.databaseConnected}</span>
            </div>
          </div>
          {/* API */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">API</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">{labels.apiActive}</span>
            </div>
          </div>
          {/* Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{labels.storageLabel}</span>
              </div>
              <span className="text-sm font-bold tabular-nums text-violet-600 dark:text-violet-400">۷۵٪</span>
            </div>
            <Progress value={75} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-fuchsia-500 [&>div]:transition-all" />
          </div>
          {/* Server */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">سرور</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">{labels.serverOnline}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ────────────── Mini Calendar Widget ──────────────

const PERSIAN_WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

// ─── Calendar External Store ──────────────────────────────────────

interface CalendarData { persianMonth: string; persianFirstDay: number; daysInMonth: number; today: number }

let calendarListeners: Array<() => void> = []
let calendarCache: CalendarData | null = null

const CALENDAR_SERVER_SNAPSHOT: CalendarData = { persianMonth: '', persianFirstDay: 0, daysInMonth: 30, today: 0 }

function getCalendarSnapshot(): CalendarData {
  if (calendarCache !== null) return calendarCache
  if (typeof window === 'undefined') return CALENDAR_SERVER_SNAPSHOT
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const persianMonth = now.toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const persianFirstDay = (firstDay + 1) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  calendarCache = { persianMonth, persianFirstDay, daysInMonth, today }
  return calendarCache
}

function getCalendarServerSnapshot(): CalendarData {
  return CALENDAR_SERVER_SNAPSHOT
}

function subscribeToCalendar(callback: () => void): () => void {
  calendarListeners.push(callback)
  return () => { calendarListeners = calendarListeners.filter(l => l !== callback) }
}

function MiniCalendarWidget() {
  const calendarData = useSyncExternalStore(
    subscribeToCalendar,
    getCalendarSnapshot,
    getCalendarServerSnapshot,
  )

  const { persianMonth, persianFirstDay, daysInMonth, today } = calendarData

  // Build calendar cells
  const cells: Array<{ day: number; isToday: boolean }> = []
  // Empty slots before first day
  for (let i = 0; i < persianFirstDay; i++) {
    cells.push({ day: 0, isToday: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isToday: d === today })
  }

  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-violet-700 dark:text-violet-300">{labels.miniCalendar}</CardTitle>
          <Badge variant="secondary" className="text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            {persianMonth}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1.5">
          {PERSIAN_WEEK_DAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((cell, i) => (
            <div
              key={i}
              className={`text-center text-xs py-1.5 rounded-lg transition-colors ${
                cell.day === 0
                  ? ''
                  : cell.isToday
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold shadow-sm shadow-violet-500/30'
                    : 'hover:bg-violet-500/10 text-foreground'
              }`}
            >
              {cell.day > 0 ? cell.day.toLocaleString('fa-IR') : ''}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ────────────── Quick Notes Widget ──────────────

const NOTE_COLORS: Array<{ value: QuickNote['color']; label: string; bgClass: string; borderClass: string; dotClass: string }> = [
  { value: 'yellow', label: 'زرد', bgClass: 'bg-yellow-50 dark:bg-yellow-950/40', borderClass: 'border-yellow-200 dark:border-yellow-800/50', dotClass: 'bg-yellow-400' },
  { value: 'green',  label: 'سبز', bgClass: 'bg-green-50 dark:bg-green-950/40',  borderClass: 'border-green-200 dark:border-green-800/50',  dotClass: 'bg-green-400' },
  { value: 'blue',   label: 'آبی', bgClass: 'bg-blue-50 dark:bg-blue-950/40',   borderClass: 'border-blue-200 dark:border-blue-800/50',   dotClass: 'bg-blue-400' },
  { value: 'pink',   label: 'صورتی', bgClass: 'bg-pink-50 dark:bg-pink-950/40',   borderClass: 'border-pink-200 dark:border-pink-800/50',   dotClass: 'bg-pink-400' },
  { value: 'purple', label: 'بنفش', bgClass: 'bg-purple-50 dark:bg-purple-950/40', borderClass: 'border-purple-200 dark:border-purple-800/50', dotClass: 'bg-purple-400' },
]

const STICKY_HEADER_COLORS: Record<QuickNote['color'], string> = {
  yellow: 'bg-yellow-300 dark:bg-yellow-600',
  green:  'bg-green-300 dark:bg-green-600',
  blue:   'bg-blue-300 dark:bg-blue-600',
  pink:   'bg-pink-300 dark:bg-pink-600',
  purple: 'bg-purple-300 dark:bg-purple-600',
}

const STICKY_BODY_COLORS: Record<QuickNote['color'], string> = {
  yellow: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800/40',
  green:  'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/40',
  blue:   'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40',
  pink:   'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800/40',
  purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/40',
}

function QuickNotesWidget({ notes }: { notes: QuickNote[] }) {
  const { createNote, updateNote, deleteNote } = useCMS()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [selectedColor, setSelectedColor] = useState<QuickNote['color']>('yellow')

  const handleCreate = () => {
    if (!noteText.trim()) {
      toast.error('لطفاً متن یادداشت را وارد کنید')
      return
    }
    createNote.mutate(
      { content: noteText.trim(), color: selectedColor, pinned: false },
      {
        onSuccess: () => {
          toast.success(labels.noteCreated)
          setNoteText('')
          setSelectedColor('yellow')
          setDialogOpen(false)
        },
        onError: () => toast.error('خطا در ایجاد یادداشت'),
      },
    )
  }

  const handleDelete = (id: string) => {
    deleteNote.mutate(id, {
      onSuccess: () => toast.success(labels.noteDeleted),
      onError: () => toast.error('خطا در حذف یادداشت'),
    })
  }

  const handleTogglePin = (note: QuickNote) => {
    updateNote.mutate({ id: note.id, pinned: !note.pinned }, {
      onError: () => toast.error('خطا در بروزرسانی یادداشت'),
    })
  }

  // Sort: pinned first, then by updatedAt descending
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [notes])

  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0 col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-violet-700 dark:text-violet-300">{labels.quickNotes}</CardTitle>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="gap-1.5 bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">{labels.addNote}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 flex items-center justify-center mb-3">
              <StickyNote className="h-7 w-7 text-violet-300" />
            </div>
            <p className="text-sm font-medium">{labels.noNotes}</p>
            <p className="text-xs mt-1 opacity-60">{labels.noNotesDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedNotes.map((note, idx) => (
              <div
                key={note.id}
                className={`group relative rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 animate-in overflow-hidden ${STICKY_BODY_COLORS[note.color]}`}
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
              >
                {/* Colored top strip */}
                <div className={`h-2 w-full ${STICKY_HEADER_COLORS[note.color]}`} />
                {/* Pin indicator */}
                <div className="flex items-center justify-between px-3 pt-2">
                  {note.pinned && (
                    <span className="text-sm" title="سنجاق شده">📌</span>
                  )}
                  {!note.pinned && <span className="w-[18px]" />}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => handleTogglePin(note)}
                      className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      title={note.pinned ? 'برداشتن سنجاق' : 'سنجاق کردن'}
                    >
                      {note.pinned ? <PinOff className="h-3 w-3 text-muted-foreground" /> : <Pin className="h-3 w-3 text-muted-foreground" />}
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="حذف"
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                    </button>
                  </div>
                </div>
                {/* Content */}
                <p className="px-3 pb-3 pt-1 text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[48px] max-h-[120px] overflow-y-auto">
                  {note.content}
                </p>
                {/* Timestamp */}
                <div className="px-3 pb-2">
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatRelativeTime(note.updatedAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Note Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="text-violet-700 dark:text-violet-300">{labels.addNote}</DialogTitle>
            <DialogDescription>{labels.notePlaceholder}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={labels.notePlaceholder}
              rows={4}
              className="border-violet-200/60 dark:border-violet-800/40 focus:border-violet-400 dark:focus:border-violet-500 resize-none"
              dir="rtl"
              autoFocus
            />
            {/* Color Selection */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">رنگ یادداشت:</p>
              <div className="flex items-center gap-2">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    className={`w-8 h-8 rounded-full ${c.dotClass} transition-all duration-200 hover:scale-110 ${selectedColor === c.value ? 'ring-2 ring-offset-2 ring-offset-background ring-violet-500 scale-110' : 'opacity-60 hover:opacity-100'}`}
                    title={c.label}
                    aria-label={`رنگ ${c.label}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogOpen(false); setNoteText(''); setSelectedColor('yellow') }}
              className="border-violet-200 dark:border-violet-800"
            >
              انصراف
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createNote.isPending || !noteText.trim()}
              className="bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white gap-2"
            >
              {createNote.isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              ایجاد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ────────────── Analytics Overview Widget ──────────────

const ANALYTICS_METRICS = [
  {
    label: 'بازدید صفحات',
    value: '۱۲٬۴۵۶',
    change: '+۱۸.۲٪',
    trend: 'up' as const,
    icon: <Eye className="h-4 w-4" />,
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    sparkData: [65, 72, 68, 80, 75, 88, 82, 95, 90, 100],
    sparkColor: '#8b5cf6',
    sparkFill: '#a78bfa',
    changePositive: true,
  },
  {
    label: 'نرخ بازگشت',
    value: '۳۲.۵٪',
    change: '−۵.۱٪',
    trend: 'down' as const,
    icon: <MousePointerClick className="h-4 w-4" />,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    sparkData: [45, 42, 40, 38, 36, 35, 33, 34, 32, 33],
    sparkColor: '#10b981',
    sparkFill: '#34d399',
    changePositive: true, // lower bounce rate is good
  },
  {
    label: 'میانگین ماندگاری',
    value: '۴:۳۲',
    change: '+۱۲.۸٪',
    trend: 'up' as const,
    icon: <Timer className="h-4 w-4" />,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    sparkData: [30, 35, 32, 40, 38, 45, 42, 48, 50, 55],
    sparkColor: '#f59e0b',
    sparkFill: '#fbbf24',
    changePositive: true,
  },
  {
    label: 'نرخ تبدیل',
    value: '۲.۴٪',
    change: '+۰.۸٪',
    trend: 'up' as const,
    icon: <BarChart2 className="h-4 w-4" />,
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    sparkData: [10, 12, 14, 15, 18, 17, 20, 22, 21, 24],
    sparkColor: '#f43f5e',
    sparkFill: '#fb7185',
    changePositive: true,
  },
]

function AnalyticsWidget() {
  const sparkId = useRef('analytics-spark')

  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0 lg:col-span-3">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-violet-700 dark:text-violet-300 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            تحلیل عملکرد
          </CardTitle>
          <Badge variant="secondary" className="text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            این ماه
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ANALYTICS_METRICS.map((metric, i) => (
            <div
              key={metric.label}
              className="group relative rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/30 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg ${metric.iconBg} flex items-center justify-center ${metric.iconColor}`}>
                  {metric.icon}
                </div>
                <Badge className={`text-[10px] gap-0.5 border-0 px-1.5 py-0 ${
                  metric.changePositive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {metric.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {metric.change}
                </Badge>
              </div>

              {/* Value */}
              <p className="text-2xl font-bold tabular-nums mb-0.5">{metric.value}</p>
              <p className="text-xs text-muted-foreground mb-3">{metric.label}</p>

              {/* Sparkline */}
              <svg viewBox="0 0 120 32" className="w-full h-8 overflow-visible opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                <defs>
                  <linearGradient id={`analytics-fill-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metric.sparkFill} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={metric.sparkFill} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                {/* Build points */}
                {(() => {
                  const data = metric.sparkData
                  const min = Math.min(...data)
                  const max = Math.max(...data)
                  const range = max - min || 1
                  const points = data.map((v, idx) => ({
                    x: (idx / (data.length - 1)) * 110 + 5,
                    y: 28 - ((v - min) / range) * 24,
                  }))
                  // Build smooth path
                  let pathD = `M ${points[0].x},${points[0].y}`
                  for (let j = 0; j < points.length - 1; j++) {
                    const p0 = points[Math.max(j - 1, 0)]
                    const p1 = points[j]
                    const p2 = points[j + 1]
                    const p3 = points[Math.min(j + 2, points.length - 1)]
                    const tension = 0.3
                    const cp1x = p1.x + (p2.x - p0.x) * tension
                    const cp1y = p1.y + (p2.y - p0.y) * tension
                    const cp2x = p2.x - (p3.x - p1.x) * tension
                    const cp2y = p2.y - (p3.y - p1.y) * tension
                    pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
                  }
                  // Fill area
                  const fillD = `${pathD} L ${points[points.length - 1].x},30 L ${points[0].x},30 Z`
                  return (
                    <g key={`spark-${i}`}>
                      <path d={fillD} fill={`url(#analytics-fill-${i})`} />
                      <path d={pathD} fill="none" stroke={metric.sparkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {/* End dot */}
                      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={metric.sparkColor} className="drop-shadow-sm" />
                    </g>
                  )
                })()}
              </svg>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ────────────── CSS-Only Sparkline Bar Chart ──────────────────

function CSSBarChart({ data, color = '#8b5cf6', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  return (
    <div className="flex items-end gap-[2px]" style={{ height: `${height}px` }}>
      {data.map((v, i) => {
        const pct = ((v - min) / range) * 100
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-500 ease-out"
            style={{
              height: `${Math.max(pct, 8)}%`,
              backgroundColor: color,
              opacity: 0.4 + (pct / 100) * 0.6,
              animationDelay: `${i * 50}ms`,
            }}
          />
        )
      })}
    </div>
  )
}

// ────────────── Dashboard Quick Stats Summary ──────────────────

function DashboardQuickStatsSummary({ statsData }: { statsData: { totalPosts?: number; totalOrders?: number; revenue?: number; totalUsers?: number; totalCustomers?: number; totalViews?: number; pendingOrders?: number } | null }) {
  const totalPosts = useCountUp(statsData?.totalPosts ?? 0, 1200, statsData !== null)
  const totalOrders = useCountUp(statsData?.totalOrders ?? 0, 1200, statsData !== null)
  const revenue = useCountUp(statsData?.revenue ?? 0, 1400, statsData !== null)
  const totalUsers = useCountUp(statsData?.totalUsers ?? 0, 1000, statsData !== null)

  const summaryCards = [
    {
      label: labels.totalPosts,
      value: totalPosts.toLocaleString('fa-IR'),
      rawValue: totalPosts,
      icon: <FileText className="h-5 w-5" />,
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-violet-100 dark:bg-violet-900/30',
      iconColor: 'text-violet-600 dark:text-violet-400',
      barData: [3, 5, 4, 7, 6, 8, 9, 7, 10, 12],
      barColor: '#8b5cf6',
    },
    {
      label: labels.totalOrders,
      value: totalOrders.toLocaleString('fa-IR'),
      rawValue: totalOrders,
      icon: <ShoppingCart className="h-5 w-5" />,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      barData: [2, 3, 5, 4, 6, 5, 7, 8, 6, 9],
      barColor: '#10b981',
    },
    {
      label: labels.revenue,
      value: `$${revenue.toLocaleString('en-US')}`,
      rawValue: revenue,
      icon: <DollarSign className="h-5 w-5" />,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      barData: [40, 55, 48, 60, 52, 70, 65, 78, 72, 85],
      barColor: '#f59e0b',
    },
    {
      label: labels.totalUsers,
      value: totalUsers.toLocaleString('fa-IR'),
      rawValue: totalUsers,
      icon: <Users className="h-5 w-5" />,
      gradient: 'from-cyan-500 to-sky-600',
      iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      barData: [1, 2, 2, 3, 3, 4, 5, 4, 6, 7],
      barColor: '#06b6d4',
    },
  ]

  return (
    <Card className="glass-card shadow-sm border-0 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">{labels.quickStatsSummary}</span>
          </div>
          <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            <Activity className="h-3 w-3 mr-1" />
            لحظه‌ای
          </Badge>
        </div>
        {/* Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border/50">
          {summaryCards.map((card, i) => (
            <div
              key={card.label}
              className="p-4 hover:bg-muted/30 transition-colors duration-200 animate-in"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`h-9 w-9 rounded-xl ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                  {card.icon}
                </div>
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shadow-sm`}>
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xl font-bold tabular-nums mb-0.5">{card.value}</p>
              <p className="text-xs text-muted-foreground mb-2">{card.label}</p>
              {/* CSS-only bar chart */}
              <CSSBarChart data={card.barData} color={card.barColor} height={24} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ────── Enhanced Activity Timeline with Alternating Cards ──────

const TIMELINE_ICON_MAP: Record<string, React.ReactNode> = {
  post: <FileText className="h-3 w-3" />,
  user: <Users className="h-3 w-3" />,
  comment: <MessageCircle className="h-3 w-3" />,
  default: <Activity className="h-3 w-3" />,
}

function getTimelineIcon(action: string): React.ReactNode {
  const lower = action.toLowerCase()
  if (lower.includes('post') || lower.includes('مطلب') || lower.includes('محتوا')) return TIMELINE_ICON_MAP.post
  if (lower.includes('user') || lower.includes('کاربر') || lower.includes('member')) return TIMELINE_ICON_MAP.user
  if (lower.includes('comment') || lower.includes('نظر')) return TIMELINE_ICON_MAP.comment
  return TIMELINE_ICON_MAP.default
}

function EnhancedActivityTimeline({ activities }: { activities: Array<{ id: string; action: string; details: string; createdAt: string; user?: Pick<import('./types').User, 'id' | 'name' | 'email' | 'avatar'> | null }> }) {
  const recent = activities.slice(0, 6)
  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Activity className="h-10 w-10 mb-3 opacity-20" />
        <p className="text-sm">{labels.noActivities}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Central timeline line */}
      <div className="absolute top-3 bottom-3 start-[18px] w-[2px] bg-gradient-to-b from-violet-300 via-purple-400 to-fuchsia-400 dark:from-violet-700 dark:via-purple-600 dark:to-fuchsia-600 rounded-full" />

      <div className="space-y-4">
        {recent.map((a, i) => {
          const isRight = i % 2 === 0
          const colorIdx = i % ACTIVITY_COLORS.length
          return (
            <div
              key={a.id}
              className={`flex items-start gap-3 relative animate-in`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
            >
              {/* Timeline dot with icon */}
              <div className="shrink-0 z-10 mt-1">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center border-[3px] border-background shadow-md"
                  style={{ backgroundColor: ACTIVITY_COLORS[colorIdx] }}
                >
                  <span className="text-white">{getTimelineIcon(a.action)}</span>
                </div>
              </div>

              {/* Alternating card */}
              <div className={`flex-1 min-w-0 ${isRight ? '' : ''}`}>
                <div className={`rounded-xl border p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  isRight
                    ? 'bg-gradient-to-l from-violet-50 to-background dark:from-violet-950/30 dark:to-background border-violet-200/60 dark:border-violet-800/40 hover:border-violet-300 dark:hover:border-violet-700'
                    : 'bg-gradient-to-l from-fuchsia-50 to-background dark:from-fuchsia-950/30 dark:to-background border-fuchsia-200/60 dark:border-fuchsia-800/40 hover:border-fuchsia-300 dark:hover:border-fuchsia-700'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-relaxed">{a.details || a.action}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-muted-foreground">{formatRelativeTime(a.createdAt)}</span>
                        {a.user?.name && (
                          <>
                            <span className="text-border text-[10px]">•</span>
                            <div className="flex items-center gap-1">
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                                style={{ backgroundColor: ACTIVITY_COLORS[colorIdx] }}
                              >
                                {a.user.name.charAt(0)}
                              </div>
                              <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{a.user.name}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Color accent bar on the left side */}
                    <div
                      className="w-1 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: ACTIVITY_COLORS[colorIdx], opacity: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ────────────── Floating Action Bar ──────────────────────────

function FloatingActionBar() {
  const { createPost } = useCMS()
  const [expanded, setExpanded] = useState(false)

  const actions = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: labels.newPostBtn,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/30',
      onClick: () => {
        createPost.mutate({
          title: '',
          content: '',
          status: 'draft',
          categoryId: null,
          slug: `post-${Date.now()}`,
          excerpt: '',
          featured: false,
        }, {
          onSuccess: () => toast.success('مطلب جدید ایجاد شد'),
        })
        setExpanded(false)
      },
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      label: labels.newOrderBtn,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/30',
      onClick: () => {
        toast.info('به زودی سفارش جدید اضافه می‌شود')
        setExpanded(false)
      },
    },
    {
      icon: <ImagePlus className="h-5 w-5" />,
      label: labels.uploadMediaBtn,
      gradient: 'from-rose-500 to-pink-600',
      shadow: 'shadow-rose-500/30',
      onClick: () => {
        toast.info('به زودی بارگذاری رسانه اضافه می‌شود')
        setExpanded(false)
      },
    },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      {/* Expanded action buttons */}
      <div
        className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex items-center gap-2 transition-all duration-300 ${
          expanded ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        {actions.map((action, i) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-l ${action.gradient} text-white shadow-lg ${action.shadow} hover:scale-105 active:scale-[0.97] transition-all duration-200 animate-in`}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
          >
            {action.icon}
            <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main toggle button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-5 py-3 rounded-2xl bg-background border-2 border-violet-300 dark:border-violet-700 shadow-xl shadow-violet-500/15 hover:shadow-2xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${
          expanded ? 'bg-violet-600 dark:bg-violet-500 border-violet-600 dark:border-violet-500 text-white' : 'text-foreground'
        }`}
      >
        <Zap className={`h-5 w-5 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`} />
        <span className="text-sm font-bold">{labels.floatingBarTitle}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
      </button>
    </div>
  )
}

// ────────────────────── Main Component ───────────────────────────

export default function DashboardPage() {
  useEnsureData(['stats', 'charts', 'activities', 'posts', 'categories', 'notes', 'orders', 'invoices', 'inventory', 'transactions', 'customers', 'products'])
  const { stats, charts, activities, comments, categories, createPost, notes } = useCMS()
  const notesData: QuickNote[] = (notes.data as QuickNote[] | undefined) ?? []
  const statsData = stats.data
  const chartData = charts.data
  const activitiesData = activities.data ?? []
  const commentsData = comments.data ?? []
  const categoriesData = categories.data ?? []
  const isLoading = stats.isLoading || charts.isLoading || categories.isLoading
  const [exportOpen, setExportOpen] = useState(false)

  // ── Data transforms for Recharts ──

  const contentStatusPieData = useMemo(() => {
    return (chartData?.contentStatus ?? []).map((cs) => ({
      name: statusLabel[cs.status] ?? cs.status,
      value: cs.count,
      fill: CONTENT_STATUS_COLORS[cs.status] ?? '#9ca3af',
    }))
  }, [chartData?.contentStatus])

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Welcome Banner */}
      <Card className="relative overflow-hidden glass-card border-0 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-l from-violet-600/10 via-purple-500/5 to-fuchsia-500/10 dark:from-violet-600/20 dark:via-purple-500/10 dark:to-fuchsia-500/10 pointer-events-none" />
        <CardContent className="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25 float-animation">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold gradient-text">{labels.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CrossModuleSyncStatus />
            <PersianClockWidget />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs hover:bg-accent/60 transition-colors"
              onClick={() => setExportOpen(true)}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">خروجی داده</span>
            </Button>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 w-fit shadow-sm gap-1">
              <Activity className="h-3 w-3" />
              آنلاین
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Tip Banner */}
      <OnboardingTipBanner />

      {/* Quick Stats Summary with Animated Counters & CSS Bar Charts */}
      <DashboardQuickStatsSummary statsData={statsData ?? null} />

      {/* Quick Stats Row */}
      <QuickStatsRow />

      {/* Today's Quick Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniTrendCard
          label="بازدید امروز"
          value="۱۲۴"
          change="+۲۳٪"
          trend="up"
          icon={<Eye className="h-4 w-4" />}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-900/20"
          delay={0}
        />
        <MiniTrendCard
          label="نظرات جدید"
          value="۸"
          change="+۴"
          trend="up"
          icon={<MessageCircle className="h-4 w-4" />}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-100 dark:bg-amber-900/20"
          delay={50}
        />
        <MiniTrendCard
          label="کاربران فعال"
          value="۳"
          change="۰٪"
          trend="flat"
          icon={<Users className="h-4 w-4" />}
          color="text-cyan-600 dark:text-cyan-400"
          bgColor="bg-cyan-100 dark:bg-cyan-900/20"
          delay={100}
        />
        <MiniTrendCard
          label="تسک‌های فعال"
          value="۵"
          change="-۱"
          trend="down"
          icon={<Target className="h-4 w-4" />}
          color="text-rose-600 dark:text-rose-400"
          bgColor="bg-rose-100 dark:bg-rose-900/20"
          delay={150}
        />
      </div>

      {/* System Health Widget — compact */}
      <Card className="glass-card card-elevated">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <span>سلامت سیستم</span>
            <Badge className="badge-gradient-emerald text-[10px]">عالی</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'سرور', value: 'فعال', status: 'ok', icon: Server },
              { label: 'پایگاه داده', value: 'متصل', status: 'ok', icon: Database },
              { label: 'فضای ذخیره', value: '۲.۴ GB', status: 'ok', icon: HardDrive },
              { label: 'آپتایم', value: '۹۹.۹٪', status: 'ok', icon: Clock },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-background/60 hover-lift">
                <item.icon className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
                <div className="mr-auto h-2 w-2 rounded-full bg-emerald-500 status-dot-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<FileText className="h-5 w-5" />} label={labels.totalPosts} value={statsData?.totalPosts ?? '—'} numericValue={statsData?.totalPosts} color="from-violet-500 to-violet-700" delay={0} sparklineData={[3, 5, 2, 8, 4, 6, 6]} sparklineColor="rgba(255,255,255,0.8)" trend="up" />
        <StatCard icon={<Users className="h-5 w-5" />} label={labels.totalUsers} value={statsData?.totalUsers ?? '—'} numericValue={statsData?.totalUsers} color="from-purple-500 to-purple-700" delay={50} sparklineData={[2, 2, 3, 3, 3, 4, 4]} sparklineColor="rgba(255,255,255,0.8)" trend="up" />
        <StatCard icon={<UserCircle className="h-5 w-5" />} label={labels.totalCustomers} value={statsData?.totalCustomers ?? '—'} numericValue={statsData?.totalCustomers} color="from-fuchsia-500 to-fuchsia-700" delay={100} sparklineData={[1, 2, 2, 3, 3, 4, 4]} sparklineColor="rgba(255,255,255,0.8)" trend="up" />
        <StatCard icon={<FolderKanban className="h-5 w-5" />} label={labels.totalProjects} value={statsData?.totalProjects ?? '—'} numericValue={statsData?.totalProjects} color="from-sky-500 to-sky-700" delay={150} sparklineData={[3, 3, 2, 4, 3, 3, 4]} sparklineColor="rgba(255,255,255,0.8)" trend="flat" />
        <StatCard icon={<Eye className="h-5 w-5" />} label={labels.totalViews} value={(statsData?.totalViews ?? 0).toLocaleString()} numericValue={statsData?.totalViews} color="from-emerald-500 to-emerald-700" delay={200} sparklineData={[100, 150, 120, 200, 180, 250, 300]} sparklineColor="rgba(255,255,255,0.8)" trend="up" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label={labels.revenue} value={`$${(statsData?.revenue ?? 0).toLocaleString()}`} numericValue={statsData?.revenue} color="from-amber-500 to-amber-700" delay={250} sparklineData={[50000, 60000, 45000, 80000, 70000, 90000, 78250]} sparklineColor="rgba(255,255,255,0.8)" trend="up" />
      </div>

      {/* Collapsible Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Access Grid */}
        <Section title={labels.quickActionsNew} defaultOpen={true} delay={100}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {[
              { label: 'ایجاد مطلب', icon: FileText, color: 'from-violet-500 to-purple-600', desc: 'محتوای جدید' },
              { label: 'افزودن کاربر', icon: UserPlus, color: 'from-cyan-500 to-blue-600', desc: 'کاربر جدید' },
              { label: 'پروژه جدید', icon: FolderPlus, color: 'from-emerald-500 to-green-600', desc: 'شروع پروژه' },
              { label: 'مشتری جدید', icon: UserCircle, color: 'from-amber-500 to-orange-600', desc: 'ثبت مشتری' },
              { label: 'ثبت سفارش', icon: ShoppingCart, color: 'from-rose-500 to-pink-600', desc: 'سفارش جدید' },
              { label: 'آپلود رسانه', icon: Upload, color: 'from-teal-500 to-cyan-600', desc: 'فایل و تصویر' },
              { label: 'دستیار AI', icon: Sparkles, color: 'from-fuchsia-500 to-purple-600', desc: 'کمک هوشمند' },
              { label: 'مشاهده گزارش', icon: BarChart3, color: 'from-sky-500 to-indigo-600', desc: 'آمار و ارقام' },
            ].map((item, i) => (
              <button key={item.label} className="group p-2.5 rounded-xl glass-card card-elevated hover-lift text-right transition-all duration-300" style={{ animationDelay: `${i * 60}ms` }}>
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center mb-1.5 shadow-md group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs font-medium">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </button>
            ))}
          </div>
        </Section>

        {/* Recent Activities — Enhanced Timeline */}
        <Section title={labels.recentActivities} defaultOpen={true} delay={150}>
          <div className="max-h-80 overflow-y-auto">
            <EnhancedActivityTimeline activities={activitiesData} />
          </div>
        </Section>

        {/* Value Metrics */}
        <Section title={labels.valueMetrics} defaultOpen={false} delay={200}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">{labels.totalPosts}</span>
              <span className="font-bold text-violet-600 dark:text-violet-400 tabular-nums">{statsData?.totalPosts ?? 0}</span>
            </div>
            <Progress value={statsData?.publishedPosts && statsData?.totalPosts ? (statsData.publishedPosts / statsData.totalPosts) * 100 : 0} className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-violet-400 [&>div]:transition-all" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{labels.published}: {statsData?.publishedPosts ?? 0}</span>
              <span>{labels.draft}: {statsData?.draftPosts ?? 0}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-center">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400 tabular-nums">{statsData?.totalCustomers ?? 0}</p>
                <p className="text-xs text-muted-foreground">{labels.totalCustomers}</p>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-center">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400 tabular-nums">{statsData?.activeProjects ?? 0}</p>
                <p className="text-xs text-muted-foreground">پروژه‌های فعال</p>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-center">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400 tabular-nums">{statsData?.completedProjects ?? 0}</p>
                <p className="text-xs text-muted-foreground">پروژه‌های تکمیل شده</p>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-center">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400 tabular-nums">{statsData?.mediaCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">فایل‌های رسانه</p>
              </div>
            </div>
          </div>
        </Section>

        {/* AI Suggestions */}
        <Section title={labels.aiSuggestions} defaultOpen={false} delay={250}>
          <div className="space-y-2">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-violet-500/5 transition-all duration-200 cursor-pointer hover-lift">
                <div className="bg-violet-500/10 rounded-lg p-2 text-violet-600 dark:text-violet-400 shrink-0">{s.icon}</div>
                <div>
                  <p className="text-sm font-medium">{s.text}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Recent Comments */}
        <Section title={labels.recentComments} defaultOpen={false} delay={300}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {commentsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">{labels.noComments}</p>
              </div>
            ) : (
              commentsData.slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-violet-500/5 transition-all duration-200 hover-lift">
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0 text-xs font-bold">
                    {c.author.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.author}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.content}</p>
                  </div>
                  <Badge variant={c.status === 'approved' ? 'default' : c.status === 'pending' ? 'secondary' : 'destructive'} className="shrink-0 text-[10px]">
                    {statusLabel[c.status] ?? c.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* ───── Monthly Views BarChart (Recharts) ───── */}
        <Section title={labels.monthlyViews} defaultOpen={true} delay={350}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData?.monthlyViews ?? []} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VIOLET_LIGHT} />
                  <stop offset="100%" stopColor={VIOLET_DARK} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<PersianTooltip />} cursor={{ fill: 'var(--violet-500/5)', radius: 4 }} />
              <Bar
                dataKey="views"
                fill="url(#barGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* ───── Category Distribution PieChart (Recharts) ───── */}
        <Section title={labels.categoryDist} defaultOpen={false} delay={400}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData?.categoryDistribution ?? []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={renderPieLabel}
                labelLine={false}
                strokeWidth={0}
              >
                {(chartData?.categoryDistribution ?? []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Section>

        {/* ───── Weekly Activity Grouped BarChart (Recharts) ───── */}
        <Section title={labels.weeklyActivity} defaultOpen={false} delay={450}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData?.weeklyActivity ?? []} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="postsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VIOLET_LIGHT} />
                  <stop offset="100%" stopColor={VIOLET_DARK} />
                </linearGradient>
                <linearGradient id="commentsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PURPLE_LIGHT} />
                  <stop offset="100%" stopColor={PURPLE_MAIN} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<PersianTooltip labelKey="comments" />} cursor={{ fill: 'var(--violet-500/5)', radius: 4 }} />
              <Bar dataKey="posts" fill="url(#postsGradient)" radius={[4, 4, 0, 0]} maxBarSize={24} name={labels.posts} />
              <Bar dataKey="comments" fill="url(#commentsGradient)" radius={[4, 4, 0, 0]} maxBarSize={24} name={labels.comments} />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
                wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* ───── Content Status PieChart (Recharts) ───── */}
        <Section title={labels.contentStatus} defaultOpen={false} delay={500}>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={contentStatusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  label={renderPieLabel}
                  labelLine={false}
                  strokeWidth={0}
                >
                  {contentStatusPieData.map((entry, index) => (
                    <Cell key={`cs-cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-1">
              {contentStatusPieData.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ───── Monthly Views Trend AreaChart (Recharts) ───── */}
        <Section title={labels.monthlyViewsTrend} defaultOpen={false} delay={525}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData?.monthlyViews ?? []} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VIOLET_MAIN} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={VIOLET_MAIN} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<PersianTooltip />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke={VIOLET_MAIN}
                strokeWidth={2.5}
                fill="url(#areaGradient)"
                dot={{ r: 4, fill: VIOLET_MAIN, strokeWidth: 2, stroke: 'var(--background)' }}
                activeDot={{ r: 6, fill: VIOLET_MAIN, stroke: 'var(--background)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Section>

        {/* Popular Articles */}
        <Section title={labels.popularArticles} defaultOpen={false} delay={550}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(chartData?.popularPosts ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Star className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">{labels.noArticles}</p>
              </div>
            ) : (
              (chartData?.popularPosts ?? []).slice(0, 6).map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-violet-500/5 transition-all duration-200 hover-lift">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${i < 3 ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-muted text-muted-foreground'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Eye className="h-3 w-3" />
                    {p.views.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* ───── Quick Draft Widget ───── */}
        <Section title={labels.quickDraft} defaultOpen={true} delay={575}>
          <QuickDraftWidget categories={categoriesData} />
        </Section>
      </div>

      {/* ═══════ New Dashboard Widgets ═══════ */}
      {/* Analytics Overview Widget — full width */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnalyticsWidget />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions Widget */}
        <QuickActionsWidget />

        {/* Activity Timeline Widget */}
        <ActivityTimelineWidget activities={activitiesData} />

        {/* Popular Posts Widget */}
        <PopularPostsWidget popularPosts={chartData?.popularPosts ?? []} />

        {/* System Health Widget */}
        <SystemHealthWidget />

        {/* Mini Calendar Widget */}
        <MiniCalendarWidget />

        {/* Quick Notes Widget */}
        <QuickNotesWidget notes={notesData} />

        {/* Activity Feed Widget */}
        <ActivityFeedWidget />

        {/* Analytics Overview Widget */}
        <AnalyticsOverviewWidget />

        {/* Data Export Widget */}
        <DataExportWidget />

        {/* System Status Widget */}
        <SystemStatusWidget />

        {/* Cross-Module Integration Overview */}
        <ModuleStatsOverview />
      </div>

      {/* ═══════ New Feature Widgets ═══════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <Card className="glass-card card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto cms-scrollbar">
            {[
              { text: 'مطلب جدید "راهنمای سئو" منتشر شد', time: '۵ دقیقه پیش', icon: FileText, color: 'text-emerald-500' },
              { text: 'سفارش #ORD-1403105 تأیید شد', time: '۱۵ دقیقه پیش', icon: ShoppingCart, color: 'text-blue-500' },
              { text: 'کاربر "زهرا موسوی" ثبت‌نام کرد', time: '۳۰ دقیقه پیش', icon: UserPlus, color: 'text-violet-500' },
              { text: 'پرداخت ۵,۲۵۰,۰۰۰ تومان دریافت شد', time: '۱ ساعت پیش', icon: CreditCard, color: 'text-emerald-500' },
              { text: 'نظر جدید روی "معرفی محصول" منتظر تأیید', time: '۲ ساعت پیش', icon: MessageSquare, color: 'text-amber-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-accent/50 transition-colors list-item-hover">
                <div className="mt-0.5">
                  <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed">{item.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Notes (localStorage) Widget */}
        <NotesWidget />

        {/* Bookmark Manager Widget */}
        <BookmarkManager />

        {/* Performance Monitor Widget */}
        <PerformanceMonitor />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Sound Toggle */}
        <NotificationSoundToggle />

        {/* Color Theme Customizer */}
        <ColorThemeCustomizer />

        {/* Theme Customizer Widget */}
        <ThemeCustomizerWidget />
      </div>

      {/* Floating Action Bar */}
      <FloatingActionBar />

      {/* Data Export Dialog */}
      <DataExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  )
}
