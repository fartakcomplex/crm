import { NextRequest, NextResponse } from 'next/server'
import { getAIClient } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    const client = await getAIClient()
    const body = await request.json()
    const { content, title, targetKeywords, contentType, audience, goals } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required for optimization analysis' },
        { status: 400 }
      )
    }

    const keywords = Array.isArray(targetKeywords)
      ? targetKeywords
      : targetKeywords
        ? [targetKeywords]
        : []

    const systemPrompt = `You are an expert content optimizer and SEO copywriter. You specialize in:
- Content readability and structure improvement
- Keyword optimization without keyword stuffing
- Heading hierarchy optimization (H1-H6)
- Meta title and description crafting
- Internal linking strategy
- Call-to-action optimization
- Content freshness and E-E-A-T signals
- User engagement optimization
- Conversion rate optimization through content
- Featured snippet optimization

You provide specific, actionable suggestions with before/after examples whenever possible.`

    const userPrompt = `Analyze and provide optimization suggestions for the following content:

${title ? `**Title**: ${title}` : ''}
${contentType ? `**Content Type**: ${contentType}` : ''}
${keywords.length > 0 ? `**Target Keywords**: ${keywords.join(', ')}` : ''}
${audience ? `**Target Audience**: ${audience}` : ''}
${goals ? `**Content Goals**: ${goals}` : ''}

**Content to Optimize**:
${content}

Please provide your analysis as a JSON object with the following structure:
{
  "overallScore": {
    "readability": 1-100,
    "seo": 1-100,
    "engagement": 1-100,
    "conversion": 1-100
  },
  "titleOptimization": {
    "currentTitle": "...",
    "suggestedTitles": ["...", "...", "..."],
    "titleScore": 1-100,
    "improvementNotes": "..."
  },
  "metaDescription": {
    "suggested": "...",
    "charCount": number,
    "includesKeywords": true/false
  },
  "headingStructure": {
    "currentStructure": ["H1: ...", "H2: ...", ...],
    "suggestedStructure": ["...", "..."],
    "issues": ["...", "..."]
  },
  "keywordOptimization": {
    "primaryKeywordUsage": {
      "keyword": "...",
      "currentCount": number,
      "recommendedCount": number,
      "placements": ["...", "..."]
    },
    "missingKeywords": ["...", "..."],
    "keywordDensity": "X%",
    "recommendedDensity": "Y%"
  },
  "readabilityImprovements": {
    "currentLevel": "grade X",
    "targetLevel": "grade Y",
    "suggestions": [
      { "issue": "...", "suggestion": "...", "impact": "high|medium|low" }
    ],
    "sentencesToSimplify": ["...", "..."]
  },
  "contentGaps": [
    { "gap": "...", "suggestion": "...", "priority": "high|medium|low" }
  ],
  "internalLinkingOpportunities": [
    { "anchorText": "...", "suggestedTarget": "...", "reason": "..." }
  ],
  "ctaSuggestions": ["...", "..."],
  "quickWins": [
    { "action": "...", "expectedImpact": "...", "effort": "low|medium|high" }
  ],
  "priorityActions": [
    { "action": "...", "reason": "...", "priority": 1-10 }
  ],
  "optimizedContent": "The fully optimized version of the content with all improvements applied"
}

Be specific and actionable. Provide the optimized content as a complete rewrite with all improvements incorporated.`

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
        contentLength: content.length,
        title,
        targetKeywords: keywords,
        contentType: contentType || 'article',
        analyzedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/optimize error:', error)
    const message = error instanceof Error ? error.message : 'Failed to optimize content'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
