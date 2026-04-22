'use client'

import { useState } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Settings, Globe, Search, Bot, FileText, Shield,
  Save, CheckCircle, Loader2, Palette, Bell, Lock,
  Sun, Moon, Monitor, Volume2, VolumeX, Mail, KeyRound,
  Smartphone, Clock, AlertTriangle, Eye, EyeOff, UserX, Database,
} from 'lucide-react'
import dynamic from 'next/dynamic'
const BackupPanel = dynamic(() => import('./BackupPanel'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
    </div>
  ),
})
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'تنظیمات',
  subtitle: 'پیکربندی سیستم مدیریت محتوا',
  save: 'ذخیره',
  saved: 'تنظیمات با موفقیت ذخیره شد!',
  general: 'عمومی',
  seo: 'سئو',
  ai: 'هوش مصنوعی',
  content: 'محتوا',
  security: 'امنیت',
  appearance: 'ظاهری',
  notifications: 'اعلان‌ها',
  siteName: 'نام سایت',
  siteDescription: 'توضیحات سایت',
  language: 'زبان',
  timezone: 'منطقه زمانی',
  metaTitle: 'قالب عنوان متا',
  metaDesc: 'متا توضیحات',
  robots: 'ربات‌ها',
  defaultModel: 'مدل پیش‌فرض',
  provider: 'ارائه‌دهنده',
  apiEndpoint: 'آدرس API',
  maxTokens: 'حداکثر توکن',
  postsPerPage: 'مطلب در هر صفحه',
  defaultCategory: 'دسته‌بندی پیش‌فرض',
  autoSave: 'ذخیره خودکار',
  autoSaveInterval: 'فاصله ذخیره خودکار (ثانیه)',
  twoFactor: 'احراز هویت دو مرحله‌ای',
  passwordPolicy: 'سیاست رمز عبور',
  sessionTimeout: 'زمان انقضای نشست (دقیقه)',
  minPasswordLength: 'حداقل طول رمز عبور',
  // Appearance labels
  theme: 'پوسته',
  light: 'روشن',
  dark: 'تاریک',
  system: 'سیستم',
  sidebarDefault: 'حالت پیش‌فرض سایدبار',
  expanded: 'باز',
  collapsed: 'جمع‌شده',
  fontSize: 'اندازه فونت',
  small: 'کوچک',
  medium: 'متوسط',
  large: 'بزرگ',
  compactMode: 'حالت فشرده',
  // Notification labels
  emailNotifs: 'اعلان‌های ایمیل',
  pushNotifs: 'اعلان‌های مرورگر',
  soundAlerts: 'هشدار صوتی',
  activityDigest: 'خلاصه فعالیت‌ها',
  // Security labels
  changePassword: 'تغییر رمز عبور',
  currentPassword: 'رمز عبور فعلی',
  newPassword: 'رمز عبور جدید',
  confirmPassword: 'تکرار رمز عبور',
  lastLogin: 'آخرین ورود',
  deactivateAccount: 'غیرفعال‌سازی حساب کاربری',
  deactivateConfirm: 'آیا از غیرفعال‌سازی حساب کاربری خود مطمئن هستید؟ این عمل قابل بازگشت نیست.',
  deactivateWarning: 'با غیرفعال‌سازی، دسترسی شما به سیستم قطع خواهد شد و تمام نشست‌های فعال پایان می‌یابند.',
}

// ─── Settings Form State ──────────────────────────────────────────────────────

interface SettingsForm {
  siteName: string; siteDescription: string; language: string; timezone: string
  metaTitle: string; metaDesc: string; robots: string
  defaultModel: string; provider: string; apiEndpoint: string; maxTokens: string
  postsPerPage: string; defaultCategory: string; autoSave: boolean; autoSaveInterval: string
  twoFactor: boolean; passwordPolicy: string; sessionTimeout: string; minPasswordLength: string
  // Appearance
  sidebarDefault: string; fontSize: string; compactMode: boolean
  // Notifications
  emailNotifs: boolean; pushNotifs: boolean; soundAlerts: boolean; activityDigest: boolean
}

