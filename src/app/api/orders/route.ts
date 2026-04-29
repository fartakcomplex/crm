import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all orders (with includes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (customerId) where.customerId = customerId
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          customer: true,
          items: { include: { product: true } },
          coupon: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, limit })
  } catch (error) {
    console.error('GET /api/orders error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// POST create a new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, status, subtotal, discount, tax, shippingCost, total, shippingAddress, notes, couponId, items } = body

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Auto-generate order number
    const count = await db.order.count()
    const orderNumber = `ORD-${String(count + 1).padStart(6, '0')}`

    const order = await db.order.create({
      data: {
        orderNumber,
        customerId,
        status: status || 'pending',
        subtotal: subtotal || 0,
        discount: discount || 0,
        tax: tax || 0,
        shippingCost: shippingCost || 0,
        total: total || 0,
        shippingAddress: shippingAddress || '',
        notes: notes || '',
        couponId: couponId || null,
        items: items?.length
          ? {
              create: items.map((item: { productId: string; quantity: number; unitPrice: number; totalPrice: number }) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              })),
            }
          : undefined,
      },
      include: {
        customer: true,
        items: { include: { product: true } },
        coupon: true,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('POST /api/orders error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'Order number already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
