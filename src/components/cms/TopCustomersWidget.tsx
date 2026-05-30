'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

// ─── Mock customer data ────────────────────────────────────
const CUSTOMERS = [
  { name: 'علی محمدی', spent: 48500000, orders: 23 },
  { name: 'زهرا احمدی', spent: 37200000, orders: 18 },
  { name: 'محمد رضایی', spent: 31500000, orders: 15 },
  { name: 'فاطمه حسینی', spent: 24800000, orders: 12 },
  { name: 'امیر کریمی', spent: 18600000, orders: 9 },
]

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-fuchsia-500 to-rose-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-sky-600',
]

const BAR_GRADIENTS = [
  'from-violet-500 to-purple-500',
  'from-fuchsia-500 to-rose-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-cyan-500 to-sky-500',
]

// Format number to Persian
function formatPersianNumber(num: number): string {
  return num.toLocaleString('fa-IR')
}

// Format to Toman
function formatToman(num: number): string {
  const toman = Math.round(num / 10000)
  return formatPersianNumber(toman) + ' ت'
}

// ─── Top Customers Widget ────────────────────────────────────

interface TopCustomersWidgetProps {
  className?: string
}

export default function TopCustomersWidget({ className }: TopCustomersWidgetProps) {
  const maxSpent = Math.max(...CUSTOMERS.map(c => c.spent), 1)

  return (
    <Card className={`glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0 ${className ?? ''}`}>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-violet-700 dark:text-violet-300 flex items-center gap-2">
            <Users className="h-4 w-4" />
            مشتریان برتر
          </CardTitle>
          <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            {formatPersianNumber(CUSTOMERS.length)} نفر
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {CUSTOMERS.map((customer, i) => {
            const percentage = Math.max((customer.spent / maxSpent) * 100, 5)
            const initials = customer.name.split(' ').map(w => w.charAt(0)).slice(0, 2).join('')

            return (
              <div
                key={i}
                className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-violet-500/5 dark:hover:bg-violet-500/10 transition-all duration-200 cursor-default hover:shadow-sm"
              >
                {/* Avatar with gradient */}
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-110 transition-transform duration-200 shrink-0 ring-2 ring-white/20 dark:ring-white/10`}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{customer.name}</p>
                    <div className="flex items-center gap-2 shrink-0 mr-2">
                      <span className="text-xs font-bold tabular-nums text-violet-600 dark:text-violet-400">
                        {formatToman(customer.spent)}
                      </span>
                    </div>
                  </div>

                  {/* Spending bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-l ${BAR_GRADIENTS[i % BAR_GRADIENTS.length]} transition-all duration-700 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatPersianNumber(customer.orders)} سفارش
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer summary */}
        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">مبلغ خرید</span>
          <span className="text-[10px] text-muted-foreground">سفارشات</span>
        </div>
      </CardContent>
    </Card>
  )
}
