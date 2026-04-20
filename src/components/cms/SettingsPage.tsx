'use client'

import { useState } from 'react'
import { useCMS } from './context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Settings, Globe, Search, Bot, FileText, Shield,
  Save, CheckCircle, Loader2,
} from 'lucide-react'
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
  // General
  siteName: 'نام سایت',
  siteDescription: 'توضیحات سایت',
  language: 'زبان',
  timezone: 'منطقه زمانی',
  // SEO
  metaTitle: 'قالب عنوان متا',
  metaDesc: 'متا توضیحات',
  robots: 'ربات‌ها',
  // AI
  defaultModel: 'مدل پیش‌فرض',
  provider: 'ارائه‌دهنده',
  apiEndpoint: 'آدرس API',
  maxTokens: 'حداکثر توکن',
  // Content
  postsPerPage: 'مطلب در هر صفحه',
  defaultCategory: 'دسته‌بندی پیش‌فرض',
  autoSave: 'ذخیره خودکار',
  autoSaveInterval: 'فاصله ذخیره خودکار (ثانیه)',
  // Security
  twoFactor: 'احراز هویت دو مرحله‌ای',
  passwordPolicy: 'سیاست رمز عبور',
  sessionTimeout: 'زمان انقضای نشست (دقیقه)',
  minPasswordLength: 'حداقل طول رمز عبور',
}

// ─── Settings Form State ──────────────────────────────────────────────────────

interface SettingsForm {
  siteName: string
  siteDescription: string
  language: string
  timezone: string
  metaTitle: string
  metaDesc: string
  robots: string
  defaultModel: string
  provider: string
  apiEndpoint: string
  maxTokens: string
  postsPerPage: string
  defaultCategory: string
  autoSave: boolean
  autoSaveInterval: string
  twoFactor: boolean
  passwordPolicy: string
  sessionTimeout: string
  minPasswordLength: string
}

