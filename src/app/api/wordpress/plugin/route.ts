import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ─── GET: Return plugin code and installation instructions ─────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') // 'json' or 'download'

    // Read the actual plugin file
    let pluginCode: string
    try {
      const pluginPath = resolve(process.cwd(), 'wordpress-plugin/smart-cms-bridge.php')
      pluginCode = readFileSync(pluginPath, 'utf-8')
    } catch {
      pluginCode = '// Plugin file not found. Please ensure the wordpress-plugin directory exists.'
    }

    // If download format requested, serve as PHP file
    if (format === 'download') {
      return new NextResponse(pluginCode, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-php',
          'Content-Disposition': 'attachment; filename="smart-cms-bridge.php"',
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        pluginName: 'Smart CMS Bridge',
        version: '2.0.0',
        description: 'پلاگین جامع اتصال وردپرس به Smart CMS — ارائه REST API سفارشی، وب‌هوک رئال‌تایم و همگام‌سازی خودکار محتوا',
        features: [
          'REST API سفارشی با احراز هویت کلید API',
          'واکشی پست‌ها با فیلتر و صفحه‌بندی',
          'همگام‌سازی افزایشی (modified_after)',
          'وب‌هوک رئال‌تایم برای تغییرات محتوا',
          'شامل تصویر شاخص، دسته‌بندی و برچسب‌ها',
          'آمار سایت و تست اتصال (Heartbeat)',
          'پشتیبان از تمام پست‌تایپ‌ها',
        ],
        supportedEvents: [
          'post_created',
          'post_updated',
          'post_deleted',
          'post_status_changed',
          'post_terms_updated',
          'heartbeat',
          'manual_sync_request',
        ],
        apiEndpoints: [
          { path: '/wp-json/smart-cms/v1/posts', method: 'GET', description: 'لیست پست‌ها با فیلتر و صفحه‌بندی' },
          { path: '/wp-json/smart-cms/v1/posts/{id}', method: 'GET', description: 'جزئیات تک پست' },
          { path: '/wp-json/smart-cms/v1/categories', method: 'GET', description: 'لیست دسته‌بندی‌ها' },
          { path: '/wp-json/smart-cms/v1/tags', method: 'GET', description: 'لیست برچسب‌ها' },
          { path: '/wp-json/smart-cms/v1/stats', method: 'GET', description: 'آمار سایت' },
          { path: '/wp-json/smart-cms/v1/heartbeat', method: 'GET', description: 'تست اتصال' },
        ],
        installationSteps: [
          '۱. فایل پلاگین را دانلود کنید (دکمه دانلود در پایین)',
          '۲. در پیشخوان وردپرس به افزونه‌ها → افزودن → بارگذاری افزونه بروید',
          '۳. فایل PHP را آپلود کنید (نیازی به زیپ کردن نیست — وردپرس خودش فایل PHP را می‌شناسد)',
          '۴. افزونه را فعال کنید',
          '۵. از منوی «Smart CMS» تنظیمات را باز کنید',
          '۶. کلید API را کپی کنید و در Smart CMS وارد کنید',
          '۷. آدرس Webhook را وارد کنید: /api/wordpress/webhook',
          '۸. یک رمز وب‌هوک تنظیم کنید',
          '۹. تنظیمات را ذخیره کنید',
        ],
        queryParameters: {
          api_key: 'کلید API (الزامی)',
          page: 'شماره صفحه (پیش‌فرض: ۱)',
          per_page: 'تعداد در هر صفحه (پیش‌فرض: ۱۰، حداکثر: ۱۰۰)',
          status: 'فیلتر وضعیت: publish, draft, pending, any',
          search: 'جستجو در عنوان و محتوا',
          category: 'فیلتر بر اساس شناسه دسته‌بندی',
          tag: 'فیلتر بر اساس شناسه برچسب',
          author: 'فیلتر بر اساس شناسه نویسنده',
          after: 'پست‌های منتشر شده بعد از تاریخ (ISO 8601)',
          modified_after: 'پست‌های تغییر یافته بعد از تاریخ — برای همگام‌سازی افزایشی',
          orderby: 'مرتب‌سازی: date, modified, title, relevance',
          order: 'جهت: asc, desc',
          include_featured_image: 'شامل تصویر شاخص (پیش‌فرض: true)',
        },
        pluginCode,
      },
    })
  } catch (error) {
    console.error('GET /api/wordpress/plugin error:', error)
    return NextResponse.json({ error: 'Failed to fetch plugin info' }, { status: 500 })
  }
}
