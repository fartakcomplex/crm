'use client'

import { useState, useMemo, useEffect } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MiniSparkline } from './MiniSparkline'
import {
  BarChart3, FileText, Users, Eye, TrendingUp,
  Download, ArrowUpRight, ArrowDownRight, DollarSign,
  Clock, ChevronDown, Wallet, ShoppingCart, Package,
  Activity, UserCheck, PieChart as PieChartIcon,
  BarChart2, LineChart as LineChartIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/csv-export'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend,
} from 'recharts'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'گزارش‌ها',
  subtitle: 'تحلیل جامع آمار و داده‌های سیستم مدیریت محتوا',
  export: 'خروجی CSV',
  exportSuccess: 'گزارش با موفقیت دانلود شد!',
  totalViews: 'کل بازدیدها',
  publishedPosts: 'مطالب منتشر شده',
  totalRevenue: 'درآمد کل',
  growthRate: 'نرخ رشد',
  totalOrders: 'سفارشات',
  activeUsers: 'کاربران فعال',
  contentPublished: 'محتوای منتشر شده',
  dateRange: 'بازه زمانی',
  last7Days: '۷ روز',
  last30Days: '۳۰ روز',
  last90Days: '۹۰ روز',
  lastYear: '۱ سال',
  // Revenue
  revenueOverview: 'نمای کلی درآمد',
  monthlyRevenue: 'درآمد ماهانه',
  avgOrderValue: 'میانگین ارزش سفارش',
  netProfit: 'سود خالص',
  // Content
  contentPerformance: 'عملکرد محتوا',
  postsByStatus: 'مطالب بر اساس وضعیت',
  categoryDistribution: 'توزیع دسته‌بندی‌ها',
  published: 'منتشر شده',
  draft: 'پیش‌نویس',
  review: 'بررسی',
  archived: 'بایگانی',
  // Sales
  salesAnalytics: 'تحلیل فروش',
  ordersOverTime: 'سفارشات در زمان',
  conversionRate: 'نرخ تبدیل',
  // Users
  userActivity: 'فعالیت کاربران',
  dailyActiveUsers: 'کاربران فعال روزانه',
  topMetrics: 'شاخص‌های برتر',
  // Store
  storePerformance: 'عملکرد فروشگاه',
  topProducts: 'محصولات پرفروش',
  orderStatus: 'وضعیت سفارشات',
  // Engagement
  engagement: 'تعامل',
  rateOfReturn: 'نرخ بازدید مجدد',
  avgStay: 'میانگین زمان ماندن',
  bounceRate: 'نرخ خروج (Bounce)',
  noData: 'اطلاعاتی موجود نیست',
  posts: 'مطالب',
  comments: 'نظرات',
  weekDays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'],
  persianMonths: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
  pending: 'در انتظار',
  processing: 'در حال پردازش',
  shipped: 'ارسال شده',
  delivered: 'تحویل شده',
  cancelled: 'لغو شده',
  newUsers: 'کاربران جدید',
  pageViews: 'بازدید صفحات',
  sessionDuration: 'مدت جلسه',
  returningUsers: 'کاربران بازگشتی',
}

// ─── Recharts Color Constants ────────────────────────────────────────────────

const VIOLET_COLORS = ['#8b5cf6', '#a78bfa', '#7c3aed', '#c084fc', '#6d28d9']
const EMERALD_COLORS = ['#10b981', '#34d399', '#059669', '#6ee7b7', '#047857']
const CYAN_COLORS = ['#06b6d4', '#22d3ee', '#0891b2', '#67e8f9', '#0e7490']
const ROSE_COLORS = ['#f43f5e', '#fb7185', '#e11d48', '#fda4af', '#be123c']
const PIE_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#a855f7']

// ─── useCountUp Hook ─────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1000, enabled = true) {
  const [value, setValue] = useState(enabled ? 0 : target)
  useEffect(() => {
    if (!enabled) return
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    return () => {}
  }, [target, duration, enabled])
  return value
}

// ─── Collapsible Section ────────────────────────────────────────────────────

