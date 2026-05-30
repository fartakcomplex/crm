'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronRight, ChevronLeft, CalendarDays, CheckCircle2 } from 'lucide-react'

// ─── Persian/Jalali month names ──────────────────────────────
const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

const PERSIAN_WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

// ─── Gregorian to Jalali conversion ─────────────────────────
function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let jy = gy <= 1600 ? 0 : 979
  gy -= gy <= 1600 ? 621 : 1600
  const gy2 = gm > 2 ? gy + 1 : gy
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1]
  jy += 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30)
  return { jy, jm, jd }
}

// Days in Jalali month
function jalaliMonthDays(jm: number): number {
  return jm <= 6 ? 31 : 30
}

// Get day of week for a Gregorian date (returns 0=Shanbe/Saturday .. 6=Jomeh/Friday)
function getJalaliDayOfWeek(gy: number, gm: number, gd: number): number {
  const d = new Date(gy, gm - 1, gd)
  const jsDay = d.getDay() // 0=Sunday, 6=Saturday
  return (jsDay + 1) % 7 // 0=Shanbe, 1=Yekshanbe, ..., 6=Jomeh
}

// Approximate Jalali to Gregorian (for month navigation)
function jalaliToGregorianApprox(jy: number, jm: number): { gy: number; gm: number } {
  let gy = jy + 621
  const gm = jm <= 3 ? jm + 9 : jm - 3
  return { gy, gm }
}

// ─── Mock task data for demo ────────────────────────────────
function getMockTaskDays(daysInMonth: number): Set<number> {
  const taskDays = new Set<number>()
  // Deterministic "random" task days for demo
  const seed = [3, 7, 12, 15, 18, 22, 25, 28]
  seed.forEach(d => { if (d <= daysInMonth) taskDays.add(d) })
  return taskDays
}

const MOCK_TASKS: Record<number, Array<{ title: string; status: string; priority: string }>> = {
  3: [{ title: 'بررسی سفارشات', status: 'in_progress', priority: 'high' }],
  7: [{ title: 'جلسه تیمی', status: 'todo', priority: 'medium' }],
  12: [{ title: 'ارسال گزارش', status: 'done', priority: 'low' }, { title: 'بروزرسانی سایت', status: 'todo', priority: 'high' }],
  15: [{ title: 'آماده‌سازی محتوا', status: 'in_progress', priority: 'medium' }],
  18: [{ title: 'بکاپ‌گیری', status: 'done', priority: 'high' }],
  22: [{ title: 'تحلیل داده', status: 'todo', priority: 'medium' }],
  25: [{ title: 'ملاقات مشتری', status: 'in_progress', priority: 'high' }, { title: 'ارسال فاکتور', status: 'todo', priority: 'low' }],
  28: [{ title: 'بررسی عملکرد', status: 'todo', priority: 'medium' }],
}

// ─── Types ──────────────────────────────────────────────────────

interface CalendarWidgetProps {
  className?: string
}

type SlideDirection = 'left' | 'right' | null

// ─── Calendar Widget ────────────────────────────────────────────

