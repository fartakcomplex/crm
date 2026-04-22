import { NextResponse } from 'next/server'

// GET /api/notifications — returns mock notifications
export async function GET() {
  try {
    const notifications = [
      { id: '1', title: 'مقاله جدید منتشر شد', message: 'مقاله "شروع با Next.js 16" با موفقیت منتشر شد.', type: 'success', read: false, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { id: '2', title: 'نظر جدید در انتظار بررسی', message: 'نظر از رضا روی مقاله "بهترین روش‌های سئو 2024" نیاز به بررسی دارد.', type: 'warning', read: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: '3', title: 'بروزرسانی سیستم', message: 'سیستم مدیریت محتوا به نسخه جدید ارتقا یافت.', type: 'info', read: true, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      { id: '4', title: 'پروژه "بازطراحی وب‌سایت" به ۶۵٪ رسید', message: 'پیشرفت پروژه وب‌سایت به ۶۵ درصد رسید.', type: 'info', read: true, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
      { id: '5', title: 'خطای备份 پایگاه داده', message: 'backup آخرین شب با خطا مواجه شد.', type: 'error', read: false, createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
      { id: '6', title: 'کاربر جدید ثبت‌نام کرد', message: 'کاربر جدید "نازنین پارک" در سیستم ثبت‌نام کرد.', type: 'success', read: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { id: '7', title: 'همگام‌سازی وردپرس موفق', message: '3 مقاله جدید از وردپرس همگام‌سازی شدند.', type: 'success', read: true, createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
      { id: '8', title: 'مشتری جدید اضافه شد', message: '"فناوری گاما" به عنوان مشتری بالقوه اضافه شد.', type: 'info', read: true, createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString() },
    ]

    return NextResponse.json(notifications)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
