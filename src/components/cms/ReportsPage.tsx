'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3, FileText, Users, Eye, MessageCircle, TrendingUp,
  Download, Calendar, ArrowUpRight, ArrowDownRight, DollarSign,
  Clock, ChevronLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/csv-export'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'گزارش‌ها',
  subtitle: 'تحلیل و آمار سیستم مدیریت محتوا',
  export: 'خروجی CSV',
  exportSuccess: 'گزارش با موفقیت دانلود شد!',
  totalViews: 'کل بازدیدها',
  publishedPosts: 'مطالب منتشر شده',
  totalRevenue: 'درآمد کل',
  growthRate: 'نرخ رشد',
  dateRange: 'بازه زمانی',
  thisWeek: 'این هفته',
  thisMonth: 'این ماه',
  thisQuarter: 'این فصل',
  thisYear: 'امسال',
  monthlyViews: 'بازدید ماهانه',
  categoryDist: 'توزیع دسته‌بندی‌ها',
  contentStatus: 'وضعیت محتوا',
  weeklyActivity: 'فعالیت هفتگی',
  engagement: 'تعامل',
  noData: 'اطلاعاتی موجود نیست',
  published: 'منتشر شده',
  draft: 'پیش‌نویس',
  archived: 'بایگانی',
  posts: 'مطالب',
  comments: 'نظرات',
  rateOfReturn: 'نرخ بازدید مجدد',
  avgStay: 'میانگین زمان ماندن',
  bounceRate: 'نرخ خروج (Bounce)',
  conversionRate: 'نرخ تبدیل',
  summary: 'خلاصه آمار',
  totalPosts: 'کل مطالب',
  totalUsers: 'کل کاربران',
  totalComments: 'کل نظرات',
  avgViews: 'میانگین بازدید',
  apply: 'اعمال',
}

// ─── Stat Summary Card ────────────────────────────────────────────────────────

