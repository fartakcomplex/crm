'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Globe, Link2, Key, User, RefreshCw, CheckCircle, XCircle,
  Clock, FileText, Settings, Loader2, Wifi, WifiOff, Zap,
  ExternalLink, ArrowLeftRight, History, Database, Download,
  Activity, Shield, Eye, Code, Copy, AlertTriangle,
  Radio, Plug, Server, Info, ChevronDown,
  Terminal,
} from 'lucide-react'
import { formatDateTime, formatRelativeTime } from './types'
import { toast } from 'sonner'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'همگام‌سازی وردپرس',
  subtitle: 'اتصال، همگام‌سازی و مدیریت محتوای وردپرس',
  tabSettings: 'تنظیمات',
  tabPlugin: 'پلاگین وردپرس',
  tabHistory: 'تاریخچه',
  tabHelp: 'راهنما',
  connectionStatus: 'وضعیت اتصال',
  connected: 'متصل',
  disconnected: 'قطع',
  configuration: 'پیکربندی',
  siteUrl: 'آدرس سایت وردپرس',
  siteUrlPlaceholder: 'https://yoursite.com',
  apiKey: 'کلید API',
  apiKeyPlaceholder: 'کلید API پلاگین را وارد کنید',
  username: 'نام کاربری',
  usernamePlaceholder: 'نام کاربری وردپرس',
  save: 'ذخیره تنظیمات',
  saved: 'تنظیمات ذخیره شد!',
  sync: 'همگام‌سازی',
  syncing: 'در حال همگام‌سازی...',
  syncSuccess: 'همگام‌سازی موفق!',
  syncError: 'خطا در همگام‌سازی',
  syncedPosts: 'مطالب همگام‌شده',
  lastSync: 'آخرین همگام‌سازی',
  noSyncedPosts: 'هنوز مطلبی همگام نشده',
  frequency: 'فرکانس خودکار',
  testConnection: 'تست اتصال',
  testing: 'در حال تست...',
  connectionOk: 'اتصال موفق!',
  connectionFail: 'اتصال ناموفق',
  downloadPlugin: 'دانلود پلاگین',
  installPlugin: 'نصب پلاگین',
  fullSync: 'همگام‌سازی کامل',
  incrementalSync: 'همگام‌سازی افزایشی',
  syncHistory: 'تاریخچه همگام‌سازی',
  syncComplete: 'موفق',
  syncFailed: 'ناموفق',
  totalSynced: 'کل همگام‌شده',
  viewAll: 'مشاهده همه',
  copyKey: 'کپی کلید',
  copied: 'کپی شد!',
  autoSync: 'همگام‌سازی خودکار',
  autoSyncDesc: 'به صورت خودکار محتوای جدید را واکشی می‌کند',
  realtimeMonitoring: 'نظارت رئال‌تایم',
  realtimeDesc: 'وضعیت سرویس همگام‌سازی را به صورت لحظه‌ای نمایش می‌دهد',
  serviceStatus: 'وضعیت سرویس',
  serviceOnline: 'آنلاین',
  serviceOffline: 'آفلاین',
  noSyncHistory: 'هنوز تاریخچه‌ای وجود ندارد',
  steps: 'مراحل نصب',
  apiEndpoints: 'اندپوینت‌های API',
}

const freqLabels: Record<string, string> = {
  manual: 'دستی',
  every_5min: 'هر ۵ دقیقه',
  every_15min: 'هر ۱۵ دقیقه',
  hourly: 'ساعتی',
  daily: 'روزانه',
  weekly: 'هفتگی',
}

// ─── Connection Test Result Type ───────────────────────────────────────────────

interface TestResult {
  connected: boolean
  bridge?: { connected: boolean; message: string; version?: string; wpVersion?: string; siteName?: string }
  native?: { connected: boolean; message: string; limited?: boolean }
  stats?: Record<string, unknown>
  recommendations?: string[]
}

