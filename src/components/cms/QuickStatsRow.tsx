'use client'

import { Eye, MessageCircle, Users, Wallet, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useMemo } from 'react'

interface StatItem {
  icon: React.ReactNode
  label: string
  value: string
  trend: string
  trendDir: 'up' | 'down' | 'flat'
  gradientFrom: string
  gradientTo: string
  iconColor: string
  iconBg: string
  accentBar: string
}

const STATS: StatItem[] = [
  {
    icon: <Eye className="h-4 w-4" />,
    label: 'بازدید امروز',
    value: '۱٬۲۴۸',
    trend: '+۱۲.۵٪',
    trendDir: 'up',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-sky-600',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    accentBar: 'bg-cyan-500',
  },
  {
    icon: <MessageCircle className="h-4 w-4" />,
    label: 'نظرات جدید',
    value: '۲۳',
    trend: '+۳',
    trendDir: 'up',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-green-600',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    accentBar: 'bg-emerald-500',
  },
  {
    icon: <Users className="h-4 w-4" />,
    label: 'کاربران فعال',
    value: '۸۴',
    trend: '۰٪',
    trendDir: 'flat',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    accentBar: 'bg-amber-500',
  },
  {
    icon: <Wallet className="h-4 w-4" />,
    label: 'درآمد',
    value: '۱۲.۵M',
    trend: '+۸.۲٪',
    trendDir: 'up',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    accentBar: 'bg-violet-500',
  },
]

function StatMiniCard({ stat, index }: { stat: StatItem; index: number }) {
  const TrendIcon = stat.trendDir === 'up' ? ArrowUpRight : stat.trendDir === 'down' ? ArrowDownRight : Minus

  return (
    <div
      className="relative group min-w-[200px] sm:min-w-0 snap-start shrink-0 sm:shrink rounded-xl border border-border/40 bg-background/80 backdrop-blur-sm p-3.5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-border/80 animate-in overflow-hidden"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 start-0 end-0 h-0.5 bg-gradient-to-l ${stat.gradientFrom} ${stat.gradientTo} opacity-60 group-hover:opacity-100 transition-opacity`} />

      <div className="flex items-center justify-between mb-2.5">
        <div className={`h-8 w-8 rounded-lg ${stat.iconBg} flex items-center justify-center ${stat.iconColor}`}>
          {stat.icon}
        </div>
        <Badge
          className={`text-[10px] gap-0.5 border-0 px-1.5 py-0 font-medium ${
            stat.trendDir === 'up'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : stat.trendDir === 'down'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400'
          }`}
        >
          <TrendIcon className="h-3 w-3" />
          {stat.trend}
        </Badge>
      </div>
      <p className="text-xl font-bold tabular-nums">{stat.value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>

      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-tl ${stat.gradientFrom} ${stat.gradientTo} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`} />
    </div>
  )
}

export function QuickStatsRow() {
  const stats = useMemo(() => STATS, [])

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin -mx-1 px-1 sm:mx-0 sm:px-0 sm:overflow-x-visible">
      {stats.map((stat, i) => (
        <div key={stat.label} className="w-full sm:w-auto snap-center">
          <StatMiniCard stat={stat} index={i} />
        </div>
      ))}
    </div>
  )
}
