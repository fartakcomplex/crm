import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all WordPress sync configs, or GET single by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      const config = await db.wPSyncConfig.findUnique({
        where: { id },
        include: {
          syncedPosts: {
            orderBy: { syncedAt: 'desc' },
          },
          _count: { select: { syncedPosts: true } },
        },
      })
      if (!config) {
        return NextResponse.json({ error: 'WordPress config not found' }, { status: 404 })
      }
      return NextResponse.json(config)
    }

    const configs = await db.wPSyncConfig.findMany({
      include: {
        _count: { select: { syncedPosts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(configs)
  } catch (error) {
    console.error('GET /api/wordpress/config error:', error)
    return NextResponse.json({ error: 'Failed to fetch WordPress configs' }, { status: 500 })
  }
}

// POST create a new WordPress sync config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteUrl, apiKey, username, syncFreq, active } = body

    if (!siteUrl || !apiKey || !username) {
      return NextResponse.json(
        { error: 'siteUrl, apiKey, and username are required' },
        { status: 400 }
      )
    }

    const config = await db.wPSyncConfig.create({
      data: {
        siteUrl,
        apiKey,
        username,
        syncFreq: syncFreq || 'manual',
        active: active !== undefined ? active : true,
      },
    })

    return NextResponse.json(config, { status: 201 })
  } catch (error) {
    console.error('POST /api/wordpress/config error:', error)
    return NextResponse.json({ error: 'Failed to create WordPress config' }, { status: 500 })
  }
}

// PUT update an existing WordPress sync config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, siteUrl, apiKey, username, syncFreq, active, lastSync } = body

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

    const config = await db.wPSyncConfig.update({
      where: { id },
      data: {
        ...(siteUrl !== undefined && { siteUrl }),
        ...(apiKey !== undefined && { apiKey }),
        ...(username !== undefined && { username }),
        ...(syncFreq !== undefined && { syncFreq }),
        ...(active !== undefined && { active }),
        ...(lastSync !== undefined && { lastSync: lastSync ? new Date(lastSync) : null }),
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('PUT /api/wordpress/config error:', error)
    return NextResponse.json({ error: 'Failed to update WordPress config' }, { status: 500 })
  }
}

// DELETE a WordPress sync config and its synced post records
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Config ID is required' }, { status: 400 })
    }

    // Delete related synced posts first
    await db.wPSyncedPost.deleteMany({ where: { wpConfigId: id } })

    await db.wPSyncConfig.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/wordpress/config error:', error)
    return NextResponse.json({ error: 'Failed to delete WordPress config' }, { status: 500 })
  }
}
