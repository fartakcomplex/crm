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
} from 'lucide-react'
import { formatDateTime } from './types'
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
}

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

      {/* Connection Status Card */}
      <Card className={`glass-card shadow-sm transition-all duration-500 ${isConnected ? 'hover-lift' : ''}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`rounded-2xl p-3 shadow-md transition-all duration-500 ${isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {isConnected
                  ? <Wifi className="h-6 w-6 text-green-600 dark:text-green-400" />
                  : <WifiOff className="h-6 w-6 text-red-600 dark:text-red-400" />
                }
              </div>
              <div>
                <p className="font-semibold text-base">{labels.connectionStatus}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isConnected ? `${labels.connected} — ${siteUrl || '—'}` : labels.disconnected}
                </p>
              </div>
            </div>
            <Badge className={`${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'} border-0 shadow-sm`}>
              {isConnected ? labels.connected : labels.disconnected}
            </Badge>
          </div>
          {/* Sync progress bar */}
          {syncing && (
            <div className="mt-4 animate-in">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">در حال همگام‌سازی...</span>
                <span className="font-semibold text-cyan-600 dark:text-cyan-400 tabular-nums">{Math.round(syncProgress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500" style={{ width: `${syncProgress}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 text-center shadow-sm">
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">{syncedPosts.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{labels.syncedPosts}</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10 text-center shadow-sm">
                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {existingConfig?.lastSync ? formatDateTime(existingConfig.lastSync) : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{labels.lastSync}</p>
              </div>
            </div>

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
    </div>
  )
}
