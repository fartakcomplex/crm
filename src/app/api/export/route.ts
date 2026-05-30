import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Valid export types and formats
const VALID_TYPES = ['posts', 'users', 'customers', 'orders'] as const
const VALID_FORMATS = ['json', 'csv'] as const

// CSV field separator and helpers
const CSV_SEPARATOR = ','

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(CSV_SEPARATOR) || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    if (value === null || value === undefined) {
      result[newKey] = ''
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value)
    } else if (typeof value === 'object' && !(value instanceof Date)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey))
    } else if (value instanceof Date) {
      result[newKey] = value.toISOString()
    } else {
      result[newKey] = value
    }
  }
  return result
}

function toCsvRow(data: Record<string, unknown>, headers: string[]): string {
  return headers.map(h => escapeCsvField(data[h])).join(CSV_SEPARATOR)
}

function convertToCsv(data: Record<string, unknown>[]): { csv: string; filename: string } {
  if (data.length === 0) {
    return { csv: '', filename: 'export.csv' }
  }

  const flatData = data.map(item => flattenObject(item))
  const headers = Object.keys(flatData[0])
  const headerRow = headers.map(h => escapeCsvField(h)).join(CSV_SEPARATOR)
  const rows = flatData.map(item => toCsvRow(item, headers))

  return {
    csv: `${headerRow}\n${rows.join('\n')}`,
    filename: `export-${new Date().toISOString().slice(0, 10)}.csv`,
  }
}

// ──────────── Data Fetchers ────────────

async function fetchPosts() {
  const posts = await db.post.findMany({
    include: {
      author: { select: { name: true, email: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  return posts.map(p => ({
    id: p.id,
    عنوان: p.title,
    وضعیت: p.status,
    نویسنده: p.author.name,
    دسته‌بندی: p.category?.name ?? '',
    بازدید: p.views ?? 0,
    تاریخ_ایجاد: p.createdAt.toISOString(),
    تاریخ_بروزرسانی: p.updatedAt.toISOString(),
  }))
}

async function fetchUsers() {
  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  return users.map(u => ({
    id: u.id,
    نام: u.name,
    ایمیل: u.email,
    نقش: u.role,
    وضعیت: u.status,
    تاریخ_ایجاد: u.createdAt.toISOString(),
    تاریخ_بروزرسانی: u.updatedAt.toISOString(),
  }))
}

async function fetchCustomers() {
  const customers = await db.customer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  return customers.map(c => ({
    id: c.id,
    نام: c.name,
    ایمیل: c.email,
    تلفن: c.phone,
    شرکت: c.company,
    وضعیت: c.status,
    ارزش: c.value,
    شهر: c.city,
    تاریخ_ایجاد: c.createdAt.toISOString(),
  }))
}

async function fetchOrders() {
  const orders = await db.order.findMany({
    include: {
      customer: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  return orders.map(o => ({
    id: o.id,
    شماره_سفارش: o.orderNumber,
    مشتری: o.customer.name,
    وضعیت: o.status,
    جمع_فرعی: o.subtotal,
    تخفیف: o.discount,
    مالیات: o.tax,
    هزینه_ارسال: o.shippingCost,
    جمع_کل: o.total,
    تاریخ_ایجاد: o.createdAt.toISOString(),
  }))
}

// ──────────── GET Handler ────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? ''
    const format = (searchParams.get('format') ?? 'json').toLowerCase()

    // Validate type
    if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
      return NextResponse.json(
        { error: `نوع نامعتبر. انواع مجاز: ${VALID_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    // Validate format
    if (!VALID_FORMATS.includes(format as typeof VALID_FORMATS[number])) {
      return NextResponse.json(
        { error: `فرمت نامعتبر. فرمت‌های مجاز: ${VALID_FORMATS.join(', ')}` },
        { status: 400 },
      )
    }

    // Fetch data based on type
    let data: Record<string, unknown>[] = []
    let typeName = ''

    switch (type) {
      case 'posts':
        data = await fetchPosts()
        typeName = 'posts'
        break
      case 'users':
        data = await fetchUsers()
        typeName = 'users'
        break
      case 'customers':
        data = await fetchCustomers()
        typeName = 'customers'
        break
      case 'orders':
        data = await fetchOrders()
        typeName = 'orders'
        break
    }

    // Return in requested format
    if (format === 'csv') {
      const { csv, filename } = convertToCsv(data)

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // Default: JSON
    return NextResponse.json({
      type: typeName,
      format: 'json',
      count: data.length,
      exportedAt: new Date().toISOString(),
      data,
    })
  } catch (error) {
    console.error('GET /api/export error:', error)
    return NextResponse.json(
      { error: 'خطا در خروجی‌گیری داده‌ها' },
      { status: 500 },
    )
  }
}