interface SyncLogEntry {
  time: string
  configId: string
  siteUrl: string
  status: 'success' | 'error'
  postsFetched: number
  created: number
  updated: number
  errors: number
  message: string
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
  const [syncResult, setSyncResult] = useState<{ created: number; updated: number; total: number } | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [serviceStatus, setServiceStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([])
  const [activeTab, setActiveTab] = useState('settings')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── WebSocket Connection for Real-time Updates ──────────────────────────

  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(`ws://localhost:3005/ws`)

      ws.onopen = () => {
        setServiceStatus('online')
        console.log('[WP Page] WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'sync_completed') {
            const logs = Array.isArray(data.data) ? data.data : [data.data]
            setSyncLogs(prev => [...logs, ...prev].slice(0, 50))
            toast.success('همگام‌سازی جدید انجام شد', {
              description: `${logs[0]?.message || 'مطالب جدید واکشی شد'}`,
            })
            // Refresh data
            wpConfig.refetch?.()
          } else if (data.type === 'status_update') {
            if (data.data?.recentLogs) {
              setSyncLogs(prev => {
                const newLogs = data.data.recentLogs.filter(
                  (l: SyncLogEntry) => !prev.find(p => p.time === l.time && p.configId === l.configId)
                )
                return [...newLogs, ...prev].slice(0, 50)
              })
            }
          }
        } catch {
          // Ignore invalid messages
        }
      }

      ws.onclose = () => {
        setServiceStatus('offline')
        console.log('[WP Page] WebSocket disconnected, reconnecting...')
        reconnectTimer.current = setTimeout(connectWebSocket, 10000)
      }

      ws.onerror = () => {
        setServiceStatus('offline')
      }

