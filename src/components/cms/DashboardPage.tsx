'use client'

import { useState, useMemo, useEffect } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
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
  Save, PenLine, X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'
import { formatRelativeTime } from './types'
import { MiniSparkline } from './MiniSparkline'

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

// ──────────────────── Persian Date ──────────────────────────────

function PersianDate() {
  const date = useMemo(() => {
    const now = new Date()
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }
    return now.toLocaleDateString('fa-IR', options)
  }, [])
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

function OnboardingTipBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('cms-tip-dismissed') !== null
  })
  const [visible, setVisible] = useState(true)
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => {
      setDismissed(true)
      localStorage.setItem('cms-tip-dismissed', 'true')
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

// ────────────────────── Main Component ───────────────────────────

export default function DashboardPage() {
  useEnsureData(['stats', 'charts', 'activities', 'posts', 'categories'])
  const { stats, charts, activities, comments, categories, createPost } = useCMS()
  const statsData = stats.data
  const chartData = charts.data
  const activitiesData = activities.data ?? []
  const commentsData = comments.data ?? []
  const categoriesData = categories.data ?? []
  const isLoading = stats.isLoading || charts.isLoading || categories.isLoading

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
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <PersianDate />
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 w-fit shadow-sm gap-1">
              <Activity className="h-3 w-3" />
              آنلاین
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Tip Banner */}
      <OnboardingTipBanner />

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Section title={labels.quickActions} defaultOpen={true} delay={100}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <Plus className="h-4 w-4" />{labels.createPost}
            </Button>
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <UserPlus className="h-4 w-4" />{labels.addUser}
            </Button>
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <FolderKanban className="h-4 w-4" />{labels.newProject}
            </Button>
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <UserCircle className="h-4 w-4" />{labels.addCustomer}
            </Button>
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <Sparkles className="h-4 w-4" />{labels.mediaUpload}
            </Button>
            <Button variant="outline" className="gap-2 border-violet-200 dark:border-violet-800 hover:bg-violet-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <Zap className="h-4 w-4" />{labels.aiGenerate}
            </Button>
          </div>
        </Section>

        {/* Recent Activities */}
        <Section title={labels.recentActivities} defaultOpen={true} delay={150}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activitiesData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Activity className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">{labels.noActivities}</p>
              </div>
            ) : (
              activitiesData.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-violet-500/5 transition-all duration-200 hover-lift">
                  <div className="rounded-lg bg-violet-100 dark:bg-violet-900/30 p-1.5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.details}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatRelativeTime(a.createdAt)}</span>
                </div>
              ))
            )}
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
    </div>
  )
}
