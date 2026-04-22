import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all invoices (with includes)
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
        { invoiceNumber: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          customer: true,
          order: true,
          items: { include: { product: true } },
          transactions: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ])

    return NextResponse.json({ invoices, total, page, limit })
  } catch (error) {
    console.error('GET /api/invoices error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

// POST create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, orderId, status, subtotal, tax, discount, total, dueDate, paidAt, notes, items } = body

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Auto-generate invoice number
    const count = await db.invoice.count()
    const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`

    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        orderId: orderId || null,
        status: status || 'draft',
        subtotal: subtotal || 0,
        tax: tax || 0,
        discount: discount || 0,
        total: total || 0,
        dueDate: dueDate ? new Date(dueDate) : null,
        paidAt: paidAt ? new Date(paidAt) : null,
        notes: notes || '',
        items: items?.length
          ? {
              create: items.map((item: { productId?: string; description: string; quantity: number; unitPrice: number; total: number }) => ({
                productId: item.productId || null,
                description: item.description || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
              })),
            }
          : undefined,
      },
      include: {
        customer: true,
        order: true,
        items: { include: { product: true } },
        transactions: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('POST /api/invoices error:', error)
    if (error instanceof Error && error.message.includes('Unique')) {
      return NextResponse.json({ error: 'Invoice number already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
