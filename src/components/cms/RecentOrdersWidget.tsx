'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from './types'

// ─── Status badge config ────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  completed: {
    label: 'تکمیل شده',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
  },
  pending: {
    label: 'در انتظار',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
  },
  cancelled: {
    label: 'لغو شده',
    className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
  },
  processing: {
    label: 'در حال پردازش',
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40',
  },
  shipped: {
    label: 'ارسال شده',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800/40',
  },
}

// ─── Fallback mock data ─────────────────────────────────────────────

const FALLBACK_ORDERS = [
  { id: 'ord-fallback-1', orderNumber: 'ORD-001423', customerName: 'علی محمدی', total: 4250000, status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
  { id: 'ord-fallback-2', orderNumber: 'ORD-001422', customerName: 'زهرا احمدی', total: 1820000, status: 'pending', createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  { id: 'ord-fallback-3', orderNumber: 'ORD-001421', customerName: 'محمد رضایی', total: 7650000, status: 'processing', createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { id: 'ord-fallback-4', orderNumber: 'ORD-001420', customerName: 'فاطمه حسینی', total: 980000, status: 'cancelled', createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
  { id: 'ord-fallback-5', orderNumber: 'ORD-001419', customerName: 'رضا کریمی', total: 3100000, status: 'completed', createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString() },
]

// ─── Helpers ────────────────────────────────────────────────────────

function formatToman(amount: number): string {
  return amount.toLocaleString('fa-IR') + ' تومان'
}

function truncateId(id: string): string {
  return id.length > 12 ? id.slice(0, 12) + '…' : id
}

// ─── Skeleton ───────────────────────────────────────────────────────

function OrdersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-20 loading-shimmer" />
          <Skeleton className="h-4 flex-1 loading-shimmer" />
          <Skeleton className="h-6 w-24 loading-shimmer" />
        </div>
      ))}
    </div>
  )
}

// ─── Order Row ─────────────────────────────────────────────────────

function OrderRow({ order }: {
  order: { id: string; orderNumber: string; customerName: string; total: number; status: string; createdAt: string }
}) {
  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg hover:bg-accent/50 transition-colors duration-150 group">
      {/* Order ID */}
      <span className="text-xs font-mono text-muted-foreground shrink-0 tabular-nums" dir="ltr">
        {truncateId(order.orderNumber || order.id)}
      </span>

      {/* Customer + Date */}
      <div className="flex-1 min-w-0 text-right">
        <p className="text-sm font-medium truncate">{order.customerName}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{formatRelativeTime(order.createdAt)}</p>
      </div>

      {/* Amount + Status */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs sm:text-sm font-semibold tabular-nums">{formatToman(order.total)}</span>
        <Badge className={`text-[10px] px-1.5 py-0 border ${badge.className}`}>
          {badge.label}
        </Badge>
      </div>
    </div>
  )
}

// ─── Widget ─────────────────────────────────────────────────────────

export default function RecentOrdersWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => fetch('/api/orders?page=1&limit=5').then((r) => r.json()),
    staleTime: 30000,
    retry: 1,
  })

  const orders = isError
    ? FALLBACK_ORDERS
    : (data?.orders ?? []).slice(0, 5).map((o: Record<string, unknown>) => ({
        id: String(o.id ?? ''),
        orderNumber: String(o.orderNumber ?? ''),
        customerName: (o.customer as Record<string, string> | null)?.name ?? 'نامشخص',
        total: Number(o.total ?? 0),
        status: String(o.status ?? 'pending'),
        createdAt: String(o.createdAt ?? ''),
      }))

  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 border border-border/50">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-base text-violet-700 dark:text-violet-300">
          آخرین سفارش‌ها
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <OrdersSkeleton />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p className="text-sm">سفارشی یافت نشد</p>
          </div>
        ) : (
          <div className="space-y-1">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
