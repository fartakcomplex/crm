import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'z-ai-web-dev-sdk'

const client = createClient({
  apiKey: process.env.ZAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { seedKeywords, industry, language, region, count } = body

    if (!seedKeywords) {
      return NextResponse.json(
        { error: 'Seed keywords are required' },
        { status: 400 }
      )
    }

    const keywords = Array.isArray(seedKeywords) ? seedKeywords : [seedKeywords]
    if (keywords.length === 0) {
      return NextResponse.json(
        { error: 'At least one seed keyword is required' },
        { status: 400 }
      )
    }

    if (keywords.some((k: string) => typeof k !== 'string' || k.trim().length === 0)) {
      return NextResponse.json(
        { error: 'All keywords must be non-empty strings' },
        { status: 400 }
      )
    }

    const targetCount = Math.min(Math.max(count || 20, 5), 50)

    const systemPrompt = `You are an expert keyword researcher and SEO strategist. You have deep knowledge of search behavior, keyword intent classification, and competitive keyword analysis. You understand:
- Search volume estimation and trends
- Keyword difficulty scoring
- Search intent classification (informational, navigational, commercial, transactional)
- Long-tail keyword opportunities
- Related keywords and semantic clustering
- Seasonal and trend-based keyword variations
- Local SEO keyword considerations

You always provide structured, actionable keyword data that content creators can immediately use.`

    const userPrompt = `Perform comprehensive keyword research based on the following:

- **Seed Keywords**: ${keywords.join(', ')}
- **Industry/Niche**: ${industry || 'General'}
- **Language**: ${language || 'English'}
- **Target Region**: ${region || 'Global'}
- **Number of Suggestions**: ${targetCount}

Please provide your analysis as a JSON object with the following structure:
{
  "seedAnalysis": [
    { "keyword": "...", "intent": "informational|navigational|commercial|transactional", "estimatedDifficulty": "low|medium|high", "estimatedVolume": "low|medium|high" }
  ],
  "relatedKeywords": [
    { "keyword": "...", "intent": "...", "estimatedDifficulty": "...", "estimatedVolume": "...", "relevanceScore": 1-10 }
  ],
  "longTailKeywords": [
    { "keyword": "...", "intent": "...", "estimatedVolume": "...", "opportunityScore": 1-10 }
  ],
  "questionKeywords": [
    { "keyword": "...", "intent": "informational", "estimatedVolume": "..." }
  ],
  "trendingKeywords": [
    { "keyword": "...", "trend": "rising|stable|declining", "estimatedVolume": "..." }
  ],
  "contentClusters": [
    { "cluster": "...", "keywords": ["...", "..."], "pillarTopic": "..." }
  ],
  "recommendations": ["...", "..."]
}

Provide realistic estimates. Only return valid JSON, no other text.`

    const result = await client.chat.completions.create({
      model: 'GLM-5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const responseText = result.choices[0].message.content

    let parsedResult
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    } catch {
      parsedResult = { raw: responseText }
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      metadata: {
        seedKeywords: keywords,
        industry: industry || 'General',
        language: language || 'English',
        region: region || 'Global',
        requestedCount: targetCount,
        analyzedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/keywords error:', error)
    const message = error instanceof Error ? error.message : 'Failed to perform keyword research'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
