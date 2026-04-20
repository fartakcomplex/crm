import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all settings grouped by group
export async function GET() {
  try {
    const settings = await db.setting.findMany({
      orderBy: { group: 'asc' },
    })

    // Group settings by their group field
    const grouped = settings.reduce<Record<string, Record<string, string>>>((acc, setting) => {
      if (!acc[setting.group]) {
        acc[setting.group] = {}
      }
      acc[setting.group][setting.key] = setting.value
      return acc
    }, {})

    return NextResponse.json({ settings, grouped })
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT update settings (upsert by key)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
    }

    const results = await Promise.all(
      Object.entries(settings).map(async ([key, data]) => {
        const value = (data as Record<string, string>).value
        const group = (data as Record<string, string>).group || 'general'

        return db.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value, group },
        })
      })
    )

    return NextResponse.json({ settings: results })
  } catch (error) {
    console.error('PUT /api/settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
