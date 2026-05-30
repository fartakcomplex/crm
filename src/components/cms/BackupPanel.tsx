'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Database, HardDrive, Download, Upload, Trash2, RefreshCw,
  Loader2, CheckCircle, AlertTriangle, Clock, Calendar,
  Shield, Zap, CalendarDays, Play, Info, FileUp, Search,
  Heart, Activity, RotateCcw, XCircle, CheckCircle2, FolderOpen,
  FileCheck, ArrowDownToLine, ArchiveRestore,
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

interface BackupDetail extends BackupRecord {
  fileExists: boolean
  currentDbSize: number
  sizeDifference: number
  ageHours: number
  isHealthy: boolean
}

interface SystemHealth {
  dbExists: boolean
  dbSize: number
  dbWritable: boolean
  dbReadable: boolean
  backupDirExists: boolean
  backupDirWritable: boolean
  totalBackupCount: number
  lastBackupDate: string | null
  estimatedDiskUsage: number
  isHealthy: boolean
  issues: string[]
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
    weekly: { label: 'هفتگی (فول)', color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-100 dark:bg-violet-900/30' },
    manual: { label: 'دستی', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  }
  return map[type] || map.manual
}

function statusIcon(status: string) {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-emerald-500" />
    case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
    case 'restoring': return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
    default: return <CheckCircle className="h-4 w-4 text-muted-foreground" />
  }
}

function typeGradient(type: string) {
  const map: Record<string, string> = {
    daily: 'from-cyan-500 to-teal-500',
    weekly: 'from-violet-500 to-purple-500',
    manual: 'from-emerald-500 to-teal-500',
  }
  return map[type] || 'from-emerald-500 to-teal-500'
}

// ─── Gradient Accent Bar ──────────────────────────────────────────────────────
function GradientAccent({ colors }: { colors: string }) {
  return <div className={`h-1 w-full rounded-full bg-gradient-to-l ${colors} mb-3 opacity-60`} />
}

