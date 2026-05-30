'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Settings2, Globe, Palette, Bell, Shield, Plug, Database,
  Save, Loader2, CheckCircle, Monitor, Sun, Moon,
  Volume2, Smartphone, Clock, Mail, Copy, Trash2,
  Key, ExternalLink, TestTube, Download, RotateCcw,
  RefreshCw, Webhook, Braces, Lock, AlertTriangle,
  Eye, MonitorCheck, Fingerprint, Wifi, Laptop,
  HardDrive, CalendarDays, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'تنظیمات پیشرفته',
  subtitle: 'گزینه‌های پیشرفته‌تر و جامع‌تر برای پیکربندی سیستم',
  save: 'ذخیره تنظیمات',
  saved: 'تنظیمات با موفقیت ذخیره شد!',
  resetDefaults: 'بازگشت به پیش‌فرض‌ها',
  resetConfirm: 'تمام تنظیمات این بخش به حالت پیش‌فرض بازگردانده شدند',

  // Tab 1: General
  general: 'عمومی',
  siteName: 'نام سایت',
  siteDescription: 'توضیحات سایت',
  siteUrl: 'آدرس سایت',
  language: 'زبان',
  timezone: 'منطقه زمانی',
  maintenanceMode: 'حالت تعمیرات',
  maintenanceDesc: 'فعال‌سازی حالت تعمیرات — سایت برای کاربران غیرفعال می‌شود',

  // Tab 2: Design
  design: 'طراحی',
  theme: 'پوسته',
  light: 'روشن',
  dark: 'تاریک',
  system: 'سیستم',
  primaryColor: 'رنگ اصلی',
  borderRadius: 'گردی گوشه‌ها',
  fontSize: 'اندازه فونت',
  small: 'کوچک',
  medium: 'متوسط',
  large: 'بزرگ',
  compactMode: 'حالت فشرده',
  compactDesc: 'نمایش فشرده‌تر عناصر رابط کاربری',

  // Tab 3: Notifications
  notifications: 'اعلان‌ها',
  emailNotifs: 'اعلان‌های ایمیل',
  emailDesc: 'دریافت اعلان‌ها از طریق ایمیل',
  pushNotifs: 'اعلان‌های مرورگر',
  pushDesc: 'دریافت اعلان‌های فوری مرورگر',
  smsNotifs: 'اعلان‌های پیامکی',
  smsDesc: 'دریافت اعلان‌ها از طریق پیامک',
  notifSound: 'صدای اعلان',
  notifSoundDesc: 'پخش صدای هشدار هنگام دریافت اعلان',
  volume: 'صدا',
  quietHours: 'ساعات سکوت',
  quietStart: 'شروع ساعات سکوت',
  quietEnd: 'پایان ساعات سکوت',
  notifDigest: 'خلاصه اعلان‌ها',
  immediate: 'فوری',
  hourly: 'ساعتی',
  daily: 'روزانه',

  // Tab 4: Security
  security: 'امنیت',
  twoFactor: 'احراز هویت دو مرحله‌ای',
  twoFactorDesc: 'افزایش امنیت با احراز هویت دو مرحله‌ای',
  sessionTimeout: 'زمان انقضای نشست',
  ipWhitelist: 'فهرست سفید IP',
  ipWhitelistDesc: 'آدرس‌های IP مجاز (هر آدرس در یک خط)',
  passwordPolicy: 'سیاست رمز عبور',
  minPasswordLength: 'حداقل طول رمز عبور',
  requireUppercase: 'نیاز به حروف بزرگ',
  requireNumbers: 'نیاز به اعداد',
  requireSpecial: 'نیاز به کاراکترهای خاص',
  loginAttempts: 'حداکثر تلاش ورود',
  activeSessions: 'نشست‌های فعال',
  device: 'دستگاه',
  location: 'موقعیت',
  lastActive: 'آخرین فعالیت',
  terminate: 'تخلیه',

  // Tab 5: Integration
  integration: 'یکپارچه‌سازی',
  googleAnalytics: 'شناسه Google Analytics',
  facebookPixel: 'شناسه Facebook Pixel',
  webhookUrl: 'آدرس Webhook',
  testWebhook: 'تست Webhook',
  apiKeyManagement: 'مدیریت کلیدهای API',
  apiKeyName: 'نام کلید',
  apiKeyCreated: 'تاریخ ایجاد',
  apiKeyLastUsed: 'آخرین استفاده',
  copyKey: 'کپی',
  revokeKey: 'لغو',
  oauthProviders: 'ارائه‌دهندگان OAuth',
  connect: 'اتصال',
  disconnect: 'قطع اتصال',

  // Tab 6: Backup
  backup: 'پشتیبان‌گیری',
  autoBackup: 'پشتیبان‌گیری خودکار',
  backupFrequency: 'فرکانس پشتیبان‌گیری',
  daily: 'روزانه',
  weekly: 'هفتگی',
  monthly: 'ماهانه',
  backupRetention: 'نگهداری پشتیبان',
  days: 'روز',
  lastBackup: 'آخرین پشتیبان‌گیری',
  manualBackup: 'پشتیبان‌گیری دستی',
  backupInProgress: 'در حال پشتیبان‌گیری...',
  backupHistory: 'تاریخچه پشتیبان‌گیری',
  backupDate: 'تاریخ',
  backupSize: 'حجم',
  backupType: 'نوع',
  backupDownload: 'دانلود',
  backupRestore: 'بازیابی',
}