function Section({ title, defaultOpen, children, delay, icon }: {
  title: string; defaultOpen: boolean; children: React.ReactNode; delay?: number; icon?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in card-elevated" style={{ animationDelay: `${delay ?? 0}ms`, animationFillMode: 'both' }}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-violet-500/5 transition-colors rounded-t-lg py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-gradient-violet flex items-center gap-2">
                {icon}
                {title}
              </CardTitle>
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

// ─── Custom Recharts Tooltip ─────────────────────────────────────────────────

function PersianTooltip({ active, payload, label: tooltipLabel }: {
  active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string; name: string }>;
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="glass-card border border-violet-200/50 dark:border-violet-700/50 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">{tooltipLabel ?? ''}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
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

const RADIAN = Math.PI / 180
function renderPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number; innerRadius: number; outerRadius: number; percent: number
}): React.ReactNode {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.08) return null
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className="fill-background text-[11px] font-bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ─── Summary Metric Card ─────────────────────────────────────────────────────

function SummaryMetricCard({ icon, label, value, numericValue, trend, trendValue, gradient, delay, sparklineData, sparklineColor }: {
  icon: React.ReactNode
  label: string
  value: string | number
  numericValue?: number
  trend?: 'up' | 'down'
  trendValue?: string
  gradient: string
  delay: number
  sparklineData?: number[]
  sparklineColor?: string
}) {
  const animatedValue = useCountUp(numericValue ?? 0, 1200, numericValue !== undefined)
  const displayValue = numericValue !== undefined ? animatedValue : value

  return (
    <Card className={`bg-gradient-to-br ${gradient} border-0 text-white stat-card card-elevated hover-lift shadow-sm animate-in relative overflow-hidden`} style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      {/* Shine overlay */}
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 ease-out" />
      </div>
      <CardContent className="p-4 flex items-start gap-3 relative z-10">
        <div className="bg-white/20 rounded-xl p-2.5 backdrop-blur-sm shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs opacity-80">{label}</p>
            {trend && trendValue && (
              <Badge className={`text-[10px] gap-0.5 border-0 ${trend === 'up' ? 'bg-green-400/30 text-white' : 'bg-red-400/30 text-white'}`}>
                {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {trendValue}
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold tabular-nums">{displayValue}</p>
          {sparklineData && sparklineData.length >= 2 && (
            <div className="mt-1 opacity-70">
              <MiniSparkline data={sparklineData} color={sparklineColor ?? 'rgba(255,255,255,0.8)'} fillColor={sparklineColor ?? 'rgba(255,255,255,0.6)'} trend={trend} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Stat Mini Card (for section stat rows) ─────────────────────────────────

function StatMiniCard({ icon, label, value, color, bgColor, trend, trendValue }: {
  icon: React.ReactNode; label: string; value: string; color: string; bgColor: string; trend?: 'up' | 'down'; trendValue?: string
}) {
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${bgColor} border border-border/40 hover-lift transition-all duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{label}</span>
        <div className={`h-7 w-7 rounded-lg ${bgColor.replace('/10', '/20')} flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xl font-bold tabular-nums ${color}`}>{value}</span>
        {trend && trendValue && (
          <Badge className={`text-[10px] gap-0.5 border-0 px-1.5 ${
            trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trendValue}
          </Badge>
        )}
      </div>
    </div>
  )
}

// ─── Progress Metric Bar ─────────────────────────────────────────────────────

function ProgressMetric({ label, value, max, color, delay }: {
  label: string; value: number; max: number; color: string; delay?: number
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1.5 animate-in" style={{ animationDelay: `${delay ?? 0}ms`, animationFillMode: 'both' }}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value.toLocaleString('fa-IR')}</span>
      </div>
      <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-l ${color} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Generate Sample Data ────────────────────────────────────────────────────

function generateRevenueData() {
  return labels.persianMonths.map((month, i) => ({
    month,
    revenue: 4500000 + Math.floor(Math.random() * 8000000) + i * 400000,
    orders: 80 + Math.floor(Math.random() * 120) + i * 5,
  }))
}

function generateDailyOrdersData(days: number) {
  const data = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStr = d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
    data.push({
      day: dayStr,
      orders: 8 + Math.floor(Math.random() * 25),
      revenue: 500000 + Math.floor(Math.random() * 2000000),
    })
  }
  return data
}

function generateDailyActiveUsersData() {
  const data = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dayStr = d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
    data.push({
      day: dayStr,
      users: 120 + Math.floor(Math.random() * 350),
      newUsers: 15 + Math.floor(Math.random() * 60),
    })
  }
  return data
}

function generateTopProductsData(products: Array<{ name: string; price: number; status: string }>) {
  const available = products.filter(p => p.status === 'active').slice(0, 8)
  if (available.length === 0) {
    return [
      { name: 'لپ‌تاپ ایسوس', sales: 142 },
      { name: 'گوشی سامسونگ', sales: 128 },
      { name: 'هدفون سونی', sales: 115 },
      { name: 'تبلت اپل', sales: 98 },
      { name: 'ساعت هوشمند', sales: 87 },
      { name: 'اسپیکر JBL', sales: 76 },
      { name: 'کامپیوتر مینی', sales: 65 },
      { name: 'دوربین کانن', sales: 54 },
    ]
  }
  return available.map(p => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
    sales: 30 + Math.floor(Math.random() * 150),
  }))
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ReportsPage() {
  useEnsureData(['stats', 'charts', 'posts', 'users', 'customers', 'products', 'orders'])
  const { stats, charts, products, orders } = useCMS()
  const statsData = stats.data
  const chartData = charts.data
  const productsData = products.data ?? []
  const ordersData = orders.data ?? []

  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  // ── Derived values from API ──
  const totalRevenue = statsData?.revenue ?? 0
  const totalPosts = statsData?.totalPosts ?? 0
  const publishedCount = statsData?.publishedPosts ?? 0
  const totalOrders = ordersData.length
  const activeUsers = statsData?.activeUsers ?? 0

  // Calculate order totals
  const ordersRevenue = useMemo(() => ordersData.reduce((sum, o) => sum + (o.total || 0), 0), [ordersData])
  const avgOrderValue = totalOrders > 0 ? Math.round(ordersRevenue / totalOrders) : 0

  // ── Chart data ──
  const revenueData = useMemo(() => generateRevenueData(), [])
  const monthlyViews = chartData?.monthlyViews ?? []
  const categoryDist = chartData?.categoryDistribution ?? []
  const contentStatus = chartData?.contentStatus ?? []
  const dailyOrders = useMemo(() => generateDailyOrdersData(dateRange === '7d' ? 7 : dateRange === '90d' ? 28 : 14), [dateRange])
  const dailyActiveUsers = useMemo(() => generateDailyActiveUsersData(), [])
  const topProducts = useMemo(() => generateTopProductsData(productsData), [productsData])

  // Order status distribution
  const orderStatusData = useMemo(() => {
    const statusMap: Record<string, number> = {}
    const statusLabels: Record<string, string> = {
      pending: labels.pending,
      processing: labels.processing,
      shipped: labels.shipped,
      delivered: labels.delivered,
      cancelled: labels.cancelled,
    }
    ordersData.forEach(o => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1
    })
    if (Object.keys(statusMap).length === 0) {
      return [
        { name: labels.delivered, value: 45 },
        { name: labels.processing, value: 25 },
        { name: labels.shipped, value: 15 },
        { name: labels.pending, value: 10 },
        { name: labels.cancelled, value: 5 },
      ]
    }
    return Object.entries(statusMap).map(([status, count]) => ({
      name: statusLabels[status] ?? status,
      value: count,
    }))
  }, [ordersData])

  // Posts by status for BarChart
  const postsByStatusData = useMemo(() => {
    if (contentStatus.length > 0) return contentStatus
    return [
      { status: labels.published, count: publishedCount },
      { status: labels.draft, count: statsData?.draftPosts ?? 0 },
      { status: labels.review, count: Math.floor(publishedCount * 0.15) },
      { status: labels.archived, count: Math.floor(totalPosts * 0.1) },
    ]
  }, [contentStatus, publishedCount, statsData, totalPosts])

  // Sparkline data for summary cards
  const revenueSparkline = useMemo(() => revenueData.map(d => d.revenue), [revenueData])
  const ordersSparkline = useMemo(() => dailyOrders.map(d => d.orders), [dailyOrders])
  const usersSparkline = useMemo(() => dailyActiveUsers.slice(-14).map(d => d.users), [dailyActiveUsers])
  const postsSparkline = useMemo(() => monthlyViews.map(d => d.views), [monthlyViews])

  // Date range config
  const dateRanges = [
    { id: '7d' as const, label: labels.last7Days },
    { id: '30d' as const, label: labels.last30Days },
    { id: '90d' as const, label: labels.last90Days },
    { id: '1y' as const, label: labels.lastYear },
  ]

  // Handle export
  const handleExport = () => {
    const reportData: Record<string, string | number>[] = [
      { section: 'خلاصه', metric: labels.totalRevenue, value: totalRevenue },
      { section: 'خلاصه', metric: labels.totalOrders, value: totalOrders },
      { section: 'خلاصه', metric: labels.activeUsers, value: activeUsers },
      { section: 'خلاصه', metric: labels.contentPublished, value: publishedCount },
    ]
    revenueData.forEach(m => {
      reportData.push({ section: labels.revenueOverview, metric: m.month, value: m.revenue })
    })
    exportToCSV(reportData, 'cms-report', [
      { key: 'section', label: 'بخش' },
      { key: 'metric', label: 'مقدار' },
      { key: 'value', label: 'عدد' },
    ])
    toast.success(labels.exportSuccess)
  }

  // ── Conversion rate (simulated) ──
  const conversionRate = 4.5

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter reveal-on-scroll" dir="rtl">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gradient-violet">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Selector (pill buttons) */}
          <div className="tab-group flex items-center bg-muted/50 rounded-xl p-1 border border-border/40">
            {dateRanges.map(dr => (
              <button
                key={dr.id}
                className={`tab-item px-3.5 py-1.5 text-xs rounded-lg transition-all duration-200 cursor-pointer ${
                  dateRange === dr.id
                    ? 'tab-item-active bg-violet-600 text-white shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
                onClick={() => setDateRange(dr.id)}
              >
                {dr.label}
              </button>
            ))}
          </div>
          {/* Export Button */}
          <Button onClick={handleExport} className="btn-gradient-primary gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{labels.export}</span>
          </Button>
        </div>
      </div>

      {/* ─── Summary Cards Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
        <SummaryMetricCard
          icon={<Wallet className="h-5 w-5" />}
          label={labels.totalRevenue}
          value={`${totalRevenue.toLocaleString()} ت`}
          numericValue={totalRevenue}
          trend="up"
          trendValue="+۱۸٪"
          gradient="from-violet-500 to-purple-700"
          delay={0}
          sparklineData={revenueSparkline}
          sparklineColor="rgba(255,255,255,0.7)"
        />
        <SummaryMetricCard
          icon={<ShoppingCart className="h-5 w-5" />}
          label={labels.totalOrders}
          value={totalOrders}
          numericValue={totalOrders}
          trend="up"
          trendValue="+۱۲٪"
          gradient="from-emerald-500 to-teal-700"
          delay={60}
          sparklineData={ordersSparkline}
          sparklineColor="rgba(255,255,255,0.7)"
        />
        <SummaryMetricCard
          icon={<UserCheck className="h-5 w-5" />}
          label={labels.activeUsers}
          value={activeUsers}
          numericValue={activeUsers}
          trend="up"
          trendValue="+۸٪"
          gradient="from-cyan-500 to-sky-700"
          delay={120}
          sparklineData={usersSparkline}
          sparklineColor="rgba(255,255,255,0.7)"
        />
        <SummaryMetricCard
          icon={<FileText className="h-5 w-5" />}
          label={labels.contentPublished}
          value={publishedCount}
          numericValue={publishedCount}
          trend="up"
          trendValue="+۴"
          gradient="from-rose-500 to-pink-700"
          delay={180}
          sparklineData={postsSparkline}
          sparklineColor="rgba(255,255,255,0.7)"
        />
      </div>

      {/* ─── Section 1: Revenue Overview ─── */}
      <Section title={labels.revenueOverview} defaultOpen={true} delay={200} icon={<TrendingUp className="h-5 w-5 text-violet-500" />}>
        <div className="space-y-4">
          {/* Stat mini cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatMiniCard
              icon={<DollarSign className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
              label={labels.totalRevenue}
              value={`${totalRevenue.toLocaleString()} ت`}
              color="text-violet-700 dark:text-violet-300"
              bgColor="from-violet-500/10 to-transparent"
              trend="up"
              trendValue="+۱۸٪"
            />
            <StatMiniCard
              icon={<TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />}
              label={labels.avgOrderValue}
              value={`${avgOrderValue.toLocaleString()} ت`}
              color="text-violet-700 dark:text-violet-300"
              bgColor="from-violet-500/10 to-transparent"
              trend="up"
              trendValue="+۵٪"
            />
            <StatMiniCard
              icon={<ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              label={labels.totalOrders}
              value={totalOrders.toLocaleString('fa-IR')}
              color="text-emerald-700 dark:text-emerald-300"
              bgColor="from-emerald-500/10 to-transparent"
              trend="up"
              trendValue="+۱۲٪"
            />
            <StatMiniCard
              icon={<Wallet className="h-4 w-4 text-rose-600 dark:text-rose-400" />}
              label={labels.netProfit}
              value={`${Math.round(totalRevenue * 0.32).toLocaleString()} ت`}
              color="text-rose-700 dark:text-rose-300"
              bgColor="from-rose-500/10 to-transparent"
              trend="up"
              trendValue="+۲۲٪"
            />
          </div>
          {/* Revenue Area Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip content={<PersianTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#revenueGradient)" name={labels.totalRevenue} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* ─── Section 2: Content Performance ─── */}
      <Section title={labels.contentPerformance} defaultOpen={true} delay={250} icon={<FileText className="h-5 w-5 text-cyan-500" />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Posts by Status - BarChart */}
          <div className="space-y-3">
            <Badge className="badge-gradient-cyan border-0 text-[10px]">{labels.postsByStatus}</Badge>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={postsByStatusData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip content={<PersianTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} name={labels.posts}>
                    {postsByStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CYAN_COLORS[index % CYAN_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Category Distribution - PieChart */}
          <div className="space-y-3">
            <Badge className="badge-gradient-violet border-0 text-[10px]">{labels.categoryDistribution}</Badge>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDist.length > 0 ? categoryDist : [
                      { name: 'تکنولوژی', value: 35, color: '#8b5cf6' },
                      { name: 'طراحی', value: 25, color: '#06b6d4' },
                      { name: 'بازاریابی', value: 20, color: '#10b981' },
                      { name: 'محتوا', value: 15, color: '#f59e0b' },
                      { name: 'سایر', value: 5, color: '#f43f5e' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {(categoryDist.length > 0 ? categoryDist : [
                      { color: '#8b5cf6' }, { color: '#06b6d4' }, { color: '#10b981' }, { color: '#f59e0b' }, { color: '#f43f5e' },
                    ]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Section 3: Sales Analytics ─── */}
      <Section title={labels.salesAnalytics} defaultOpen={true} delay={300} icon={<BarChart3 className="h-5 w-5 text-emerald-500" />}>
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatMiniCard
              icon={<ShoppingCart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              label={labels.totalOrders}
              value={totalOrders.toLocaleString('fa-IR')}
              color="text-emerald-700 dark:text-emerald-300"
              bgColor="from-emerald-500/10 to-transparent"
              trend="up"
              trendValue="+۱۲٪"
            />
            <StatMiniCard
              icon={<DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              label={labels.totalRevenue}
              value={`${ordersRevenue.toLocaleString()} ت`}
              color="text-emerald-700 dark:text-emerald-300"
              bgColor="from-emerald-500/10 to-transparent"
              trend="up"
              trendValue="+۱۸٪"
            />
            <StatMiniCard
              icon={<TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              label={labels.avgOrderValue}
              value={`${avgOrderValue.toLocaleString()} ت`}
              color="text-emerald-700 dark:text-emerald-300"
              bgColor="from-emerald-500/10 to-transparent"
              trend="up"
              trendValue="+۵٪"
            />
            <StatMiniCard
              icon={<Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              label={labels.conversionRate}
              value={`${conversionRate}٪`}
              color="text-emerald-700 dark:text-emerald-300"
              bgColor="from-emerald-500/10 to-transparent"
              trend="up"
              trendValue="+۱.۲٪"
            />
          </div>
          {/* Orders Line Chart */}
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyOrders} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={dateRange === '7d' ? 0 : 2} />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip content={<PersianTooltip />} />
                <Legend
                  formatter={(value: string) => value === 'orders' ? labels.totalOrders : labels.totalRevenue}
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#10b981' }} name={labels.totalOrders} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* ─── Section 4: User Activity ─── */}
      <Section title={labels.userActivity} defaultOpen={true} delay={350} icon={<Users className="h-5 w-5 text-cyan-500" />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Active Users - Area Chart */}
          <div className="space-y-3 lg:col-span-1">
            <Badge className="badge-gradient-cyan border-0 text-[10px]">{labels.dailyActiveUsers}</Badge>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyActiveUsers} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="newUsersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
                  <XAxis dataKey="day" tick={{ fontSize: 9 }} className="text-muted-foreground" interval={4} />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip content={<PersianTooltip />} />
                  <Area type="monotone" dataKey="users" stroke="#06b6d4" strokeWidth={2} fill="url(#usersGradient)" name={labels.activeUsers} />
                  <Area type="monotone" dataKey="newUsers" stroke="#22d3ee" strokeWidth={1.5} fill="url(#newUsersGradient)" name={labels.newUsers} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Top Performing Metrics with Progress Bars */}
          <div className="space-y-3">
            <Badge className="badge-gradient-cyan border-0 text-[10px]">{labels.topMetrics}</Badge>
            <div className="space-y-5 pt-2">
              <ProgressMetric
                label={labels.pageViews}
                value={statsData?.totalViews ?? 0}
                max={Math.max((statsData?.totalViews ?? 0) * 1.2, 1)}
                color="from-cyan-500 to-cyan-400"
                delay={0}
              />
              <ProgressMetric
                label={labels.returningUsers}
                value={activeUsers}
                max={Math.max(activeUsers * 1.3, 1)}
                color="from-sky-500 to-sky-400"
                delay={80}
              />
              <ProgressMetric
                label={labels.newUsers}
                value={statsData?.totalUsers ?? 0}
                max={Math.max((statsData?.totalUsers ?? 0) * 1.4, 1)}
                color="from-cyan-600 to-cyan-500"
                delay={160}
              />
              <ProgressMetric
                label={labels.rateOfReturn}
                value={68}
                max={100}
                color="from-teal-500 to-teal-400"
                delay={240}
              />
              <ProgressMetric
                label={labels.sessionDuration}
                value={4.5}
                max={10}
                color="from-sky-600 to-sky-500"
                delay={320}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Section 5: Store Performance ─── */}
      <Section title={labels.storePerformance} defaultOpen={true} delay={400} icon={<Package className="h-5 w-5 text-rose-500" />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products - BarChart */}
          <div className="space-y-3">
            <Badge className="badge-gradient-rose border-0 text-[10px]">{labels.topProducts}</Badge>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} className="text-muted-foreground" width={90} />
                  <Tooltip content={<PersianTooltip />} />
                  <Bar dataKey="sales" radius={[0, 6, 6, 0]} name={labels.salesAnalytics}>
                    {topProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ROSE_COLORS[index % ROSE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Order Status Distribution - PieChart */}
          <div className="space-y-3">
            <Badge className="badge-gradient-rose border-0 text-[10px]">{labels.orderStatus}</Badge>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {orderStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ROSE_COLORS[index % ROSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3">
              {orderStatusData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs animate-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ROSE_COLORS[i % ROSE_COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-semibold tabular-nums">{d.value.toLocaleString('fa-IR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Engagement Metrics Row ─── */}
      <Section title={labels.engagement} defaultOpen={true} delay={450} icon={<BarChart2 className="h-5 w-5 text-amber-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: labels.rateOfReturn, value: '۶۸٪', trend: 'up' as const, change: '+۱۲٪', icon: <Users className="h-4 w-4 text-violet-500" />, gradient: 'from-violet-500/10 to-transparent' },
            { label: labels.avgStay, value: '۴:۳۲', trend: 'up' as const, change: '+۸٪', icon: <Clock className="h-4 w-4 text-cyan-500" />, gradient: 'from-cyan-500/10 to-transparent' },
            { label: labels.bounceRate, value: '۳۲٪', trend: 'down' as const, change: '-۵٪', icon: <ArrowDownRight className="h-4 w-4 text-emerald-500" />, gradient: 'from-emerald-500/10 to-transparent' },
            { label: labels.conversionRate, value: '۴.۵٪', trend: 'up' as const, change: '+۱.۲٪', icon: <TrendingUp className="h-4 w-4 text-amber-500" />, gradient: 'from-amber-500/10 to-transparent' },
          ].map((item, i) => (
            <div key={i} className={`p-4 rounded-xl bg-gradient-to-br ${item.gradient} border border-border/40 hover-lift animate-in`} style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{item.label}</span>
                {item.icon}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-foreground tabular-nums">{item.value}</span>
                <Badge variant={item.trend === 'up' ? 'default' : 'secondary'} className={`text-[10px] gap-0.5 border-0 ${item.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                  {item.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {item.change}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