const defaultSettings: SettingsForm = {
  siteName: 'سیستم مدیریت محتوا',
  siteDescription: 'یک سیستم مدیریت محتوا هوشمند',
  language: 'fa',
  timezone: 'Asia/Tehran',
  metaTitle: '%title% | %sitename%',
  metaDesc: 'سیستم مدیریت محتوا هوشمند - تولید و مدیریت محتوای حرفه‌ای',
  robots: 'index, follow',
  defaultModel: 'GLM-5-turbo',
  provider: 'glm',
  apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4',
  maxTokens: '2048',
  postsPerPage: '10',
  defaultCategory: '',
  autoSave: true,
  autoSaveInterval: '30',
  twoFactor: false,
  passwordPolicy: 'strong',
  sessionTimeout: '60',
  minPasswordLength: '8',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { bulkUpdateSettings } = useCMS()

  const [form, setForm] = useState<SettingsForm>(defaultSettings)
  const [saving, setSaving] = useState(false)

  const handleSave = (group: string) => {
    setSaving(true)
    const groupKeys: Record<string, (keyof SettingsForm)[]> = {
      general: ['siteName', 'siteDescription', 'language', 'timezone'],
      seo: ['metaTitle', 'metaDesc', 'robots'],
      ai: ['defaultModel', 'provider', 'apiEndpoint', 'maxTokens'],
      content: ['postsPerPage', 'defaultCategory', 'autoSave', 'autoSaveInterval'],
      security: ['twoFactor', 'passwordPolicy', 'sessionTimeout', 'minPasswordLength'],
    }
    const keys = groupKeys[group] ?? []
    const items = keys.map(key => ({
      key,
      value: String(form[key]),
      group: group as 'general' | 'seo' | 'ai' | 'content' | 'security',
    }))
    bulkUpdateSettings.mutate(items, {
      onSuccess: () => {
        toast.success(labels.saved)
        setSaving(false)
      },
      onError: () => {
        toast.error('خطا در ذخیره تنظیمات')
        setSaving(false)
      },
    })
  }

  const updateField = (field: keyof SettingsForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-teal-100 dark:bg-teal-900/30 h-11">
          <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            <Globe className="h-4 w-4" />
            {labels.general}
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            <Search className="h-4 w-4" />
            {labels.seo}
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            <Bot className="h-4 w-4" />
            {labels.ai}
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4" />
            {labels.content}
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-teal-600 data-[state=active]:text-white">
            <Shield className="h-4 w-4" />
            {labels.security}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════ General ═══════════════ */}
        <TabsContent value="general">
          <Card className="bg-gradient-to-br from-teal-500/5 to-teal-600/5 border-teal-200/30 dark:border-teal-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-teal-700 dark:text-teal-300 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                تنظیمات عمومی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{labels.siteName}</Label>
                <Input value={form.siteName} onChange={e => updateField('siteName', e.target.value)} />
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
              <Button
                onClick={() => handleSave('general')}
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {labels.save}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ SEO ═══════════════ */}
        <TabsContent value="seo">
          <Card className="bg-gradient-to-br from-teal-500/5 to-teal-600/5 border-teal-200/30 dark:border-teal-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-teal-700 dark:text-teal-300 flex items-center gap-2">
                <Search className="h-5 w-5" />
                تنظیمات سئو
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{labels.metaTitle}</Label>
                <Input value={form.metaTitle} onChange={e => updateField('metaTitle', e.target.value)} dir="ltr" placeholder="%title% | %sitename%" />
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
              <Button
                onClick={() => handleSave('seo')}
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {labels.save}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ AI ═══════════════ */}
        <TabsContent value="ai">
          <Card className="bg-gradient-to-br from-teal-500/5 to-teal-600/5 border-teal-200/30 dark:border-teal-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-teal-700 dark:text-teal-300 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                تنظیمات هوش مصنوعی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <Button
                onClick={() => handleSave('ai')}
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {labels.save}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ Content ═══════════════ */}
        <TabsContent value="content">
          <Card className="bg-gradient-to-br from-teal-500/5 to-teal-600/5 border-teal-200/30 dark:border-teal-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-teal-700 dark:text-teal-300 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                تنظیمات محتوا
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{labels.postsPerPage}</Label>
                  <Select value={form.postsPerPage} onValueChange={v => updateField('postsPerPage', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">۵</SelectItem>
                      <SelectItem value="10">۱۰</SelectItem>
                      <SelectItem value="15">۱۵</SelectItem>
                      <SelectItem value="20">۲۰</SelectItem>
                      <SelectItem value="25">۲۵</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{labels.defaultCategory}</Label>
                  <Input value={form.defaultCategory} onChange={e => updateField('defaultCategory', e.target.value)} placeholder="نام دسته‌بندی" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <div>
                  <p className="text-sm font-medium">{labels.autoSave}</p>
                  <p className="text-xs text-muted-foreground">ذخیره خودکار پیش‌نویس‌ها</p>
                </div>
                <Switch checked={form.autoSave} onCheckedChange={v => updateField('autoSave', v)} />
              </div>
              {form.autoSave && (
                <div className="space-y-2">
                  <Label>{labels.autoSaveInterval}</Label>
                  <Select value={form.autoSaveInterval} onValueChange={v => updateField('autoSaveInterval', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">۱۵ ثانیه</SelectItem>
                      <SelectItem value="30">۳۰ ثانیه</SelectItem>
                      <SelectItem value="60">۶۰ ثانیه</SelectItem>
                      <SelectItem value="120">۱۲۰ ثانیه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                onClick={() => handleSave('content')}
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {labels.save}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ Security ═══════════════ */}
        <TabsContent value="security">
          <Card className="bg-gradient-to-br from-teal-500/5 to-teal-600/5 border-teal-200/30 dark:border-teal-800/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-teal-700 dark:text-teal-300 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                تنظیمات امنیتی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <div>
                  <p className="text-sm font-medium">{labels.twoFactor}</p>
                  <p className="text-xs text-muted-foreground">افزایش امنیت با احراز هویت دو مرحله‌ای</p>
                </div>
                <Switch checked={form.twoFactor} onCheckedChange={v => updateField('twoFactor', v)} />
              </div>
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
                      <SelectItem value="30">۳۰ دقیقه</SelectItem>
                      <SelectItem value="60">۶۰ دقیقه</SelectItem>
                      <SelectItem value="120">۱۲۰ دقیقه</SelectItem>
                      <SelectItem value="480">۸ ساعت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{labels.minPasswordLength}</Label>
                <Select value={form.minPasswordLength} onValueChange={v => updateField('minPasswordLength', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">۶ کاراکتر</SelectItem>
                    <SelectItem value="8">۸ کاراکتر</SelectItem>
                    <SelectItem value="10">۱۰ کاراکتر</SelectItem>
                    <SelectItem value="12">۱۲ کاراکتر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => handleSave('security')}
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {labels.save}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
