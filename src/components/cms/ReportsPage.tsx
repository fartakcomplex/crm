'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart3, FileText, Users, Eye, MessageCircle, TrendingUp,
  Download, Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/csv-export'
import { formatDate } from './types'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'گزارش‌ها',
  subtitle: 'تحلیل و آمار سیستم مدیریت محتوا',
  export: 'خروجی CSV',
  exportSuccess: 'گزارش با موفقیت دانلود شد!',
  dateRange: 'بازه زمانی',
  from: 'از تاریخ',
  to: 'تا تاریخ',
  totalViews: 'کل بازدیدها',
  totalPosts: 'کل مطالب',
  totalUsers: 'کل کاربران',
  totalComments: 'کل نظرات',
  publishedPosts: 'مطالب منتشر شده',
  draftPosts: 'پیش‌نویس‌ها',
  viewsTrend: 'روند بازدید',
  contentBreakdown: 'ترکیب محتوا',
  engagement: 'تعامل',
  avgViews: 'میانگین بازدید',
  noData: 'اطلاعاتی موجود نیست',
  apply: 'اعمال',
}

// ─── Circle Chart ─────────────────────────────────────────────────────────────

function CircleChart({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="4" />
          <circle cx="18" cy="18" r="14" fill="none" className={color} strokeWidth="4" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease-out' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  useEnsureData(['stats', 'charts', 'posts', 'users', 'customers', 'projects'])
  const { stats, charts, posts, users, customers } = useCMS()
  const statsData = stats.data
  const chartData = charts.data
  const postsData = posts.data ?? []
  const usersData = users.data ?? []
  const customersData = customers.data ?? []

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const monthlyViews = chartData?.monthlyViews ?? []
  const categoryDist = chartData?.categoryDistribution ?? []

  const maxViews = Math.max(...monthlyViews.map(v => v.views), 1)
  const totalPostsCount = statsData?.totalPosts ?? 0
  const publishedCount = statsData?.publishedPosts ?? 0
  const draftCount = statsData?.draftPosts ?? 0
  const archivedCount = totalPostsCount - publishedCount - draftCount
  const avgViews = totalPostsCount > 0 ? Math.round((statsData?.totalViews ?? 0) / totalPostsCount) : 0

  const handleExport = () => {
    // Export comprehensive report data
    const reportData: Record<string, string | number>[] = [
      // Summary stats
      { section: 'خلاصه آمار', metric: 'کل بازدیدها', value: statsData?.totalViews ?? 0 },
      { section: 'خلاصه آمار', metric: 'کل مطالب', value: totalPostsCount },
      { section: 'خلاصه آمار', metric: 'مطالب منتشر شده', value: publishedCount },
      { section: 'خلاصه آمار', metric: 'پیش‌نویس‌ها', value: draftCount },
      { section: 'خلاصه آمار', metric: 'کل کاربران', value: statsData?.totalUsers ?? 0 },
      { section: 'خلاصه آمار', metric: 'کل نظرات', value: statsData?.totalComments ?? 0 },
      { section: 'خلاصه آمار', metric: 'میانگین بازدید', value: avgViews },
    ]

    // Add monthly views
    monthlyViews.forEach(m => {
      reportData.push({ section: 'بازدید ماهانه', metric: m.month, value: m.views })
    })

    // Add category distribution
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
        <Button onClick={handleExport} className="gap-2 bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-700 hover:to-fuchsia-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md">
          <Download className="h-4 w-4" />
          {labels.export}
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="glass-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs text-muted-foreground">{labels.from}</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full" dir="ltr" />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs text-muted-foreground">{labels.to}</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full" dir="ltr" />
            </div>
            <Button variant="outline" className="border-fuchsia-300 dark:border-fuchsia-700 hover:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <Calendar className="h-4 w-4" />
              {labels.apply}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { icon: <Eye className="h-5 w-5" />, label: labels.totalViews, value: (statsData?.totalViews ?? 0).toLocaleString(), color: 'from-fuchsia-500 to-fuchsia-700', delay: 0 },
          { icon: <FileText className="h-5 w-5" />, label: labels.totalPosts, value: totalPostsCount, color: 'from-pink-500 to-pink-700', delay: 50 },
          { icon: <Users className="h-5 w-5" />, label: labels.totalUsers, value: statsData?.totalUsers ?? 0, color: 'from-rose-500 to-rose-700', delay: 100 },
          { icon: <MessageCircle className="h-5 w-5" />, label: labels.totalComments, value: statsData?.totalComments ?? 0, color: 'from-purple-500 to-purple-700', delay: 150 },
          { icon: <TrendingUp className="h-5 w-5" />, label: labels.avgViews, value: avgViews, color: 'from-violet-500 to-violet-700', delay: 200 },
          { icon: <BarChart3 className="h-5 w-5" />, label: labels.publishedPosts, value: publishedCount, color: 'from-amber-500 to-amber-700', delay: 250 },
        ].map((card, i) => (
          <Card key={i} className={`bg-gradient-to-br ${card.color} border-0 text-white stat-card hover-lift shadow-sm animate-in`} style={{ animationDelay: `${card.delay}ms`, animationFillMode: 'both' }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">{card.icon}</div>
              <div>
                <p className="text-xs opacity-80">{card.label}</p>
                <p className="text-xl font-bold tabular-nums">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Views Bar Chart */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-fuchsia-700 dark:text-fuchsia-300">{labels.viewsTrend}</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyViews.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{labels.noData}</p>
            ) : (
              <div className="flex items-end gap-1.5 h-44">
                {monthlyViews.map((m, i) => {
                  const height = (m.views / maxViews) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{m.views}</span>
                      <div
                        className="w-full bg-gradient-to-t from-fuchsia-600 to-fuchsia-400 rounded-t-md min-h-[4px] transition-all duration-500 group-hover:from-fuchsia-500 group-hover:to-fuchsia-300 group-hover:shadow-lg group-hover:shadow-fuchsia-500/20"
                        style={{ height: `${height}%`, transitionDelay: `${i * 50}ms` }}
                      />
                      <span className="text-[10px] text-muted-foreground">{m.month}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Breakdown (Circles) */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-fuchsia-700 dark:text-fuchsia-300">{labels.contentBreakdown}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8 py-4">
              <CircleChart value={publishedCount} max={totalPostsCount || 1} color="bg-green-500" label="منتشر شده" />
              <CircleChart value={draftCount} max={totalPostsCount || 1} color="bg-yellow-500" label="پیش‌نویس" />
              <CircleChart value={archivedCount} max={totalPostsCount || 1} color="bg-gray-400" label="بایگانی" />
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution Horizontal Bars */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-fuchsia-700 dark:text-fuchsia-300">توزیع دسته‌بندی‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryDist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{labels.noData}</p>
            ) : (
              <div className="space-y-3">
                {categoryDist.map((c, i) => {
                  const maxVal = Math.max(...categoryDist.map(v => v.value), 1)
                  const width = (c.value / maxVal) * 100
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span>{c.name}</span>
                        <span className="text-muted-foreground tabular-nums">{c.value}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${width}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-fuchsia-700 dark:text-fuchsia-300">{labels.engagement}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'نرخ بازدید مجدد', value: '۶۸٪', trend: 'up', change: '+۱۲٪' },
                { label: 'میانگین زمان ماندن', value: '۴:۳۲ دقیقه', trend: 'up', change: '+۸٪' },
                { label: 'نرخ خروج (Bounce)', value: '۳۲٪', trend: 'down', change: '-۵٪' },
                { label: 'نرخ تبدیل', value: '۴.۵٪', trend: 'up', change: '+۱.۲٪' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-background/50 hover:bg-fuchsia-500/5 transition-colors duration-200 hover-lift animate-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                  <span className="text-sm">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-fuchsia-700 dark:text-fuchsia-300 tabular-nums">{item.value}</span>
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
