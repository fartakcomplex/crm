import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/invoices/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        order: true,
        items: { include: { product: true } },
        transactions: { include: { bankAccount: true } },
      },
    })
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    return NextResponse.json(invoice)
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 })
  }
}

// PUT /api/invoices/:id — partial update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const { status, subtotal, tax, discount, total, dueDate, paidAt, notes, orderId } = body

    const invoice = await db.invoice.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(subtotal !== undefined && { subtotal }),
        ...(tax !== undefined && { tax }),
        ...(discount !== undefined && { discount }),
        ...(total !== undefined && { total }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(paidAt !== undefined && { paidAt: paidAt ? new Date(paidAt) : null }),
        ...(notes !== undefined && { notes }),
        ...(orderId !== undefined && { orderId: orderId || null }),
      },
      include: {
        customer: true,
        order: true,
        items: { include: { product: true } },
        transactions: true,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('PUT /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

// DELETE /api/invoices/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Delete related records first
    await db.transaction.updateMany({ where: { invoiceId: id }, data: { invoiceId: null } })
    await db.invoiceItem.deleteMany({ where: { invoiceId: id } })

    await db.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
