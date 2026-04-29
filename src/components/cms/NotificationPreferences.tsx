'use client'

import { useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  ShoppingBag,
  MessageCircle,
  FileText,
  DollarSign,
  Shield,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Notification Categories ──────────────────────────────────────────

interface NotificationCategory {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  defaultEnabled: boolean
  badge?: string
}

const notificationCategories: NotificationCategory[] = [
  {
    id: 'system',
    label: 'اطلاعیه‌های سیستم',
    description: 'بروزرسانی‌ها، نگهداری و اطلاعیه‌های عمومی سیستم',
    icon: Bell,
    gradient: 'from-violet-500 to-purple-600',
    defaultEnabled: true,
    badge: 'مهم',
  },
  {
    id: 'orders',
    label: 'سفارشات جدید',
    description: 'ثبت سفارشات جدید و تغییر وضعیت سفارشات',
    icon: ShoppingBag,
    gradient: 'from-emerald-500 to-teal-600',
    defaultEnabled: true,
    badge: null,
  },
  {
    id: 'comments',
    label: 'نظرات جدید',
    description: 'نظرات جدید روی مطالب و محصولات',
    icon: MessageCircle,
    gradient: 'from-cyan-500 to-sky-600',
    defaultEnabled: true,
    badge: null,
  },
  {
    id: 'content',
    label: 'بروزرسانی محتوا',
    description: 'تغییرات در مطالب، دسته‌بندی‌ها و رسانه‌ها',
    icon: FileText,
    gradient: 'from-amber-500 to-orange-500',
    defaultEnabled: false,
    badge: null,
  },
  {
    id: 'financial',
    label: 'گزارش‌های مالی',
    description: 'خلاصه فروش، فاکتورها و گزارش‌های مالی دوره‌ای',
    icon: DollarSign,
    gradient: 'from-rose-500 to-pink-600',
    defaultEnabled: true,
    badge: 'هفتگی',
  },
  {
    id: 'security',
    label: 'امنیت و ورود',
    description: 'لاگ ورود، تغییرات رمز عبور و هشدارهای امنیتی',
    icon: Shield,
    gradient: 'from-fuchsia-500 to-purple-600',
    defaultEnabled: true,
    badge: null,
  },
]

// ─── Main Component ────────────────────────────────────────────────────

export default function NotificationPreferences() {
  // Initialize state from defaults
  const [settings, setSettings] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    notificationCategories.forEach(cat => {
      initial[cat.id] = cat.defaultEnabled
    })
    return initial
  })

  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleToggle = useCallback((id: string, checked: boolean) => {
    setSettings(prev => ({ ...prev, [id]: checked }))
    setHasChanges(true)
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setHasChanges(false)
    toast.success('تنظیمات اعلان‌ها ذخیره شد')
  }, [])

  const enabledCount = Object.values(settings).filter(Boolean).length
  const totalCount = notificationCategories.length

  return (
    <div className="rounded-xl glass-card card-elevated border border-border/60 overflow-hidden" dir="rtl">
      {/* ─── Header ─── */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-md">
              <Bell className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base font-bold text-gradient-violet">
              تنظیمات اعلان‌ها
            </h2>
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] h-5 px-2 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0"
          >
            {enabledCount} از {totalCount} فعال
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          مدیریت نحوه دریافت اعلان‌ها و هشدارهای سیستم
        </p>
      </div>

      <Separator className="bg-border/40" />

      {/* ─── Categories List ─── */}
      <div className="divide-y divide-border/40 stagger-children">
        {notificationCategories.map((category, idx) => {
          const Icon = category.icon
          const isEnabled = settings[category.id] ?? category.defaultEnabled

          return (
            <div
              key={category.id}
              className={`flex items-center gap-3 px-5 py-3.5 transition-all duration-200 list-item-hover ${
                isEnabled ? '' : 'opacity-60'
              }`}
              style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
            >
              {/* Icon */}
              <div className={`shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br ${category.gradient} flex items-center justify-center text-white shadow-sm transition-transform duration-200 hover:scale-110`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Label & Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {category.label}
                  </span>
                  {category.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[8px] h-4 px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0"
                    >
                      {category.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  {category.description}
                </p>
              </div>

              {/* Toggle Switch */}
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handleToggle(category.id, checked)}
                className="data-[state=checked]:bg-violet-500 shrink-0"
              />
            </div>
          )
        })}
      </div>

      <Separator className="bg-border/40" />

      {/* ─── Footer ─── */}
      <div className="p-4 flex items-center justify-between bg-muted/20">
        {/* Save status indicator */}
        {hasChanges ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            تغییرات ذخیره نشده
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            ذخیره شده
          </div>
        )}

        {/* Save Button */}
        <Button
          className="gap-2 btn-primary-gradient text-white h-9 px-5 text-xs font-medium shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              در حال ذخیره...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5" />
              ذخیره تنظیمات
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
