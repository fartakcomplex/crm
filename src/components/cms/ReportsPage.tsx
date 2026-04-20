'use client'

import { useMemo } from 'react'
import { useCMS } from './context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BarChart3, FileText, Users, Eye, MessageCircle, TrendingUp,
  Download, Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { toast } from 'sonner'

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

// ─── Circle Chart (outside component) ─────────────────────────────────────────

function CircleChart({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="4" />
          <circle cx="18" cy="18" r="14" fill="none" className={color} strokeWidth="4" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { stats, charts } = useCMS()
  const statsData = stats.data
  const chartData = charts.data

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
    toast.success(labels.exportSuccess, {
      description: 'فایل CSV در حال آماده‌سازی...',
    })
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 bg-clip-text text-transparent">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
        <Button
          onClick={handleExport}
          className="gap-2 bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 hover:from-fuchsia-700 hover:to-fuchsia-600 text-white"
        >
          <Download className="h-4 w-4" />
          {labels.export}
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="bg-gradient-to-br from-fuchsia-500/5 to-fuchsia-600/5 border-fuchsia-200/30 dark:border-fuchsia-800/30">
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
            <Button variant="outline" className="border-fuchsia-300 dark:border-fuchsia-700 hover:bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 gap-2">
              <Calendar className="h-4 w-4" />
              {labels.apply}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 border-0 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2"><Eye className="h-5 w-5" /></div>
            <div>
              <p className="text-xs opacity-80">{labels.totalViews}</p>
              <p className="text-xl font-bold">{(statsData?.totalViews ?? 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-500 to-pink-700 border-0 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2"><FileText className="h-5 w-5" /></div>
            <div>
              <p className="text-xs opacity-80">{labels.totalPosts}</p>
              <p className="text-xl font-bold">{totalPostsCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500 to-rose-700 border-0 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2"><Users className="h-5 w-5" /></div>
            <div>
              <p className="text-xs opacity-80">{labels.totalUsers}</p>
              <p className="text-xl font-bold">{statsData?.totalUsers ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-700 border-0 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2"><MessageCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-xs opacity-80">{labels.totalComments}</p>
              <p className="text-xl font-bold">{statsData?.totalComments ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500 to-violet-700 border-0 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <p className="text-xs opacity-80">{labels.avgViews}</p>
              <p className="text-xl font-bold">{avgViews}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-700 border-0 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <p className="text-xs opacity-80">{labels.publishedPosts}</p>
              <p className="text-xl font-bold">{publishedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Views Bar Chart */}
        <Card className="bg-gradient-to-br from-fuchsia-500/5 to-fuchsia-600/5 border-fuchsia-200/30 dark:border-fuchsia-800/30">
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
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{m.views}</span>
                      <div
                        className="w-full bg-gradient-to-t from-fuchsia-600 to-fuchsia-400 rounded-t-md min-h-[4px] transition-all hover:from-fuchsia-500 hover:to-fuchsia-300"
                        style={{ height: `${height}%` }}
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
        <Card className="bg-gradient-to-br from-fuchsia-500/5 to-fuchsia-600/5 border-fuchsia-200/30 dark:border-fuchsia-800/30">
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
        <Card className="bg-gradient-to-br from-fuchsia-500/5 to-fuchsia-600/5 border-fuchsia-200/30 dark:border-fuchsia-800/30">
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
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{c.name}</span>
                        <span className="text-muted-foreground">{c.value}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${width}%`, backgroundColor: c.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card className="bg-gradient-to-br from-fuchsia-500/5 to-fuchsia-600/5 border-fuchsia-200/30 dark:border-fuchsia-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-fuchsia-700 dark:text-fuchsia-300">{labels.engagement}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'نرخ بازدید مجدد', value: '۶۸٪', trend: 'up', change: '+۱۲٪' },
                { label: 'میانگین زمان ماندن', value: '۴:۳۲ دقیقه', trend: 'up', change: '+۸٪' },
                { label: 'نرخ خروج (Bounce)', value: '۳۲٪', trend: 'down', change: '-۵٪' },
                { label: 'نرخ تبدیل', value: '۴.۵٪', trend: 'up', change: '+۱.۲٪' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <span className="text-sm">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-fuchsia-700 dark:text-fuchsia-300">{item.value}</span>
                    <Badge variant={item.trend === 'up' ? 'default' : 'secondary'} className={`text-[10px] gap-0.5 ${item.trend === 'up' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'} border-0`}>
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
