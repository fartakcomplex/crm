import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Types ──────────────────────────────────────────────────────────

interface BulkRequest {
  action: 'delete' | 'publish' | 'draft'
  type: 'posts' | 'users' | 'products'
  ids: string[]
}

// ─── POST Handler ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: BulkRequest = await request.json()
    const { action, type, ids } = body

    // Validate inputs
    if (!action || !['delete', 'publish', 'draft'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'عملیات نامعتبر است', affected: 0 },
        { status: 400 }
      )
    }

    if (!type || !['posts', 'users', 'products'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'نوع داده نامعتبر است', affected: 0 },
        { status: 400 }
      )
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'لیست شناسه‌ها خالی است', affected: 0 },
        { status: 400 }
      )
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { success: false, error: 'حداکثر ۱۰۰ آیتم قابل پردازش است', affected: 0 },
        { status: 400 }
      )
    }

    let affected = 0

    // Execute bulk operation in a transaction
    await db.$transaction(async (tx) => {
      switch (type) {
        case 'posts': {
          if (action === 'delete') {
            const result = await tx.post.deleteMany({
              where: { id: { in: ids } },
            })
            affected = result.count
          } else {
            const status = action === 'publish' ? 'published' : 'draft'
            const result = await tx.post.updateMany({
              where: { id: { in: ids } },
              data: { status },
            })
            affected = result.count
          }
          break
        }

        case 'users': {
          if (action === 'delete') {
            const result = await tx.user.deleteMany({
              where: { id: { in: ids } },
            })
            affected = result.count
          } else {
            const status = action === 'publish' ? 'active' : 'inactive'
            const result = await tx.user.updateMany({
              where: { id: { in: ids } },
              data: { status },
            })
            affected = result.count
          }
          break
        }

        case 'products': {
          if (action === 'delete') {
            const result = await tx.product.deleteMany({
              where: { id: { in: ids } },
            })
            affected = result.count
          } else {
            const status = action === 'publish' ? 'active' : 'draft'
            const result = await tx.product.updateMany({
              where: { id: { in: ids } },
              data: { status },
            })
            affected = result.count
          }
          break
        }
      }
    })

    const actionLabels: Record<string, string> = {
      delete: 'حذف',
      publish: 'انتشار',
      draft: 'پیش‌نویس',
    }

    const typeLabels: Record<string, string> = {
      posts: 'مطالب',
      users: 'کاربران',
      products: 'محصولات',
    }

    return NextResponse.json({
      success: true,
      affected,
      message: `${actionLabels[action]} ${typeLabels[type]} با موفقیت انجام شد`,
    })
  } catch (error) {
    console.error('[Bulk API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در انجام عملیات دسته‌ای', affected: 0 },
      { status: 500 }
    )
  }
}
