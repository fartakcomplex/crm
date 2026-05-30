import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all CRM activities (with includes)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}
    if (customerId) where.customerId = customerId
    if (type) where.type = type
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { outcome: { contains: search } },
      ]
    }

    const [crmActivities, total] = await Promise.all([
      db.crmActivity.findMany({
        where,
        include: {
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.crmActivity.count({ where }),
    ])

    return NextResponse.json({ crmActivities, total, page, limit })
  } catch (error) {
    console.error('GET /api/crm-activities error:', error)
    return NextResponse.json({ error: 'Failed to fetch CRM activities' }, { status: 500 })
  }
}

// POST create a new CRM activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, type, title, description, outcome, scheduledAt, completedAt } = body

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    const crmActivity = await db.crmActivity.create({
      data: {
        customerId,
        type: type || 'note',
        title: title || '',
        description: description || '',
        outcome: outcome || '',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
      include: {
        customer: true,
      },
    })

    return NextResponse.json(crmActivity, { status: 201 })
  } catch (error) {
    console.error('POST /api/crm-activities error:', error)
    return NextResponse.json({ error: 'Failed to create CRM activity' }, { status: 500 })
  }
}
