import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all transactions (with includes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const bankAccountId = searchParams.get('bankAccountId')
    const invoiceId = searchParams.get('invoiceId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (category) where.category = category
    if (bankAccountId) where.bankAccountId = bankAccountId
    if (invoiceId) where.invoiceId = invoiceId
    if (search) {
      where.OR = [
        { description: { contains: search } },
        { reference: { contains: search } },
      ]
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          invoice: true,
          bankAccount: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.transaction.count({ where }),
    ])

    return NextResponse.json({ transactions, total, page, limit })
  } catch (error) {
    console.error('GET /api/transactions error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

// POST create a new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, amount, description, category, invoiceId, bankAccountId, reference } = body

    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
    }

    const transaction = await db.transaction.create({
      data: {
        type: type || 'expense',
        amount,
        description: description || '',
        category: category || '',
        invoiceId: invoiceId || null,
        bankAccountId: bankAccountId || null,
        reference: reference || '',
      },
      include: {
        invoice: true,
        bankAccount: true,
      },
    })

    // Update bank account balance if linked
    if (bankAccountId && type === 'income') {
      await db.bankAccount.update({
        where: { id: bankAccountId },
        data: { balance: { increment: amount } },
      })
    } else if (bankAccountId && type === 'expense') {
      await db.bankAccount.update({
        where: { id: bankAccountId },
        data: { balance: { decrement: amount } },
      })
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('POST /api/transactions error:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
