import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface WPPostResponse {
  id: number
  title: { rendered: string; raw: string }
  content: { rendered: string; raw: string }
  excerpt: { rendered: string; raw: string }
  slug: string
  status: string
  date: string
  date_gmt: string
  modified: string
  modified_gmt: string
  type: string
  author: { id: number; login: string; name: string; email: string; url: string }
  categories: Array<{ id: number; name: string; slug: string; count: number }>
  tags: Array<{ id: number; name: string; slug: string; count: number }>
  featured_media: Array<{ id: number; url: string; width: number; height: number; alt: string; title: string }> | null
  link: string
  comment_count: number
}

interface WPApiResponse {
  posts: WPPostResponse[]
  total: number
  pages: number
  page: number
  per_page: number
  site_info?: {
    name: string
    description: string
    url: string
    language: string
    version: string
  }
}

interface SyncResult {
  wpPostId: number
  localPostId: string
  title: string
  status: string
  action: 'created' | 'updated' | 'skipped'
  error?: string
}

// ─── POST trigger real sync — fetches posts from actual WordPress REST API ────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { configId, fullSync } = body

    if (!configId) {
      return NextResponse.json({ error: 'configId is required' }, { status: 400 })
    }

    // Verify config exists and is active
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

    // Get default author for synced posts
    const defaultAuthor = await db.user.findFirst({ select: { id: true } })
    if (!defaultAuthor) {
      return NextResponse.json({ error: 'No user found to assign as author' }, { status: 400 })
    }

    // Build WordPress REST API URL
    const siteUrl = config.siteUrl.replace(/\/+$/, '')
    const apiEndpoint = `${siteUrl}/wp-json/smart-cms/v1/posts`
    const webhookSecretSetting = await db.setting.findUnique({
      where: { key: 'wp_webhook_secret' },
    })

    // Determine the modified_after date for incremental sync
    let modifiedAfter = ''
    if (!fullSync && config.lastSync) {
      modifiedAfter = config.lastSync.toISOString()
    }

    // Fetch posts from WordPress
    let allPosts: WPPostResponse[] = []
    let currentPage = 1
    let totalPages = 1
    const perPage = 20

    while (currentPage <= totalPages) {
      const params = new URLSearchParams({
        api_key: config.apiKey,
        page: String(currentPage),
        per_page: String(perPage),
        status: 'any',
        include_featured_image: 'true',
        orderby: 'modified',
        order: 'desc',
      })

      if (modifiedAfter) {
        params.set('modified_after', modifiedAfter)
      }

      const fetchUrl = `${apiEndpoint}?${params.toString()}`

      try {
        const response = await fetch(fetchUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Smart-CMS-Bridge/2.0',
          },
          signal: AbortSignal.timeout(30000),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`WP API error (HTTP ${response.status}): ${errorText}`)
          
          if (response.status === 401 || response.status === 403) {
            return NextResponse.json({
              error: 'Authentication failed. Check your API key.',
              details: `WordPress returned HTTP ${response.status}. Make sure the Smart CMS Bridge plugin is installed and your API key matches.`,
            }, { status: 400 })
          }

          if (response.status === 404) {
            return NextResponse.json({
              error: 'WordPress API endpoint not found.',
              details: 'The Smart CMS Bridge plugin is not installed on the target WordPress site. Please install the plugin first.',
            }, { status: 400 })
          }

          throw new Error(`WordPress API returned HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json() as WPApiResponse

        if (data.posts && Array.isArray(data.posts)) {
          allPosts = allPosts.concat(data.posts)
        }

        totalPages = data.pages || 1
        currentPage++
      } catch (fetchError: unknown) {
        const msg = fetchError instanceof Error ? fetchError.message : String(fetchError)
        console.error(`Failed to fetch page ${currentPage} from WordPress:`, msg)
        
        // If it's a network error, try the native WP REST API as fallback
        if (allPosts.length === 0 && currentPage === 1) {
          console.log('Falling back to native WordPress REST API v2...')
          const fallbackPosts = await fetchFromNativeWPRestAPI(siteUrl, config.apiKey, modifiedAfter)
          if (fallbackPosts.length > 0) {
            allPosts = fallbackPosts
            break
          }
        }

        break
      }
    }

    // Process fetched posts
    const syncResults: SyncResult[] = []
    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const wpPost of allPosts) {
      try {
        const result = await processPost(wpPost, configId, defaultAuthor.id)
        syncResults.push(result)

        if (result.action === 'created') createdCount++
        else if (result.action === 'updated') updatedCount++
        else if (result.action === 'skipped') skippedCount++
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        errorCount++
        syncResults.push({
          wpPostId: wpPost.id,
          localPostId: '',
          title: wpPost.title?.raw || 'Unknown',
          status: wpPost.status,
          action: 'skipped',
          error: errMsg,
        })
      }
    }

    // Update config's lastSync timestamp
    await db.wPSyncConfig.update({
      where: { id: configId },
      data: { lastSync: new Date() },
    })

    // Log the sync activity
    await db.activityLog.create({
      data: {
        action: 'wp_sync_completed',
        details: `WordPress sync completed: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} errors from ${config.siteUrl}`,
        userId: defaultAuthor.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Sync completed. ${allPosts.length} posts fetched, ${createdCount} created, ${updatedCount} updated.`,
      config: {
        id: config.id,
        siteUrl: config.siteUrl,
        lastSync: new Date(),
      },
      results: syncResults,
      summary: {
        totalPostsFetched: allPosts.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
        incrementalSync: !!modifiedAfter,
        modifiedAfter: modifiedAfter || null,
      },
    })
  } catch (error) {
    console.error('POST /api/wordpress/sync error:', error)
    return NextResponse.json({ error: 'Failed to sync WordPress posts' }, { status: 500 })
  }
}

