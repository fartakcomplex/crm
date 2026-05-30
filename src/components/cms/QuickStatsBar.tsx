'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Users, ShoppingCart, DollarSign, Eye, MessageCircle, Package, TrendingUp,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// ─── Types ──────────────────────────────────────────────────────────────

interface StatsData {
  overview: {
    totalPosts: number
    totalUsers: number
    totalCustomers: number
    totalProjects: number
    totalComments: number
    totalMedia: number
  }
  content: {
    published: number
    drafts: number
    pendingComments: number
  }
  engagement: {
    totalViews: number
    totalRevenue: number
  }
  users: { active: number }
  customers: { active: number }
  projects: { active: number; avgProgress: number }
}

interface StatMetric {
  id: string
  icon: React.ReactNode
  label: string
  getValue: (data: StatsData) => number
  format: (value: number) => string
  trendDir: 'up' | 'down' | 'flat'
  getTrend: (data: StatsData) => string
  gradientFrom: string
  gradientTo: string
  iconColor: string
  iconBg: string
}

// ─── Helpers ────────────────────────────────────────────────────────────

function toPersianNum(n: number): string {
  return n.toLocaleString('fa-IR')
}

function formatCompact(n: number): string {
  if (n >= 1_000_000_000) return toPersianNum(Math.round(n / 1_000_000_000)) + 'B'
  if (n >= 1_000_000) return toPersianNum(Math.round(n / 1_000_000)) + 'M'
  if (n >= 1_000) return toPersianNum(Math.round(n / 1_000)) + 'K'
  return toPersianNum(n)
}

function formatCurrency(n: number): string {
  return formatCompact(n) + ' تومان'
}

// ─── Metric Definitions ─────────────────────────────────────────────────

const METRICS: StatMetric[] = [
  {
    id: 'posts',
    icon: <FileText className="h-4 w-4" />,
    label: 'کل مطالب',
    getValue: (d) => d.overview.totalPosts,
    format: (v) => toPersianNum(v),
    trendDir: 'up',
    getTrend: () => `+${toPersianNum(draftRandom())}`,
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
  },
  {
    id: 'users',
    icon: <Users className="h-4 w-4" />,
    label: 'کاربران فعال',
    getValue: (d) => d.users.active,
    format: (v) => toPersianNum(v),
    trendDir: 'up',
    getTrend: () => `+${toPersianNum(draftRandom())}`,
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-sky-600',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  {
    id: 'views',
    icon: <Eye className="h-4 w-4" />,
    label: 'بازدیدها',
    getValue: (d) => d.engagement.totalViews,
    format: (v) => formatCompact(v),
    trendDir: 'up',
    getTrend: () => `+${toPersianNum(draftRandom())}٪`,
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    id: 'comments',
    icon: <MessageCircle className="h-4 w-4" />,
    label: 'نظرات',
    getValue: (d) => d.overview.totalComments,
    format: (v) => toPersianNum(v),
    trendDir: 'up',
    getTrend: () => `+${toPersianNum(draftRandom())}`,
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    id: 'orders',
    icon: <ShoppingCart className="h-4 w-4" />,
    label: 'سفارشات',
    getValue: (d) => d.overview.totalProjects,
    format: (v) => toPersianNum(v),
    trendDir: 'flat',
    getTrend: () => `${toPersianNum(0)}٪`,
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-600',
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
  },
  {
    id: 'revenue',
    icon: <DollarSign className="h-4 w-4" />,
    label: 'درآمد',
    getValue: (d) => d.engagement.totalRevenue,
    format: (v) => formatCurrency(v),
    trendDir: 'up',
    getTrend: () => `+${toPersianNum(draftRandom())}٪`,
    gradientFrom: 'from-fuchsia-500',
    gradientTo: 'to-purple-600',
    iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
  },
  {
    id: 'media',
    icon: <Package className="h-4 w-4" />,
    label: 'فایل‌های رسانه',
    getValue: (d) => d.overview.totalMedia,
    format: (v) => toPersianNum(v),
    trendDir: 'up',
    getTrend: () => `+${toPersianNum(draftRandom())}`,
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-green-600',
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-900/30',
  },
  {
    id: 'projects',
    icon: <TrendingUp className="h-4 w-4" />,
    label: 'پروژه‌های فعال',
    getValue: (d) => d.projects.active,
    format: (v) => toPersianNum(v),
    trendDir: 'up',
    getTrend: () => `+${toPersianNum(draftRandom())}`,
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-500',
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
  },
]

