import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET synced WordPress posts list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('configId')
    const syncStatus = searchParams.get('syncStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: Record<string, unknown> = {}

    if (configId) {
      where.wpConfigId = configId
    }
    if (syncStatus) {
      where.syncStatus = syncStatus
    }

    const [syncedPosts, total] = await Promise.all([
      db.wPSyncedPost.findMany({
        where,
        include: {
          wpConfig: {
            select: {
              id: true,
              siteUrl: true,
              username: true,
            },
          },
        },
        orderBy: { syncedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.wPSyncedPost.count({ where }),
    ])

    // Enrich with local post data if available
    const enrichedPosts = await Promise.all(
      syncedPosts.map(async (sp) => {
        const localPost = await db.post.findUnique({
          where: { id: sp.localPostId },
          select: { id: true, title: true, status: true, updatedAt: true },
        })
        return {
          ...sp,
          localPost,
        }
      })
    )

    return NextResponse.json({
      posts: enrichedPosts,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('GET /api/wordpress/posts error:', error)
    return NextResponse.json({ error: 'Failed to fetch synced WordPress posts' }, { status: 500 })
  }
}
