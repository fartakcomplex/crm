import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// GET /api/notifications — returns all notifications from database
export async function GET() {
  try {
    const freshDb = new PrismaClient()
    const notifications = await freshDb.notification.findMany({
      orderBy: { createdAt: 'desc' },
    })
    await freshDb.$disconnect()
    return NextResponse.json(notifications)
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}
