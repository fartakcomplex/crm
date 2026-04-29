'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Users, UserCircle, BarChart3, Download, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/csv-export'

const EXPORT_BUTTONS = [
  {
    id: 'content',
    label: 'خروجی CSV محتوا',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    gradient: 'from-cyan-500 to-cyan-600',
    hoverShadow: 'hover:shadow-cyan-500/25',
    fetchUrl: '/api/posts',
    columns: [
      { key: 'title', label: 'عنوان' },
      { key: 'status', label: 'وضعیت' },
      { key: 'slug', label: 'نامک' },
      { key: 'createdAt', label: 'تاریخ ایجاد' },
      { key: 'updatedAt', label: 'تاریخ بروزرسانی' },
    ],
    filename: 'content-export',
  },
  {
    id: 'users',
    label: 'خروجی CSV کاربران',
    icon: <Users className="h-4 w-4" />,
    gradient: 'from-emerald-500 to-emerald-600',
    hoverShadow: 'hover:shadow-emerald-500/25',
    fetchUrl: '/api/users',
    columns: [
      { key: 'name', label: 'نام' },
      { key: 'email', label: 'ایمیل' },
      { key: 'role', label: 'نقش' },
      { key: 'status', label: 'وضعیت' },
      { key: 'createdAt', label: 'تاریخ ایجاد' },
    ],
    filename: 'users-export',
  },
  {
    id: 'customers',
    label: 'خروجی CSV مشتریان',
    icon: <UserCircle className="h-4 w-4" />,
    gradient: 'from-amber-500 to-amber-600',
    hoverShadow: 'hover:shadow-amber-500/25',
    fetchUrl: '/api/customers',
    columns: [
      { key: 'name', label: 'نام' },
      { key: 'email', label: 'ایمیل' },
      { key: 'company', label: 'شرکت' },
      { key: 'status', label: 'وضعیت' },
      { key: 'value', label: 'ارزش' },
    ],
    filename: 'customers-export',
  },
  {
    id: 'report',
    label: 'گزارش عملکرد',
    icon: <BarChart3 className="h-4 w-4" />,
    gradient: 'from-violet-500 to-violet-600',
    hoverShadow: 'hover:shadow-violet-500/25',
    isReport: true,
    filename: 'performance-report',
  },
]

export function DataExportWidget() {
  const [lastExport, setLastExport] = useState<string | null>(null)
  const [exportingId, setExportingId] = useState<string | null>(null)

  const handleExport = async (btn: typeof EXPORT_BUTTONS[number]) => {
    if (btn.isReport) {
      // Generate performance report from stats
      try {
        setExportingId(btn.id)
        const statsRes = await fetch('/api/stats')
        const statsData = await statsRes.json()
        const chartRes = await fetch('/api/charts')
        const chartData = await chartRes.json()

        const reportData = [
          { metric: 'کل مطالب', value: statsData.totalPosts ?? 0 },
          { metric: 'کل کاربران', value: statsData.totalUsers ?? 0 },
          { metric: 'کل مشتریان', value: statsData.totalCustomers ?? 0 },
          { metric: 'کل پروژه‌ها', value: statsData.totalProjects ?? 0 },
          { metric: 'کل بازدیدها', value: statsData.totalViews ?? 0 },
          { metric: 'کل نظرات', value: statsData.totalComments ?? 0 },
          { metric: 'مطالب منتشر شده', value: statsData.publishedPosts ?? 0 },
          { metric: 'مطالب پیش‌نویس', value: statsData.draftPosts ?? 0 },
          { metric: 'درآمد', value: statsData.revenue ?? 0 },
          { metric: 'پروژه‌های فعال', value: statsData.activeProjects ?? 0 },
        ]

        const columns = [
          { key: 'metric', label: 'شاخص' },
          { key: 'value', label: 'مقدار' },
        ]

        exportToCSV(reportData as unknown as Record<string, unknown>[], btn.filename, columns)
        setLastExport(new Date().toLocaleTimeString('fa-IR'))
        toast.success('گزارش عملکرد با موفقیت دانلود شد')
      } catch {
        toast.error('خطا در ایجاد گزارش عملکرد')
      } finally {
        setExportingId(null)
      }
      return
    }

    try {
      setExportingId(btn.id)
      const res = await fetch(btn.fetchUrl)
      const data = await res.json()

      // Handle wrapped responses
      const items = Array.isArray(data) ? data : (data.posts ?? data.users ?? data.customers ?? [])

      if (items.length === 0) {
        toast.error('داده‌ای برای خروجی وجود ندارد')
        return
      }

      exportToCSV(items as unknown as Record<string, unknown>[], btn.filename, btn.columns)
      setLastExport(new Date().toLocaleTimeString('fa-IR'))
      toast.success(`${btn.label} با موفقیت دانلود شد`)
    } catch {
      toast.error('خطا در دانلود خروجی')
    } finally {
      setExportingId(null)
    }
  }

  return (
    <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-violet-700 dark:text-violet-300">خروجی داده‌ها</CardTitle>
          {lastExport && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>آخرین: {lastExport}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          {EXPORT_BUTTONS.map((btn) => (
            <button
              key={btn.id}
              className={`flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-br ${btn.gradient} text-white shadow-md ${btn.hoverShadow} hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 hover-lift group disabled:opacity-50 disabled:cursor-not-allowed`}
              onClick={() => handleExport(btn)}
              disabled={exportingId === btn.id}
            >
              <div className="bg-white/20 rounded-lg p-1.5 backdrop-blur-sm shrink-0">
                {btn.isReport || exportingId === btn.id ? (
                  <Download className="h-3.5 w-3.5 group-hover:animate-bounce" />
                ) : (
                  btn.icon
                )}
              </div>
              <span className="text-[11px] font-medium leading-tight text-right">{btn.label}</span>
              {exportingId === btn.id && (
                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