// ─── GET — Get sync status for all configs ─────────────────────────────────────

export async function GET() {
  try {
    const configs = await db.wPSyncConfig.findMany({
      where: { active: true },
      select: {
        id: true,
        siteUrl: true,
        lastSync: true,
        syncFreq: true,
        _count: { select: { syncedPosts: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ configs })
  } catch (error) {
    console.error('GET /api/wordpress/sync error:', error)
    return NextResponse.json({ error: 'Failed to fetch sync status' }, { status: 500 })
  }
}

// ─── Helper: Process a single WordPress post ───────────────────────────────────

async function processPost(
  wpPost: WPPostResponse,
  configId: string,
  authorId: string
): Promise<SyncResult> {
  const wpPostId = wpPost.id
  const title = wpPost.title?.raw || 'Untitled'
  const content = wpPost.content?.raw || wpPost.content?.rendered || ''
  const excerpt = wpPost.excerpt?.raw || wpPost.excerpt?.rendered || ''
  const wpStatus = wpPost.status || 'draft'
  const slug = wpPost.slug || title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)/g, '')
  const uniqueSlug = `${slug}-wp-${wpPostId}`

  // Check if this WP post has already been synced
  const existingSync = await db.wPSyncedPost.findFirst({
    where: { wpPostId },
  })

  const localStatus = wpStatus === 'publish' ? 'published' : 'draft'
  const publishedAt = wpStatus === 'publish' ? (wpPost.date ? new Date(wpPost.date) : new Date()) : null

  if (existingSync) {
    // Update existing local post
    const localPost = await db.post.update({
      where: { id: existingSync.localPostId },
      data: {
        title,
        content,
        excerpt,
        status: localStatus,
        publishedAt,
      },
    })

    // Update sync record
    await db.wPSyncedPost.update({
      where: { id: existingSync.id },
      data: {
        syncStatus: localStatus,
        syncedAt: new Date(),
      },
    })

    // Sync categories
    await syncPostCategories(localPost.id, wpPost)

    return {
      wpPostId,
      localPostId: localPost.id,
      title: localPost.title,
      status: localPost.status,
      action: 'updated',
    }
  }

  // Check for slug uniqueness
  const existingPost = await db.post.findUnique({ where: { slug: uniqueSlug } })
  if (existingPost) {
    return {
      wpPostId,
      localPostId: existingPost.id,
      title,
      status: existingPost.status,
      action: 'skipped',
    }
  }

  // Create new local post
  const localPost = await db.post.create({
    data: {
      title,
      slug: uniqueSlug,
      content,
      excerpt,
      status: localStatus,
      featured: false,
      authorId,
      publishedAt,
    },
  })

  // Create sync record
  await db.wPSyncedPost.create({
    data: {
      wpPostId,
      localPostId: localPost.id,
      syncStatus: localStatus,
      wpConfigId: configId,
    },
  })

  // Sync categories
  await syncPostCategories(localPost.id, wpPost)

  return {
    wpPostId,
    localPostId: localPost.id,
    title: localPost.title,
    status: localPost.status,
    action: 'created',
  }
}

// ─── Helper: Sync post categories from WordPress ───────────────────────────────

async function syncPostCategories(localPostId: string, wpPost: WPPostResponse): Promise<void> {
  if (!wpPost.categories || wpPost.categories.length === 0) return

  for (const wpCat of wpPost.categories) {
    // Try to find existing category by name
    const existingCat = await db.category.findFirst({
      where: { name: wpCat.name },
    })

    if (existingCat) {
      await db.post.update({
        where: { id: localPostId },
        data: { categoryId: existingCat.id },
      })
      break // Assign the first category
    } else {
      // Create new category
      const newCat = await db.category.create({
        data: {
          name: wpCat.name,
          slug: wpCat.slug || wpCat.name.toLowerCase().replace(/\s+/g, '-'),
          color: '#06b6d4',
          postCount: 1,
        },
      })
      await db.post.update({
        where: { id: localPostId },
        data: { categoryId: newCat.id },
      })
      break
    }
  }
}

// ─── Fallback: Fetch from native WordPress REST API v2 ─────────────────────────

async function fetchFromNativeWPRestAPI(
  siteUrl: string,
  apiKey: string,
  modifiedAfter: string
): Promise<WPPostResponse[]> {
  try {
    const params = new URLSearchParams({
      per_page: '50',
      orderby: 'modified',
      order: 'desc',
      status: 'publish,draft,pending',
      _embed: 'true',
    })

    if (modifiedAfter) {
      params.set('after', modifiedAfter)
    }

    const response = await fetch(
      `${siteUrl}/wp-json/wp/v2/posts?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      }
    )

    if (!response.ok) return []

    const data = await response.json() as Array<Record<string, unknown>>

    // Transform native WP REST API response to our format
    return data.map((post) => {
      const embedded = post._embedded as Record<string, Array<Record<string, unknown>>> | undefined
      const wpTerms = embedded?.['wp:term']?.[0] as Array<Record<string, unknown>> | undefined
      const authorData = embedded?.['author']?.[0] as Record<string, unknown> | undefined
      const featuredMedia = embedded?.['wp:featuredmedia']?.[0] as Record<string, unknown> | undefined

      return {
        id: post.id as number,
        title: {
          rendered: (post.title as Record<string, string>)?.rendered || '',
          raw: (post.title as Record<string, string>)?.rendered || '',
        },
        content: {
          rendered: (post.content as Record<string, string>)?.rendered || '',
          raw: (post.content as Record<string, string>)?.rendered || '',
        },
        excerpt: {
          rendered: (post.excerpt as Record<string, string>)?.rendered || '',
          raw: (post.excerpt as Record<string, string>)?.rendered || '',
        },
        slug: post.slug as string,
        status: post.status as string,
        date: post.date as string,
        date_gmt: post.date_gmt as string,
        modified: post.modified as string,
        modified_gmt: post.modified_gmt as string,
        type: 'post',
        author: {
          id: (post.author as number) || 0,
          login: (authorData?.slug as string) || '',
          name: (authorData?.name as string) || '',
          email: '',
          url: (authorData?.link as string) || '',
        },
        categories: (wpTerms || [])
          .filter((t: Record<string, unknown>) => t.taxonomy === 'category')
          .map((t: Record<string, unknown>) => ({
            id: t.id as number,
            name: t.name as string,
            slug: t.slug as string,
            count: t.count as number,
          })),
        tags: (wpTerms || [])
          .filter((t: Record<string, unknown>) => t.taxonomy === 'post_tag')
          .map((t: Record<string, unknown>) => ({
            id: t.id as number,
            name: t.name as string,
            slug: t.slug as string,
            count: t.count as number,
          })),
        featured_media: featuredMedia
          ? [{
              id: featuredMedia.id as number,
              url: (featuredMedia.source_url as string) || '',
              width: (featuredMedia.media_details?.width as number) || 0,
              height: (featuredMedia.media_details?.height as number) || 0,
              alt: (featuredMedia.alt_text as string) || '',
              title: (featuredMedia.title?.rendered as string) || '',
            }]
          : null,
        link: post.link as string,
        comment_count: 0,
      }
    })
  } catch (err) {
    console.error('Native WP REST API fallback also failed:', err)
    return []
  }
}
