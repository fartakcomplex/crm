'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Globe, Link2, Key, User, RefreshCw, CheckCircle, XCircle,
  Clock, FileText, Settings, Loader2, Wifi, WifiOff, Zap,
  AlertTriangle, History, Check, X,
} from 'lucide-react'
import { formatDateTime, formatRelativeTime } from './types'
import { toast } from 'sonner'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'همگام‌سازی وردپرس',
  subtitle: 'اتصال و همگام‌سازی با سایت وردپرس',
  connectionStatus: 'وضعیت اتصال',
  connected: 'متصل',
  disconnected: 'قطع اتصال',
  configuration: 'پیکربندی',
  siteUrl: 'آدرس سایت',
  siteUrlPlaceholder: 'https://example.com',
  apiKey: 'کلید API',
  apiKeyPlaceholder: 'کلید REST API وردپرس را وارد کنید',
  username: 'نام کاربری',
  usernamePlaceholder: 'نام کاربری وردپرس',
  save: 'ذخیره تنظیمات',
  saved: 'تنظیمات با موفقیت ذخیره شد!',
  sync: 'شروع همگام‌سازی',
  syncing: 'در حال همگام‌سازی...',
  syncSuccess: 'همگام‌سازی با موفقیت انجام شد!',
  syncError: 'خطا در همگام‌سازی',
  syncedPosts: 'مطالب همگام‌شده',
  lastSync: 'آخرین همگام‌سازی',
  noSyncedPosts: 'هنوز مطبی همگام نشده است',
  frequency: 'فرکانس همگام‌سازی',
  freqLabels: { manual: 'دستی', hourly: 'ساعتی', daily: 'روزانه', weekly: 'هفتگی' },
  postTitle: 'عنوان مطلب',
  syncHistory: 'تاریخچه همگام‌سازی',
  syncErrors: 'خطاهای همگام‌سازی',
}

// ─── Mock Sync History Data ───────────────────────────────────────────────────

