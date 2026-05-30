import { NextRequest, NextResponse } from 'next/server'
import { getAIClient } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    const client = await getAIClient()
    const body = await request.json()
    const { url, competitors, industry, existingBacklinks } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required for backlink analysis' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert link building strategist and backlink analyst. You have deep knowledge of:
- Link equity and PageRank concepts
- Anchor text optimization strategies
- Toxic link identification and disavow recommendations
- Competitor backlink gap analysis
- Link building outreach strategies
- Content-led link building tactics
- Digital PR and relationship building
- Technical link analysis (nofollow, dofollow, redirects, etc.)
- Link velocity and natural link profiles

You provide actionable, realistic backlink strategies that align with white-hat SEO practices and avoid manipulative tactics.`

    const userPrompt = `Perform a comprehensive backlink analysis and strategy recommendation:

**Target URL/Domain**: ${url}
${competitors && competitors.length > 0 ? `**Competitors to Analyze**: ${Array.isArray(competitors) ? competitors.join(', ') : competitors}` : ''}
${industry ? `**Industry**: ${industry}` : ''}
${existingBacklinks ? `**Known Existing Backlinks**: ${typeof existingBacklinks === 'string' ? existingBacklinks : JSON.stringify(existingBacklinks)}` : ''}

Please provide your analysis as a JSON object with the following structure:
{
  "backlinkProfileScore": {
    "overallHealth": "good|fair|poor",
    "authorityStrength": "high|medium|low",
    "diversityScore": 1-10,
    "toxicityRisk": "low|medium|high"
  },
  "linkTypeBreakdown": {
    "editorial": percentage,
    "guestPost": percentage,
    "directory": percentage,
    "resource": percentage,
    "other": percentage
  },
  "anchorTextAnalysis": {
    "branded": percentage,
    "exactMatch": percentage,
    "partialMatch": percentage,
    "generic": percentage,
    "nakedUrl": percentage
  },
  "competitorGapAnalysis": [
    { "competitor": "...", "opportunityType": "...", "estimatedValue": "high|medium|low", "actionRequired": "..." }
  ],
  "topOpportunities": [
    { "opportunity": "...", "type": "guestPost|resource|brokenLink|skyscraper|digitalPR", "difficulty": "easy|medium|hard", "estimatedImpact": "high|medium|low", "description": "..." }
  ],
  "linkBuildingStrategy": {
    "shortTerm": ["...", "..."],
    "mediumTerm": ["...", "..."],
    "longTerm": ["...", "..."]
  },
  "toxicLinkIndicators": ["...", "..."],
  "recommendations": ["...", "..."]
}

Provide realistic analysis based on the URL and context. Only return valid JSON.`

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
        competitors: competitors || [],
        industry: industry || 'General',
        analyzedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/backlink error:', error)
    const message = error instanceof Error ? error.message : 'Failed to perform backlink analysis'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