const defaultSettings: SettingsForm = {
  siteName: 'سیستم مدیریت محتوا', siteDescription: 'یک سیستم مدیریت محتوا هوشمند',
  language: 'fa', timezone: 'Asia/Tehran',
  metaTitle: '%title% | %sitename%', metaDesc: 'سیستم مدیریت محتوا هوشمند - تولید و مدیریت محتوای حرفه‌ای', robots: 'index, follow',
  defaultModel: 'GLM-5-turbo', provider: 'glm', apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4', maxTokens: '2048',
  postsPerPage: '10', defaultCategory: '', autoSave: true, autoSaveInterval: '30',
  twoFactor: false, passwordPolicy: 'strong', sessionTimeout: '60', minPasswordLength: '8',
  // Appearance
  sidebarDefault: 'expanded', fontSize: 'medium', compactMode: false,
  // Notifications
  emailNotifs: true, pushNotifs: true, soundAlerts: true, activityDigest: false,
}

// ─── Gradient Accent Bar ──────────────────────────────────────────────────────

function GradientAccent({ colors }: { colors: string }) {
  return (
    <div className={`h-1 w-full rounded-full bg-gradient-to-l ${colors} mb-3 opacity-60`} />
  )
}

// ─── Section Wrapper ─────────────────────────────────────────────────────────

