'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react'

// Persian day names (Saturday first - Persian week)
const PERSIAN_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

// Simulated weekly views data (Mon-Sun)
const WEEKLY_VIEWS = [65, 45, 80, 55, 90, 70, 40]

// Simulated top content
const TOP_CONTENT = [
  { title: 'راهنمای کامل سئو', views: 2340, percentage: 100 },
  { title: 'مقایسه فریمورک‌ها', views: 1820, percentage: 78 },
  { title: 'نکات طراحی UI', views: 1450, percentage: 62 },
]

// Engagement rate
const ENGAGEMENT_RATE = 68

function getTodayDayIndex(): number {
  // JavaScript: 0=Sun, 1=Mon, ..., 6=Sat
  // Persian week: 0=Sat, 1=Sun, 2=Mon, ..., 6=Fri
  const jsDay = new Date().getDay()
  // Convert to Persian week index (Sat=0)
  return (jsDay + 1) % 7
}

export default function AnalyticsOverviewWidget() {
  const todayIndex = getTodayDayIndex()

  // Bar chart heights (max height 100%)
  const maxViews = Math.max(...WEEKLY_VIEWS, 1)

  const bars = useMemo(() => {
    return WEEKLY_VIEWS.map((v, i) => ({
      height: Math.max((v / maxViews) * 100, 8),
      isToday: i === todayIndex,
      day: PERSIAN_DAYS[i],
      views: v,
    }))
  }, [todayIndex])

  // Conic gradient for donut ring (68% filled)
  const donutGradient = `conic-gradient(#8b5cf6 0deg ${ENGAGEMENT_RATE * 3.6}deg, oklch(0.7 0 0 / 15%) ${ENGAGEMENT_RATE * 3.6}deg 360deg)`

  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-base text-violet-700 dark:text-violet-300">
          تحلیل سریع
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Weekly Views Bar Chart */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">بازدید هفتگی</p>
                <p className="text-[10px] text-muted-foreground">۷ روز اخیر</p>
              </div>
            </div>
            {/* Bars */}
            <div className="flex items-end justify-between gap-1.5 h-24">
              {bars.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[9px] tabular-nums text-muted-foreground">{bar.views}</span>
                  <div className="w-full flex items-end" style={{ height: '72px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-700 ease-out ${
                        bar.isToday
                          ? 'bg-gradient-to-t from-violet-600 to-violet-400 shadow-sm shadow-violet-500/30'
                          : 'bg-gradient-to-t from-violet-300 dark:from-violet-700 to-violet-200 dark:to-violet-600'
                      }`}
                      style={{ height: `${bar.height}%` }}
                    />
                  </div>
                  <span className={`text-[9px] leading-tight text-center ${bar.isToday ? 'font-bold text-violet-600 dark:text-violet-400' : 'text-muted-foreground'}`}>
                    {bar.day.slice(0, 2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Rate Donut */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <PieIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">نرخ تعامل</p>
                <p className="text-[10px] text-muted-foreground">میانگین ماهانه</p>
              </div>
            </div>
            {/* Donut Ring */}
            <div className="flex items-center justify-center py-2">
              <div className="relative w-24 h-24">
                {/* Background ring */}
                <div
                  className="w-full h-full rounded-full"
                  style={{ background: donutGradient }}
                />
                {/* Inner circle (donut hole) */}
                <div className="absolute inset-[6px] rounded-full bg-background dark:bg-card flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                      {ENGAGEMENT_RATE}%
                    </span>
                    <p className="text-[9px] text-muted-foreground mt-0.5">تعامل</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Content Progress Bars */}
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">محتوای پربازدید</p>
                <p className="text-[10px] text-muted-foreground">۳ مطلب برتر</p>
              </div>
            </div>
            <div className="space-y-3">
              {TOP_CONTENT.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate max-w-[120px]">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {item.views.toLocaleString('fa-IR')}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        i === 0
                          ? 'bg-gradient-to-l from-emerald-500 to-emerald-400'
                          : i === 1
                            ? 'bg-gradient-to-l from-violet-500 to-violet-400'
                            : 'bg-gradient-to-l from-cyan-500 to-cyan-400'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