const MOCK_SYNC_HISTORY = [
  { id: '1', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'success' as const, description: 'همگام‌سازی ۱۲ مطلب با موفقیت انجام شد' },
  { id: '2', date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), type: 'error' as const, description: 'خطا در دریافت دسته‌بندی‌ها: timeout' },
  { id: '3', date: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), type: 'success' as const, description: 'همگام‌سازی ۸ مطلب و ۳ تصویر جدید' },
  { id: '4', date: new Date(Date.now() - 74 * 60 * 60 * 1000).toISOString(), type: 'success' as const, description: 'همگام‌سازی اولیه با ۲۵ مطلب' },
  { id: '5', date: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(), type: 'error' as const, description: 'خطا در احراز هویت: کلید API نامعتبر' },
  { id: '6', date: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(), type: 'success' as const, description: 'همگام‌سازی ۵ مطلب منتشر شده' },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WordPressPage() {
  useEnsureData(['wp-config'])
  const { wpConfig, saveWPConfig, syncWP, posts } = useCMS()
  const configData = wpConfig.data ?? []

  const existingConfig = configData.length > 0 ? configData[0] : null
  const isConnected = existingConfig?.active ?? false

  const [siteUrl, setSiteUrl] = useState(existingConfig?.siteUrl ?? '')
  const [apiKey, setApiKey] = useState(existingConfig?.apiKey ?? '')
  const [username, setUsername] = useState(existingConfig?.username ?? '')
  const [syncFreq, setSyncFreq] = useState(existingConfig?.syncFreq ?? 'manual')
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)

  const handleSave = () => {
    saveWPConfig.mutate({ id: existingConfig?.id, siteUrl, apiKey, username, syncFreq, active: true })
    toast.success(labels.saved)
  }

  const handleSync = async () => {
    if (!existingConfig?.id) { toast.error('ابتدا تنظیمات را ذخیره کنید.'); return }
    setSyncing(true)
    setSyncProgress(0)
    // Simulate progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) { clearInterval(interval); return prev }
        return prev + Math.random() * 15
      })
    }, 300)
    try {
      await syncWP.mutateAsync(existingConfig.id)
      clearInterval(interval)
      setSyncProgress(100)
      toast.success(labels.syncSuccess)
    } catch {
      clearInterval(interval)
      toast.error(labels.syncError)
    } finally {
      setTimeout(() => { setSyncing(false); setSyncProgress(0) }, 1000)
    }
  }

  const syncedPosts = useMemo(() => {
    return (posts.data ?? []).slice(0, 10)
  }, [posts.data])

  const statusLabels: Record<string, string> = { published: 'منتشر شده', draft: 'پیش‌نویس', archived: 'بایگانی' }

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <Button onClick={handleSync} disabled={syncing || !isConnected} className="gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncing ? labels.syncing : labels.sync}
        </Button>
      </div>

      {/* ───── Connection Status Hero Card ───── */}
      <Card className={`relative overflow-hidden shadow-sm border-0 animate-in transition-all duration-500 ${isConnected ? 'hover-lift' : ''}`}>
        {/* Gradient Background */}
        <div className={`absolute inset-0 ${
          isConnected
            ? 'bg-gradient-to-l from-emerald-600/20 via-emerald-500/10 to-teal-500/5 dark:from-emerald-600/30 dark:via-emerald-500/15 dark:to-teal-500/10'
            : 'bg-gradient-to-l from-red-600/20 via-red-500/10 to-rose-500/5 dark:from-red-600/30 dark:via-red-500/15 dark:to-rose-500/10'
        }`} />
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Icon + Status */}
            <div className="flex items-center gap-4">
              <div className={`relative h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg ${
                isConnected
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30'
                  : 'bg-gradient-to-br from-red-400 to-red-600 shadow-red-500/30'
              }`}>
                <Globe className="h-7 w-7 text-white" />
                {/* Animated pulse ring */}
                <span className={`absolute inset-0 rounded-2xl ${
                  isConnected ? 'animate-ping bg-emerald-400/20' : ''
                }`} />
              </div>
              <div>
                <h2 className="text-lg font-bold">{labels.connectionStatus}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isConnected
                    ? <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                        {labels.connected}
                      </span>
                    : <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                        {labels.disconnected}
                      </span>
                  }
                </p>
              </div>
            </div>
            {/* Right: Badge + URL + Last Sync */}
            <div className="flex flex-col items-end gap-2">
              <Badge className={`text-sm px-3 py-1 border-0 shadow-sm ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {isConnected
                  ? <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />{labels.connected}</span>
                  : <span className="flex items-center gap-1.5"><X className="h-3.5 w-3.5" />{labels.disconnected}</span>
                }
              </Badge>
              {siteUrl && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5" dir="ltr">
                  <Link2 className="h-3 w-3" />
                  {siteUrl}
                </span>
              )}
              {existingConfig?.lastSync && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(existingConfig.lastSync)}
                </span>
              )}
            </div>
          </div>
          {/* Sync progress bar */}
          {syncing && (
            <div className="mt-4 animate-in">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">در حال همگام‌سازی...</span>
                <span className="font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">{Math.round(syncProgress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${syncProgress}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ───── Sync Stats Cards ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* مطالب همگام‌سازی شده */}
        <Card className="glass-card hover-lift shine-effect shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{labels.syncedPosts}</p>
              <p className="text-2xl font-bold tabular-nums text-cyan-600 dark:text-cyan-400">{syncedPosts.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* خطاهای همگام‌سازی */}
        <Card className="glass-card hover-lift shine-effect shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{labels.syncErrors}</p>
              <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                {MOCK_SYNC_HISTORY.filter(h => h.type === 'error').length}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* آخرین همگام‌سازی */}
        <Card className="glass-card hover-lift shine-effect shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{labels.lastSync}</p>
              <p className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">
                {existingConfig?.lastSync ? formatRelativeTime(existingConfig.lastSync) : '—'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Configuration Form */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {labels.configuration}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-cyan-500" />{labels.siteUrl}</Label>
              <Input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder={labels.siteUrlPlaceholder} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-cyan-500" />{labels.apiKey}</Label>
              <Input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={labels.apiKeyPlaceholder} type="password" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-cyan-500" />{labels.username}</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder={labels.usernamePlaceholder} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-cyan-500" />{labels.frequency}</Label>
              <Select value={syncFreq} onValueChange={v => setSyncFreq(v as typeof syncFreq)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(labels.freqLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" disabled={!siteUrl.trim() || !apiKey.trim()}>
              <CheckCircle className="h-4 w-4" />
              {labels.save}
            </Button>
          </CardContent>
        </Card>

        {/* Sync Info */}
        <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              اطلاعات همگام‌سازی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Synced Posts List */}
            <div>
              <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300 mb-2">{labels.syncedPosts}</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {syncedPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">{labels.noSyncedPosts}</p>
                  </div>
                ) : (
                  syncedPosts.map((post, idx) => (
                    <div key={post.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50 hover:bg-cyan-500/5 transition-all duration-200 hover-lift animate-in" style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/30 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <span className="text-sm truncate">{post.title}</span>
                      </div>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className={`shrink-0 text-[10px] border-0 ${post.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                        {statusLabels[post.status] ?? post.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ───── Sync History Timeline ───── */}
      <Card className="glass-card hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in border-0" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
              <History className="h-5 w-5" />
              {labels.syncHistory}
            </CardTitle>
            <Badge variant="secondary" className="text-xs font-medium bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
              {MOCK_SYNC_HISTORY.length} مورد
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute top-3 bottom-3 start-[11px] w-0.5 bg-gradient-to-b from-cyan-300 via-emerald-300 to-amber-300 dark:from-cyan-700 dark:via-emerald-700 dark:to-amber-700" />
            <div className="space-y-4">
              {MOCK_SYNC_HISTORY.map((entry, i) => (
                <div key={entry.id} className="flex items-start gap-3 relative animate-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}>
                  {/* Colored dot */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-background ${
                    entry.type === 'success'
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                      : 'bg-red-500 shadow-sm shadow-red-500/50'
                  }`}>
                    {entry.type === 'success'
                      ? <Check className="h-3 w-3 text-white" />
                      : <X className="h-3 w-3 text-white" />
                    }
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm font-medium">{entry.description}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(entry.date)}
                      </span>
                      <Badge className={`text-[10px] border-0 px-1.5 py-0 ${
                        entry.type === 'success'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {entry.type === 'success' ? 'موفق' : 'خطا'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
