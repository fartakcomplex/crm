import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST webhook receiver — accepts WordPress post data and creates/updates local Post records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, timestamp, data, secret } = body

    // Validate required fields
    if (!event || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: event and data are required' },
        { status: 400 }
      )
    }

    // Validate event type
    const validEvents = ['post_created', 'post_updated', 'post_deleted', 'post_status_changed']
    if (!validEvents.includes(event)) {
      return NextResponse.json(
        { error: `Invalid event type. Must be one of: ${validEvents.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate secret if configured
    const webhookSecretSetting = await db.setting.findUnique({
      where: { key: 'wp_webhook_secret' },
    })
    if (webhookSecretSetting && webhookSecretSetting.value) {
      if (!secret || secret !== webhookSecretSetting.value) {
        return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 403 })
      }
    }

    // Find an active WP config to associate with
    const wpConfig = await db.wPSyncConfig.findFirst({
      where: { active: true },
    })

    // Find or create the author user
    const authorName = data.author || 'webhook-bot'
    let author = await db.user.findFirst({
      where: { name: authorName },
    })
    if (!author) {
      author = await db.user.create({
        data: {
          name: authorName,
          email: `${authorName.replace(/\s+/g, '-').toLowerCase()}@wordpress-sync.local`,
          role: 'author',
          avatar: '',
          status: 'active',
        },
      })
    }

    const wpPostId = data.post_id || data.postId
    if (!wpPostId) {
      return NextResponse.json({ error: 'Post ID is required in data' }, { status: 400 })
    }

    // Handle post deletion
    if (event === 'post_deleted') {
      // Find the synced post record
      const syncedPost = await db.wPSyncedPost.findFirst({
        where: { wpPostId: Number(wpPostId) },
      })
      if (syncedPost) {
        // Mark local post as draft (soft delete) rather than removing it
        await db.post.update({
          where: { id: syncedPost.localPostId },
          data: { status: 'draft' },
        })
        // Update sync status
        await db.wPSyncedPost.update({
          where: { id: syncedPost.id },
          data: { syncStatus: 'deleted' },
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Post deletion processed',
        wpPostId,
        event,
      })
    }

    // Handle post creation or update
    const title = data.title || 'Untitled'
    const content = data.content || ''
    const excerpt = data.excerpt || ''
    const wpStatus = data.status || data.new_status || 'draft'
    const slug = data.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const uniqueSlug = `${slug}-wp-${wpPostId}`

    // Check if this WP post has already been synced
    const existingSync = await db.wPSyncedPost.findFirst({
      where: { wpPostId: Number(wpPostId) },
    })

    let localPost
    let syncAction: 'created' | 'updated'

    if (existingSync) {
      // Update existing local post
      localPost = await db.post.update({
        where: { id: existingSync.localPostId },
        data: {
          title,
          content,
          excerpt,
          status: wpStatus === 'publish' ? 'published' : 'draft',
          publishedAt: wpStatus === 'publish' ? (data.date ? new Date(data.date) : new Date()) : null,
        },
      })

      // Update sync record
      await db.wPSyncedPost.update({
        where: { id: existingSync.id },
        data: {
          syncStatus: wpStatus === 'publish' ? 'synced' : 'synced',
          syncedAt: new Date(),
        },
      })
      syncAction = 'updated'
    } else {
      // Create new local post
      localPost = await db.post.create({
        data: {
          title,
          slug: uniqueSlug,
          content,
          excerpt,
          status: wpStatus === 'publish' ? 'published' : 'draft',
          featured: false,
          authorId: author.id,
          publishedAt: wpStatus === 'publish' ? (data.date ? new Date(data.date) : new Date()) : null,
        },
      })

      // Create sync record if we have a WP config
      if (wpConfig) {
        await db.wPSyncedPost.create({
          data: {
            wpPostId: Number(wpPostId),
            localPostId: localPost.id,
            syncStatus: 'synced',
            wpConfigId: wpConfig.id,
          },
        })
      }
      syncAction = 'created'
    }

    // Log the activity
    await db.activityLog.create({
      data: {
        action: `wp_${event}`,
        details: `WordPress ${event}: "${title}" (WP ID: ${wpPostId}) — ${syncAction} local post "${localPost.title}"`,
        userId: author.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Post ${syncAction} successfully via webhook`,
      event,
      wpPostId,
      localPostId: localPost.id,
      syncAction,
      title: localPost.title,
      status: localPost.status,
    })
  } catch (error) {
    console.error('POST /api/wordpress/webhook error:', error)
    return NextResponse.json({ error: 'Failed to process WordPress webhook' }, { status: 500 })
  }
}
