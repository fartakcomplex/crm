import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/events — List all events ordered by startDate
export async function GET() {
  try {
    const events = await db.calendarEvent.findMany({
      orderBy: { startDate: 'asc' },
    })
    return NextResponse.json({ events })
  } catch (error) {
    console.error('GET /api/events error:', error)
    return NextResponse.json({ error: 'خطا در دریافت رویدادها' }, { status: 500 })
  }
}

// POST /api/events — Create a new event
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, startDate, endDate, allDay, color, location, type } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'عنوان رویداد الزامی است' }, { status: 400 })
    }
    if (!startDate) {
      return NextResponse.json({ error: 'تاریخ شروع الزامی است' }, { status: 400 })
    }
    if (!endDate) {
      return NextResponse.json({ error: 'تاریخ پایان الزامی است' }, { status: 400 })
    }

    const event = await db.calendarEvent.create({
      data: {
        title: title.trim(),
        description: description?.trim() ?? '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay: allDay ?? false,
        color: color ?? 'violet',
        location: location?.trim() ?? '',
        type: type ?? 'event',
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('POST /api/events error:', error)
    return NextResponse.json({ error: 'خطا در ایجاد رویداد' }, { status: 500 })
  }
}
