'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, Zap, Cpu, HardDrive, Radio, ChevronDown, ChevronUp } from 'lucide-react'

interface MetricData {
  label: string
  value: string
  percent: number
  icon: React.ReactNode
  colorClass: string
  fillClass: string
}

export default function PerformanceMonitorWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [metrics, setMetrics] = useState<MetricData[]>([
    { label: 'زمان پاسخ API', value: '85ms', percent: 42, icon: <Zap className="w-4 h-4" />, colorClass: 'text-emerald-500', fillClass: 'progress-fill-emerald' },
    { label: 'حافظه مصرفی', value: '45%', percent: 45, icon: <Cpu className="w-4 h-4" />, colorClass: 'text-cyan-500', fillClass: 'progress-fill-cyan' },
    { label: 'درخواست‌های فعال', value: '3', percent: 37, icon: <HardDrive className="w-4 h-4" />, colorClass: 'text-violet-500', fillClass: 'progress-fill-violet' },
    { label: 'وضعیت اتصال', value: 'متصل', percent: 100, icon: <Radio className="w-4 h-4" />, colorClass: 'text-emerald-500', fillClass: 'progress-fill-emerald' },
  ])

  const updateMetrics = useCallback(() => {
    const apiTime = Math.floor(Math.random() * 76) + 45 // 45-120ms
    const memory = Math.floor(Math.random() * 31) + 35 // 35-65%
    const requests = Math.floor(Math.random() * 8) + 1 // 1-8

    const apiColor = apiTime < 80 ? 'text-emerald-500' : apiTime < 100 ? 'text-amber-500' : 'text-rose-500'
    const apiFill = apiTime < 80 ? 'progress-fill-emerald' : apiTime < 100 ? 'progress-fill-amber' : 'progress-fill-rose'
    const apiPercent = Math.min((apiTime / 120) * 100, 100)

    setMetrics([
      {
        label: 'زمان پاسخ API',
        value: `${apiTime}ms`,
        percent: apiPercent,
        icon: <Zap className="w-4 h-4" />,
        colorClass: apiColor,
        fillClass: apiFill,
      },
      {
        label: 'حافظه مصرفی',
        value: `${memory}%`,
        percent: memory,
        icon: <Cpu className="w-4 h-4" />,
        colorClass: 'text-cyan-500',
        fillClass: 'progress-fill-cyan',
      },
      {
        label: 'درخواست‌های فعال',
        value: String(requests),
        percent: (requests / 8) * 100,
        icon: <HardDrive className="w-4 h-4" />,
        colorClass: 'text-violet-500',
        fillClass: 'progress-fill-violet',
      },
      {
        label: 'وضعیت اتصال',
        value: 'متصل',
        percent: 100,
        icon: <Radio className="w-4 h-4" />,
        colorClass: 'text-emerald-500',
        fillClass: 'progress-fill-emerald',
      },
    ])
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateMetrics()
    const interval = setInterval(updateMetrics, 2000)
    return () => clearInterval(interval)
  }, [updateMetrics])

  return (
    <div className="fixed bottom-20 left-4 z-40" dir="rtl">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="عملکرد سیستم"
      >
        {isOpen ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <Activity className="w-5 h-5" />
        )}
      </button>

      {/* Panel */}
      <div
        className={`mt-2 w-[350px] rounded-xl glass-card card-elevated overflow-hidden transition-all duration-300 ease-in-out origin-bottom-left ${
          isOpen
            ? 'opacity-100 scale-100 h-[400px]'
            : 'opacity-0 scale-90 h-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gradient-cyan">
              عملکرد سیستم
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">زنده</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="p-4 space-y-4 cms-scrollbar overflow-y-auto" style={{ maxHeight: 'calc(400px - 57px)' }}>
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className="space-y-2"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`${metric.colorClass}`}>
                    {metric.icon}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {metric.label}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${metric.colorClass} smooth-number`}>
                  {metric.value}
                </span>
              </div>
              <div className="progress-bar-cms">
                <div
                  className={`progress-fill ${metric.fillClass}`}
                  style={{ width: `${metric.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