export default function CalendarWidget({ className }: CalendarWidgetProps) {
  const now = new Date()
  const todayJalali = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())

  const [viewYear, setViewYear] = useState(todayJalali.jy)
  const [viewMonth, setViewMonth] = useState(todayJalali.jm)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [slideDirection, setSlideDirection] = useState<SlideDirection>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  // We reset selectedDay inside handlePrevMonth/handleNextMonth instead of via useEffect

  // Calculate calendar data
  const { daysInMonth, firstDayOfWeek, taskDays, calendarCells } = useMemo(() => {
    const dim = jalaliMonthDays(viewMonth)
    const greg = jalaliToGregorianApprox(viewYear, viewMonth)
    const fdow = getJalaliDayOfWeek(greg.gy, greg.gm, 1)
    const td = getMockTaskDays(dim)

    const cells: Array<{ day: number; isToday: boolean; hasTasks: boolean; taskCount: number }> = []
    for (let i = 0; i < fdow; i++) {
      cells.push({ day: 0, isToday: false, hasTasks: false, taskCount: 0 })
    }
    for (let d = 1; d <= dim; d++) {
      const isToday = viewYear === todayJalali.jy && viewMonth === todayJalali.jm && d === todayJalali.jd
      const hasTasks = td.has(d)
      const taskCount = MOCK_TASKS[d]?.length ?? 0
      cells.push({ day: d, isToday, hasTasks, taskCount })
    }

    return { daysInMonth: dim, firstDayOfWeek: fdow, taskDays: td, calendarCells: cells }
  }, [viewYear, viewMonth, todayJalali.jy, todayJalali.jm, todayJalali.jd])

  const handlePrevMonth = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setSlideDirection('right')
    setTimeout(() => {
      if (viewMonth === 1) {
        setViewYear(prev => prev - 1)
        setViewMonth(12)
      } else {
        setViewMonth(prev => prev - 1)
      }
      setSelectedDay(null)
      setSlideDirection(null)
      setIsAnimating(false)
    }, 200)
  }, [viewMonth, isAnimating])

  const handleNextMonth = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setSlideDirection('left')
    setTimeout(() => {
      if (viewMonth === 12) {
        setViewYear(prev => prev + 1)
        setViewMonth(1)
      } else {
        setViewMonth(prev => prev + 1)
      }
      setSelectedDay(null)
      setSlideDirection(null)
      setIsAnimating(false)
    }, 200)
  }, [viewMonth, isAnimating])

  const selectedDayTasks = selectedDay ? (MOCK_TASKS[selectedDay] ?? []) : []

  const persianMonthName = PERSIAN_MONTHS[viewMonth - 1] ?? ''
  const persianYear = viewYear.toLocaleString('fa-IR')

  const statusLabel = (status: string) => {
    if (status === 'done') return 'انجام شد'
    if (status === 'in_progress') return 'در حال انجام'
    return 'انجام نشده'
  }

  return (
    <Card className={`glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0 ${className ?? ''}`}>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-violet-700 dark:text-violet-300 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            تقویم وظایف
          </CardTitle>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              disabled={isAnimating}
              className="p-1.5 rounded-md hover:bg-violet-500/10 transition-colors text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-40"
              aria-label="ماه قبلی"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <Badge variant="secondary" className="text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-2.5 min-w-[100px] justify-center">
              {persianMonthName} {persianYear}
            </Badge>
            <button
              onClick={handleNextMonth}
              disabled={isAnimating}
              className="p-1.5 rounded-md hover:bg-violet-500/10 transition-colors text-muted-foreground hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-40"
              aria-label="ماه بعدی"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-0.5 mb-1.5" dir="rtl">
          {PERSIAN_WEEK_DAYS.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Day cells with slide animation */}
        <div
          className={`grid grid-cols-7 gap-0.5 transition-all duration-200 ${
            slideDirection === 'left' ? 'translate-x-[-8px] opacity-0' :
            slideDirection === 'right' ? 'translate-x-[8px] opacity-0' :
            'translate-x-0 opacity-100'
          }`}
          dir="rtl"
        >
          {calendarCells.map((cell, i) => (
            <button
              key={`${viewYear}-${viewMonth}-${i}`}
              className={`relative text-center text-xs py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                cell.day === 0
                  ? 'pointer-events-none'
                  : cell.isToday
                    ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold shadow-sm shadow-violet-500/30 ring-2 ring-violet-400/40 ring-offset-1 ring-offset-background'
                    : selectedDay === cell.day
                      ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-medium ring-1 ring-violet-300/50 hover:bg-violet-200/80 dark:hover:bg-violet-800/60'
                      : 'hover:bg-violet-500/10 text-foreground hover:text-violet-700 dark:hover:text-violet-300'
              }`}
              onClick={() => cell.day > 0 && setSelectedDay(selectedDay === cell.day ? null : cell.day)}
              disabled={cell.day === 0}
            >
              {cell.day > 0 && (
                <>
                  <span className="tabular-nums">{cell.day.toLocaleString('fa-IR')}</span>
                  {cell.hasTasks && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {Array.from({ length: Math.min(cell.taskCount, 3) }).map((_, j) => (
                        <span
                          key={j}
                          className="w-1 h-1 rounded-full bg-fuchsia-500 shadow-sm shadow-fuchsia-500/40"
                        />
                      ))}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Selected day tasks */}
        {selectedDay !== null && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              وظایف روز {selectedDay.toLocaleString('fa-IR')} {persianMonthName}
            </p>
            {selectedDayTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 py-2 text-center">وظیفه‌ای یافت نشد</p>
            ) : (
              selectedDayTasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${
                    task.priority === 'high' ? 'text-rose-500' :
                    task.priority === 'medium' ? 'text-amber-500' :
                    'text-emerald-500'
                  }`} />
                  <span className="text-xs font-medium truncate flex-1">{task.title}</span>
                  <Badge
                    className={`text-[9px] px-1.5 py-0 border-0 ${
                      task.status === 'done'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : task.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {statusLabel(task.status)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