function SettingsSection({ icon, title, children, color, accent }: {
  icon: React.ReactNode; title: string; children: React.ReactNode;
  color: string; accent?: string
}) {
  return (
    <Card className="glass-card hover-lift shadow-sm transition-all duration-300">
      <CardHeader className="pb-3">
        {accent && <GradientAccent colors={accent} />}
        <CardTitle className={`text-base flex items-center gap-2 ${color}`}>
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

function ToggleRow({
  icon, title, description, checked, onCheckedChange, accentColor = 'border-violet-100/50 dark:border-violet-800/20 hover:bg-violet-500/5',
}: {
  icon: React.ReactNode; title: string; description: string
  checked: boolean; onCheckedChange: (v: boolean) => void; accentColor?: string
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
        className="data-[state=checked]:bg-violet-500 transition-colors duration-300"
      />
    </div>
  )
}

// ─── Theme Card ───────────────────────────────────────────────────────────────

function ThemeCard({
  value, currentValue, onChange, label, sublabel, icon, previewGradient,
}: {
  value: string; currentValue: string; onChange: (v: string) => void
  label: string; sublabel: string; icon: React.ReactNode; previewGradient: string
}) {
  const isActive = currentValue === value
  return (
    <button
      className={`relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer group hover:scale-[1.03] ${
        isActive
          ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 shadow-lg shadow-violet-500/10'
          : 'border-border hover:border-violet-300 dark:hover:border-violet-700 bg-card'
      }`}
      onClick={() => onChange(value)}
    >
      {isActive && (
        <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center animate-in zoom-in-50 duration-200">
          <CheckCircle className="h-3 w-3 text-white" />
        </div>
      )}
      {/* Preview illustration */}
      <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${previewGradient} flex items-center justify-center transition-all duration-300 ${
        isActive ? 'shadow-md' : 'shadow-sm group-hover:shadow-md'
      }`}>
        {icon}
      </div>
      <div className="text-center">
        <p className={`text-sm font-medium transition-colors ${isActive ? 'text-violet-700 dark:text-violet-300' : 'text-foreground'}`}>
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sublabel}</p>
      </div>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  useEnsureData(['settings'])
  const { bulkUpdateSettings } = useCMS()
  const { theme, setTheme } = useTheme()

  const [form, setForm] = useState<SettingsForm>(defaultSettings)
  const [saving, setSaving] = useState(false)

  // Change password state
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })

  const handleSave = (group: string) => {
    setSaving(true)
    const groupKeys: Record<string, (keyof SettingsForm)[]> = {
      general: ['siteName', 'siteDescription', 'language', 'timezone'],
      seo: ['metaTitle', 'metaDesc', 'robots'],
      ai: ['defaultModel', 'provider', 'apiEndpoint', 'maxTokens'],
      content: ['postsPerPage', 'defaultCategory', 'autoSave', 'autoSaveInterval'],
      security: ['twoFactor', 'passwordPolicy', 'sessionTimeout', 'minPasswordLength'],
      appearance: ['sidebarDefault', 'fontSize', 'compactMode'],
      notifications: ['emailNotifs', 'pushNotifs', 'soundAlerts', 'activityDigest'],
    }
    const keys = groupKeys[group] ?? []
    const items = keys.map(key => ({
      key, value: String(form[key]), group: group as 'general' | 'seo' | 'ai' | 'content' | 'security' | 'appearance' | 'notifications',
    }))
    bulkUpdateSettings.mutate(items, {
      onSuccess: () => { toast.success(labels.saved); setSaving(false) },
      onError: () => { toast.error('خطا در ذخیره تنظیمات'); setSaving(false) },
    })
  }

  const updateField = (field: keyof SettingsForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleChangePassword = () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      toast.error('لطفاً تمام فیلدها را پر کنید')
      return
    }
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error('رمز عبور جدید و تکرار آن مطابقت ندارند')
      return
    }
    if (pwForm.newPw.length < 8) {
      toast.error('رمز عبور جدید باید حداقل ۸ کاراکتر باشد')
      return
    }
    toast.success('رمز عبور با موفقیت تغییر کرد')
    setPwForm({ current: '', newPw: '', confirm: '' })
  }

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
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-teal-100 dark:bg-teal-900/30 h-11 shadow-sm flex-wrap">
          <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-200">
            <Globe className="h-4 w-4" />{labels.general}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200">
            <Palette className="h-4 w-4" />{labels.appearance}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-amber-600 data-[state=active]:text-white transition-all duration-200">
            <Bell className="h-4 w-4" />{labels.notifications}
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-200">
            <Search className="h-4 w-4" />{labels.seo}
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-200">
            <Bot className="h-4 w-4" />{labels.ai}
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white transition-all duration-200">
            <FileText className="h-4 w-4" />{labels.content}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white transition-all duration-200">
            <Shield className="h-4 w-4" />{labels.security}
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200">
            <Database className="h-4 w-4" />بکاپ
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════ General ═══════════════ */}
        <TabsContent value="general" className="animate-in">
          <SettingsSection icon={<Globe className="h-5 w-5" />} title="تنظیمات عمومی" color="text-teal-700 dark:text-teal-300" accent="from-teal-400 to-teal-600">
            <div className="space-y-2">
              <Label>{labels.siteName}</Label>
              <Input value={form.siteName} onChange={e => updateField('siteName', e.target.value)} className="transition-all duration-200 focus:shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label>{labels.siteDescription}</Label>
              <Input value={form.siteDescription} onChange={e => updateField('siteDescription', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.language}</Label>
                <Select value={form.language} onValueChange={v => updateField('language', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fa">فارسی</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.timezone}</Label>
                <Select value={form.timezone} onValueChange={v => updateField('timezone', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Tehran">Asia/Tehran (UTC+3:30)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4:00)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (UTC+0:00)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (UTC-5:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={() => handleSave('general')} disabled={saving} className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{labels.save}
            </Button>
          </SettingsSection>
        </TabsContent>

        {/* ═══════════════ Appearance ═══════════════ */}
        <TabsContent value="appearance" className="animate-in">
          <SettingsSection icon={<Palette className="h-5 w-5" />} title="تنظیمات ظاهری" color="text-violet-700 dark:text-violet-300" accent="from-violet-400 to-fuchsia-500">

            {/* Theme Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.theme}</Label>
              <p className="text-xs text-muted-foreground">انتخاب پوسته مورد نظر برای رابط کاربری</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <ThemeCard
                  value="light"
                  currentValue={theme ?? 'system'}
                  onChange={setTheme}
                  label={labels.light}
                  sublabel="پس‌زمینه روشن"
                  icon={<Sun className="h-8 w-8 text-amber-400" />}
                  previewGradient="from-gray-100 to-white"
                />
                <ThemeCard
                  value="dark"
                  currentValue={theme ?? 'system'}
                  onChange={setTheme}
                  label={labels.dark}
                  sublabel="پس‌زمینه تاریک"
                  icon={<Moon className="h-8 w-8 text-indigo-300" />}
                  previewGradient="from-gray-800 to-gray-900"
                />
                <ThemeCard
                  value="system"
                  currentValue={theme ?? 'system'}
                  onChange={setTheme}
                  label={labels.system}
                  sublabel="پیروی از تنظیمات سیستم"
                  icon={<Monitor className="h-8 w-8 text-gray-500" />}
                  previewGradient="from-gray-200 via-gray-700 to-gray-200"
                />
              </div>
            </div>

            {/* Sidebar Default State */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-violet-100/50 dark:border-violet-800/20 transition-all duration-300 hover:bg-violet-500/5">
              <div>
                <p className="text-sm font-medium">{labels.sidebarDefault}</p>
                <p className="text-xs text-muted-foreground">حالت پیش‌فرض منوی کناری هنگام ورود</p>
              </div>
              <div className="flex rounded-lg border border-border/60 overflow-hidden">
                <button
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                    form.sidebarDefault === 'expanded'
                      ? 'bg-violet-500 text-white'
                      : 'bg-transparent text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => updateField('sidebarDefault', 'expanded')}
                >
                  {labels.expanded}
                </button>
                <button
                  className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                    form.sidebarDefault === 'collapsed'
                      ? 'bg-violet-500 text-white'
                      : 'bg-transparent text-muted-foreground hover:bg-muted'
                  }`}
                  onClick={() => updateField('sidebarDefault', 'collapsed')}
                >
                  {labels.collapsed}
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.fontSize}</Label>
              <RadioGroup
                value={form.fontSize}
                onValueChange={v => updateField('fontSize', v)}
                className="flex gap-3"
                dir="rtl"
              >
                {[
                  { value: 'small', label: labels.small, desc: 'کوچک' },
                  { value: 'medium', label: labels.medium, desc: 'متوسط' },
                  { value: 'large', label: labels.large, desc: 'بزرگ' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-sm ${
                      form.fontSize === opt.value
                        ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                        : 'border-border bg-card hover:border-violet-300 dark:hover:border-violet-700'
                    }`}
                  >
                    <RadioGroupItem value={opt.value} className="border-violet-500" />
                    <div>
                      <p className={`text-sm font-medium ${form.fontSize === opt.value ? 'text-violet-700 dark:text-violet-300' : ''}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Compact Mode */}
            <ToggleRow
              icon={<Palette className="h-4 w-4 text-violet-500" />}
              title={labels.compactMode}
              description="نمایش فشرده‌تر عناصر رابط کاربری"
              checked={form.compactMode}
              onCheckedChange={v => updateField('compactMode', v)}
              accentColor="border-violet-100/50 dark:border-violet-800/20 hover:bg-violet-500/5"
            />

            <Button onClick={() => handleSave('appearance')} disabled={saving} className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{labels.save}
            </Button>
          </SettingsSection>
        </TabsContent>

        {/* ═══════════════ Notifications ═══════════════ */}
        <TabsContent value="notifications" className="animate-in">
          <SettingsSection icon={<Bell className="h-5 w-5" />} title="تنظیمات اعلان‌ها" color="text-amber-700 dark:text-amber-300" accent="from-amber-400 to-orange-500">

            <ToggleRow
              icon={<Mail className="h-4 w-4 text-blue-500" />}
              title={labels.emailNotifs}
              description="دریافت اعلان‌ها از طریق ایمیل"
              checked={form.emailNotifs}
              onCheckedChange={v => updateField('emailNotifs', v)}
              accentColor="border-blue-100/50 dark:border-blue-800/20 hover:bg-blue-500/5"
            />

            <ToggleRow
              icon={<Bell className="h-4 w-4 text-amber-500" />}
              title={labels.pushNotifs}
              description="دریافت اعلان‌های فوری مرورگر"
              checked={form.pushNotifs}
              onCheckedChange={v => updateField('pushNotifs', v)}
              accentColor="border-amber-100/50 dark:border-amber-800/20 hover:bg-amber-500/5"
            />

            <ToggleRow
              icon={form.soundAlerts ? <Volume2 className="h-4 w-4 text-emerald-500" /> : <VolumeX className="h-4 w-4 text-gray-400" />}
              title={labels.soundAlerts}
              description="پخش صدای هشدار هنگام دریافت اعلان"
              checked={form.soundAlerts}
              onCheckedChange={v => updateField('soundAlerts', v)}
              accentColor="border-emerald-100/50 dark:border-emerald-800/20 hover:bg-emerald-500/5"
            />

            <ToggleRow
              icon={<Clock className="h-4 w-4 text-violet-500" />}
              title={labels.activityDigest}
              description="دریافت خلاصه روزانه فعالیت‌ها"
              checked={form.activityDigest}
              onCheckedChange={v => updateField('activityDigest', v)}
              accentColor="border-violet-100/50 dark:border-violet-800/20 hover:bg-violet-500/5"
            />

            <Button onClick={() => handleSave('notifications')} disabled={saving} className="gap-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{labels.save}
            </Button>
          </SettingsSection>
        </TabsContent>

        {/* ═══════════════ SEO ═══════════════ */}
        <TabsContent value="seo" className="animate-in">
          <SettingsSection icon={<Search className="h-5 w-5" />} title="تنظیمات سئو" color="text-teal-700 dark:text-teal-300" accent="from-teal-400 to-cyan-500">
            <div className="space-y-2">
              <Label>{labels.metaTitle}</Label>
              <Input value={form.metaTitle} onChange={e => updateField('metaTitle', e.target.value)} dir="ltr" placeholder="%title% | %sitename%" className="transition-all duration-200 focus:shadow-sm" />
              <p className="text-xs text-muted-foreground">از %title% و %sitename% استفاده کنید</p>
            </div>
            <div className="space-y-2">
              <Label>{labels.metaDesc}</Label>
              <Input value={form.metaDesc} onChange={e => updateField('metaDesc', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{labels.robots}</Label>
              <Select value={form.robots} onValueChange={v => updateField('robots', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="index, follow">index, follow</SelectItem>
                  <SelectItem value="noindex, follow">noindex, follow</SelectItem>
                  <SelectItem value="index, nofollow">index, nofollow</SelectItem>
                  <SelectItem value="noindex, nofollow">noindex, nofollow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleSave('seo')} disabled={saving} className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{labels.save}
            </Button>
          </SettingsSection>
        </TabsContent>

        {/* ═══════════════ AI ═══════════════ */}
        <TabsContent value="ai" className="animate-in">
          <SettingsSection icon={<Bot className="h-5 w-5" />} title="تنظیمات هوش مصنوعی" color="text-teal-700 dark:text-teal-300" accent="from-violet-400 to-purple-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.defaultModel}</Label>
                <Select value={form.defaultModel} onValueChange={v => updateField('defaultModel', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GLM-5-turbo">GLM-5-turbo</SelectItem>
                    <SelectItem value="GLM-4-plus">GLM-4-plus</SelectItem>
                    <SelectItem value="GLM-4-flash">GLM-4-flash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.provider}</Label>
                <Select value={form.provider} onValueChange={v => updateField('provider', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glm">GLM (Zhipu AI)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.apiEndpoint}</Label>
              <Input value={form.apiEndpoint} onChange={e => updateField('apiEndpoint', e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{labels.maxTokens}</Label>
              <Select value={form.maxTokens} onValueChange={v => updateField('maxTokens', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1024">۱,۰۲۴</SelectItem>
                  <SelectItem value="2048">۲,۰۴۸</SelectItem>
                  <SelectItem value="4096">۴,۰۹۶</SelectItem>
                  <SelectItem value="8192">۸,۱۹۲</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleSave('ai')} disabled={saving} className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{labels.save}
            </Button>
          </SettingsSection>
        </TabsContent>

        {/* ═══════════════ Content ═══════════════ */}
        <TabsContent value="content" className="animate-in">
          <SettingsSection icon={<FileText className="h-5 w-5" />} title="تنظیمات محتوا" color="text-teal-700 dark:text-teal-300" accent="from-cyan-400 to-teal-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.postsPerPage}</Label>
                <Select value={form.postsPerPage} onValueChange={v => updateField('postsPerPage', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">۵</SelectItem><SelectItem value="10">۱۰</SelectItem>
                    <SelectItem value="15">۱۵</SelectItem><SelectItem value="20">۲۰</SelectItem>
                    <SelectItem value="25">۲۵</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.defaultCategory}</Label>
                <Input value={form.defaultCategory} onChange={e => updateField('defaultCategory', e.target.value)} placeholder="نام دسته‌بندی" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-background/50 border border-teal-100/50 dark:border-teal-800/20 transition-all duration-200 hover:bg-teal-500/5">
              <div>
                <p className="text-sm font-medium">{labels.autoSave}</p>
                <p className="text-xs text-muted-foreground">ذخیره خودکار پیش‌نویس‌ها</p>
              </div>
              <Switch checked={form.autoSave} onCheckedChange={v => updateField('autoSave', v)} />
            </div>
            {form.autoSave && (
              <div className="space-y-2 animate-in">
                <Label>{labels.autoSaveInterval}</Label>
                <Select value={form.autoSaveInterval} onValueChange={v => updateField('autoSaveInterval', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">۱۵ ثانیه</SelectItem><SelectItem value="30">۳۰ ثانیه</SelectItem>
                    <SelectItem value="60">۶۰ ثانیه</SelectItem><SelectItem value="120">۱۲۰ ثانیه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={() => handleSave('content')} disabled={saving} className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{labels.save}
            </Button>
          </SettingsSection>
        </TabsContent>

        {/* ═══════════════ Security ═══════════════ */}
        <TabsContent value="security" className="animate-in space-y-4">
          {/* Change Password */}
          <SettingsSection icon={<Lock className="h-5 w-5" />} title={labels.changePassword} color="text-red-700 dark:text-red-300" accent="from-red-400 to-rose-500">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>{labels.currentPassword}</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={pwForm.current}
                    onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                    placeholder="••••••••"
                    className="transition-all duration-200 focus:shadow-sm pl-10"
                  />
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{labels.newPassword}</Label>
                <div className="relative">
                  <Input
                    type={showNewPw ? 'text' : 'password'}
                    value={pwForm.newPw}
                    onChange={e => setPwForm(p => ({ ...p, newPw: e.target.value }))}
                    placeholder="••••••••"
                    className="transition-all duration-200 focus:shadow-sm pl-10"
                  />
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={() => setShowNewPw(!showNewPw)}
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{labels.confirmPassword}</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={pwForm.confirm}
                    onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="••••••••"
                    className="transition-all duration-200 focus:shadow-sm pl-10"
                  />
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                  >
                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                className="gap-2 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm cursor-pointer"
              >
                <KeyRound className="h-4 w-4" />
                {labels.changePassword}
              </Button>
            </div>
          </SettingsSection>

          {/* Security Settings */}
          <SettingsSection icon={<Shield className="h-5 w-5" />} title="تنظیمات امنیتی" color="text-teal-700 dark:text-teal-300" accent="from-teal-400 to-emerald-500">
            {/* Two-Factor Auth */}
            <ToggleRow
              icon={<Smartphone className="h-4 w-4 text-violet-500" />}
              title={labels.twoFactor}
              description="افزایش امنیت با احراز هویت دو مرحله‌ای"
              checked={form.twoFactor}
              onCheckedChange={v => updateField('twoFactor', v)}
              accentColor="border-violet-100/50 dark:border-violet-800/20 hover:bg-violet-500/5"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.passwordPolicy}</Label>
                <Select value={form.passwordPolicy} onValueChange={v => updateField('passwordPolicy', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">پایه</SelectItem>
                    <SelectItem value="strong">قوی</SelectItem>
                    <SelectItem value="very-strong">بسیار قوی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.sessionTimeout}</Label>
                <Select value={form.sessionTimeout} onValueChange={v => updateField('sessionTimeout', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">۳۰ دقیقه</SelectItem><SelectItem value="60">۶۰ دقیقه</SelectItem>
                    <SelectItem value="120">۱۲۰ دقیقه</SelectItem><SelectItem value="480">۸ ساعت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.minPasswordLength}</Label>
              <Select value={form.minPasswordLength} onValueChange={v => updateField('minPasswordLength', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">۶ کاراکتر</SelectItem><SelectItem value="8">۸ کاراکتر</SelectItem>
                  <SelectItem value="10">۱۰ کاراکتر</SelectItem><SelectItem value="12">۱۲ کاراکتر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Session Management */}
            <div className="p-4 rounded-xl bg-background/50 border border-teal-100/50 dark:border-teal-800/20">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-teal-500" />
                <p className="text-sm font-medium">مدیریت نشست</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{labels.lastLogin}:</span>
                <span className="text-xs font-medium bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-lg">
                  امروز ساعت ۱۴:۳۰
                </span>
              </div>
            </div>

            <Button onClick={() => handleSave('security')} disabled={saving} className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{labels.save}
            </Button>
          </SettingsSection>

          {/* Danger Zone */}
          <Card className="border-red-200 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10 hover-lift shadow-sm transition-all duration-300">
            <CardHeader className="pb-3">
              <GradientAccent colors="from-red-400 to-rose-600" />
              <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                منطقه خطر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {labels.deactivateWarning}
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                    <UserX className="h-4 w-4" />
                    {labels.deactivateAccount}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      {labels.deactivateAccount}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {labels.deactivateConfirm}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">انصراف</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700 cursor-pointer" onClick={() => toast.success('درخواست غیرفعال‌سازی ثبت شد')}>
                      تأیید و غیرفعال‌سازی
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ Backup ═══════════════ */}
        <TabsContent value="backup" className="animate-in">
          <BackupPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
