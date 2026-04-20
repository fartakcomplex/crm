import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST trigger sync — simulates pulling posts from WordPress
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { configId } = body

    if (!configId) {
      return NextResponse.json({ error: 'configId is required' }, { status: 400 })
    }

    // Verify the config exists
    const config = await db.wPSyncConfig.findUnique({
      where: { id: configId },
      include: { _count: { select: { syncedPosts: true } } },
    })

    if (!config) {
      return NextResponse.json({ error: 'WordPress config not found' }, { status: 404 })
    }

    if (!config.active) {
      return NextResponse.json({ error: 'WordPress config is not active' }, { status: 400 })
    }

    // Simulate sync: generate mock WordPress posts
    const mockWPPosts = [
      {
        wpPostId: Date.now() + 1,
        title: 'Getting Started with WordPress REST API',
        content: 'WordPress provides a powerful REST API that allows developers to interact with the site programmatically. This guide covers the basics of authentication, endpoints, and common use cases.',
        excerpt: 'Learn how to use the WordPress REST API for content management and automation.',
        status: 'published',
        author: config.username,
        date: new Date().toISOString(),
      },
      {
        wpPostId: Date.now() + 2,
        title: 'Advanced Custom Fields Integration Guide',
        content: 'ACF is one of the most popular plugins for adding custom fields to WordPress. This tutorial shows how to register field groups, display field values, and work with repeater fields and flexible content layouts.',
        excerpt: 'Master Advanced Custom Fields for WordPress development.',
        status: 'published',
        author: config.username,
        date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        wpPostId: Date.now() + 3,
        title: 'WordPress Security Best Practices for 2025',
        content: 'Security is paramount for any WordPress site. This article covers essential security measures including SSL enforcement, two-factor authentication, file permissions, automated backups, and vulnerability scanning.',
        excerpt: 'Protect your WordPress site with these security best practices.',
        status: 'draft',
        author: config.username,
        date: new Date(Date.now() - 172800000).toISOString(),
      },
    ]

    // Simulate creating local posts and sync records
    const syncResults = []

    // Get the first user as the default author for synced posts
    const defaultAuthor = await db.user.findFirst({
      select: { id: true },
    })

    if (!defaultAuthor) {
      return NextResponse.json({ error: 'No user found to assign as author for synced posts' }, { status: 400 })
    }

    for (const wpPost of mockWPPosts) {
      // Create a local Post record
      const slug = wpPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const localPost = await db.post.create({
        data: {
          title: wpPost.title,
          slug: `${slug}-wp-${wpPost.wpPostId}`,
          content: wpPost.content,
          excerpt: wpPost.excerpt,
          status: wpPost.status === 'published' ? 'published' : 'draft',
          featured: false,
          authorId: defaultAuthor.id,
          publishedAt: wpPost.status === 'published' ? new Date(wpPost.date) : null,
        },
      })

      // Create a WPSyncedPost record
      const syncedPost = await db.wPSyncedPost.create({
        data: {
          wpPostId: wpPost.wpPostId,
          localPostId: localPost.id,
          syncStatus: 'synced',
          wpConfigId: configId,
        },
      })

      syncResults.push({
        wpPostId: wpPost.wpPostId,
        localPostId: localPost.id,
        title: wpPost.title,
        status: wpPost.status,
        syncedPostId: syncedPost.id,
      })
    }

    // Update the config's lastSync timestamp
    await db.wPSyncConfig.update({
      where: { id: configId },
      data: { lastSync: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: `Sync completed. ${syncResults.length} posts synced from ${config.siteUrl}`,
      config: {
        id: config.id,
        siteUrl: config.siteUrl,
        lastSync: new Date(),
      },
      results: syncResults,
      summary: {
        totalPostsFetched: mockWPPosts.length,
        created: syncResults.length,
        updated: 0,
        errors: 0,
      },
    })
  } catch (error) {
    console.error('POST /api/wordpress/sync error:', error)
    return NextResponse.json({ error: 'Failed to sync WordPress posts' }, { status: 500 })
  }
}
