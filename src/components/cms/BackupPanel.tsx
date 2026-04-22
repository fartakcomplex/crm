'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Database, HardDrive, Download, Upload, Trash2, RefreshCw,
  Loader2, CheckCircle, AlertTriangle, Clock, Calendar,
  Shield, Zap, CalendarDays, Play, Info,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────
interface BackupRecord {
  id: string
  filename: string
  sizeBytes: number
  type: string
  status: string
  note: string
  createdAt: string
}

interface BackupStats {
  totalBackups: number
  totalSize: number
  dailyCount: number
  weeklyCount: number
  manualCount: number
  lastDailyBackup: string | null
  lastWeeklyBackup: string | null
  dbSize: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'همین الان'
  if (diffMin < 60) return `${diffMin} دقیقه پیش`
  if (diffHour < 24) return `${diffHour} ساعت پیش`
  if (diffDay < 7) return `${diffDay} روز پیش`
  return new Intl.DateTimeFormat('fa-IR').format(date)
}

function persianDate(dateStr: string): string {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr))
}

function typeLabel(type: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    daily: { label: 'روزانه', color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    weekly: { label: 'هفتگی', color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-100 dark:bg-violet-900/30' },
    manual: { label: 'دستی', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  }
  return map[type] || map.manual
}

function statusIcon(status: string) {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-emerald-500" />
    case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />
    case 'restoring': return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
    default: return <CheckCircle className="h-4 w-4 text-muted-foreground" />
  }
}

// ─── Gradient Accent Bar ──────────────────────────────────────────────────────
function GradientAccent({ colors }: { colors: string }) {
  return <div className={`h-1 w-full rounded-full bg-gradient-to-l ${colors} mb-3 opacity-60`} />
}

// ─── Main BackupPanel Component ──────────────────────────────────────────────
export default function BackupPanel() {
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [autoChecking, setAutoChecking] = useState(false)
  const [backupNote, setBackupNote] = useState('')
  const [progress, setProgress] = useState(0)

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch('/api/backups')
      const data = await res.json()
      setBackups(data.backups || [])
      setStats(data.stats || null)
    } catch {
      toast.error('خطا در دریافت اطلاعات بکاپ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBackups() }, [fetchBackups])

  // Simulate progress animation
  const animateProgress = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return 90 }
        return prev + Math.random() * 15
      })
    }, 200)
    return () => clearInterval(interval)
  }

  const handleCreateBackup = async (type: 'manual' | 'daily' | 'weekly') => {
    setCreating(true)
    const cleanup = animateProgress()
    try {
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, note: backupNote || undefined }),
      })
      const data = await res.json()
      cleanup()
      setProgress(100)
      if (res.ok) {
        toast.success('بکاپ با موفقیت ایجاد شد')
        setBackupNote('')
        fetchBackups()
      } else {
        toast.error(data.error || 'خطا در ایجاد بکاپ')
      }
    } catch {
      cleanup()
      toast.error('خطا در ایجاد بکاپ')
    } finally {
      setTimeout(() => { setCreating(false); setProgress(0) }, 500)
    }
  }

  const handleRestore = async (id: string) => {
    setRestoring(id)
    try {
      const res = await fetch(`/api/backups/${id}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('بازیابی با موفقیت انجام شد. صفحه را رفرش کنید.')
      } else {
        toast.error(data.error || 'خطا در بازیابی')
      }
    } catch {
      toast.error('خطا در بازیابی بکاپ')
    } finally {
      setRestoring(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/backups/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success('بکاپ حذف شد')
        fetchBackups()
      } else {
        toast.error(data.error || 'خطا در حذف بکاپ')
      }
    } catch {
      toast.error('خطا در حذف بکاپ')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownload = (id: string, filename: string) => {
    window.open(`/api/backups/${id}`, '_blank')
    toast.info(`دانلود ${filename} شروع شد`)
  }

  const handleAutoCheck = async () => {
    setAutoChecking(true)
    try {
      const res = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoCheck: true }),
      })
      const data = await res.json()
      toast.success(data.message || 'بررسی انجام شد')
      fetchBackups()
    } catch {
      toast.error('خطا در بررسی خودکار')
    } finally {
      setAutoChecking(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">اندازه دیتابیس</p>
              <p className="text-sm font-bold">{formatSize(stats?.dbSize || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
              <HardDrive className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">تعداد بکاپ</p>
              <p className="text-sm font-bold">{stats?.totalBackups || 0} فایل</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">حجم بکاپ‌ها</p>
              <p className="text-sm font-bold">{formatSize(stats?.totalSize || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">آخرین بکاپ روزانه</p>
              <p className="text-sm font-bold truncate max-w-[100px]">
                {stats?.lastDailyBackup ? relativeTime(stats.lastDailyBackup) : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Auto Backup Schedule ── */}
      <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
        <CardHeader className="pb-3">
          <GradientAccent colors="from-violet-400 to-purple-500" />
          <CardTitle className="text-base flex items-center gap-2 text-violet-700 dark:text-violet-300">
            <Zap className="h-5 w-5" />
            بکاپ خودکار
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-background/50 border border-cyan-100/50 dark:border-cyan-800/20">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-cyan-500" />
                <p className="text-sm font-medium">بکاپ روزانه خودکار</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                هر ۲۴ ساعت یک بکاپ کامل از دیتابیس ایجاد می‌شود
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  تعداد: {stats?.dailyCount || 0} (حداکثر ۳۰)
                </span>
                <Badge variant="outline" className="text-[10px] text-cyan-600 border-cyan-300 dark:border-cyan-700">
                  فعال
                </Badge>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-background/50 border border-violet-100/50 dark:border-violet-800/20">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-4 w-4 text-violet-500" />
                <p className="text-sm font-medium">بکاپ هفتگی (فول)</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                هر هفته یک بکاپ کامل با نگهداری بیشتر ذخیره می‌شود
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  تعداد: {stats?.weeklyCount || 0} (حداکثر ۱۲)
                </span>
                <Badge variant="outline" className="text-[10px] text-violet-600 border-violet-300 dark:border-violet-700">
                  فعال
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAutoCheck}
              disabled={autoChecking}
              variant="outline"
              className="gap-2 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/20 cursor-pointer"
            >
              {autoChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              بررسی و ایجاد بکاپ خودکار
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              <span>در صورت نیاز، بکاپ روزانه/هفتگی ایجاد می‌شود</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Create Manual Backup ── */}
      <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
        <CardHeader className="pb-3">
          <GradientAccent colors="from-emerald-400 to-teal-500" />
          <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
            <Upload className="h-5 w-5" />
            ایجاد بکاپ جدید
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">توضیحات بکاپ (اختیاری)</p>
            <Input
              value={backupNote}
              onChange={e => setBackupNote(e.target.value)}
              placeholder="مثلاً: بکاپ قبل از آپدیت"
              className="max-w-md"
            />
          </div>
          {creating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                <span>در حال ایجاد بکاپ...</span>
                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={() => handleCreateBackup('manual')}
              disabled={creating}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm cursor-pointer"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              ایجاد بکاپ دستی
            </Button>
            <Button
              onClick={() => handleCreateBackup('daily')}
              disabled={creating}
              variant="outline"
              className="gap-2 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 cursor-pointer"
            >
              <CalendarDays className="h-4 w-4" />
              بکاپ روزانه
            </Button>
            <Button
              onClick={() => handleCreateBackup('weekly')}
              disabled={creating}
              variant="outline"
              className="gap-2 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/20 cursor-pointer"
            >
              <Calendar className="h-4 w-4" />
              بکاپ هفتگی (فول)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Backup List ── */}
      <Card className="glass-card shadow-sm transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <CardTitle className="text-base">تاریخچه بکاپ‌ها</CardTitle>
            </div>
            <Button
              onClick={fetchBackups}
              variant="ghost"
              size="sm"
              className="gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              بروزرسانی
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">هنوز بکاپی ایجاد نشده است</p>
              <p className="text-xs mt-1">اولین بکاپ خود را ایجاد کنید</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar">
              {backups.map((backup, index) => {
                const tl = typeLabel(backup.type)
                return (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {statusIcon(backup.status)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {backup.filename.replace(/backup_/g, '').replace(/\.db$/, '')}
                          </span>
                          <Badge variant="outline" className={`text-[10px] ${tl.color} ${tl.bg} border-0`}>
                            {tl.label}
                          </Badge>
                          {backup.status === 'failed' && (
                            <Badge variant="destructive" className="text-[10px]">ناموفق</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {relativeTime(backup.createdAt)}
                          </span>
                          <span>{formatSize(backup.sizeBytes)}</span>
                          {backup.note && (
                            <span className="text-muted-foreground truncate max-w-[200px]">
                              — {backup.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                      <button
                        onClick={() => handleDownload(backup.id, backup.filename)}
                        className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                        title="دانلود"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                            title="بازیابی"
                          >
                            {restoring === backup.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Upload className="h-4 w-4" />
                            }
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>بازیابی از بکاپ</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا مطمئن هستید که می‌خواهید دیتابیس را از این بکاپ بازیابی کنید؟
                              <br />
                              <span className="font-medium text-amber-600 dark:text-amber-400">
                                قبل از بازیابی، یک بکاپ ایمنی خودکار ایجاد می‌شود.
                              </span>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogAction
                              onClick={() => handleRestore(backup.id)}
                              className="bg-amber-600 hover:bg-amber-700 cursor-pointer"
                            >
                              بازیابی کن
                            </AlertDialogAction>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors cursor-pointer"
                            title="حذف"
                          >
                            {deleting === backup.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />
                            }
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف بکاپ</AlertDialogTitle>
                            <AlertDialogDescription>
                              آیا مطمئن هستید که می‌خواهید این بکاپ را حذف کنید؟ این عمل قابل بازگشت نیست.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse gap-2">
                            <AlertDialogAction
                              onClick={() => handleDelete(backup.id)}
                              className="bg-red-600 hover:bg-red-700 cursor-pointer"
                            >
                              حذف کن
                            </AlertDialogAction>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Info Box ── */}
      <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1.5">
            <p><strong className="text-foreground">بکاپ روزانه:</strong> هر ۲۴ ساعت به صورت خودکار اجرا می‌شود (حداکثر ۳۰ نسخه)</p>
            <p><strong className="text-foreground">بکاپ هفتگی:</strong> هر ۷ روز یک فول بکاپ ایجاد می‌شود (حداکثر ۱۲ نسخه)</p>
            <p><strong className="text-foreground">بکاپ دستی:</strong> در هر زمانی قابل ایجاد است (حداکثر ۵۰ نسخه)</p>
            <p><strong className="text-foreground">بازیابی:</strong> قبل از هر بازیابی یک بکاپ ایمنی خودکار ذخیره می‌شود</p>
          </div>
        </div>
      </div>
    </div>
  )
}
