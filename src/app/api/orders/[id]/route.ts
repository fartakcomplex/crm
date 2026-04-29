import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
        coupon: true,
        invoices: true,
        outboundRecords: true,
      },
    })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json(order)
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

// PUT /api/orders/:id — partial update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const { status, subtotal, discount, tax, shippingCost, total, shippingAddress, notes, couponId } = body

    const order = await db.order.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(subtotal !== undefined && { subtotal }),
        ...(discount !== undefined && { discount }),
        ...(tax !== undefined && { tax }),
        ...(shippingCost !== undefined && { shippingCost }),
        ...(total !== undefined && { total }),
        ...(shippingAddress !== undefined && { shippingAddress }),
        ...(notes !== undefined && { notes }),
        ...(couponId !== undefined && { couponId: couponId || null }),
      },
      include: {
        customer: true,
        items: { include: { product: true } },
        coupon: true,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('PUT /api/orders/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// DELETE /api/orders/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Delete related records first
    await db.outboundRecord.deleteMany({ where: { orderId: id } })
    await db.orderItem.deleteMany({ where: { orderId: id } })
    // Disconnect invoices instead of deleting them
    await db.invoice.updateMany({ where: { orderId: id }, data: { orderId: null } })

    await db.order.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/orders/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
