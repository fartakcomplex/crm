import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, type } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      )
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const client = await ZAI.create()

    const results = await client.functions.invoke('web_search', {
      query,
      num: 10,
      recency_days: type === 'news' ? 3 : type === 'trending' ? 7 : 30,
    })

    const formattedResults = Array.isArray(results)
      ? results.map((item: Record<string, unknown>) => ({
          title: item.title || item.name || '',
          url: item.url || item.link || '',
          snippet: item.snippet || item.description || item.text || '',
          publishedDate: item.publishedDate || item.date || null,
          source: item.source || item.domain || '',
        }))
      : results?.results
        ? Array.from(results.results as unknown[]).map((item: Record<string, unknown>) => ({
            title: item.title || '',
            url: item.url || item.link || '',
            snippet: item.snippet || item.description || '',
            publishedDate: item.publishedDate || null,
            source: item.source || '',
          }))
        : []

    return NextResponse.json({
      success: true,
      results: formattedResults,
      metadata: {
        query,
        type: type || 'general',
        resultCount: Array.isArray(formattedResults) ? formattedResults.length : 0,
        searchedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/search-web error:', error)
    const message = error instanceof Error ? error.message : 'Failed to perform web search'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
