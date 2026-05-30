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
  Shield, Eye, Star, UserPlus, LogIn, Github, Twitter, Globe,
  Sparkles, TrendingUp, Award, Coffee, Zap, Palette,
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

// ─── Mini Sparkline Data ─────────────────────────────────────────────────

const activityData = [3, 5, 2, 8, 6, 4, 9, 7, 5, 3, 6, 8]
const maxActivity = Math.max(...activityData)

// ─── Skill Tags ──────────────────────────────────────────────────────────

const skillTags = [
  { label: 'React', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200/50 dark:border-cyan-800/30' },
  { label: 'Next.js', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200/50 dark:border-violet-800/30' },
  { label: 'TypeScript', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/30' },
  { label: 'Tailwind', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200/50 dark:border-teal-800/30' },
  { label: 'Node.js', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200/50 dark:border-green-800/30' },
  { label: 'WordPress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/30' },
]

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
  const activityList = activities.data ?? []

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
      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-[1.05] ${
        active
          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-lg shadow-violet-500/15'
          : 'border-border hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md'
      }`}
      onClick={() => setTheme(value)}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
        active ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md' : 'bg-muted text-muted-foreground'
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
        {/* ─── Animated Gradient Header Banner ─── */}
        <div className="relative h-52 bg-gradient-to-bl from-violet-500 via-purple-500 to-fuchsia-500 overflow-hidden shrink-0">
          {/* Animated decorative elements */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 float-animation" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 float-animation" style={{ animationDelay: '1s' }} />
          <div className="absolute top-10 left-1/3 w-20 h-20 rounded-full bg-white/5 float-animation" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-4 right-1/4 w-10 h-10 rounded-full bg-white/5 float-animation" style={{ animationDelay: '0.5s' }} />

          {/* Gradient mesh overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/5 pointer-events-none" />

          {/* Close button */}
          <button
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all duration-200 cursor-pointer text-white hover:scale-110"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>

          <SheetHeader className="relative z-10 pt-12 pb-2 px-5 text-white">
            <div className="flex items-end gap-4">
              {/* Avatar with gradient ring */}
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-white/40 to-white/10 blur-sm animate-pulse" />
                <div className="relative w-22 h-22 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/50 flex items-center justify-center text-white text-3xl font-bold shadow-2xl" style={{ width: '88px', height: '88px' }}>
                  {userName.charAt(0)}
                </div>
                {/* Online status dot */}
                <div className="absolute bottom-1 left-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-md">
                  <div className="w-full h-full rounded-full bg-emerald-400 badge-pulse" />
                </div>
              </div>
              <div className="flex-1 pb-1">
                <SheetTitle className="text-xl font-bold text-white">{userName}</SheetTitle>
                <SheetDescription className="text-white/80 text-xs mt-1 flex items-center gap-1.5">
                  <Badge className="h-5 text-[10px] bg-white/20 text-white border-0 backdrop-blur-sm hover:bg-white/30 transition-colors">
                    <Sparkles className="h-2.5 w-2.5 ml-1" />
                    مدیر سیستم
                  </Badge>
                </SheetDescription>
                <p className="text-white/60 text-xs mt-1.5">{userEmail}</p>
              </div>
            </div>
          </SheetHeader>

          {/* Online status */}
          <div className="absolute bottom-3 right-5 flex items-center gap-1.5 text-white/80">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-xs font-medium">آنلاین</span>
          </div>
        </div>

        {/* ─── Scrollable Content ─── */}
        <ScrollArea className="flex-1 h-[calc(100vh-210px)]">
          <div className="px-5 py-4 space-y-5">

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Section 1: Personal Info                                       */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
                  اطلاعات شخصی
                </h3>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-3 w-3" />
                    ویرایش
                  </Button>
                )}
              </div>

              <div className="rounded-xl bg-card border border-border/60 p-4 space-y-3 glass-card card-inner-glow transition-all duration-300 hover:shadow-sm">
                {isEditing ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">نام</Label>
                      <Input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="h-8 text-sm hover:border-violet-400 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">ایمیل</Label>
                      <Input
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        dir="ltr"
                        className="h-8 text-sm hover:border-violet-400 transition-colors"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md shadow-violet-500/20 cursor-pointer"
                        onClick={handleSaveProfile}
                      >
                        <Save className="h-3 w-3" />
                        ذخیره
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
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
            {/* Section 2: Profile Stats + Activity Graph                      */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500" />
                آمار فعالیت
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <StatCard
                  icon={<FileText className="h-4 w-4 text-white" />}
                  label="مطالب منتشر شده"
                  value="۶"
                  gradient="from-cyan-500 to-cyan-600"
                />
                <StatCard
                  icon={<MessageCircle className="h-4 w-4 text-white" />}
                  label="نظرات داده شده"
                  value="۳"
                  gradient="from-orange-500 to-amber-500"
                />
                <StatCard
                  icon={<FolderKanban className="h-4 w-4 text-white" />}
                  label="پروژه‌های فعال"
                  value="۲"
                  gradient="from-violet-500 to-purple-600"
                />
                <StatCard
                  icon={<Clock className="h-4 w-4 text-white" />}
                  label="آخرین ورود"
                  value="امروز"
                  gradient="from-emerald-500 to-teal-600"
                />
              </div>

              {/* Mini Activity Graph */}
              <div className="rounded-xl bg-card border border-border/60 p-4 glass-card card-inner-glow">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
                    نمودار فعالیت
                  </p>
                  <Badge variant="secondary" className="text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0">
                    ۱۲ هفته
                  </Badge>
                </div>
                <div className="flex items-end gap-1.5 h-16">
                  {activityData.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-t-sm transition-all duration-500 hover:opacity-80 animate-in"
                      style={{
                        animationDelay: `${idx * 60}ms`,
                        animationFillMode: 'both',
                        height: `${Math.max(8, (val / maxActivity) * 100)}%`,
                        background: `linear-gradient(to top, ${idx >= 8 ? '#8b5cf6' : '#a78bfa'}, ${idx >= 8 ? '#d946ef' : '#c4b5fd'})`,
                        opacity: idx >= 8 ? 1 : 0.5,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-muted-foreground">۱۲ هفته پیش</span>
                  <span className="text-[9px] text-muted-foreground">امروز</span>
                </div>
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Section 3: Skill Tags                                          */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                مهارت‌ها
              </h3>
              <div className="flex flex-wrap gap-2">
                {skillTags.map((skill, idx) => (
                  <Badge
                    key={skill.label}
                    variant="outline"
                    className={`text-xs px-3 py-1.5 border transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] animate-in ${skill.color}`}
                    style={{ animationDelay: `${idx * 70}ms`, animationFillMode: 'both' }}
                  >
                    {skill.label}
                  </Badge>
                ))}
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Section 4: Social Links                                        */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="animate-in" style={{ animationDelay: '350ms', animationFillMode: 'both' }}>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-sky-500 to-blue-500" />
                لینک‌ها
              </h3>
              <div className="flex gap-2">
                <SocialButton icon={<Globe className="h-4 w-4" />} label="وب‌سایت" gradient="from-cyan-500 to-teal-500" />
                <SocialButton icon={<Github className="h-4 w-4" />} label="گیت‌هاب" gradient="from-violet-500 to-purple-600" />
                <SocialButton icon={<Twitter className="h-4 w-4" />} label="توییتر" gradient="from-sky-400 to-blue-500" />
                <SocialButton icon={<Coffee className="h-4 w-4" />} label="قهوه" gradient="from-amber-500 to-orange-500" />
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* Section 5: Recent Activity                                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="animate-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                فعالیت اخیر
              </h3>

              <div className="rounded-xl bg-card border border-border/60 divide-y divide-border/40 max-h-64 overflow-y-auto glass-card card-inner-glow">
                {activityList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    فعالیتی ثبت نشده است
                  </div>
                ) : (
                  activityList.slice(0, 5).map((activity, idx) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-all duration-200 animate-in"
                      style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
                    >
                      <div className="w-7 h-7 rounded-lg bg-muted/80 flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-110">
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
            {/* Section 6: Theme Preview / Quick Settings                      */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="animate-in" style={{ animationDelay: '450ms', animationFillMode: 'both' }}>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-violet-500 to-purple-500" />
                <Palette className="h-4 w-4 text-violet-500" />
                تنظیمات سریع
              </h3>

              <div className="rounded-xl bg-card border border-border/60 divide-y divide-border/40 glass-card card-inner-glow">

                {/* Theme toggle */}
                <div className="p-3">
                  <p className="text-xs font-medium mb-2.5 flex items-center gap-1.5">
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    پوسته
                  </p>
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
                          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm'
                          : 'bg-transparent text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={() => setLanguage('fa')}
                    >
                      فارسی
                    </button>
                    <button
                      className={`px-2.5 py-1 text-[10px] font-medium transition-all duration-200 cursor-pointer ${
                        language === 'en'
                          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm'
                          : 'bg-transparent text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={() => setLanguage('en')}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* Notification sound */}
                <div className="flex items-center justify-between px-3 py-3 hover:bg-accent/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${soundEnabled ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-muted/80'}`}>
                      {soundEnabled
                        ? <Volume2 className="h-3.5 w-3.5 text-violet-500" />
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
                <div className="flex items-center justify-between px-3 py-3 hover:bg-accent/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${compactMode ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-muted/80'}`}>
                      {compactMode
                        ? <PanelLeftClose className="h-3.5 w-3.5 text-violet-500" />
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
              className="w-full gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] glass-card animate-in"
              style={{ animationDelay: '500ms', animationFillMode: 'both' }}
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
    <div className="flex items-center justify-between group">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400" dir={dir}>{value}</span>
    </div>
  )
}

function StatCard({
  icon, label, value, gradient,
}: {
  icon: React.ReactNode; label: string; value: string; gradient: string
}) {
  return (
    <div className={`rounded-xl bg-gradient-to-br ${gradient} p-3 flex flex-col items-center text-center gap-1.5 transition-all duration-300 hover:scale-[1.04] hover:shadow-lg cursor-default glass-card hover-lift card-inner-glow`}>
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
        {icon}
      </div>
      <span className="text-lg font-bold text-white tabular-nums drop-shadow-sm">{value}</span>
      <span className="text-[10px] text-white/80 leading-tight">{label}</span>
    </div>
  )
}

function SocialButton({
  icon, label, gradient,
}: {
  icon: React.ReactNode; label: string; gradient: string
}) {
  return (
    <button
      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-md transition-all duration-300 hover:scale-[1.1] hover:shadow-lg active:scale-[0.95] cursor-pointer`}
      title={label}
    >
      {icon}
    </button>
  )
}
