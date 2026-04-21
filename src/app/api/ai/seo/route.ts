import { NextRequest, NextResponse } from 'next/server'
import { getAIClient } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    const client = await getAIClient()
    const body = await request.json()
    const { content, title, description, keywords, url, language } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required for SEO analysis' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert SEO analyst with deep knowledge of search engine algorithms, ranking factors, and content optimization strategies. You provide detailed, actionable SEO recommendations backed by industry best practices. You analyze content for:
- On-page SEO factors (titles, headings, meta descriptions, keyword usage)
- Content quality and readability
- Keyword density and placement
- Internal/external linking opportunities
- Technical SEO considerations
- Content structure and formatting
- User experience signals

Always provide a clear score, specific recommendations, and priority levels for each finding.`

    const userPrompt = `Perform a comprehensive SEO analysis on the following content:

${title ? `**Title**: ${title}` : ''}
${description ? `**Meta Description**: ${description}` : ''}
${keywords ? `**Target Keywords**: ${Array.isArray(keywords) ? keywords.join(', ') : keywords}` : ''}
${url ? `**URL**: ${url}` : ''}
${language ? `**Language**: ${language}` : ''}

**Content**:
${content}

Please provide:
1. **Overall SEO Score** (0-100)
2. **Title Analysis** - effectiveness and suggestions
3. **Meta Description Analysis** - if provided
4. **Keyword Analysis** - density, placement, and suggestions
5. **Content Structure** - headings, paragraphs, readability
6. **Readability Score** - with specific improvement tips
7. **Internal Linking Opportunities**
8. **Content Length Assessment**
9. **Top 5 Priority Actions** to improve SEO
10. **Quick Wins** - easy improvements with high impact

Format your response in a clear, structured manner using markdown.`

    const result = await client.chat.completions.create({
      model: 'GLM-5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const responseText = result.choices[0].message.content

    return NextResponse.json({
      success: true,
      analysis: responseText,
      metadata: {
        contentLength: content.length,
        title,
        keywords,
        analyzedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/seo error:', error)
    const message = error instanceof Error ? error.message : 'Failed to perform SEO analysis'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