// ─── Main BackupPanel Component ──────────────────────────────────────────────
export default function BackupPanel() {
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [stats, setStats] = useState<BackupStats | null>(null)
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [autoChecking, setAutoChecking] = useState(false)
  const [backupNote, setBackupNote] = useState('')
  const [progress, setProgress] = useState(0)

  // Restore dialog state
  const [selectedRestore, setSelectedRestore] = useState<BackupRecord | null>(null)
  const [restoreDetail, setRestoreDetail] = useState<BackupDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)

  // Upload state
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/backups/health')
      const data = await res.json()
      setHealth(data)
    } catch {
      // Ignore health check errors
    }
  }, [])

  useEffect(() => { fetchBackups(); fetchHealth() }, [fetchBackups, fetchHealth])

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
        fetchHealth()
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

  const handleOpenRestoreDialog = async (backup: BackupRecord) => {
    setSelectedRestore(backup)
    setRestoreDialogOpen(true)
    setLoadingDetail(true)
    setRestoreDetail(null)

    try {
      const res = await fetch(`/api/backups/${backup.id}?detail=true`)
      if (res.ok) {
        const data = await res.json()
        setRestoreDetail(data)
      }
    } catch {
      // Detail fetch failed, show basic info
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedRestore) return
    setRestoring(selectedRestore.id)
    try {
      const res = await fetch(`/api/backups/${selectedRestore.id}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success('بازیابی با موفقیت انجام شد. صفحه را رفرش کنید.')
        setRestoreDialogOpen(false)
        fetchBackups()
        fetchHealth()
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
        fetchHealth()
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

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite') && !file.name.endsWith('.sqlite3')) {
      toast.error('فرمت فایل باید .db یا .sqlite باشد')
      e.target.value = ''
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      toast.error('حجم فایل بیش از حد مجاز (۵۰۰ مگابایت) است')
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/backups', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('بازیابی از فایل آپلودی با موفقیت انجام شد')
        fetchBackups()
        fetchHealth()
      } else {
        toast.error(data.error || 'خطا در آپلود فایل بکاپ')
      }
    } catch {
      toast.error('خطا در آپلود فایل بکاپ')
    } finally {
      setUploading(false)
      e.target.value = ''
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
            <div className="min-w-0">
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
            <div className="min-w-0">
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
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">حجم بکاپ‌ها</p>
              <p className="text-sm font-bold">{formatSize(stats?.totalSize || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`glass-card hover-lift shadow-sm transition-all duration-300 ${health?.isHealthy ? '' : 'border-amber-300 dark:border-amber-700'}`}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              health?.isHealthy
                ? 'bg-gradient-to-br from-emerald-500 to-green-500'
                : 'bg-gradient-to-br from-amber-500 to-orange-500'
            }`}>
              <Heart className={`h-5 w-5 text-white ${health?.isHealthy ? '' : 'animate-pulse'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">سلامت سیستم</p>
              <p className={`text-sm font-bold ${health?.isHealthy ? 'text-emerald-600' : 'text-amber-600'}`}>
                {health?.isHealthy ? 'سالم' : `${health?.issues.length || 0} مشکل`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── System Health Issues ── */}
      {health && !health.isHealthy && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              هشدارهای سیستم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {health.issues.map((issue, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Main Tabs ── */}
      <Tabs defaultValue="backup" className="space-y-4">
        <TabsList className="bg-gradient-to-r from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 h-11 shadow-sm">
          <TabsTrigger value="backup" className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200">
            <Upload className="h-4 w-4" />
            بکاپ‌گیری
          </TabsTrigger>
          <TabsTrigger value="restore" className="gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all duration-200">
            <RotateCcw className="h-4 w-4" />
            بازیابی و ریستور
          </TabsTrigger>
          <TabsTrigger value="auto" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-200">
            <Zap className="h-4 w-4" />
            زمان‌بندی خودکار
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════ Backup Tab ═══════════════ */}
        <TabsContent value="backup" className="animate-in space-y-4">
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
                <label className="text-xs text-muted-foreground">توضیحات بکاپ (اختیاری)</label>
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
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleCreateBackup('manual')}
                  disabled={creating}
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm cursor-pointer"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  بکاپ دستی
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
                  <Badge variant="outline" className="text-[10px]">{backups.length} مورد</Badge>
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
                  {backups.map((backup) => {
                    const tl = typeLabel(backup.type)
                    return (
                      <div
                        key={backup.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50 hover:border-border hover:shadow-sm transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${typeGradient(backup.type)} flex items-center justify-center shrink-0`}>
                            {backup.type === 'daily' && <CalendarDays className="h-4 w-4 text-white" />}
                            {backup.type === 'weekly' && <ArchiveRestore className="h-4 w-4 text-white" />}
                            {backup.type === 'manual' && <Database className="h-4 w-4 text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium truncate">
                                {backup.filename.replace(/backup_/g, '').replace(/\.db$/, '').replace(/uploaded_/g, 'آپلودی: ').replace(/pre_restore_/g, 'ایمنی: ')}
                              </span>
                              <Badge variant="outline" className={`text-[10px] ${tl.color} ${tl.bg} border-0`}>
                                {tl.label}
                              </Badge>
                              {backup.status === 'failed' && (
                                <Badge variant="destructive" className="text-[10px]">ناموفق</Badge>
                              )}
                              {backup.status === 'restoring' && (
                                <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0">در حال بازیابی</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {relativeTime(backup.createdAt)}
                              </span>
                              <span>{formatSize(backup.sizeBytes)}</span>
                              {backup.note && (
                                <span className="text-muted-foreground truncate max-w-[180px]">
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
                          {backup.status === 'completed' && (
                            <button
                              onClick={() => handleOpenRestoreDialog(backup)}
                              className="p-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                              title="بازیابی"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
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
        </TabsContent>

        {/* ═══════════════ Restore Tab ═══════════════ */}
        <TabsContent value="restore" className="animate-in space-y-4">
          {/* ── Restore from Backup File ── */}
          <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
            <CardHeader className="pb-3">
              <GradientAccent colors="from-amber-400 to-orange-500" />
              <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <FileUp className="h-5 w-5" />
                بازیابی از فایل بکاپ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                یک فایل بکاپ (.db یا .sqlite) را انتخاب کنید تا دیتابیس فعلی با آن جایگزین شود.
                قبل از بازیابی، یک بکاپ ایمنی خودکار از وضعیت فعلی ذخیره می‌شود.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".db,.sqlite,.sqlite3"
                  onChange={handleUploadFile}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gap-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm cursor-pointer"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
                  {uploading ? 'در حال آپلود و بازیابی...' : 'انتخاب و بازیابی فایل'}
                </Button>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>لطفاً صبر کنید...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Restore from Available Backups ── */}
          <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
            <CardHeader className="pb-3">
              <GradientAccent colors="from-teal-400 to-cyan-500" />
              <CardTitle className="text-base flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <ArchiveRestore className="h-5 w-5" />
                بازیابی از بکاپ‌های موجود
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                یکی از بکاپ‌های موجود را انتخاب کنید. قبل از بازیابی، یک بکاپ ایمنی خودکار ذخیره می‌شود.
              </p>
              {backups.filter(b => b.status === 'completed').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">بکاپ قابل بازیابی وجود ندارد</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {backups
                    .filter(b => b.status === 'completed')
                    .map((backup) => {
                      const tl = typeLabel(backup.type)
                      return (
                        <div
                          key={backup.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition-all duration-200 group cursor-pointer"
                          onClick={() => handleOpenRestoreDialog(backup)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${typeGradient(backup.type)} flex items-center justify-center shrink-0`}>
                              <RotateCcw className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium truncate">
                                  {backup.filename.replace(/backup_/g, '').replace(/\.db$/, '').replace(/uploaded_/g, 'آپلودی: ').replace(/pre_restore_/g, 'ایمنی: ')}
                                </span>
                                <Badge variant="outline" className={`text-[10px] ${tl.color} ${tl.bg} border-0`}>
                                  {tl.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                                <span>{persianDate(backup.createdAt)}</span>
                                <span>{formatSize(backup.sizeBytes)}</span>
                                {backup.note && (
                                  <span className="text-muted-foreground truncate max-w-[180px]">
                                    — {backup.note}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer shrink-0"
                            onClick={(e) => { e.stopPropagation(); handleOpenRestoreDialog(backup) }}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            بازیابی
                          </Button>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Restore Safety Info ── */}
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1.5">
                <p><strong className="text-foreground">ایمنی بازیابی:</strong> قبل از هر عملیات بازیابی، یک نسخه پشتیبان ایمنی از وضعیت فعلی دیتابیس ذخیره می‌شود.</p>
                <p><strong className="text-foreground">بررسی یکپارچگی:</strong> فایل‌های بکاپ قبل از بازیابی از نظر صحت فرمت SQLite بررسی می‌شوند.</p>
                <p><strong className="text-foreground">بازگشت:</strong> در صورت بروز مشکل، می‌توانید از بکاپ ایمنی (با عبارت &quot;ایمنی&quot; در نام) برای بازگشت استفاده کنید.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════ Auto Schedule Tab ═══════════════ */}
        <TabsContent value="auto" className="animate-in space-y-4">
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                      <CalendarDays className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-sm font-medium">بکاپ روزانه</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    هر ۲۴ ساعت یک بکاپ کامل از دیتابیس ایجاد می‌شود
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      تعداد: {stats?.dailyCount || 0} / ۳۰
                    </span>
                    <Badge variant="outline" className="text-[10px] text-cyan-600 border-cyan-300 dark:border-cyan-700">
                      فعال
                    </Badge>
                  </div>
                  {stats?.lastDailyBackup && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <p className="text-[10px] text-muted-foreground">
                        آخرین بکاپ: {persianDate(stats.lastDailyBackup)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-violet-100/50 dark:border-violet-800/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <ArchiveRestore className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-sm font-medium">بکاپ هفتگی (فول)</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    هر ۷ روز یک بکاپ کامل با نگهداری بیشتر ذخیره می‌شود
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      تعداد: {stats?.weeklyCount || 0} / ۱۲
                    </span>
                    <Badge variant="outline" className="text-[10px] text-violet-600 border-violet-300 dark:border-violet-700">
                      فعال
                    </Badge>
                  </div>
                  {stats?.lastWeeklyBackup && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <p className="text-[10px] text-muted-foreground">
                        آخرین بکاپ: {persianDate(stats.lastWeeklyBackup)}
                      </p>
                    </div>
                  )}
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
                  بررسی و اجرای بکاپ خودکار
                </Button>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  <span>در صورت نیاز، بکاپ روزانه/هفتگی ایجاد می‌شود</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Backup Schedule Summary ── */}
          <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
            <CardHeader className="pb-3">
              <GradientAccent colors="from-teal-400 to-emerald-500" />
              <CardTitle className="text-base flex items-center gap-2 text-teal-700 dark:text-teal-300">
                <Activity className="h-5 w-5" />
                خلاصه برنامه بکاپ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-background/50 border border-border/30 text-center">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mx-auto mb-2">
                    <CalendarDays className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <p className="text-sm font-bold">{stats?.dailyCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground">بکاپ روزانه</p>
                  <p className="text-[10px] text-muted-foreground">حداکثر ۳۰</p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/30 text-center">
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-2">
                    <ArchiveRestore className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <p className="text-sm font-bold">{stats?.weeklyCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground">بکاپ هفتگی</p>
                  <p className="text-[10px] text-muted-foreground">حداکثر ۱۲</p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/30 text-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                    <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold">{stats?.manualCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground">بکاپ دستی</p>
                  <p className="text-[10px] text-muted-foreground">حداکثر ۵۰</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Restore Detail Dialog ── */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="sm:max-w-[520px] glass-card" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <RotateCcw className="h-5 w-5" />
              بازیابی از بکاپ
            </DialogTitle>
            <DialogDescription>
              جزئیات بکاپ انتخابی را بررسی کنید و تایید کنید.
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              <span className="mr-2 text-sm text-muted-foreground">در حال بارگذاری جزئیات...</span>
            </div>
          ) : selectedRestore ? (
            <div className="space-y-4">
              {/* Backup Info */}
              <div className="p-4 rounded-xl bg-background/50 border border-border/50 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeGradient(selectedRestore.type)} flex items-center justify-center`}>
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{selectedRestore.filename}</p>
                    <Badge variant="outline" className={`text-[10px] ${typeLabel(selectedRestore.type).color} ${typeLabel(selectedRestore.type).bg} border-0 mt-1`}>
                      {typeLabel(selectedRestore.type).label}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">تاریخ ایجاد:</span>
                    <span className="font-medium">{persianDate(selectedRestore.createdAt)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">حجم فایل:</span>
                    <span className="font-medium">{formatSize(selectedRestore.sizeBytes)}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">وضعیت فایل:</span>
                    <span className={`font-medium ${restoreDetail?.isHealthy ? 'text-emerald-600' : 'text-red-600'}`}>
                      {restoreDetail?.fileExists ? (restoreDetail?.isHealthy ? 'سالم ✓' : 'آسیب‌دیده ✗') : 'وجود ندارد ✗'}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-muted/30">
                    <span className="text-muted-foreground">سنی بکاپ:</span>
                    <span className="font-medium">
                      {restoreDetail?.ageHours !== undefined
                        ? restoreDetail.ageHours < 1
                          ? `${Math.floor(restoreDetail.ageHours * 60)} دقیقه`
                          : restoreDetail.ageHours < 24
                            ? `${Math.floor(restoreDetail.ageHours)} ساعت`
                            : `${Math.floor(restoreDetail.ageHours / 24)} روز`
                        : relativeTime(selectedRestore.createdAt)}
                    </span>
                  </div>
                </div>

                {restoreDetail && restoreDetail.sizeDifference !== 0 && (
                  <div className={`text-xs p-2 rounded-lg ${restoreDetail.sizeDifference > 0 ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400'}`}>
                    {restoreDetail.sizeDifference > 0
                      ? `⚠ این بکاپ ${formatSize(Math.abs(restoreDetail.sizeDifference))} بزرگ‌تر از دیتابیس فعلی است`
                      : `✓ این بکاپ ${formatSize(Math.abs(restoreDetail.sizeDifference))} کوچک‌تر از دیتابیس فعلی است`
                    }
                  </div>
                )}

                {selectedRestore.note && (
                  <div className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/30">
                    <span className="font-medium">توضیحات:</span> {selectedRestore.note}
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-red-700 dark:text-red-400 space-y-1">
                    <p className="font-medium">توجه: بازیابی دیتابیس فعلی را جایگزین می‌کند!</p>
                    <p>قبل از بازیابی، یک بکاپ ایمنی خودکار از وضعیت فعلی ذخیره خواهد شد.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0 flex-row-reverse">
            <Button
              onClick={handleRestore}
              disabled={restoring || loadingDetail || !restoreDetail?.isHealthy}
              className="gap-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white shadow-sm cursor-pointer"
            >
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال بازیابی...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  تایید بازیابی
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
              className="hover:bg-accent/60 cursor-pointer"
            >
              انصراف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
