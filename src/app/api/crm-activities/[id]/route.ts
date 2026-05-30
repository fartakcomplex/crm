import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/crm-activities/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const crmActivity = await db.crmActivity.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    })
    if (!crmActivity) {
      return NextResponse.json({ error: 'CRM activity not found' }, { status: 404 })
    }
    return NextResponse.json(crmActivity)
  } catch (error) {
    console.error('GET /api/crm-activities/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch CRM activity' }, { status: 500 })
  }
}

// PUT /api/crm-activities/:id — partial update
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existing = await db.crmActivity.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'CRM activity not found' }, { status: 404 })
    }

    const { type, title, description, outcome, scheduledAt, completedAt } = body

    const crmActivity = await db.crmActivity.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(outcome !== undefined && { outcome }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        ...(completedAt !== undefined && { completedAt: completedAt ? new Date(completedAt) : null }),
      },
      include: {
        customer: true,
      },
    })

    return NextResponse.json(crmActivity)
  } catch (error) {
    console.error('PUT /api/crm-activities/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update CRM activity' }, { status: 500 })
  }
}

// DELETE /api/crm-activities/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.crmActivity.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'CRM activity not found' }, { status: 404 })
    }

    await db.crmActivity.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/crm-activities/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete CRM activity' }, { status: 500 })
  }
}
