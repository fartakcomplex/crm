import { NextRequest, NextResponse } from 'next/server'
import { isRateLimited, isSDKBusy, getQueueDepth, getCooldownSeconds, markSuccess, isRateLimitError, withSDKMutex, markRateLimited } from '@/lib/rate-limit'

// ─── In-memory cache (10 minutes TTL) ───────────────────────────────────────
interface ResearchCacheEntry {
  researchContext: string
  searchResults: Array<{ title: string; url: string; snippet: string }>
  createdAt: number
}
const researchCache = new Map<string, ResearchCacheEntry>()
const CACHE_TTL_MS = 10 * 60 * 1000

function getCacheKey(title: string, type: string): string {
  return `research:${type}:${title}`.toLowerCase().trim()
}

// ─── POST: Research a topic before media generation ─────────────────────────
export async function POST(request: NextRequest) {
  let body: { title?: string; type?: string } = {}

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: true, researchContext: 'Professional quality content with high quality and modern aesthetic.', searchResults: [], fallback: true },
    )
  }

  const { title, type } = body
  const mediaType = ['image', 'video', 'audio'].includes(type) ? type : 'image'

  // No title = return fallback
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return NextResponse.json(
      { success: true, researchContext: 'Professional quality content with high quality and modern aesthetic.', searchResults: [], fallback: true },
    )
  }

  try {
    // If rate-limited, return fallback immediately
    if (isRateLimited()) {
      console.log('[ai-research] Rate limited, returning fallback')
      return NextResponse.json({
        success: true,
        researchContext: `Professional ${mediaType} content about "${title.trim()}" with high quality and modern aesthetic.`,
        searchResults: [],
        fallback: true,
        rateLimited: true,
      })
    }

    // If SDK is busy with another call, don't queue research — return fallback
    if (isSDKBusy()) {
      console.log('[ai-research] SDK busy (queue depth: ' + getQueueDepth() + '), returning fallback')
      return NextResponse.json({
        success: true,
        researchContext: `Professional ${mediaType} content about "${title.trim()}" with high quality and modern aesthetic.`,
        searchResults: [],
        fallback: true,
        sdkBusy: true,
      })
    }

    // Check cache first
    const cacheKey = getCacheKey(title.trim(), mediaType)
    const cached = researchCache.get(cacheKey)
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        researchContext: cached.researchContext,
        searchResults: cached.searchResults,
        cached: true,
      })
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const client = await ZAI.create()

    const searchQuery = `"${title.trim()}"`

    console.log(`[ai-research] Search query: "${searchQuery}"`)

    // Use global SDK mutex — only ONE SDK call at a time
    const searchResults = await withSDKMutex(
      () => client.functions.invoke('web_search', { query: searchQuery, num: 5 }),
      'Research web_search',
      15000, // 15s timeout for research (should be fast)
    )

    // Normalize results
    const normalizedResults: Array<{ title: string; url: string; snippet: string }> = []
    const rawResults = Array.isArray(searchResults)
      ? searchResults
      : (searchResults as Record<string, unknown>)?.results
        ? Array.from((searchResults as Record<string, unknown>).results as unknown[])
        : []

    for (const item of rawResults.slice(0, 5)) {
      const r = item as Record<string, unknown>
      const t = String(r.title || r.name || '')
      const u = String(r.url || r.link || '')
      const s = String(r.snippet || r.description || r.text || '')
      if (t || s) normalizedResults.push({ title: t, url: u, snippet: s })
    }

    // Build context from snippets directly
    let researchContext = ''

    if (normalizedResults.length > 0) {
      const snippets = normalizedResults
        .slice(0, 3)
        .map(r => r.snippet)
        .filter(s => s.length > 10)
        .join('. ')

      researchContext = snippets.length > 0
        ? `Based on research about "${title.trim()}": ${snippets.slice(0, 300)}.`
        : `Professional ${mediaType} content about "${title.trim()}" with high quality and modern aesthetic.`
    } else {
      researchContext = `Professional ${mediaType} content about "${title.trim()}" with high quality and modern aesthetic.`
    }

    markSuccess()

    // Cache result
    researchCache.set(cacheKey, {
      researchContext,
      searchResults: normalizedResults,
      createdAt: Date.now(),
    })

    // Clean expired cache
    for (const [key, entry] of researchCache.entries()) {
      if (Date.now() - entry.createdAt >= CACHE_TTL_MS) researchCache.delete(key)
    }

    return NextResponse.json({
      success: true,
      researchContext,
      searchResults: normalizedResults,
    })
  } catch (error) {
    console.error('[ai-research] Error:', error)

    // Handle rate limit / precondition errors
    if (error && isRateLimitError(error)) {
      console.log('[ai-research] Rate limit or precondition error detected, returning fallback')
      markRateLimited()
    }

    // Always return success with fallback — never block generation
    return NextResponse.json({
      success: true,
      researchContext: `Professional ${mediaType} content about "${title.trim()}" with high quality and modern aesthetic.`,
      searchResults: [],
      fallback: true,
    })
  }
}
