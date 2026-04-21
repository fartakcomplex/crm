'use client'

import { useState, useEffect } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Sun, Moon, Volume2, VolumeX, Languages, PanelLeftClose, PanelLeft,
  FileText, MessageCircle, FolderKanban, Clock, Edit3, Save, X,
  Shield, Eye, Star, UserPlus, LogIn,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { formatRelativeTime } from './types'
import { toast } from 'sonner'

// ─── Props ───────────────────────────────────────────────────────────────

interface ProfilePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate?: (tabId: string) => void
  onToggleSidebar?: () => void
  sidebarCollapsed?: boolean
}

// ─── Activity icon map ───────────────────────────────────────────────────

function getActivityIcon(action: string) {
  if (action.includes('create') || action.includes('ایجاد')) return <FileText className="h-3.5 w-3.5 text-cyan-500" />
  if (action.includes('comment') || action.includes('نظر')) return <MessageCircle className="h-3.5 w-3.5 text-orange-500" />
  if (action.includes('login') || action.includes('ورود')) return <LogIn className="h-3.5 w-3.5 text-emerald-500" />
  if (action.includes('update') || action.includes('ویرایش')) return <Edit3 className="h-3.5 w-3.5 text-violet-500" />
  if (action.includes('delete') || action.includes('حذف')) return <X className="h-3.5 w-3.5 text-red-500" />
  if (action.includes('user') || action.includes('کاربر')) return <UserPlus className="h-3.5 w-3.5 text-teal-500" />
  if (action.includes('star') || action.includes('ستاره')) return <Star className="h-3.5 w-3.5 text-amber-500" />
  if (action.includes('view') || action.includes('مشاهده')) return <Eye className="h-3.5 w-3.5 text-sky-500" />
  return <Shield className="h-3.5 w-3.5 text-gray-500" />
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function ProfilePanel({
  open, onOpenChange, onNavigate, onToggleSidebar, sidebarCollapsed,
}: ProfilePanelProps) {
  const { activities } = useCMS()
  useEnsureData(['activities'])

  const { theme, setTheme } = useTheme()

  // User profile state
  const [userName, setUserName] = useState('مدیر سیستم')
  const [userEmail, setUserEmail] = useState('admin@smartcms.ir')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(userName)
  const [editEmail, setEditEmail] = useState(userEmail)

  // Quick settings state
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [compactMode, setCompactMode] = useState(false)
  const [language, setLanguage] = useState('fa')

  // Ensure activities data
  const activityData = activities.data ?? []

  const handleSaveProfile = () => {
    setUserName(editName)
    setUserEmail(editEmail)
    setIsEditing(false)
    toast.success('پروفایل با موفقیت به‌روزرسانی شد')
  }

  const handleCancelEdit = () => {
    setEditName(userName)
    setEditEmail(userEmail)
    setIsEditing(false)
  }

  const handleCompactToggle = (checked: boolean) => {
    setCompactMode(checked)
    onToggleSidebar?.()
  }

  // Theme card styling helper
  const themeCard = (value: string, label: string, icon: React.ReactNode, active: boolean) => (
    <button
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-[1.03] ${
        active
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-md shadow-violet-500/10'
          : 'border-border hover:border-violet-300 dark:hover:border-violet-700'
      }`}
      onClick={() => setTheme(value)}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
        active ? 'bg-violet-500 text-white' : 'bg-muted text-muted-foreground'
      }`}>
        {icon}
      </div>
      <span className={`text-xs font-medium ${active ? 'text-violet-700 dark:text-violet-300' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </button>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[380px] p-0 bg-background border-r border-border/60 sm:max-w-[380px]"
        dir="rtl"
      >
        {/* ─── Gradient Header ─── */}
        <div className="relative h-44 bg-gradient-to-bl from-violet-500 via-purple-500 to-fuchsia-500 overflow-hidden shrink-0">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute top-8 left-1/2 w-16 h-16 rounded-full bg-white/5" />

          {/* Close button positioned in header */}
          <button
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>

          <SheetHeader className="relative z-10 pt-10 pb-2 px-5 text-white">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {userName.charAt(0)}
              </div>
              <div className="flex-1">
                <SheetTitle className="text-lg font-bold text-white">{userName}</SheetTitle>
                <SheetDescription className="text-white/80 text-xs mt-0.5 flex items-center gap-1.5">
                  <Badge className="h-5 text-[10px] bg-white/20 text-white border-0 backdrop-blur-sm">
                    مدیر سیستم
                  </Badge>
                </SheetDescription>
                <p className="text-white/70 text-xs mt-1.5">{userEmail}</p>
              </div>
            </div>
          </SheetHeader>

          {/* Online status indicator */}
          <div className="absolute bottom-3 right-5 flex items-center gap-1.5 text-white/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-medium">آنلاین</span>
          </div>
        </div>

        {/* ─── Scrollable Content ─── */}
        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          <div className="px-5 py-4 space-y-5">

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Section 1: Personal Info                                       */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
                  اطلاعات شخصی
                </h3>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 cursor-pointer"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-3 w-3" />
                    ویرایش
                  </Button>
                )}
              </div>

              <div className="rounded-xl bg-card border border-border/60 p-4 space-y-3">
                {isEditing ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">نام</Label>
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">ایمیل</Label>
                      <Input
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        dir="ltr"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 cursor-pointer"
                        onClick={handleSaveProfile}
                      >
                        <Save className="h-3 w-3" />
                        ذخیره
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs cursor-pointer"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3 w-3" />
                        انصراف
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <InfoRow label="نام" value={userName} />
                    <InfoRow label="ایمیل" value={userEmail} dir="ltr" />
                    <InfoRow label="نقش" value="مدیر سیستم" />
                    <InfoRow label="تاریخ عضویت" value="۱۴۰۳/۰۶/۱۵" />
                  </>
                )}
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Section 2: Activity Stats                                      */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                آمار فعالیت
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  icon={<FileText className="h-4 w-4 text-cyan-500" />}
                  label="مطالب منتشر شده"
                  value="۶"
                  gradient="from-cyan-500/10 to-cyan-500/5"
                />
                <StatCard
                  icon={<MessageCircle className="h-4 w-4 text-orange-500" />}
                  label="نظرات داده شده"
                  value="۳"
                  gradient="from-orange-500/10 to-orange-500/5"
                />
                <StatCard
                  icon={<FolderKanban className="h-4 w-4 text-violet-500" />}
                  label="پروژه‌های فعال"
                  value="۲"
                  gradient="from-violet-500/10 to-violet-500/5"
                />
                <StatCard
                  icon={<Clock className="h-4 w-4 text-emerald-500" />}
                  label="آخرین ورود"
                  value="امروز"
                  gradient="from-emerald-500/10 to-emerald-500/5"
                />
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Section 3: Recent Activity                                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                فعالیت اخیر
              </h3>

              <div className="rounded-xl bg-card border border-border/60 divide-y divide-border/40 max-h-64 overflow-y-auto">
                {activityData.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    فعالیتی ثبت نشده است
                  </div>
                ) : (
                  activityData.slice(0, 5).map(activity => (
                    <div key={activity.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-muted/80 flex items-center justify-center shrink-0">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{activity.details || activity.action}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Section 4: Quick Settings                                      */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-violet-500 to-purple-500" />
                تنظیمات سریع
              </h3>

              <div className="rounded-xl bg-card border border-border/60 divide-y divide-border/40">

                {/* Theme toggle */}
                <div className="p-3">
                  <p className="text-xs font-medium mb-2.5">پوسته</p>
                  <div className="grid grid-cols-3 gap-2">
                    {themeCard('light', 'روشن', <Sun className="h-4 w-4" />, theme === 'light')}
                    {themeCard('dark', 'تاریک', <Moon className="h-4 w-4" />, theme === 'dark')}
                    {themeCard('system', 'سیستم', <Shield className="h-4 w-4" />, theme === 'system')}
                  </div>
                </div>

                {/* Language selector */}
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-muted/80 flex items-center justify-center">
                      <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">زبان</p>
                      <p className="text-[10px] text-muted-foreground">انتخاب زبان رابط کاربری</p>
                    </div>
                  </div>
                  <div className="flex rounded-lg border border-border/60 overflow-hidden">
                    <button
                      className={`px-2.5 py-1 text-[10px] font-medium transition-all duration-200 cursor-pointer ${
                        language === 'fa'
                          ? 'bg-violet-500 text-white'
                          : 'bg-transparent text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={() => setLanguage('fa')}
                    >
                      فارسی
                    </button>
                    <button
                      className={`px-2.5 py-1 text-[10px] font-medium transition-all duration-200 cursor-pointer ${
                        language === 'en'
                          ? 'bg-violet-500 text-white'
                          : 'bg-transparent text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={() => setLanguage('en')}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Notification sound */}
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-muted/80 flex items-center justify-center">
                      {soundEnabled
                        ? <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                        : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                      }
                    </div>
                    <div>
                      <p className="text-xs font-medium">صدای اعلان</p>
                      <p className="text-[10px] text-muted-foreground">
                        {soundEnabled ? 'روشن' : 'خاموش'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>

                {/* Compact mode / Sidebar toggle */}
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-muted/80 flex items-center justify-center">
                      {compactMode
                        ? <PanelLeftClose className="h-3.5 w-3.5 text-muted-foreground" />
                        : <PanelLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      }
                    </div>
                    <div>
                      <p className="text-xs font-medium">حالت فشرده</p>
                      <p className="text-[10px] text-muted-foreground">
                        {compactMode ? 'منوی جمع‌شده' : 'منوی باز'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={compactMode}
                    onCheckedChange={handleCompactToggle}
                    className="data-[state=checked]:bg-violet-500"
                  />
                </div>
              </div>
            </section>

            {/* Navigate to Settings link */}
            <Button
              variant="outline"
              className="w-full gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer transition-all duration-200"
              onClick={() => {
                onOpenChange(false)
                onNavigate?.('settings')
              }}
            >
              <Shield className="h-4 w-4" />
              مشاهده تنظیمات کامل
            </Button>

            {/* Bottom padding for safe area */}
            <div className="h-4" />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────

function InfoRow({ label, value, dir }: { label: string; value: string; dir?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium" dir={dir}>{value}</span>
    </div>
  )
}

function StatCard({
  icon, label, value, gradient,
}: {
  icon: React.ReactNode; label: string; value: string; gradient: string
}) {
  return (
    <div className={`rounded-xl bg-gradient-to-br ${gradient} border border-border/40 p-3 flex flex-col items-center text-center gap-1.5 transition-all duration-200 hover:scale-[1.02]`}>
      {icon}
      <span className="text-lg font-bold tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </div>
  )
}