      wsRef.current = ws
    } catch {
      setServiceStatus('offline')
      reconnectTimer.current = setTimeout(connectWebSocket, 10000)
    }
  }, [wpConfig])

  useEffect(() => {
    connectWebSocket()
    return () => {
      wsRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [connectWebSocket])

  // Check service health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/?XTransformPort=3005/health')
        if (res.ok) {
          setServiceStatus('online')
          const data = await res.json()
          if (data.lastSync) {
            setSyncLogs([{
              time: data.lastSync,
              configId: '',
              siteUrl: '',
              status: 'success',
              postsFetched: 0,
              created: 0,
              updated: 0,
              errors: 0,
              message: 'آخرین همگام‌سازی خودکار',
            }])
          }
        } else {
          setServiceStatus('offline')
        }
      } catch {
        setServiceStatus('offline')
      }
    }
    checkHealth()
  }, [])

  // ─── Handlers ───────────────────────────────────────────────────────────

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

  const handleSync = async (fullSync = false) => {
    if (!existingConfig?.id) {
      toast.error('ابتدا تنظیمات را ذخیره کنید.')
      return
    }
    setSyncing(true)
    setSyncProgress(0)
    setSyncResult(null)

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 85) { clearInterval(interval); return prev }
        return prev + Math.random() * 12
      })
    }, 400)

    try {
      const res = await fetch('/api/wordpress/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId: existingConfig.id, fullSync }),
      })
      clearInterval(interval)

      const data = await res.json()
      setSyncProgress(100)

      if (res.ok && data.success) {
        setSyncResult({
          created: data.summary?.created || 0,
          updated: data.summary?.updated || 0,
          total: data.summary?.totalPostsFetched || 0,
        })
        toast.success(data.message || labels.syncSuccess)

        // Refresh synced posts
        setTimeout(() => {
          posts.refetch?.()
          wpConfig.refetch?.()
        }, 500)
      } else {
        toast.error(data.error || data.details || labels.syncError)
      }
    } catch {
      clearInterval(interval)
      toast.error(labels.syncError)
    } finally {
      setTimeout(() => { setSyncing(false); setSyncProgress(0) }, 1500)
    }
  }

  const handleTestConnection = async () => {
    if (!siteUrl || !apiKey) {
      toast.error('ابتدا آدرس سایت و کلید API را وارد کنید.')
      return
    }
    setTesting(true)
    setTestResult(null)

    try {
      const res = await fetch('/api/wordpress/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, apiKey }),
      })
      const data = await res.json()
      setTestResult(data)

      if (data.connected) {
        toast.success(labels.connectionOk)
      } else {
        toast.error(labels.connectionFail)
      }
    } catch {
      toast.error('خطا در تست اتصال')
    } finally {
      setTesting(false)
    }
  }

  const handleDownloadPlugin = async () => {
    try {
      toast.loading('در حال آماده‌سازی فایل پلاگین...', { id: 'plugin-download' })
      const res = await fetch('/api/wordpress/plugin?format=download')
      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'smart-cms-bridge.php'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('فایل پلاگین دانلود شد!', { id: 'plugin-download' })
    } catch {
      toast.error('خطا در دانلود پلاگین', { id: 'plugin-download' })
    }
  }

  const handleCopyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      toast.success(labels.copied)
    }
  }

  // ─── Synced Posts ───────────────────────────────────────────────────────

  const syncedPosts = useMemo(() => {
    return (posts.data ?? []).slice(0, 15)
  }, [posts.data])

  const statusLabels: Record<string, string> = { published: 'منتشر شده', draft: 'پیش‌نویس', synced: 'همگام‌شده', archived: 'بایگانی', deleted: 'حذف شده' }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-4 md:p-6 page-enter content-area reveal-on-scroll">
      {/* ─── Header ─── */}
      <div className="relative rounded-2xl overflow-hidden p-5 md:p-7 glass-card shine-effect">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-emerald-500/10 pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 animate-in">
              <Database className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">{labels.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sync Service Status */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              serviceStatus === 'online'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : serviceStatus === 'checking'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {serviceStatus === 'online' ? (
                <><Radio className="h-3 w-3" /> سرویس {labels.serviceOnline}</>
              ) : serviceStatus === 'checking' ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> در حال بررسی...</>
              ) : (
                <><WifiOff className="h-3 w-3" /> سرویس {labels.serviceOffline}</>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync(true)}
              disabled={syncing || !isConnected}
              className="btn-ghost-subtle gap-1.5 border-cyan-300 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {labels.fullSync}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync(false)}
              disabled={syncing || !isConnected}
              className="btn-ghost-subtle gap-1.5 border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Zap className="h-3.5 w-3.5" />
              {labels.incrementalSync}
            </Button>

            {isConnected && siteUrl && (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={siteUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Sync Progress */}
        {syncing && (
          <div className="mt-4 animate-in">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <ArrowLeftRight className="h-3 w-3 animate-pulse" />
                {labels.syncing}
              </span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">{Math.round(syncProgress)}%</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${syncProgress}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #14b8a6, #22c55e, #14b8a6, #06b6d4)',
                  backgroundSize: '200% 100%',
                  animation: 'gradient-flow 2s ease infinite',
                }}
              />
            </div>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && !syncing && (
          <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 animate-in">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="text-sm text-emerald-700 dark:text-emerald-300">
              <strong>{syncResult.total}</strong> پست واکشی شد — <strong>{syncResult.created}</strong> جدید، <strong>{syncResult.updated}</strong> بروزرسانی
            </div>
          </div>
        )}
      </div>

      {/* ─── Tabs ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass-card p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="settings" className="gap-1.5 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400">
            <Settings className="h-3.5 w-3.5" /> {labels.tabSettings}
          </TabsTrigger>
          <TabsTrigger value="plugin" className="gap-1.5 data-[state=active]:bg-teal-500/10 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400">
            <Download className="h-3.5 w-3.5" /> {labels.tabPlugin}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400">
            <History className="h-3.5 w-3.5" /> {labels.tabHistory}
          </TabsTrigger>
          <TabsTrigger value="help" className="gap-1.5 data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400">
            <Info className="h-3.5 w-3.5" /> {labels.tabHelp}
          </TabsTrigger>
        </TabsList>

        {/* ─── Settings Tab ─── */}
        <TabsContent value="settings" className="space-y-4">
          {/* Connection Status */}
          <Card className={`glass-card card-inner-glow shadow-sm transition-all duration-500 relative overflow-hidden ${isConnected ? 'hover-lift' : ''}`}>
            {isConnected && <div className="absolute inset-0 rounded-xl border-2 border-green-400/30 pointer-events-none animate-pulse" />}
            <CardContent className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className={`rounded-2xl p-3 shadow-lg transition-all duration-500 ${isConnected ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/25' : 'bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/25'}`}>
                    {isConnected ? <Wifi className="h-6 w-6 text-white" /> : <WifiOff className="h-6 w-6 text-white" />}
                  </div>
                  <div>
                    <p className="font-semibold">{labels.connectionStatus}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {isConnected ? `${labels.connected} — ${siteUrl}` : labels.disconnected}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${isConnected ? 'badge-gradient-emerald' : 'badge-gradient-rose'} border-0 h-7 px-2.5`}>
                    {isConnected ? labels.connected : labels.disconnected}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={testing || !siteUrl || !apiKey}
                    className="gap-1.5"
                  >
                    {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
                    {testing ? labels.testing : labels.testConnection}
                  </Button>
                </div>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className={`mt-4 p-3 rounded-xl text-sm animate-in ${
                  testResult.connected
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    {testResult.connected ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <span className="font-medium">{testResult.connected ? labels.connectionOk : labels.connectionFail}</span>
                  </div>
                  {testResult.bridge?.message && (
                    <p className="text-muted-foreground text-xs mb-1">{testResult.bridge.message}</p>
                  )}
                  {testResult.stats && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(Object.entries(testResult.stats) as [string, string | number][]).slice(0, 6).map(([key, val]) => (
                        <div key={key} className="text-center p-2 bg-background/50 rounded-lg">
                          <div className="font-bold text-sm">{String(val)}</div>
                          <div className="text-[10px] text-muted-foreground">{key}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {testResult.recommendations && testResult.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1">
                        <AlertTriangle className="h-3 w-3" /> راهکارها:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {testResult.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
            <Card className="glass-card stat-card-gradient hover-lift card-inner-glow shadow-sm overflow-hidden">
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
            <Card className="glass-card stat-card-gradient hover-lift card-inner-glow shadow-sm overflow-hidden">
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
            <Card className="glass-card stat-card-gradient hover-lift card-inner-glow shadow-sm overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {freqLabels[syncFreq] ?? syncFreq}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{labels.frequency}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card stat-card-gradient hover-lift card-inner-glow shadow-sm overflow-hidden">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-md">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                    {serviceStatus === 'online' ? labels.serviceOnline : labels.serviceOffline}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{labels.realtimeMonitoring}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Configuration Form */}
            <Card className="glass-card hover-lift card-inner-glow shine-effect shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-sm">
                    <Settings className="h-4 w-4 text-white" />
                  </div>
                  {labels.configuration}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Globe className="h-3 w-3 text-cyan-500" />{labels.siteUrl}
                  </Label>
                  <Input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder={labels.siteUrlPlaceholder} dir="ltr" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Key className="h-3 w-3 text-cyan-500" />{labels.apiKey}
                  </Label>
                  <div className="flex gap-1.5">
                    <Input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={labels.apiKeyPlaceholder} type="password" dir="ltr" className="text-sm flex-1" />
                    <Button variant="outline" size="icon" onClick={handleCopyApiKey} className="shrink-0 h-9 w-9" title={labels.copyKey}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <User className="h-3 w-3 text-cyan-500" />{labels.username}
                  </Label>
                  <Input value={username} onChange={e => setUsername(e.target.value)} placeholder={labels.usernamePlaceholder} dir="ltr" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <Clock className="h-3 w-3 text-cyan-500" />{labels.frequency}
                  </Label>
                  <Select value={syncFreq} onValueChange={v => setSyncFreq(v)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(freqLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto Sync Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-cyan-500" />
                    <div>
                      <p className="text-sm font-medium">{labels.autoSync}</p>
                      <p className="text-[10px] text-muted-foreground">{labels.autoSyncDesc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={syncFreq !== 'manual'}
                    onCheckedChange={(checked) => setSyncFreq(checked ? 'every_15min' : 'manual')}
                  />
                </div>

                <Button onClick={handleSave} className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-cyan-500/20" disabled={!siteUrl.trim() || !apiKey.trim()}>
                  <CheckCircle className="h-4 w-4" />
                  {labels.save}
                </Button>
              </CardContent>
            </Card>

            {/* Synced Posts List */}
            <Card className="glass-card hover-lift card-inner-glow shine-effect shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-sm">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  {labels.syncedPosts}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-80 overflow-y-auto custom-scrollbar">
                  {syncedPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200/50 dark:from-cyan-900/20 dark:to-cyan-800/10 flex items-center justify-center mb-3 float-animation">
                        <FileText className="h-8 w-8 text-cyan-300" />
                      </div>
                      <p className="text-sm">{labels.noSyncedPosts}</p>
                      <p className="text-xs mt-1">پس از همگام‌سازی، مطالب وردپرس اینجا نمایش داده می‌شود</p>
                    </div>
                  ) : (
                    syncedPosts.map((post, idx) => (
                      <div
                        key={post.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 hover:bg-cyan-500/5 transition-all duration-200 hover-lift animate-in glass-card"
                        style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/30 flex items-center justify-center shrink-0 shadow-sm">
                            <FileText className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <span className="text-sm truncate">{post.title}</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`shrink-0 text-[10px] border-0 ${
                            post.status === 'published' ? 'badge-gradient-emerald' :
                            post.status === 'synced' ? 'badge-gradient-cyan' :
                            'badge-gradient-amber'
                          }`}
                        >
                          {statusLabels[post.status] ?? post.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── Plugin Tab ─── */}
        <TabsContent value="plugin" className="space-y-4">
          <Card className="glass-card hover-lift card-inner-glow shine-effect shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-teal-700 dark:text-teal-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-sm">
                  <Download className="h-4 w-4 text-white" />
                </div>
                {labels.downloadPlugin}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                برای اتصال سایت وردپرس خود به Smart CMS، ابتدا پلاگین زیر را دانلود و نصب کنید.
                این پلاگین یک API اختصاصی و سیستم وب‌هوک رئال‌تایم روی سایت شما ایجاد می‌کند.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10">
                  <Download className="h-8 w-8 text-cyan-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">دانلود پلاگین</p>
                  <p className="text-[10px] text-muted-foreground">فایل PHP آماده نصب</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/10">
                  <Code className="h-8 w-8 text-teal-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">REST API اختصاصی</p>
                  <p className="text-[10px] text-muted-foreground">۶ اندپوینت حرفه‌ای</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10">
                  <Radio className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">وب‌هوک رئال‌تایم</p>
                  <p className="text-[10px] text-muted-foreground">اعلان فوری تغییرات</p>
                </div>
              </div>

              <Button onClick={handleDownloadPlugin} className="w-full gap-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-teal-500/20">
                <Download className="h-4 w-4" />
                {labels.downloadPlugin} — Smart CMS Bridge v2.0
              </Button>

              {/* Installation Steps */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-teal-500" />
                  {labels.steps}
                </h3>
                <div className="space-y-2">
                  {[
                    'فایل پلاگین را دانلود کنید',
                    'در پیشخوان وردپرس به «افزونه‌ها» → «افزودن» → «بارگذاری افزونه» بروید',
                    'فایل را آپلود و فعال کنید',
                    'از منوی «Smart CMS» در سایدبار وردپرس وارد تنظیمات شوید',
                    'کلید API تولید شده را کپی کنید',
                    'آدرس وب‌هوک Smart CMS و رمز مخفی را وارد کنید',
                    'تنظیمات را ذخیره کنید',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-[10px] font-bold text-white">{i + 1}</span>
                      </div>
                      <p className="text-xs leading-relaxed mt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Endpoints */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-teal-500" />
                  {labels.apiEndpoints}
                </h3>
                <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                  {[
                    { method: 'GET', path: '/wp-json/smart-cms/v1/posts', desc: 'لیست پست‌ها با فیلتر و صفحه‌بندی' },
                    { method: 'GET', path: '/wp-json/smart-cms/v1/posts/{id}', desc: 'جزئیات تک پست' },
                    { method: 'GET', path: '/wp-json/smart-cms/v1/categories', desc: 'لیست دسته‌بندی‌ها' },
                    { method: 'GET', path: '/wp-json/smart-cms/v1/tags', desc: 'لیست برچسب‌ها' },
                    { method: 'GET', path: '/wp-json/smart-cms/v1/stats', desc: 'آمار سایت' },
                    { method: 'GET', path: '/wp-json/smart-cms/v1/heartbeat', desc: 'تست اتصال' },
                  ].map((ep, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 font-mono text-xs" dir="ltr">
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-cyan-300 dark:border-cyan-700 text-cyan-600 dark:text-cyan-400 font-mono">
                        {ep.method}
                      </Badge>
                      <span className="text-muted-foreground truncate">{ep.path}</span>
                      <span className="text-[10px] text-muted-foreground mr-auto" dir="rtl">{ep.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── History Tab ─── */}
        <TabsContent value="history" className="space-y-4">
          <Card className="glass-card hover-lift card-inner-glow shine-effect shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <History className="h-4 w-4 text-white" />
                </div>
                {labels.syncHistory}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute right-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-amber-300/40 via-orange-300/30 to-transparent dark:from-amber-700/30 dark:via-orange-700/20" />

                <div className="space-y-2.5">
                  {syncLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200/50 dark:from-amber-900/20 dark:to-amber-800/10 flex items-center justify-center mb-3 float-animation">
                        <History className="h-8 w-8 text-amber-300" />
                      </div>
                      <p className="text-sm">{labels.noSyncHistory}</p>
                      <p className="text-xs mt-1">پس از اولین همگام‌سازی، تاریخچه اینجا نمایش داده می‌شود</p>
                    </div>
                  ) : (
                    syncLogs.map((log, idx) => {
                      const isSuccess = log.status === 'success'
                      return (
                        <div key={`${log.time}-${log.configId}-${idx}`} className="flex gap-3 animate-in" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}>
                          <div className="shrink-0 z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 ring-offset-2 ring-offset-background shadow-md ${
                              isSuccess
                                ? 'bg-gradient-to-br from-green-400 to-emerald-500 ring-green-200 dark:ring-green-800'
                                : 'bg-gradient-to-br from-red-400 to-rose-500 ring-red-200 dark:ring-red-800'
                            }`}>
                              {isSuccess
                                ? <CheckCircle className="h-3.5 w-3.5 text-white" />
                                : <XCircle className="h-3.5 w-3.5 text-white" />
                              }
                            </div>
                          </div>
                          <div className="flex-1 flex items-center justify-between p-2.5 rounded-xl glass-card hover:bg-amber-500/5 transition-all">
                            <div>
                              <p className="text-sm font-medium">
                                {isSuccess ? labels.syncComplete : labels.syncFailed}
                                {log.siteUrl && (
                                  <span className="text-xs text-muted-foreground mr-2">— {log.siteUrl}</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatRelativeTime(log.time)}
                              </p>
                              {log.message && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">{log.message}</p>
                              )}
                            </div>
                            {isSuccess && (log.created > 0 || log.updated > 0) && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                {log.created > 0 && (
                                  <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-0 text-[10px]">
                                    +{log.created} جدید
                                  </Badge>
                                )}
                                {log.updated > 0 && (
                                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 text-[10px]">
                                    ↑{log.updated} بروزرسانی
                                  </Badge>
                                )}
                                {log.postsFetched > 0 && (
                                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0 text-[10px]">
                                    {log.postsFetched} واکشی
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Help Tab ─── */}
        <TabsContent value="help" className="space-y-4">
          <Card className="glass-card hover-lift card-inner-glow shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-violet-700 dark:text-violet-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm">
                  <Info className="h-4 w-4 text-white" />
                </div>
                راهنمای استفاده
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* How it works */}
              <div>
                <h3 className="text-sm font-semibold mb-2">🔧 نحوه کارکرد</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  این سیستم به شما امکان می‌دهد محتوای سایت وردپرس خود را به صورت خودکار به Smart CMS منتقل کنید.
                  ابتدا پلاگین را روی سایت وردپرس نصب کنید، سپس تنظیمات اتصال را وارد کنید.
                  سیستم به صورت خودکار محتوای جدید را واکشی و در لیست محتواهای شما نمایش می‌دهد.
                </p>
              </div>

              {/* Sync modes */}
              <div>
                <h3 className="text-sm font-semibold mb-2">🔄 حالت‌های همگام‌سازی</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-900/20 dark:to-cyan-800/10">
                    <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">همگام‌سازی کامل</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">تمام مطالب سایت را از ابتدا واکشی می‌کند</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/10">
                    <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">همگام‌سازی افزایشی</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">فقط مطالب تغییر یافته پس از آخرین همگام‌سازی را واکشی می‌کند</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10">
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">وب‌هوک رئال‌تایم</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">به محض ایجاد/تغییر مطلب در وردپرس، فوراً در CMS ثبت می‌شود</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/10">
                    <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">همگام‌سازی خودکار</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">سرویس پس‌زمینه هر چند دقیقه محتوا را بررسی و واکشی می‌کند</p>
                  </div>
                </div>
              </div>

              {/* Webhook URL */}
              <div>
                <h3 className="text-sm font-semibold mb-2">🔗 آدرس وب‌هوک</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  این آدرس را در تنظیمات پلاگین وردپرس وارد کنید:
                </p>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted font-mono text-xs" dir="ltr">
                  <span className="truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/api/wordpress/webhook</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-6 w-6"
                    onClick={() => {
                      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/wordpress/webhook`
                      navigator.clipboard.writeText(url)
                      toast.success(labels.copied)
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Troubleshooting */}
              <div>
                <h3 className="text-sm font-semibold mb-2">🛠️ عیب‌یابی</h3>
                <div className="space-y-1.5">
                  {[
                    { q: 'خطای ۴۰۴ در زمان همگام‌سازی', a: 'مطمئن شوید پلاگین Smart CMS Bridge روی سایت وردپرس نصب و فعال شده است.' },
                    { q: 'خطای ۴۰۱/۴۰۳ در زمان تست اتصال', a: 'کلید API را بررسی کنید. باید دقیقاً همان کلیدی باشد که در تنظیمات پلاگین وردپرس تولید شده.' },
                    { q: 'مطالب واکشی نمی‌شوند', a: 'مطمئن شوید آدرس سایت به درستی وارد شده و سایت در دسترس باشد. همچنین وب‌هوک URL را بررسی کنید.' },
                    { q: 'سرویس همگام‌سازی آفلاین است', a: 'این مشکل موقتی است. سرویس به طور خودکار دوباره متصل می‌شود. در غیر اینصورت سرور را ری‌استارت کنید.' },
                  ].map((item, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-muted/30">
                      <p className="text-xs font-medium text-amber-600 dark:text-amber-400">❓ {item.q}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">✅ {item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
