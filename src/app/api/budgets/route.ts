import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all budget items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const period = searchParams.get('period')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (period) where.period = period
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
      ]
    }

    const [budgetItems, total] = await Promise.all([
      db.budgetItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.budgetItem.count({ where }),
    ])

    return NextResponse.json({ budgetItems, total, page, limit })
  } catch (error) {
    console.error('GET /api/budgets error:', error)
    return NextResponse.json({ error: 'Failed to fetch budget items' }, { status: 500 })
  }
}

// POST create a new budget item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, allocated, spent, period, startDate, endDate } = body

    if (!name) {
      return NextResponse.json({ error: 'Budget name is required' }, { status: 400 })
    }

    const budgetItem = await db.budgetItem.create({
      data: {
        name,
        category: category || '',
        allocated: allocated || 0,
        spent: spent || 0,
        period: period || 'monthly',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json(budgetItem, { status: 201 })
  } catch (error) {
    console.error('POST /api/budgets error:', error)
    return NextResponse.json({ error: 'Failed to create budget item' }, { status: 500 })
  }
}
