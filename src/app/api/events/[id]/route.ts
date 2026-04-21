import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/events/:id — Update an event
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, startDate, endDate, allDay, color, location, type } = body

    const existing = await db.calendarEvent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'رویداد یافت نشد' }, { status: 404 })
    }

    const event = await db.calendarEvent.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() ?? '' }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: new Date(endDate) }),
        ...(allDay !== undefined && { allDay }),
        ...(color !== undefined && { color }),
        ...(location !== undefined && { location: location?.trim() ?? '' }),
        ...(type !== undefined && { type }),
      },
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('PUT /api/events/[id] error:', error)
    return NextResponse.json({ error: 'خطا در بروزرسانی رویداد' }, { status: 500 })
  }
}

// DELETE /api/events/:id — Delete an event
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await db.calendarEvent.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'رویداد یافت نشد' }, { status: 404 })
    }

    await db.calendarEvent.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/events/[id] error:', error)
    return NextResponse.json({ error: 'خطا در حذف رویداد' }, { status: 500 })
  }
}
