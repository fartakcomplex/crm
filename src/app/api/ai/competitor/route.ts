import { NextRequest, NextResponse } from 'next/server'
import { getAIClient } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    const client = await getAIClient()
    const body = await request.json()
    const { url, competitors, industry, focusAreas } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required for competitor analysis' },
        { status: 400 }
      )
    }

    const competitorList = Array.isArray(competitors) ? competitors : competitors ? [competitors] : []
    const areas = Array.isArray(focusAreas)
      ? focusAreas
      : focusAreas
        ? [focusAreas]
        : ['seo', 'content', 'keywords', 'backlinks', 'social', 'performance']

    const validAreas = ['seo', 'content', 'keywords', 'backlinks', 'social', 'performance', 'technical', 'ux']
    const invalidAreas = areas.filter((a: string) => !validAreas.includes(a))
    if (invalidAreas.length > 0) {
      return NextResponse.json(
        { error: `Invalid focus areas: ${invalidAreas.join(', ')}. Must be one of: ${validAreas.join(', ')}` },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert competitive intelligence analyst specializing in digital marketing and SEO. You have deep expertise in:
- Competitor website and content analysis
- SEO competitive benchmarking
- Keyword gap analysis
- Content strategy comparison
- Technical SEO comparison
- Social media presence analysis
- Backlink profile comparison
- Traffic estimation and market share analysis
- SWOT analysis for digital presence
- Strategic recommendations based on competitive data

You provide objective, data-driven competitive insights with actionable strategic recommendations.`

    const userPrompt = `Perform a comprehensive competitor analysis:

**Your URL/Domain**: ${url}
${competitorList.length > 0 ? `**Competitors**: ${competitorList.join(', ')}` : '**Competitors**: (Please identify the top 3-5 likely competitors based on the URL)'}
${industry ? `**Industry**: ${industry}` : ''}
**Focus Areas**: ${areas.join(', ')}

Please provide your analysis as a JSON object with the following structure:
{
  "identifiedCompetitors": [
    { "name": "...", "url": "...", "estimatedAuthority": "high|medium|low", "primaryStrength": "..." }
  ],
  "swotAnalysis": {
    "strengths": ["...", "..."],
    "weaknesses": ["...", "..."],
    "opportunities": ["...", "..."],
    "threats": ["...", "..."]
  },
  "keywordGaps": {
    "competitorRankingKeywords": [
      { "keyword": "...", "competitor": "...", "estimatedDifficulty": "...", "opportunityScore": 1-10 }
    ],
    "yourAdvantageKeywords": [
      { "keyword": "...", "yourPosition": "..." }
    ]
  },
  "contentComparison": {
    "contentVolume": { "yours": "X pages", "averageCompetitor": "Y pages" },
    "topPerformingContent": [
      { "competitor": "...", "topic": "...", "estimatedTraffic": "..." }
    ],
    "contentGaps": ["topics your competitors cover that you don't"]
  },
  "backlinkComparison": {
    "estimatedBacklinkCounts": { "yours": "...", "competitors": ["..."] },
    "linkBuildingOpportunities": ["..."]
  },
  "technicalComparison": {
    "siteSpeed": { "yours": "estimated", "competitors": "estimated" },
    "mobileFriendliness": { "yours": "...", "competitors": "..." },
    "technicalIssues": ["..."]
  },
  "marketPosition": {
    "estimatedMarketShare": "X%",
    "rankingPosition": "X-Y",
    "growthPotential": "high|medium|low"
  },
  "strategicRecommendations": {
    "immediateActions": ["...", "..."],
    "shortTermStrategy": ["...", "..."],
    "longTermStrategy": ["...", "..."],
    "differentiationOpportunities": ["...", "..."]
  },
  "summary": "A brief 2-3 sentence executive summary of the competitive landscape"
}

Provide realistic, insightful analysis. Only return valid JSON.`

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
        url,
        competitors: competitorList,
        focusAreas: areas,
        industry: industry || 'General',
        analyzedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/competitor error:', error)
    const message = error instanceof Error ? error.message : 'Failed to perform competitor analysis'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
