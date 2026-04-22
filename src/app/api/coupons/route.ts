import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all coupons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (active === 'true') {
      where.active = true
    } else if (active === 'false') {
      where.active = false
    }
    if (search) {
      where.OR = [
        { code: { contains: search } },
      ]
    }

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        where,
        include: {
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.coupon.count({ where }),
    ])

    return NextResponse.json({ coupons, total, page, limit })
  } catch (error) {
    console.error('GET /api/coupons error:', error)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

// POST create a new coupon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, type, value, minPurchase, maxUses, active, expiresAt } = body

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    const coupon = await db.coupon.create({
      data: {
        code: code.toUpperCase(),
        type: type || 'percent',
        value: value || 0,
        minPurchase: minPurchase || 0,
        maxUses: maxUses || 0,
        usedCount: 0,
        active: active !== undefined ? active : true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        _count: { select: { orders: true } },
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    console.error('POST /api/coupons error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}
