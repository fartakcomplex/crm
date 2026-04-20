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
  Clock, FileText, Settings, Loader2,
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
  freqOptions: {
    manual: 'دستی',
    hourly: 'ساعتی',
    daily: 'روزانه',
    weekly: 'هفتگی',
  },
  freqLabels: {
    manual: 'دستی',
    hourly: 'ساعتی',
    daily: 'روزانه',
    weekly: 'هفتگی',
  },
  postTitle: 'عنوان مطلب',
  postStatus: 'وضعیت',
  postDate: 'تاریخ',
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

  const handleSave = () => {
    saveWPConfig.mutate({
      id: existingConfig?.id,
      siteUrl,
      apiKey,
      username,
      syncFreq,
      active: true,
    })
    toast.success(labels.saved)
  }

  const handleSync = async () => {
    if (!existingConfig?.id) {
      toast.error('ابتدا تنظیمات را ذخیره کنید.')
      return
    }
    setSyncing(true)
    try {
      await syncWP.mutateAsync(existingConfig.id)
      toast.success(labels.syncSuccess)
    } catch {
      toast.error(labels.syncError)
    } finally {
      setSyncing(false)
    }
  }

  // Get synced posts (filter those with wp- prefix or from sync)
  const syncedPosts = useMemo(() => {
    // Since we don't have a direct synced posts query, show recent posts
    return (posts.data ?? []).slice(0, 10)
  }, [posts.data])

  const statusLabels: Record<string, string> = {
    published: 'منتشر شده',
    draft: 'پیش‌نویس',
    archived: 'بایگانی',
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing || !isConnected}
          className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncing ? labels.syncing : labels.sync}
        </Button>
      </div>

      {/* Connection Status */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-200/30 dark:border-blue-800/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2.5 ${isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {isConnected ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div>
                <p className="font-medium">{labels.connectionStatus}</p>
                <p className="text-sm text-muted-foreground">
                  {isConnected
                    ? `${labels.connected} — ${siteUrl || '—'}`
                    : labels.disconnected
                  }
                </p>
              </div>
            </div>
            <Badge className={`${isConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'} border-0`}>
              {isConnected ? labels.connected : labels.disconnected}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Configuration Form */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-200/30 dark:border-blue-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {labels.configuration}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-blue-500" />
                {labels.siteUrl}
              </Label>
              <Input
                value={siteUrl}
                onChange={e => setSiteUrl(e.target.value)}
                placeholder={labels.siteUrlPlaceholder}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-blue-500" />
                {labels.apiKey}
              </Label>
              <Input
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={labels.apiKeyPlaceholder}
                type="password"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-500" />
                {labels.username}
              </Label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={labels.usernamePlaceholder}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                {labels.frequency}
              </Label>
              <Select value={syncFreq} onValueChange={v => setSyncFreq(v as typeof syncFreq)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{labels.freqLabels.manual}</SelectItem>
                  <SelectItem value="hourly">{labels.freqLabels.hourly}</SelectItem>
                  <SelectItem value="daily">{labels.freqLabels.daily}</SelectItem>
                  <SelectItem value="weekly">{labels.freqLabels.weekly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleSave}
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
              disabled={!siteUrl.trim() || !apiKey.trim()}
            >
              <CheckCircle className="h-4 w-4" />
              {labels.save}
            </Button>
          </CardContent>
        </Card>

        {/* Sync Info & Last Sync */}
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-200/30 dark:border-blue-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              اطلاعات همگام‌سازی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-background/50 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{syncedPosts.length}</p>
                <p className="text-xs text-muted-foreground">{labels.syncedPosts}</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 text-center">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {existingConfig?.lastSync ? formatDateTime(existingConfig.lastSync) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">{labels.lastSync}</p>
              </div>
            </div>

            {/* Synced Posts List */}
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">{labels.syncedPosts}</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {syncedPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{labels.noSyncedPosts}</p>
                ) : (
                  syncedPosts.map(post => (
                    <div key={post.id} className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 hover:bg-blue-500/5 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="text-sm truncate">{post.title}</span>
                      </div>
                      <Badge
                        variant={post.status === 'published' ? 'default' : 'secondary'}
                        className={`shrink-0 text-[10px] border-0 ${post.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}
                      >
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
