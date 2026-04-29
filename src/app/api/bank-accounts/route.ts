import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all bank accounts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { accountNumber: { contains: search } },
      ]
    }

    const [bankAccounts, total] = await Promise.all([
      db.bankAccount.findMany({
        where,
        include: {
          _count: { select: { transactions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.bankAccount.count({ where }),
    ])

    return NextResponse.json({ bankAccounts, total, page, limit })
  } catch (error) {
    console.error('GET /api/bank-accounts error:', error)
    return NextResponse.json({ error: 'Failed to fetch bank accounts' }, { status: 500 })
  }
}

// POST create a new bank account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, accountNumber, balance, currency, type } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const bankAccount = await db.bankAccount.create({
      data: {
        name,
        accountNumber: accountNumber || '',
        balance: balance || 0,
        currency: currency || 'IRR',
        type: type || 'checking',
      },
      include: {
        _count: { select: { transactions: true } },
      },
    })

    return NextResponse.json(bankAccount, { status: 201 })
  } catch (error) {
    console.error('POST /api/bank-accounts error:', error)
    return NextResponse.json({ error: 'Failed to create bank account' }, { status: 500 })
  }
}