function StatSummaryCard({ icon, label, value, trend, trendValue, gradient, delay }: {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: 'up' | 'down'
  trendValue?: string
  gradient: string
  delay: number
}) {
  return (
    <Card className={`bg-gradient-to-br ${gradient} border-0 text-white stat-card hover-lift shadow-sm animate-in card-elevated`} style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="bg-white/20 rounded-xl p-2.5 backdrop-blur-sm">{icon}</div>
          {trend && trendValue && (
            <Badge className={`text-[10px] gap-0.5 border-0 ${trend === 'up' ? 'bg-green-400/30 text-white' : 'bg-red-400/30 text-white'}`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trendValue}
            </Badge>
          )}
        </div>
        <p className="text-xs opacity-80 mb-0.5">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────

function HorizontalBarChart({ data, maxVal, colorFrom, colorTo }: {
  data: { month: string; views: number }[]
  maxVal: number
  colorFrom: string
  colorTo: string
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{labels.noData}</p>
  }
  return (
    <div className="space-y-2.5">
      {data.map((m, i) => {
        const width = maxVal > 0 ? (m.views / maxVal) * 100 : 0
        return (
          <div key={i} className="group space-y-1 animate-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">{m.month}</span>
              <span className="tabular-nums font-semibold text-fuchsia-700 dark:text-fuchsia-300 opacity-0 group-hover:opacity-100 transition-opacity">{m.views.toLocaleString()}</span>
            </div>
            <div className="h-5 bg-muted/60 rounded-lg overflow-hidden">
              <div
                className={`h-full bg-gradient-to-l ${colorFrom} ${colorTo} rounded-lg transition-all duration-700 ease-out group-hover:opacity-90 relative`}
                style={{ width: `${width}%`, transitionDelay: `${i * 60}ms` }}
              >
                {width > 20 && (
                  <span className="absolute inset-0 flex items-center justify-end px-2 text-[10px] font-bold text-white/90 tabular-nums">
                    {m.views.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Donut Chart (CSS conic-gradient) ────────────────────────────────────────

function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0 || data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{labels.noData}</p>
  }

  // Build conic-gradient string
  const gradientParts = data.reduce<Array<string>>((acc, d, i) => {
    const prevEnd = acc.length > 0
      ? parseFloat(acc[acc.length - 1].split(' ').pop()!)
      : 0
    const end = prevEnd + (d.value / total) * 360
    acc.push(`${d.color} ${prevEnd}deg ${end}deg`)
    return acc
  }, [])

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-44 h-44">
        <div
          className="w-full h-full rounded-full"
          style={{ background: `conic-gradient(${gradientParts.join(', ')})` }}
        />
        <div className="absolute inset-4 rounded-full bg-card flex items-center justify-center flex-col">
          <span className="text-2xl font-bold tabular-nums">{total}</span>
          <span className="text-[10px] text-muted-foreground">مجموع</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs animate-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.name}</span>
            <span className="font-semibold tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Content Status Progress Bars ─────────────────────────────────────────────

function ContentStatusBars({ statuses }: { statuses: { status: string; count: number }[] }) {
  const maxCount = Math.max(...statuses.map(s => s.count), 1)
  const total = statuses.reduce((sum, s) => sum + s.count, 0)

  const statusMeta: Record<string, { label: string; color: string; gradient: string }> = {
    published: { label: labels.published, color: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-400' },
    draft: { label: labels.draft, color: 'bg-amber-500', gradient: 'from-amber-500 to-amber-400' },
    archived: { label: labels.archived, color: 'bg-gray-400', gradient: 'from-gray-400 to-gray-300' },
  }

  return (
    <div className="space-y-4">
      {statuses.map((s, i) => {
        const meta = statusMeta[s.status] ?? { label: s.status, color: 'bg-gray-400', gradient: 'from-gray-400 to-gray-300' }
        const pct = total > 0 ? Math.round((s.count / total) * 100) : 0
        const barWidth = maxCount > 0 ? (s.count / maxCount) * 100 : 0
        return (
          <div key={i} className="space-y-2 animate-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.color}`} />
                <span className="font-medium">{meta.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground tabular-nums">{s.count}</span>
                <span className="text-xs text-muted-foreground">({pct}%)</span>
              </div>
            </div>
            <div className="h-4 bg-muted/60 rounded-lg overflow-hidden">
              <div
                className={`h-full bg-gradient-to-l ${meta.gradient} rounded-lg transition-all duration-700 ease-out`}
                style={{ width: `${barWidth}%`, transitionDelay: `${i * 100}ms` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Weekly Activity Vertical Bar Chart ───────────────────────────────────────

function WeeklyActivityChart({ data }: { data: { day: string; posts: number; comments: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{labels.noData}</p>
  }

  const maxVal = Math.max(...data.flatMap(d => [d.posts, d.comments]), 1)

  return (
    <div className="flex items-end gap-2 h-48">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          {/* Tooltip on hover */}
          <div className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-0.5 mb-1">
            <span className="text-fuchsia-600 dark:text-fuchsia-400 font-medium">{d.posts}</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-medium">{d.comments}</span>
          </div>
          {/* Bars */}
          <div className="flex items-end gap-0.5 w-full h-36">
            <div
              className="flex-1 bg-gradient-to-t from-fuchsia-600 to-fuchsia-400 rounded-t-sm min-h-[3px] transition-all duration-500 group-hover:from-fuchsia-500 group-hover:to-fuchsia-300"
              style={{ height: `${(d.posts / maxVal) * 100}%`, transitionDelay: `${i * 40}ms` }}
            />
            <div
              className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm min-h-[3px] transition-all duration-500 group-hover:from-cyan-500 group-hover:to-cyan-300"
              style={{ height: `${(d.comments / maxVal) * 100}%`, transitionDelay: `${i * 40 + 20}ms` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  useEnsureData(['stats', 'charts', 'posts', 'users', 'customers', 'projects'])
  const { stats, charts } = useCMS()
  const statsData = stats.data
  const chartData = charts.data

  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  const monthlyViews = chartData?.monthlyViews ?? []
  const categoryDist = chartData?.categoryDistribution ?? []
  const weeklyActivity = chartData?.weeklyActivity ?? []
  const contentStatus = chartData?.contentStatus ?? []

  const maxViews = Math.max(...monthlyViews.map(v => v.views), 1)
  const totalPostsCount = statsData?.totalPosts ?? 0
  const publishedCount = statsData?.publishedPosts ?? 0
  const draftCount = statsData?.draftPosts ?? 0
  const archivedCount = totalPostsCount - publishedCount - draftCount
  const avgViews = totalPostsCount > 0 ? Math.round((statsData?.totalViews ?? 0) / totalPostsCount) : 0

  // Derived values for stat summary cards
  const totalViews = statsData?.totalViews ?? 0
  const revenue = statsData?.revenue ?? 0
  const growthRate = 12.5 // simulated growth rate

  const timePeriods = [
    { id: 'week' as const, label: labels.thisWeek },
    { id: 'month' as const, label: labels.thisMonth },
    { id: 'quarter' as const, label: labels.thisQuarter },
    { id: 'year' as const, label: labels.thisYear },
  ]

  // Simulated time period data filtering (uses full data always, period selector is for UI)
  const filteredMonthlyViews = useMemo(() => {
    const count = timePeriod === 'week' ? 1 : timePeriod === 'month' ? 3 : timePeriod === 'quarter' ? 6 : monthlyViews.length
    return monthlyViews.slice(-count)
  }, [monthlyViews, timePeriod])

  const handleExport = () => {
    const reportData: Record<string, string | number>[] = [
      { section: labels.summary, metric: labels.totalViews, value: totalViews },
      { section: labels.summary, metric: labels.totalPosts, value: totalPostsCount },
      { section: labels.summary, metric: labels.publishedPosts, value: publishedCount },
      { section: labels.summary, metric: labels.draft, value: draftCount },
      { section: labels.summary, metric: labels.totalUsers, value: statsData?.totalUsers ?? 0 },
      { section: labels.summary, metric: labels.totalComments, value: statsData?.totalComments ?? 0 },
      { section: labels.summary, metric: labels.avgViews, value: avgViews },
      { section: labels.summary, metric: labels.totalRevenue, value: revenue },
    ]

    monthlyViews.forEach(m => {
      reportData.push({ section: 'بازدید ماهانه', metric: m.month, value: m.views })
    })

    categoryDist.forEach(c => {
      reportData.push({ section: 'توزیع دسته‌بندی‌ها', metric: c.name, value: c.value })
    })

    exportToCSV(
      reportData,
      'cms-report',
      [
        { key: 'section', label: 'بخش' },
        { key: 'metric', label: 'مقدار' },
        { key: 'value', label: 'عدد' },
      ],
    )
    toast.success(labels.exportSuccess)
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
          {/* Time Period Selector */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/40">
            {timePeriods.map(tp => (
              <button
                key={tp.id}
                className={`px-3 py-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer ${
                  timePeriod === tp.id
                    ? 'bg-fuchsia-600 text-white shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
                onClick={() => setTimePeriod(tp.id)}
              >
                {tp.label}
              </button>
            ))}
          </div>
          {/* Export Button */}
          <Button onClick={handleExport} className="gap-2 bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-700 hover:to-fuchsia-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.export}</span>
          </Button>
        </div>
      </div>

      {/* Stat Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatSummaryCard
          icon={<Eye className="h-5 w-5" />}
          label={labels.totalViews}
          value={totalViews.toLocaleString()}
          trend="up"
          trendValue="+23%"
          gradient="from-fuchsia-500 to-fuchsia-700"
          delay={0}
        />
        <StatSummaryCard
          icon={<FileText className="h-5 w-5" />}
          label={labels.publishedPosts}
          value={publishedCount}
          trend="up"
          trendValue="+4"
          gradient="from-cyan-500 to-cyan-700"
          delay={60}
        />
        <StatSummaryCard
          icon={<DollarSign className="h-5 w-5" />}
          label={labels.totalRevenue}
          value={`${revenue.toLocaleString()} ت`}
          trend="up"
          trendValue="+18%"
          gradient="from-emerald-500 to-emerald-700"
          delay={120}
        />
        <StatSummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label={labels.growthRate}
          value={`${growthRate}%`}
          trend="up"
          trendValue="+2.3%"
          gradient="from-violet-500 to-violet-700"
          delay={180}
        />
      </div>

      {/* Charts Grid — 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Monthly Views — Horizontal Bar Chart */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300 card-depth-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-fuchsia-700 dark:text-fuchsia-300 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {labels.monthlyViews}
              </CardTitle>
              <Badge className="bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 border-0 text-[10px]">
                {timePeriods.find(t => t.id === timePeriod)?.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={filteredMonthlyViews}
              maxVal={Math.max(...filteredMonthlyViews.map(v => v.views), 1)}
              colorFrom="from-fuchsia-600"
              colorTo="to-fuchsia-400"
            />
          </CardContent>
        </Card>

        {/* Category Distribution — Donut Chart */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300 card-depth-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-fuchsia-700 dark:text-fuchsia-300 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {labels.categoryDist}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={categoryDist} />
          </CardContent>
        </Card>

        {/* Content Status — Progress Bars */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300 card-depth-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-fuchsia-700 dark:text-fuchsia-300 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {labels.contentStatus}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contentStatus.length > 0 ? (
              <ContentStatusBars statuses={contentStatus} />
            ) : (
              <ContentStatusBars statuses={[
                { status: 'published', count: publishedCount },
                { status: 'draft', count: draftCount },
                { status: 'archived', count: archivedCount },
              ]} />
            )}
          </CardContent>
        </Card>

        {/* Weekly Activity — Vertical Bar Chart */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300 card-depth-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-fuchsia-700 dark:text-fuchsia-300 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {labels.weeklyActivity}
              </CardTitle>
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
                  <span className="text-muted-foreground">{labels.posts}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="text-muted-foreground">{labels.comments}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <WeeklyActivityChart data={weeklyActivity} />
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300 card-depth-1 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-fuchsia-700 dark:text-fuchsia-300 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {labels.engagement}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: labels.rateOfReturn, value: '۶۸٪', trend: 'up' as const, change: '+۱۲٪', icon: <Users className="h-4 w-4 text-fuchsia-500" />, gradient: 'from-fuchsia-500/10 to-transparent' },
                { label: labels.avgStay, value: '۴:۳۲', trend: 'up' as const, change: '+۸٪', icon: <Clock className="h-4 w-4 text-cyan-500" />, gradient: 'from-cyan-500/10 to-transparent' },
                { label: labels.bounceRate, value: '۳۲٪', trend: 'down' as const, change: '-۵٪', icon: <ArrowDownRight className="h-4 w-4 text-emerald-500" />, gradient: 'from-emerald-500/10 to-transparent' },
                { label: labels.conversionRate, value: '۴.۵٪', trend: 'up' as const, change: '+۱.۲٪', icon: <TrendingUp className="h-4 w-4 text-violet-500" />, gradient: 'from-violet-500/10 to-transparent' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-xl bg-gradient-to-br ${item.gradient} border border-border/40 hover-lift animate-in`} style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.icon}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-300 tabular-nums">{item.value}</span>
                    <Badge variant={item.trend === 'up' ? 'default' : 'secondary'} className={`text-[10px] gap-0.5 border-0 ${item.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                      {item.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {item.change}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Need Activity icon from lucide ──────────────────────────────────────────
function Activity({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  )
}