// ─── State Interface ──────────────────────────────────────────────────────────

interface GeneralSettings {
  siteName: string
  siteDescription: string
  siteUrl: string
  language: string
  timezone: string
  maintenanceMode: boolean
}

interface DesignSettings {
  theme: string
  primaryColor: string
  borderRadius: number
  fontSize: string
  compactMode: boolean
}

interface NotificationSettings {
  emailNotifs: boolean
  pushNotifs: boolean
  smsNotifs: boolean
  notifSound: boolean
  volume: number
  quietStart: string
  quietEnd: string
  notifDigest: string
}

interface SecuritySettings {
  twoFactor: boolean
  sessionTimeout: string
  ipWhitelist: string
  minPasswordLength: string
  requireUppercase: boolean
  requireNumbers: boolean
  requireSpecial: boolean
  loginAttempts: string
}

interface IntegrationSettings {
  googleAnalytics: string
  facebookPixel: string
  webhookUrl: string
}

interface BackupSettings {
  autoBackup: boolean
  backupFrequency: string
  backupRetention: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockSessions = [
  { id: '1', device: 'Chrome / Windows 11', location: 'تهران، ایران', lastActive: '۵ دقیقه پیش', current: true },
  { id: '2', device: 'Safari / macOS', location: 'اصفهان، ایران', lastActive: '۲ ساعت پیش', current: false },
  { id: '3', device: 'Firefox / Ubuntu', location: 'شیراز، ایران', lastActive: '۱ روز پیش', current: false },
]

const mockApiKeys = [
  { id: '1', name: 'کلید اصلی API', key: 'sk-proj-abc123xyz...', created: '۱۴۰۳/۰۱/۱۵', lastUsed: '۱ ساعت پیش' },
  { id: '2', name: 'کلید وب‌هوک', key: 'whk-456def789...', created: '۱۴۰۳/۰۲/۲۰', lastUsed: '۳ روز پیش' },
]

const mockBackupHistory = [
  { id: '1', date: '۱۴۰۳/۰۳/۱۵ — ۱۲:۳۰', size: '۴۵.۲ مگابایت', type: 'خودکار' },
  { id: '2', date: '۱۴۰۳/۰۳/۱۴ — ۱۲:۳۰', size: '۴۴.۸ مگابایت', type: 'خودکار' },
  { id: '3', date: '۱۴۰۳/۰۳/۱۰ — ۱۵:۴۵', size: '۴۳.۵ مگابایت', type: 'دستی' },
]

const presetColors = [
  { name: 'بنفش', value: 'violet', bg: 'bg-violet-500', ring: 'ring-violet-500' },
  { name: 'فیروزه‌ای', value: 'cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { name: 'سبز', value: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { name: 'صورتی', value: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { name: 'کهربایی', value: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { name: 'آبی', value: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
]

const borderRadiusOptions = [
  { value: 0, label: '۰' },
  { value: 4, label: '۴' },
  { value: 8, label: '۸' },
  { value: 12, label: '۱۲' },
  { value: 16, label: '۱۶' },
  { value: 24, label: '۲۴' },
]

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function SectionCard({ icon, title, accent, children }: {
  icon: React.ReactNode
  title: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <Card className="glass-card card-elevated hover-lift shadow-sm transition-all duration-300">
      <CardHeader className="pb-3">
        <div className={`h-1 w-full rounded-full bg-gradient-to-l ${accent} mb-3 opacity-60`} />
        <CardTitle className={`text-base flex items-center gap-2 text-gradient-violet`}>
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  )
}

// ─── Toggle Row ──────────────────────────────────────────────────────────────

function ToggleRow({ icon, title, description, checked, onCheckedChange, accentColor = 'border-violet-100/50 dark:border-violet-800/20 hover:bg-violet-500/5' }: {
  icon: React.ReactNode
  title: string
  description: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  accentColor?: string
}) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl bg-background/50 border transition-all duration-300 ${accentColor}`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-violet-500 transition-colors duration-300 badge-gradient"
      />
    </div>
  )
}

// ─── Save Button ─────────────────────────────────────────────────────────────

function SaveButton({ saving, onSave, colorClass = 'from-violet-600 to-fuchsia-500' }: {
  saving: boolean
  onSave: () => void
  colorClass?: string
}) {
  return (
    <Button
      onClick={onSave}
      disabled={saving}
      className={`gap-2 animated-underline btn-primary-gradient bg-gradient-to-r ${colorClass} hover:from-violet-700 hover:to-fuchsia-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm`}
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {labels.save}
    </Button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdvancedSettingsPage() {
  const [saving, setSaving] = useState(false)

  // Tab 1: General
  const [general, setGeneral] = useState<GeneralSettings>({
    siteName: 'Smart CMS',
    siteDescription: 'سیستم مدیریت محتوای هوشمند و حرفه‌ای',
    siteUrl: 'https://smartcms.ir',
    language: 'fa',
    timezone: 'Asia/Tehran',
    maintenanceMode: false,
  })

  // Tab 2: Design
  const [design, setDesign] = useState<DesignSettings>({
    theme: 'system',
    primaryColor: 'violet',
    borderRadius: 12,
    fontSize: 'medium',
    compactMode: false,
  })

  // Tab 3: Notifications
  const [notif, setNotif] = useState<NotificationSettings>({
    emailNotifs: true,
    pushNotifs: true,
    smsNotifs: false,
    notifSound: true,
    volume: 70,
    quietStart: '23:00',
    quietEnd: '07:00',
    notifDigest: 'immediate',
  })

  // Tab 4: Security
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactor: false,
    sessionTimeout: '30',
    ipWhitelist: '127.0.0.1\n192.168.1.0/24',
    minPasswordLength: '8',
    requireUppercase: true,
    requireNumbers: true,
    requireSpecial: false,
    loginAttempts: '5',
  })

  // Tab 5: Integration
  const [integration, setIntegration] = useState<IntegrationSettings>({
    googleAnalytics: 'G-XXXXXXXXXX',
    facebookPixel: '',
    webhookUrl: 'https://smartcms.ir/api/webhook',
  })

  // Tab 6: Backup
  const [backup, setBackup] = useState<BackupSettings>({
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: '30',
  })
  const [backupLoading, setBackupLoading] = useState(false)

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleSave = (section: string) => {
    setSaving(true)
    setTimeout(() => {
      toast.success(labels.saved)
      setSaving(false)
    }, 800)
  }

  const handleResetDesign = () => {
    setDesign({
      theme: 'system',
      primaryColor: 'violet',
      borderRadius: 12,
      fontSize: 'medium',
      compactMode: false,
    })
    toast.success(labels.resetConfirm)
  }

  const handleTestWebhook = () => {
    toast.success('تست وب‌هوک ارسال شد — پاسخ موفق')
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      toast.success('کلید کپی شد')
    })
  }

  const handleRevokeKey = (name: string) => {
    toast.success(`کلید "${name}" لغو شد`)
  }

  const handleManualBackup = () => {
    setBackupLoading(true)
    setTimeout(() => {
      setBackupLoading(false)
      toast.success('پشتیبان‌گیری با موفقیت انجام شد')
    }, 2500)
  }

  const handleTerminateSession = (device: string) => {
    toast.success(`نشست "${device}" تخلیه شد`)
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter stagger-children">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-violet-500" />
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <Badge className="badge-gradient-violet text-xs px-3 py-1">
          پیشرفته
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" dir="rtl" className="space-y-4 card-gradient-border p-4 md:p-6 rounded-xl">
        <TabsList className="bg-violet-100 dark:bg-violet-900/30 h-11 shadow-sm flex-wrap">
          <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200">
            <Globe className="h-4 w-4" />{labels.general}
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200">
            <Palette className="h-4 w-4" />{labels.design}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all duration-200">
            <Bell className="h-4 w-4" />{labels.notifications}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all duration-200">
            <Shield className="h-4 w-4" />{labels.security}
          </TabsTrigger>
          <TabsTrigger value="integration" className="gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white transition-all duration-200">
            <Plug className="h-4 w-4" />{labels.integration}
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all duration-200">
            <Database className="h-4 w-4" />{labels.backup}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════ Tab 1: General ═══════════════ */}
        <TabsContent value="general" className="animate-in">
          <SectionCard
            icon={<Globe className="h-5 w-5 text-violet-500" />}
            title="تنظیمات عمومی سایت"
            accent="from-violet-400 to-purple-500"
          >
            <div className="space-y-2">
              <Label>{labels.siteName}</Label>
              <Input
                value={general.siteName}
                onChange={e => setGeneral(p => ({ ...p, siteName: e.target.value }))}
                className="transition-all duration-200 focus:shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>{labels.siteDescription}</Label>
              <Textarea
                value={general.siteDescription}
                onChange={e => setGeneral(p => ({ ...p, siteDescription: e.target.value }))}
                rows={3}
                className="transition-all duration-200 focus:shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>{labels.siteUrl}</Label>
              <Input
                value={general.siteUrl}
                onChange={e => setGeneral(p => ({ ...p, siteUrl: e.target.value }))}
                dir="ltr"
                className="transition-all duration-200 focus:shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.language}</Label>
                <Select value={general.language} onValueChange={v => setGeneral(p => ({ ...p, language: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fa">فارسی</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="tr">Türkçe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.timezone}</Label>
                <Select value={general.timezone} onValueChange={v => setGeneral(p => ({ ...p, timezone: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Tehran">Asia/Tehran (UTC+3:30)</SelectItem>
                    <SelectItem value="UTC">UTC (UTC+0:00)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4:00)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (UTC+0:00)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (UTC-5:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-2" />

            <ToggleRow
              icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
              title={labels.maintenanceMode}
              description={labels.maintenanceDesc}
              checked={general.maintenanceMode}
              onCheckedChange={v => setGeneral(p => ({ ...p, maintenanceMode: v }))}
              accentColor="border-amber-100/50 dark:border-amber-800/20 hover:bg-amber-500/5"
            />

            <SaveButton saving={saving} onSave={() => handleSave('general')} colorClass="from-violet-600 to-purple-500" />
          </SectionCard>
        </TabsContent>

        {/* ═══════════════ Tab 2: Design ═══════════════ */}
        <TabsContent value="design" className="animate-in">
          <SectionCard
            icon={<Palette className="h-5 w-5 text-violet-500" />}
            title="تنظیمات طراحی و ظاهر"
            accent="from-violet-400 to-fuchsia-500"
          >
            {/* Theme Selector — 3 Radio Cards */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.theme}</Label>
              <p className="text-xs text-muted-foreground">انتخاب پوسته مورد نظر برای رابط کاربری</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {[
                  { value: 'light', label: labels.light, sublabel: 'پس‌زمینه روشن', icon: <Sun className="h-8 w-8 text-amber-400" />, previewGradient: 'from-gray-100 to-white' },
                  { value: 'dark', label: labels.dark, sublabel: 'پس‌زمینه تاریک', icon: <Moon className="h-8 w-8 text-indigo-300" />, previewGradient: 'from-gray-800 to-gray-900' },
                  { value: 'system', label: labels.system, sublabel: 'پیروی از تنظیمات سیستم', icon: <Monitor className="h-8 w-8 text-gray-500" />, previewGradient: 'from-gray-200 via-gray-700 to-gray-200' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer group hover:scale-[1.03] ${
                      design.theme === opt.value
                        ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 shadow-lg shadow-violet-500/10'
                        : 'border-border hover:border-violet-300 dark:hover:border-violet-700 bg-card'
                    }`}
                    onClick={() => setDesign(p => ({ ...p, theme: opt.value }))}
                  >
                    {design.theme === opt.value && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center animate-in zoom-in-50 duration-200">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${opt.previewGradient} flex items-center justify-center transition-all duration-300 ${
                      design.theme === opt.value ? 'shadow-md' : 'shadow-sm group-hover:shadow-md'
                    }`}>
                      {opt.icon}
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium transition-colors ${design.theme === opt.value ? 'text-violet-700 dark:text-violet-300' : 'text-foreground'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{opt.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Color — 6 Preset Colors */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">{labels.primaryColor}</Label>
              <div className="flex flex-wrap gap-3">
                {presetColors.map(color => (
                  <button
                    key={color.value}
                    className={`w-10 h-10 rounded-full ${color.bg} transition-all duration-200 cursor-pointer hover:scale-110 ${
                      design.primaryColor === color.value
                        ? `ring-2 ring-offset-2 ${color.ring} ring-offset-background scale-110`
                        : 'ring-1 ring-black/10 dark:ring-white/10'
                    }`}
                    onClick={() => setDesign(p => ({ ...p, primaryColor: color.value }))}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Border Radius Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{labels.borderRadius}</Label>
                <Badge variant="secondary" className="text-xs">{borderRadiusOptions.find(o => o.value === design.borderRadius)?.label ?? design.borderRadius}px</Badge>
              </div>
              <Slider
                value={[design.borderRadius]}
                onValueChange={v => setDesign(p => ({ ...p, borderRadius: v[0] }))}
                min={0}
                max={24}
                step={4}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                {borderRadiusOptions.map(opt => (
                  <span key={opt.value}>{opt.label}</span>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.fontSize}</Label>
              <div className="flex gap-3">
                {[
                  { value: 'small', label: labels.small },
                  { value: 'medium', label: labels.medium },
                  { value: 'large', label: labels.large },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
                      design.fontSize === opt.value
                        ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-300'
                        : 'border-border bg-card hover:border-violet-300 dark:hover:border-violet-700'
                    }`}
                    onClick={() => setDesign(p => ({ ...p, fontSize: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Mode */}
            <ToggleRow
              icon={<Palette className="h-4 w-4 text-violet-500" />}
              title={labels.compactMode}
              description={labels.compactDesc}
              checked={design.compactMode}
              onCheckedChange={v => setDesign(p => ({ ...p, compactMode: v }))}
            />

            <div className="flex gap-3">
              <SaveButton saving={saving} onSave={() => handleSave('design')} colorClass="from-violet-600 to-fuchsia-500" />
              <Button
                variant="outline"
                onClick={handleResetDesign}
                className="gap-2 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4" />
                {labels.resetDefaults}
              </Button>
            </div>
          </SectionCard>
        </TabsContent>

        {/* ═══════════════ Tab 3: Notifications ═══════════════ */}
        <TabsContent value="notifications" className="animate-in">
          <SectionCard
            icon={<Bell className="h-5 w-5 text-amber-500" />}
            title="تنظیمات اعلان‌ها"
            accent="from-amber-400 to-orange-500"
          >
            <ToggleRow
              icon={<Mail className="h-4 w-4 text-blue-500" />}
              title={labels.emailNotifs}
              description={labels.emailDesc}
              checked={notif.emailNotifs}
              onCheckedChange={v => setNotif(p => ({ ...p, emailNotifs: v }))}
              accentColor="border-blue-100/50 dark:border-blue-800/20 hover:bg-blue-500/5"
            />

            <ToggleRow
              icon={<Bell className="h-4 w-4 text-amber-500" />}
              title={labels.pushNotifs}
              description={labels.pushDesc}
              checked={notif.pushNotifs}
              onCheckedChange={v => setNotif(p => ({ ...p, pushNotifs: v }))}
              accentColor="border-amber-100/50 dark:border-amber-800/20 hover:bg-amber-500/5"
            />

            <ToggleRow
              icon={<Smartphone className="h-4 w-4 text-emerald-500" />}
              title={labels.smsNotifs}
              description={labels.smsDesc}
              checked={notif.smsNotifs}
              onCheckedChange={v => setNotif(p => ({ ...p, smsNotifs: v }))}
              accentColor="border-emerald-100/50 dark:border-emerald-800/20 hover:bg-emerald-500/5"
            />

            <Separator className="my-2" />

            {/* Notification Sound with Volume */}
            <ToggleRow
              icon={<Volume2 className="h-4 w-4 text-violet-500" />}
              title={labels.notifSound}
              description={labels.notifSoundDesc}
              checked={notif.notifSound}
              onCheckedChange={v => setNotif(p => ({ ...p, notifSound: v }))}
              accentColor="border-violet-100/50 dark:border-violet-800/20 hover:bg-violet-500/5"
            />

            {notif.notifSound && (
              <div className="space-y-2 pr-12 animate-in">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">{labels.volume}</Label>
                  <span className="text-xs text-muted-foreground">{notif.volume}%</span>
                </div>
                <Slider
                  value={[notif.volume]}
                  onValueChange={v => setNotif(p => ({ ...p, volume: v[0] }))}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            )}

            <Separator className="my-2" />

            {/* Quiet Hours */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Moon className="h-4 w-4 text-indigo-500" />
                {labels.quietHours}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{labels.quietStart}</Label>
                  <Input
                    type="time"
                    value={notif.quietStart}
                    onChange={e => setNotif(p => ({ ...p, quietStart: e.target.value }))}
                    dir="ltr"
                    className="text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{labels.quietEnd}</Label>
                  <Input
                    type="time"
                    value={notif.quietEnd}
                    onChange={e => setNotif(p => ({ ...p, quietEnd: e.target.value }))}
                    dir="ltr"
                    className="text-center"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Notification Digest */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-violet-500" />
                {labels.notifDigest}
              </Label>
              <div className="flex gap-3">
                {[
                  { value: 'immediate', label: labels.immediate },
                  { value: 'hourly', label: labels.hourly },
                  { value: 'daily', label: labels.daily },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
                      notif.notifDigest === opt.value
                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300'
                        : 'border-border bg-card hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                    onClick={() => setNotif(p => ({ ...p, notifDigest: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <SaveButton saving={saving} onSave={() => handleSave('notifications')} colorClass="from-amber-600 to-orange-500" />
          </SectionCard>
        </TabsContent>

        {/* ═══════════════ Tab 4: Security ═══════════════ */}
        <TabsContent value="security" className="animate-in space-y-4">
          {/* Security Settings */}
          <SectionCard
            icon={<Shield className="h-5 w-5 text-red-500" />}
            title="تنظیمات امنیتی"
            accent="from-red-400 to-rose-500"
          >
            <ToggleRow
              icon={<Fingerprint className="h-4 w-4 text-violet-500" />}
              title={labels.twoFactor}
              description={labels.twoFactorDesc}
              checked={security.twoFactor}
              onCheckedChange={v => setSecurity(p => ({ ...p, twoFactor: v }))}
              accentColor="border-violet-100/50 dark:border-violet-800/20 hover:bg-violet-500/5"
            />

            {/* Session Timeout */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.sessionTimeout}</Label>
              <Select value={security.sessionTimeout} onValueChange={v => setSecurity(p => ({ ...p, sessionTimeout: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">۱۵ دقیقه</SelectItem>
                  <SelectItem value="30">۳۰ دقیقه</SelectItem>
                  <SelectItem value="60">۱ ساعت</SelectItem>
                  <SelectItem value="120">۲ ساعت</SelectItem>
                  <SelectItem value="240">۴ ساعت</SelectItem>
                  <SelectItem value="never">هرگز</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* IP Whitelist */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.ipWhitelist}</Label>
              <p className="text-xs text-muted-foreground">{labels.ipWhitelistDesc}</p>
              <Textarea
                value={security.ipWhitelist}
                onChange={e => setSecurity(p => ({ ...p, ipWhitelist: e.target.value }))}
                rows={3}
                dir="ltr"
                className="font-mono text-xs transition-all duration-200 focus:shadow-sm"
              />
            </div>

            <Separator className="my-2" />

            {/* Password Policy */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-500" />
                {labels.passwordPolicy}
              </Label>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{labels.minPasswordLength}</Label>
                <Select value={security.minPasswordLength} onValueChange={v => setSecurity(p => ({ ...p, minPasswordLength: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">۶</SelectItem>
                    <SelectItem value="8">۸</SelectItem>
                    <SelectItem value="10">۱۰</SelectItem>
                    <SelectItem value="12">۱۲</SelectItem>
                    <SelectItem value="16">۱۶</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ToggleRow
                icon={<CheckCircle className="h-4 w-4 text-blue-500" />}
                title={labels.requireUppercase}
                description="رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد"
                checked={security.requireUppercase}
                onCheckedChange={v => setSecurity(p => ({ ...p, requireUppercase: v }))}
                accentColor="border-blue-100/50 dark:border-blue-800/20 hover:bg-blue-500/5"
              />

              <ToggleRow
                icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}
                title={labels.requireNumbers}
                description="رمز عبور باید حداقل یک عدد داشته باشد"
                checked={security.requireNumbers}
                onCheckedChange={v => setSecurity(p => ({ ...p, requireNumbers: v }))}
                accentColor="border-emerald-100/50 dark:border-emerald-800/20 hover:bg-emerald-500/5"
              />

              <ToggleRow
                icon={<CheckCircle className="h-4 w-4 text-amber-500" />}
                title={labels.requireSpecial}
                description="رمز عبور باید حداقل یک کاراکتر خاص (!@#$...) داشته باشد"
                checked={security.requireSpecial}
                onCheckedChange={v => setSecurity(p => ({ ...p, requireSpecial: v }))}
                accentColor="border-amber-100/50 dark:border-amber-800/20 hover:bg-amber-500/5"
              />
            </div>

            {/* Login Attempts */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.loginAttempts}</Label>
              <Select value={security.loginAttempts} onValueChange={v => setSecurity(p => ({ ...p, loginAttempts: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">۳ بار</SelectItem>
                  <SelectItem value="5">۵ بار</SelectItem>
                  <SelectItem value="10">۱۰ بار</SelectItem>
                  <SelectItem value="unlimited">نامحدود</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SaveButton saving={saving} onSave={() => handleSave('security')} colorClass="from-red-600 to-rose-500" />
          </SectionCard>

          {/* Active Sessions */}
          <SectionCard
            icon={<Wifi className="h-5 w-5 text-violet-500" />}
            title={labels.activeSessions}
            accent="from-violet-400 to-purple-500"
          >
            <div className="space-y-3">
              {mockSessions.map(session => (
                <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-background/50 border border-border hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-200 list-item-hover">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                      <Laptop className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{session.device}</p>
                        {session.current && (
                          <Badge className="badge-gradient-emerald text-[10px] px-2 py-0">فعال</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {session.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.lastActive}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20 hover:text-red-700 transition-all duration-200"
                      onClick={() => handleTerminateSession(session.device)}
                    >
                      <Trash2 className="h-3.5 w-3.5 ml-1" />
                      {labels.terminate}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* ═══════════════ Tab 5: Integration ═══════════════ */}
        <TabsContent value="integration" className="animate-in space-y-4">
          {/* Analytics */}
          <SectionCard
            icon={<Plug className="h-5 w-5 text-cyan-500" />}
            title="تحلیل و پیگیری"
            accent="from-cyan-400 to-blue-500"
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Webhook className="h-4 w-4 text-violet-500" />
                {labels.googleAnalytics}
              </Label>
              <Input
                value={integration.googleAnalytics}
                onChange={e => setIntegration(p => ({ ...p, googleAnalytics: e.target.value }))}
                dir="ltr"
                placeholder="G-XXXXXXXXXX"
                className="transition-all duration-200 focus:shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-blue-500" />
                {labels.facebookPixel}
              </Label>
              <Input
                value={integration.facebookPixel}
                onChange={e => setIntegration(p => ({ ...p, facebookPixel: e.target.value }))}
                dir="ltr"
                placeholder="XXXXXXXXXXXXXXX"
                className="transition-all duration-200 focus:shadow-sm"
              />
            </div>
          </SectionCard>

          {/* Webhook */}
          <SectionCard
            icon={<Webhook className="h-5 w-5 text-violet-500" />}
            title="وب‌هوک"
            accent="from-violet-400 to-purple-500"
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.webhookUrl}</Label>
              <div className="flex gap-2">
                <Input
                  value={integration.webhookUrl}
                  onChange={e => setIntegration(p => ({ ...p, webhookUrl: e.target.value }))}
                  dir="ltr"
                  className="transition-all duration-200 focus:shadow-sm flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestWebhook}
                  className="gap-1.5 shrink-0 text-violet-600 border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:hover:bg-violet-950/20"
                >
                  <TestTube className="h-4 w-4" />
                  <span className="hidden sm:inline">{labels.testWebhook}</span>
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* API Key Management */}
          <SectionCard
            icon={<Key className="h-5 w-5 text-amber-500" />}
            title={labels.apiKeyManagement}
            accent="from-amber-400 to-orange-500"
          >
            <div className="space-y-3">
              {mockApiKeys.map(apiKey => (
                <div key={apiKey.id} className="p-4 rounded-xl bg-background/50 border border-border hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 list-item-hover">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Braces className="h-4 w-4 text-amber-500" />
                        {apiKey.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {labels.apiKeyCreated}: {apiKey.created}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {labels.apiKeyLastUsed}: {apiKey.lastUsed}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-1.5 bg-muted/50 rounded px-2 py-1 inline-block" dir="ltr">
                        {apiKey.key}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:hover:bg-violet-950/20"
                        onClick={() => handleCopyKey(apiKey.key)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {labels.copyKey}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20"
                        onClick={() => handleRevokeKey(apiKey.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {labels.revokeKey}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* OAuth Providers */}
          <SectionCard
            icon={<MonitorCheck className="h-5 w-5 text-emerald-500" />}
            title={labels.oauthProviders}
            accent="from-emerald-400 to-teal-500"
          >
            <div className="space-y-3">
              {[
                { name: 'Google', connected: true, color: 'border-red-200 dark:border-red-800' },
                { name: 'GitHub', connected: true, color: 'border-gray-200 dark:border-gray-700' },
                { name: 'GitLab', connected: false, color: 'border-orange-200 dark:border-orange-800' },
              ].map(provider => (
                <div key={provider.name} className={`flex items-center justify-between p-4 rounded-xl bg-background/50 border ${provider.color} transition-all duration-200 list-item-hover`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {provider.connected ? 'متصل' : 'متصل نیست'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={provider.connected ? 'outline' : 'default'}
                    size="sm"
                    className={`transition-all duration-200 ${
                      provider.connected
                        ? 'text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white'
                    }`}
                    onClick={() => toast.success(provider.connected ? `اتصال ${provider.name} قطع شد` : `${provider.name} متصل شد`)}
                  >
                    {provider.connected ? labels.disconnect : labels.connect}
                  </Button>
                </div>
              ))}
            </div>

            <SaveButton saving={saving} onSave={() => handleSave('integration')} colorClass="from-cyan-600 to-blue-500" />
          </SectionCard>
        </TabsContent>

        {/* ═══════════════ Tab 6: Backup ═══════════════ */}
        <TabsContent value="backup" className="animate-in space-y-4">
          {/* Backup Settings */}
          <SectionCard
            icon={<Database className="h-5 w-5 text-emerald-500" />}
            title="تنظیمات پشتیبان‌گیری"
            accent="from-emerald-400 to-teal-500"
          >
            <ToggleRow
              icon={<HardDrive className="h-4 w-4 text-emerald-500" />}
              title={labels.autoBackup}
              description="ایجاد خودکار پشتیبان از داده‌ها"
              checked={backup.autoBackup}
              onCheckedChange={v => setBackup(p => ({ ...p, autoBackup: v }))}
              accentColor="border-emerald-100/50 dark:border-emerald-800/20 hover:bg-emerald-500/5"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{labels.backupFrequency}</Label>
                <Select value={backup.backupFrequency} onValueChange={v => setBackup(p => ({ ...p, backupFrequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{labels.daily}</SelectItem>
                    <SelectItem value="weekly">{labels.weekly}</SelectItem>
                    <SelectItem value="monthly">{labels.monthly}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{labels.backupRetention}</Label>
                <Select value={backup.backupRetention} onValueChange={v => setBackup(p => ({ ...p, backupRetention: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">۷ {labels.days}</SelectItem>
                    <SelectItem value="14">۱۴ {labels.days}</SelectItem>
                    <SelectItem value="30">۳۰ {labels.days}</SelectItem>
                    <SelectItem value="90">۹۰ {labels.days}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          {/* Last Backup Info */}
          <Card className="glass-card card-elevated shadow-sm transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <Database className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gradient-violet">{labels.lastBackup}</p>
                    <p className="text-lg font-bold mt-0.5" dir="rtl">۱۴۰۳/۰۳/۱۵ — ۱۲:۳۰</p>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                      <HardDrive className="h-3.5 w-3.5" />
                      ۴۵.۲ مگابایت
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleManualBackup}
                  disabled={backupLoading}
                  className="gap-2 btn-primary-gradient bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm shine-effect"
                >
                  {backupLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {labels.backupInProgress}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      {labels.manualBackup}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Backup History */}
          <SectionCard
            icon={<Clock className="h-5 w-5 text-violet-500" />}
            title={labels.backupHistory}
            accent="from-violet-400 to-purple-500"
          >
            <div className="space-y-3">
              {mockBackupHistory.map(entry => (
                <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-background/50 border border-border hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-200 list-item-hover">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                      <Database className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" dir="rtl">{entry.date}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {entry.size}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                          {entry.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50 dark:border-violet-800 dark:hover:bg-violet-950/20"
                      onClick={() => toast.success('دانلود پشتیبان شروع شد')}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {labels.backupDownload}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/20"
                      onClick={() => toast.success('بازیابی پشتیبان شروع شد')}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {labels.backupRestore}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <SaveButton saving={saving} onSave={() => handleSave('backup')} colorClass="from-emerald-600 to-teal-500" />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
