'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Database, Server, HardDrive, Cpu, Clock } from 'lucide-react'

interface StatusItem {
  icon: React.ReactNode
  label: string
  status: string
  dotColor: string
  statusColor: string
}

const STATUS_ITEMS: StatusItem[] = [
  {
    icon: <Database className="h-3.5 w-3.5" />,
    label: 'پایگاه داده',
    status: 'متصل',
    dotColor: 'bg-green-500',
    statusColor: 'text-green-600 dark:text-green-400',
  },
  {
    icon: <Server className="h-3.5 w-3.5" />,
    label: 'سرور',
    status: 'فعال',
    dotColor: 'bg-green-500',
    statusColor: 'text-green-600 dark:text-green-400',
  },
  {
    icon: <HardDrive className="h-3.5 w-3.5" />,
    label: 'فضای ذخیره‌سازی',
    status: '۷۵٪ استفاده',
    dotColor: 'bg-amber-500',
    statusColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: <Cpu className="h-3.5 w-3.5" />,
    label: 'حافظه',
    status: '۱.۲ GB / ۴ GB',
    dotColor: 'bg-green-500',
    statusColor: 'text-green-600 dark:text-green-400',
  },
  {
    icon: <Clock className="h-3.5 w-3.5" />,
    label: 'آپتایم',
    status: '۹۹.۹٪',
    dotColor: 'bg-green-500',
    statusColor: 'text-green-600 dark:text-green-400',
  },
]

export function SystemStatusWidget() {
  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0">
      <CardContent className="p-4">
        <div className="space-y-3">
          {STATUS_ITEMS.map((item, idx) => (
            <div
              key={item.label}
              className="flex items-center justify-between animate-in"
              style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center gap-2.5">
                {/* Pulsing dot */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${item.dotColor} opacity-40`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${item.dotColor} shadow-sm`} style={{
                    boxShadow: `0 0 6px ${item.dotColor === 'bg-green-500' ? 'rgba(34,197,94,0.5)' : 'rgba(245,158,11,0.5)'}`,
                  }} />
                </span>
                <span className="text-muted-foreground">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
              <span className={`text-xs font-medium ${item.statusColor}`}>{item.status}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-muted-foreground">آخرین بروزرسانی: الان</span>
        </div>
      </CardContent>
    </Card>
  )
}
