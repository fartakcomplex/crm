'use client'

import { useState, useMemo, useCallback } from 'react'
import { useCMS } from '@/components/cms/context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { CalendarEvent } from './types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Clock,
  CalendarClock,
  Users,
  Flag,
  Bell,
  CalendarDaysIcon,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Constants ────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  { name: 'بنفش', value: 'violet', bg: 'bg-violet-500', border: 'border-violet-500', text: 'text-violet-600 dark:text-violet-400', light: 'bg-violet-100 dark:bg-violet-900/30' },
  { name: 'فیروزه‌ای', value: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', light: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { name: 'سبز', value: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', light: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { name: 'صورتی', value: 'rose', bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-600 dark:text-rose-400', light: 'bg-rose-100 dark:bg-rose-900/30' },
  { name: 'طلایی', value: 'amber', bg: 'bg-amber-500', border: 'border-amber-500', text: 'text-amber-600 dark:text-amber-400', light: 'bg-amber-100 dark:bg-amber-900/30' },
  { name: 'آبی', value: 'blue', bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600 dark:text-blue-400', light: 'bg-blue-100 dark:bg-blue-900/30' },
  { name: 'فوکسیا', value: 'fuchsia', bg: 'bg-fuchsia-500', border: 'border-fuchsia-500', text: 'text-fuchsia-600 dark:text-fuchsia-400', light: 'bg-fuchsia-100 dark:bg-fuchsia-900/30' },
  { name: 'خاکستری', value: 'slate', bg: 'bg-slate-500', border: 'border-slate-500', text: 'text-slate-600 dark:text-slate-400', light: 'bg-slate-100 dark:bg-slate-900/30' },
]

const TYPE_CONFIG: Record<string, { label: string; gradient: string; icon: typeof CalendarDays }> = {
  event:    { label: 'رویداد',  gradient: 'from-violet-500 to-violet-600', icon: CalendarDaysIcon },
  meeting:  { label: 'جلسه',   gradient: 'from-blue-500 to-blue-600', icon: Users },
  deadline: { label: 'موعد',   gradient: 'from-rose-500 to-rose-600', icon: Flag },
  reminder: { label: 'یادآوری', gradient: 'from-amber-500 to-amber-600', icon: Bell },
}

const TYPE_FILTERS = [
  { value: 'all', label: 'همه' },
  { value: 'event', label: 'رویداد' },
  { value: 'meeting', label: 'جلسه' },
  { value: 'deadline', label: 'موعد' },
  { value: 'reminder', label: 'یادآوری' },
]

const PERSIAN_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
const PERSIAN_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

// ─── Helpers ──────────────────────────────────────────────────────────

function getColorClass(color: string) {
  return COLOR_PRESETS.find(c => c.value === color) ?? COLOR_PRESETS[0]
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
}

function isToday(date: Date): boolean {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
}

function persianDigits(n: number): string {
  const persianDigitsMap = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, d => persianDigitsMap[parseInt(d)])
}

function toPersianDate(date: Date): string {
  try {
    return date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' })
  } catch {
    return ''
  }
}

// ─── Main Component ───────────────────────────────────────────────────

export default function CalendarEventsPage() {
  useEnsureData(['events'])
  const { events, createEvent, updateEvent, deleteEvent } = useCMS()
  const eventsData = (events.data ?? []) as CalendarEvent[]

  // ── Calendar State ──
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')

  // ── Dialog State ──
  const [createOpen, setCreateOpen] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null)

  // ── Form State ──
  const emptyForm = {
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: false,
    color: 'violet',
    location: '',
    type: 'event' as CalendarEvent['type'],
  }
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  // ── Calendar helpers ──
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = (firstDay.getDay() + 6) % 7 // Saturday=0 for Persian calendar start
    const days: (Date | null)[] = []

    // Pad start
    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }

    // Actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d))
    }

    // Pad end to complete weeks
    while (days.length % 7 !== 0) {
      days.push(null)
    }

    return days
  }, [year, month])

  // ── Event filtering ──
  const eventsForDate = useMemo(() => {
    if (!selectedDate) return []
    return eventsData.filter(ev => isSameDay(ev.startDate, selectedDate))
  }, [eventsData, selectedDate])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    let filtered = eventsData.filter(ev => new Date(ev.startDate) >= now)
    if (typeFilter !== 'all') {
      filtered = filtered.filter(ev => ev.type === typeFilter)
    }
    return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [eventsData, typeFilter])

  const allFilteredEvents = useMemo(() => {
    let filtered = [...eventsData]
    if (typeFilter !== 'all') {
      filtered = filtered.filter(ev => ev.type === typeFilter)
    }
    return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [eventsData, typeFilter])

  const displayEvents = selectedDate ? eventsForDate : upcomingEvents

  // ── Events on each calendar day ──
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of eventsData) {
      const key = new Date(ev.startDate).toDateString()
      if (!map[key]) map[key] = []
      map[key].push(ev)
    }
    return map
  }, [eventsData])

  // ── Stats ──
  const stats = useMemo(() => {
    const now = new Date()
    const todayStr = now.toDateString()
    const todayEvents = eventsData.filter(ev => new Date(ev.startDate).toDateString() === todayStr)
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() + 7)
    const weekEvents = eventsData.filter(ev => {
      const d = new Date(ev.startDate)
      return d >= now && d <= weekEnd
    })
    return {
      total: eventsData.length,
      today: todayEvents.length,
      thisWeek: weekEvents.length,
      meetings: eventsData.filter(ev => ev.type === 'meeting').length,
    }
  }, [eventsData])

  // ── Handlers ──
  const prevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }, [])

  const nextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }, [])

  const goToday = useCallback(() => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }, [])

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDate(day.toISOString())
  }, [])

  const openCreateDialog = useCallback((prefillDate?: Date) => {
    const d = prefillDate ?? new Date()
    const dateStr = d.toISOString().slice(0, 16)
    const endDateStr = new Date(d.getTime() + 3600000).toISOString().slice(0, 16)
    setForm({
      ...emptyForm,
      startDate: dateStr,
      endDate: endDateStr,
    })
    setCreateOpen(true)
  }, [])

  const openEditDialog = useCallback((event: CalendarEvent) => {
    setForm({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay,
      color: event.color,
      location: event.location,
      type: event.type,
    })
    setEditEvent(event)
  }, [])

  const handleSave = useCallback(async (isEdit: boolean) => {
    if (!form.title.trim()) {
      toast.error('عنوان رویداد الزامی است')
      return
    }
    if (!form.startDate) {
      toast.error('تاریخ شروع الزامی است')
      return
    }
    if (!form.endDate) {
      toast.error('تاریخ پایان الزامی است')
      return
    }

    setIsSaving(true)
    try {
      if (isEdit && editEvent) {
        await updateEvent.mutateAsync({ id: editEvent.id, ...form })
        toast.success('رویداد با موفقیت بروزرسانی شد')
        setEditEvent(null)
      } else {
        await createEvent.mutateAsync(form)
        toast.success('رویداد با موفقیت ایجاد شد')
        setCreateOpen(false)
      }
      setForm(emptyForm)
    } catch {
      toast.error(isEdit ? 'خطا در بروزرسانی رویداد' : 'خطا در ایجاد رویداد')
    } finally {
      setIsSaving(false)
    }
  }, [form, editEvent, createEvent, updateEvent])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteEvent.mutateAsync(deleteTarget.id)
      toast.success('رویداد با موفقیت حذف شد')
      setDeleteTarget(null)
    } catch {
      toast.error('خطا در حذف رویداد')
    }
  }, [deleteTarget, deleteEvent])

  // ── Loading State ──
  if (events.isLoading) {
    return (
      <div className="p-6 space-y-6 page-enter" dir="rtl">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl loading-shimmer" />)}
        </div>
        <Skeleton className="h-96 rounded-xl loading-shimmer" />
      </div>
    )
  }

  // ── Render ──
  return (
    <div className="p-4 md:p-6 page-enter" dir="rtl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/25">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">تقویم و رویدادها</h1>
            <p className="text-sm text-muted-foreground">مدیریت رویدادها، جلسات و یادآوری‌ها</p>
          </div>
        </div>
        <Button
          onClick={() => openCreateDialog()}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          رویداد جدید
        </Button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'کل رویدادها', value: stats.total, icon: CalendarDays, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'رویداد امروز', value: stats.today, icon: Clock, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'این هفته', value: stats.thisWeek, icon: CalendarClock, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'جلسات', value: stats.meetings, icon: Users, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map((stat, i) => (
          <Card key={i} className={`glass-card hover-lift animate-in border-0 ${stat.bg}`} style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{persianDigits(stat.value)}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-md`}>
                  <stat.icon className="h-4.5 w-4.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Main Grid: Calendar + Events ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Calendar Grid ── */}
        <Card className="lg:col-span-1 glass-card card-elevated border-0 overflow-hidden">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <CardTitle className="text-sm font-bold">{toPersianDate(currentDate)}</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1.5"
                onClick={goToday}
              >
                <Clock className="h-3 w-3" />
                امروز
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {PERSIAN_WEEKDAYS.map(day => (
                <div key={day} className="text-center text-[11px] font-semibold text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>
            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                if (!day) {
                  return <div key={`empty-${i}`} className="h-12" />
                }

                const today = isToday(day)
                const isSelected = selectedDate && isSameDay(day.toISOString(), selectedDate)
                const dayEvents = eventsByDay[day.toDateString()] ?? []

                return (
                  <button
                    key={day.toISOString()}
                    className={`h-12 rounded-lg text-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer relative
                      ${today ? 'bg-indigo-100 dark:bg-indigo-900/30 font-bold text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-400/30' : ''}
                      ${isSelected ? 'bg-indigo-500 text-white shadow-md' : ''}
                      ${!today && !isSelected ? 'hover:bg-accent/60' : ''}
                    `}
                    onClick={() => handleDayClick(day)}
                  >
                    <span className={`text-xs leading-none ${isSelected ? 'text-white' : ''}`}>
                      {persianDigits(day.getDate())}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((ev, j) => (
                          <span
                            key={j}
                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : getColorClass(ev.color).bg}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Events List ── */}
        <Card className="lg:col-span-2 glass-card card-elevated border-0 overflow-hidden">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold">
                  {selectedDate
                    ? `رویدادهای ${new Date(selectedDate).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                    : 'رویدادهای پیش رو'
                  }
                </CardTitle>
                {selectedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 mt-1 gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedDate(null)}
                  >
                    نمایش همه رویدادهای پیش رو
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {TYPE_FILTERS.map(filter => (
                  <Button
                    key={filter.value}
                    variant={typeFilter === filter.value ? 'default' : 'outline'}
                    size="sm"
                    className={`text-[11px] h-7 px-2.5 transition-all ${
                      typeFilter === filter.value
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-sm'
                        : 'hover:bg-accent/60'
                    }`}
                    onClick={() => setTypeFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ScrollArea className="max-h-[480px]">
              {displayEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center mb-4 float-animation">
                    <CalendarDays className="h-8 w-8 text-indigo-400 dark:text-indigo-500" />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">رویدادی یافت نشد</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {selectedDate ? 'هیچ رویدادی برای این تاریخ ثبت نشده است' : 'رویداد پیش‌رویی وجود ندارد'}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5"
                    onClick={() => selectedDate ? openCreateDialog(new Date(selectedDate)) : openCreateDialog()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    ایجاد رویداد
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {displayEvents.map((event, i) => {
                    const colorClass = getColorClass(event.color)
                    const typeConf = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.event
                    const TypeIcon = typeConf.icon
                    const startDate = new Date(event.startDate)
                    const endDate = new Date(event.endDate)
                    const sameDay = isSameDay(event.startDate, event.endDate)

                    return (
                      <div
                        key={event.id}
                        className={`group relative rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 p-4 transition-all duration-200 hover:shadow-md hover-lift animate-in slide-in-from-bottom-1 cursor-pointer`}
                        style={{ animationDelay: `${i * 40}ms` }}
                        onClick={() => openEditDialog(event)}
                      >
                        {/* Colored left accent border */}
                        <div className={`absolute right-0 top-3 bottom-3 w-1 rounded-full ${colorClass.bg}`} />

                        <div className="flex items-start gap-3 pr-3">
                          {/* Color dot */}
                          <div className={`w-2.5 h-2.5 rounded-full ${colorClass.bg} mt-1.5 shrink-0`} />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h4 className="text-sm font-semibold truncate">{event.title}</h4>
                              <Badge
                                className={`text-[10px] px-1.5 py-0 h-5 bg-gradient-to-r ${typeConf.gradient} text-white border-0 shrink-0`}
                              >
                                <TypeIcon className="h-2.5 w-2.5 ml-0.5" />
                                {typeConf.label}
                              </Badge>
                            </div>

                            {event.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                                {event.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                              {/* Time */}
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {event.allDay
                                    ? 'تمام روز'
                                    : `${formatTime(event.startDate)} — ${sameDay ? formatTime(event.endDate) : `${formatDateShort(event.endDate)} ${formatTime(event.endDate)}`}`
                                  }
                                </span>
                              </div>

                              {/* Date */}
                              <div className="flex items-center gap-1">
                                <CalendarClock className="h-3 w-3" />
                                <span>{formatDateShort(event.startDate)}</span>
                              </div>

                              {/* Location */}
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate max-w-[150px]">{event.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                              onClick={e => { e.stopPropagation(); openEditDialog(event) }}
                            >
                              <Pencil className="h-3.5 w-3.5 text-indigo-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-rose-100 dark:hover:bg-rose-900/30"
                              onClick={e => { e.stopPropagation(); setDeleteTarget(event) }}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            {/* All events (when viewing upcoming, show count) */}
            {!selectedDate && upcomingEvents.length > 0 && allFilteredEvents.length > upcomingEvents.length && (
              <div className="mt-3 pt-3 border-t border-border/50 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground gap-1.5"
                  onClick={() => {
                    setSelectedDate(null)
                    setTypeFilter('all')
                  }}
                >
                  <CalendarDays className="h-3 w-3" />
                  مشاهده {persianDigits(allFilteredEvents.length)} رویداد ثبت‌شده
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Create Event Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[520px] glass-card" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <Plus className="h-5 w-5" />
              رویداد جدید
            </DialogTitle>
            <DialogDescription>یک رویداد، جلسه یا یادآوری جدید ایجاد کنید.</DialogDescription>
          </DialogHeader>

          <EventForm
            form={form}
            setForm={setForm}
            isSaving={isSaving}
            onSave={() => handleSave(false)}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit Event Dialog ── */}
      <Dialog open={!!editEvent} onOpenChange={(open) => { if (!open) setEditEvent(null) }}>
        <DialogContent className="sm:max-w-[520px] glass-card" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <Pencil className="h-5 w-5" />
              ویرایش رویداد
            </DialogTitle>
            <DialogDescription>جزئیات رویداد را ویرایش کنید.</DialogDescription>
          </DialogHeader>

          <EventForm
            form={form}
            setForm={setForm}
            isSaving={isSaving}
            onSave={() => handleSave(true)}
            onCancel={() => setEditEvent(null)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent dir="rtl" className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <Trash2 className="h-5 w-5" />
              حذف رویداد
            </AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف رویداد <span className="font-bold text-foreground">«{deleteTarget?.title}»</span> مطمئن هستید؟
              این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="hover:bg-accent/60">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Event Form Component ──────────────────────────────────────────────

interface EventFormProps {
  form: typeof emptyForm
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>
  isSaving: boolean
  onSave: () => void
  onCancel: () => void
}

function EventForm({ form, setForm, isSaving, onSave, onCancel }: EventFormProps) {
  return (
    <div className="space-y-4 py-2">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="event-title" className="text-xs font-medium">عنوان رویداد *</Label>
        <Input
          id="event-title"
          placeholder="عنوان رویداد..."
          value={form.title}
          onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
          className="bg-background/50"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="event-desc" className="text-xs font-medium">توضیحات</Label>
        <Textarea
          id="event-desc"
          placeholder="توضیحات رویداد..."
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          rows={2}
          className="bg-background/50 resize-none"
        />
      </div>

      {/* Date Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="event-start" className="text-xs font-medium">تاریخ و ساعت شروع *</Label>
          <Input
            id="event-start"
            type="datetime-local"
            value={form.startDate}
            onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
            className="bg-background/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-end" className="text-xs font-medium">تاریخ و ساعت پایان *</Label>
          <Input
            id="event-end"
            type="datetime-local"
            value={form.endDate}
            onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
            className="bg-background/50"
          />
        </div>
      </div>

      {/* All Day Toggle + Type + Location Row */}
      <div className="flex items-end gap-3">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="event-location" className="text-xs font-medium">مکان</Label>
          <Input
            id="event-location"
            placeholder="مکان رویداد..."
            value={form.location}
            onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
            className="bg-background/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">نوع</Label>
          <Select
            value={form.type}
            onValueChange={v => setForm(prev => ({ ...prev, type: v as CalendarEvent['type'] }))}
          >
            <SelectTrigger className="w-[120px] bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="event">رویداد</SelectItem>
              <SelectItem value="meeting">جلسه</SelectItem>
              <SelectItem value="deadline">موعد</SelectItem>
              <SelectItem value="reminder">یادآوری</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* All Day Toggle */}
      <div className="flex items-center justify-between rounded-lg bg-background/50 border border-border/50 p-3">
        <Label htmlFor="event-allday" className="text-xs font-medium cursor-pointer">
          <CalendarDays className="h-3.5 w-3.5 inline-block ml-1.5" />
          تمام روز
        </Label>
        <Switch
          id="event-allday"
          checked={form.allDay}
          onCheckedChange={v => setForm(prev => ({ ...prev, allDay: v }))}
        />
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">رنگ</Label>
        <div className="flex items-center gap-2 flex-wrap">
          {COLOR_PRESETS.map(color => (
            <button
              key={color.value}
              type="button"
              className={`w-8 h-8 rounded-full ${color.bg} transition-all duration-150 cursor-pointer hover:scale-110 ${
                form.color === color.value ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : ''
              }`}
              title={color.name}
              onClick={() => setForm(prev => ({ ...prev, color: color.value }))}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <DialogFooter className="gap-2 sm:gap-0 pt-2">
        <Button variant="outline" onClick={onCancel} className="hover:bg-accent/60">
          انصراف
        </Button>
        <Button
          onClick={onSave}
          disabled={isSaving || !form.title.trim() || !form.startDate || !form.endDate}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-sm hover:shadow-md"
        >
          {isSaving ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          ذخیره رویداد
        </Button>
      </DialogFooter>
    </div>
  )
}