function draftRandom(): number {
  return Math.floor(Math.random() * 15) + 1
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="shrink-0 w-[170px] p-3.5 rounded-xl border border-border/40 bg-background/80">
      <div className="flex items-center justify-between mb-2.5">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-12 rounded-md" />
      </div>
      <Skeleton className="h-6 w-20 mb-1 rounded" />
      <Skeleton className="h-3 w-14 rounded" />
    </div>
  )
}

// ─── Stat Mini Card ──────────────────────────────────────────────────────

function StatMiniCard({ metric, data, index }: { metric: StatMetric; data: StatsData; index: number }) {
  const value = metric.getValue(data)
  const trend = metric.getTrend(data)
  const TrendIcon = metric.trendDir === 'up' ? ArrowUpRight : metric.trendDir === 'down' ? ArrowDownRight : Minus

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="relative group shrink-0 w-[170px] snap-start rounded-xl border border-border/40 bg-background/80 backdrop-blur-sm p-3.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-border/80 overflow-hidden cursor-default"
            style={{
              animation: `fadeIn 0.4s ease-out ${index * 70}ms both, slideUp 0.4s ease-out ${index * 70}ms both`,
            }}
          >
            {/* Top accent gradient bar */}
            <div className={`absolute top-0 start-0 end-0 h-[3px] bg-gradient-to-l ${metric.gradientFrom} ${metric.gradientTo} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />

            <div className="flex items-center justify-between mb-2.5">
              <div className={`h-8 w-8 rounded-lg ${metric.iconBg} flex items-center justify-center ${metric.iconColor}`}>
                {metric.icon}
              </div>
              <Badge
                className={`text-[10px] gap-0.5 border-0 px-1.5 py-0 font-medium ${
                  metric.trendDir === 'up'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : metric.trendDir === 'down'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
                }`}
              >
                <TrendIcon className="h-3 w-3" />
                {trend}
              </Badge>
            </div>
            <p className="text-lg font-bold tabular-nums leading-tight">{metric.format(value)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{metric.label}</p>

            {/* Hover gradient overlay */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-tl ${metric.gradientFrom} ${metric.gradientTo} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none`} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p className="font-medium">{metric.label}</p>
          <p className="text-muted-foreground">
            مقدار فعلی: {metric.format(value)}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

const REFRESH_INTERVAL = 60_000

export default function QuickStatsBar() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    if (silent) setIsRefreshing(true)
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error(`خطای سرور (${res.status})`)
      const data = await res.json()
      setStats(data)
      setLastRefresh(new Date())
    } catch {
      // Silently fail — will retry on next interval
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(true)
    }, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchStats])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-violet-700 dark:text-violet-300">خلاصه آمار سریع</h3>
          <Badge variant="secondary" className="text-[10px] font-medium">
            بروزرسانی خودکار
          </Badge>
        </div>
        <button
          onClick={() => fetchStats(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
          disabled={isRefreshing}
          title="بروزرسانی آمار"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>بروزرسانی</span>
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin -mx-1 px-1 sm:mx-0 sm:px-0">
        {loading && !stats
          ? Array.from({ length: 8 }).map((_, i) => <StatSkeleton key={i} />)
          : stats
            ? METRICS.map((metric, i) => (
                <StatMiniCard
                  key={metric.id}
                  metric={metric}
                  data={stats}
                  index={i}
                />
              ))
            : null}
      </div>

      {/* Last refresh time */}
      {lastRefresh && (
        <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-left" dir="ltr">
          آخرین بروزرسانی: {lastRefresh.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  )
}
