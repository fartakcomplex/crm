import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Maps database action patterns to enriched activity metadata
const ACTION_TYPE_MAP: Record<string, { type: string; icon: string; color: string }> = {
  create: { type: 'create', icon: 'FileText', color: 'violet' },
  post: { type: 'create', icon: 'FileText', color: 'violet' },
  upload: { type: 'upload', icon: 'ImagePlus', color: 'cyan' },
  media: { type: 'upload', icon: 'ImagePlus', color: 'cyan' },
  comment: { type: 'comment', icon: 'MessageCircle', color: 'emerald' },
  user: { type: 'user', icon: 'UserPlus', color: 'amber' },
  order: { type: 'order', icon: 'ShoppingCart', color: 'rose' },
  task: { type: 'task', icon: 'CheckSquare', color: 'purple' },
  backup: { type: 'backup', icon: 'Database', color: 'sky' },
  settings: { type: 'settings', icon: 'Settings', color: 'fuchsia' },
  project: { type: 'task', icon: 'CheckSquare', color: 'purple' },
  inventory: { type: 'task', icon: 'Database', color: 'amber' },
}

const DEFAULT_META = { type: 'settings', icon: 'Settings', color: 'fuchsia' }

function formatPersianRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  const toPersian = (n: number) => String(n).replace(/\d/g, (d) => persianDigits[parseInt(d)])

  if (seconds < 60) return 'همین الان'
  if (minutes < 2) return '۱ دقیقه پیش'
  if (minutes < 60) return `${toPersian(minutes)} دقیقه پیش`
  if (hours < 2) return '۱ ساعت پیش'
  if (hours < 24) return `${toPersian(hours)} ساعت پیش`
  if (days < 2) return 'دیروز'
  if (days < 7) return `${toPersian(days)} روز پیش`
  return date.toLocaleDateString('fa-IR')
}

function resolveMeta(action: string) {
  const lower = action.toLowerCase()
  for (const [key, meta] of Object.entries(ACTION_TYPE_MAP)) {
    if (lower.includes(key)) return meta
  }
  return DEFAULT_META
}

export async function GET() {
  try {
    // Get recent activities from database
    const activities = await db.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // If no activities, return mock data
    if (activities.length === 0) {
      return NextResponse.json({
        activities: [
          { id: '1', type: 'create', title: 'مطلب جدید ایجاد شد', description: 'مقاله "راهنمای استفاده از API" منتشر شد', user: 'علی محمدی', time: '۲ ساعت پیش', icon: 'FileText', color: 'violet' },
          { id: '2', type: 'upload', title: 'فایل آپلود شد', description: 'تصویر "dashboard-preview.png" در رسانه آپلود شد', user: 'سارا رضایی', time: '۴ ساعت پیش', icon: 'ImagePlus', color: 'cyan' },
          { id: '3', type: 'comment', title: 'نظر جدید', description: 'کاربر "محمد" نظر جدیدی ثبت کرد', user: 'محمد احمدی', time: '۵ ساعت پیش', icon: 'MessageCircle', color: 'emerald' },
          { id: '4', type: 'user', title: 'کاربر جدید', description: 'کاربر "فاطمه حسینی" ثبت‌نام کرد', user: 'سیستم', time: '۸ ساعت پیش', icon: 'UserPlus', color: 'amber' },
          { id: '5', type: 'order', title: 'سفارش جدید', description: 'سفارش #۱۰۲۴ ثبت شد — مبلغ: ۲,۵۰۰,۰۰۰ تومان', user: 'رها کریمی', time: '۱۲ ساعت پیش', icon: 'ShoppingCart', color: 'rose' },
          { id: '6', type: 'task', title: 'وظیفه تکمیل شد', description: 'وظیفه "بهینه‌سازی سرعت سایت" با موفقیت تکمیل شد', user: 'امیر حسینی', time: '۱ روز پیش', icon: 'CheckSquare', color: 'purple' },
          { id: '7', type: 'backup', title: 'پشتیبان‌گیری', description: 'پشتیبان‌گیری خودکار با موفقیت انجام شد', user: 'سیستم', time: '۱ روز پیش', icon: 'Database', color: 'sky' },
          { id: '8', type: 'settings', title: 'تنظیمات تغییر کرد', description: 'تنظیمات SMTP ایمیل بروزرسانی شد', user: 'مدیر سیستم', time: '۲ روز پیش', icon: 'Settings', color: 'fuchsia' },
        ]
      })
    }

    // Transform database records to enriched format
    const enriched = activities.map((a) => {
      const meta = resolveMeta(a.action)
      return {
        id: a.id,
        type: meta.type,
        title: a.action.split('.').pop()?.replace(/_/g, ' ') ?? a.action,
        description: a.details || a.action,
        user: a.user?.name ?? 'سیستم',
        time: formatPersianRelativeTime(a.createdAt),
        icon: meta.icon,
        color: meta.color,
      }
    })

    return NextResponse.json({ activities: enriched })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}
