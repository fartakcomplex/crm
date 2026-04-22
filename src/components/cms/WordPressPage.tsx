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
  ExternalLink, ArrowLeftRight, History, ChevronLeft, Database,
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
  sync: 'همگام‌سازی',
  syncing: 'در حال همگام‌سازی...',
  syncSuccess: 'همگام‌سازی با موفقیت انجام شد!',
  syncError: 'خطا در همگام‌سازی',
  syncedPosts: 'مطالب همگام‌شده',
  lastSync: 'آخرین همگام‌سازی',
  noSyncedPosts: 'هنوز مطبی همگام نشده است',
  frequency: 'فرکانس همگام‌سازی',
  freqLabels: { manual: 'دستی', hourly: 'ساعتی', daily: 'روزانه', weekly: 'هفتگی' },
  postTitle: 'عنوان مطلب',
  settings: 'تنظیمات',
  viewSite: 'مشاهده سایت',
  syncHistory: 'تاریخچه همگام‌سازی',
  syncComplete: 'تکمیل',
  syncFailed: 'ناموفق',
  totalSynced: 'کل همگام‌شده',
  viewAll: 'مشاهده همه',
}

// ─── Mock Sync History ────────────────────────────────────────────────────────

const syncHistoryData = [
  { id: '1', time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), status: 'success', count: 12 },
  { id: '2', time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), status: 'success', count: 5 },
  { id: '3', time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), status: 'success', count: 8 },
  { id: '4', time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'failed', count: 0 },
  { id: '5', time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'success', count: 3 },
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
    <div className="space-y-6 p-4 md:p-6 page-enter content-area reveal-on-scroll">
      {/* ─── Animated Gradient Header ─── */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8 glass-card shine-effect">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-emerald-500/10 pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 animate-in">
              <Database className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                {labels.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                {labels.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing || !isConnected}
              className="btn-ghost-subtle gap-2 border-cyan-300 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {syncing ? labels.syncing : labels.sync}
            </Button>
            {isConnected && siteUrl && (
              <Button
                variant="outline"
                size="sm"
                className="btn-ghost-subtle gap-2 border-cyan-300 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                asChild
              >
                <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  {labels.viewSite}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Connection Status Card with Animated Glow ─── */}
      <Card className={`glass-card card-inner-glow shadow-sm transition-all duration-500 relative overflow-hidden animate-in ${isConnected ? 'hover-lift' : ''}`} style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
        {isConnected && (
          <div className="absolute inset-0 rounded-xl border-2 border-green-400/30 pointer-events-none transition-all duration-1000 animate-pulse" />
        )}
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`rounded-2xl p-3.5 shadow-lg transition-all duration-500 ${isConnected ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/25' : 'bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/25'}`}>
                {isConnected
                  ? <Wifi className="h-6 w-6 text-white" />
                  : <WifiOff className="h-6 w-6 text-white" />
                }
              </div>
              <div>
                <p className="font-semibold text-base">{labels.connectionStatus}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isConnected ? `${labels.connected} — ${siteUrl || '—'}` : labels.disconnected}
                </p>
              </div>
            </div>
            <Badge className={`${isConnected ? 'badge-gradient-emerald' : 'badge-gradient-rose'} border-0 shadow-sm h-8 px-3`}>
              {isConnected ? labels.connected : labels.disconnected}
            </Badge>
          </div>

          {/* Animated gradient progress bar */}
          {syncing && (
            <div className="mt-5 animate-in">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5 animate-pulse" />
                  {labels.syncing}
                </span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">{Math.round(syncProgress)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out stat-card-gradient"
                  style={{
                    width: `${syncProgress}%`,
                    background: `linear-gradient(90deg, #06b6d4, #14b8a6, #22c55e, #14b8a6, #06b6d4)`,
                    backgroundSize: '200% 100%',
                    animation: 'gradient-flow 2s ease infinite',
                  }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children animate-in" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
        <Card className="glass-card card-metric stat-card-gradient hover-lift card-inner-glow shadow-sm overflow-hidden transition-all duration-300">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-md">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">{syncedPosts.length}</p>
              <p className="text-[11px] text-muted-foreground">{labels.syncedPosts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card card-metric stat-card-gradient hover-lift card-inner-glow shadow-sm overflow-hidden transition-all duration-300">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {existingConfig?.lastSync ? formatRelativeTime(existingConfig.lastSync) : '—'}
              </p>
              <p className="text-[11px] text-muted-foreground">{labels.lastSync}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card card-metric stat-card-gradient hover-lift card-inner-glow shadow-sm overflow-hidden transition-all duration-300">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {labels.freqLabels[syncFreq as keyof typeof labels.freqLabels] ?? syncFreq}
              </p>
              <p className="text-[11px] text-muted-foreground">{labels.frequency}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card card-metric stat-card-gradient hover-lift card-inner-glow shadow-sm overflow-hidden transition-all duration-300">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-md">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">{syncHistoryData.length}</p>
              <p className="text-[11px] text-muted-foreground">{labels.syncHistory}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ─── Configuration Form ─── */}
        <Card className="glass-card hover-lift card-inner-glow shine-effect shadow-sm transition-all duration-300 animate-in" style={{ animationDelay: '350ms', animationFillMode: 'both' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-sm">
                <Settings className="h-4 w-4 text-white" />
              </div>
              {labels.configuration}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-cyan-500" />{labels.siteUrl}</Label>
              <Input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder={labels.siteUrlPlaceholder} dir="ltr" className="hover:border-cyan-400 transition-colors" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-cyan-500" />{labels.apiKey}</Label>
              <Input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={labels.apiKeyPlaceholder} type="password" dir="ltr" className="hover:border-cyan-400 transition-colors" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-cyan-500" />{labels.username}</Label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder={labels.usernamePlaceholder} dir="ltr" className="hover:border-cyan-400 transition-colors" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-cyan-500" />{labels.frequency}</Label>
              <Select value={syncFreq} onValueChange={v => setSyncFreq(v as typeof syncFreq)}>
                <SelectTrigger className="hover:border-cyan-400 transition-colors"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(labels.freqLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="btn-gradient-primary w-full gap-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30" disabled={!siteUrl.trim() || !apiKey.trim()}>
              <CheckCircle className="h-4 w-4" />
              {labels.save}
            </Button>
          </CardContent>
        </Card>

        {/* ─── Sync Info ─── */}
        <Card className="glass-card hover-lift card-inner-glow shine-effect shadow-sm transition-all duration-300 animate-in" style={{ animationDelay: '450ms', animationFillMode: 'both' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-sm">
                <Zap className="h-4 w-4 text-white" />
              </div>
              اطلاعات همگام‌سازی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Synced Posts List */}
            <div>
              <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {labels.syncedPosts}
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {syncedPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200/50 dark:from-cyan-900/20 dark:to-cyan-800/10 flex items-center justify-center mb-3 float-animation">
                      <FileText className="h-8 w-8 text-cyan-300" />
                    </div>
                    <p className="text-sm">{labels.noSyncedPosts}</p>
                  </div>
                ) : (
                  syncedPosts.map((post, idx) => (
                    <div key={post.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50 hover:bg-cyan-500/5 transition-all duration-200 hover-lift animate-in glass-card" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/30 flex items-center justify-center shrink-0 shadow-sm">
                          <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <span className="text-sm truncate">{post.title}</span>
                      </div>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className={`shrink-0 text-[10px] border-0 ${post.status === 'published' ? 'badge-gradient-emerald' : 'badge-gradient-amber'}`}>
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

      {/* ─── Recent Sync History Timeline ─── */}
      <Card className="glass-card hover-lift card-inner-glow shine-effect shadow-sm transition-all duration-300 animate-in" style={{ animationDelay: '550ms', animationFillMode: 'both' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm">
                <History className="h-4 w-4 text-white" />
              </div>
              {labels.syncHistory}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute right-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-cyan-300/40 via-teal-300/30 to-transparent dark:from-cyan-700/30 dark:via-teal-700/20" />

            <div className="space-y-3">
              {syncHistoryData.map((item, idx) => {
                const isSuccess = item.status === 'success'
                return (
                  <div key={item.id} className="flex gap-4 animate-in" style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}>
                    {/* Timeline dot */}
                    <div className="shrink-0 z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-background shadow-md transition-all duration-300 ${isSuccess ? 'bg-gradient-to-br from-green-400 to-emerald-500 ring-green-200 dark:ring-green-800' : 'bg-gradient-to-br from-red-400 to-rose-500 ring-red-200 dark:ring-red-800'}`}>
                        {isSuccess
                          ? <CheckCircle className="h-3.5 w-3.5 text-white" />
                          : <XCircle className="h-3.5 w-3.5 text-white" />
                        }
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex items-center justify-between p-3 rounded-xl glass-card hover:bg-cyan-500/5 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {isSuccess ? labels.syncComplete : labels.syncFailed}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(item.time)}</p>
                        </div>
                      </div>
                      {isSuccess && (
                        <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-0 shadow-sm text-[10px]">
                          {item.count} مطلب
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
