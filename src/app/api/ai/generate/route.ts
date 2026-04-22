import { NextRequest, NextResponse } from 'next/server'
import { getAIClient } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    const client = await getAIClient()
    const body = await request.json()
    const { type, topic, tone, length, keywords, language, context } = body

    if (!topic || !type) {
      return NextResponse.json(
        { error: 'Topic and content type are required' },
        { status: 400 }
      )
    }

    const validTypes = ['blog-post', 'article', 'product-description', 'social-media', 'email', 'landing-page', 'meta-description', 'ad-copy']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid content type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert content creator and copywriter with deep knowledge of SEO best practices, content marketing, and audience engagement. You write compelling, well-structured content that ranks well in search engines while providing genuine value to readers. You adapt your writing style, tone, and format based on the requested content type. Always include relevant headings, subheadings, and structural elements when appropriate. Write in a way that naturally incorporates keywords without keyword stuffing.`

    const userPrompt = `Generate the following content:
- **Content Type**: ${type}
- **Topic/Subject**: ${topic}
- **Tone**: ${tone || 'professional'}
- **Target Length**: ${length || 'medium'} (short ~300 words, medium ~800 words, long ~1500 words)
- **Target Keywords**: ${keywords?.join(', ') || 'not specified'}
- **Language**: ${language || 'English'}${context ? `\n- **Additional Context**: ${context}` : ''}

Please create high-quality, SEO-optimized content. Use proper formatting with headers, paragraphs, and bullet points where appropriate. Ensure the content is engaging and provides real value to the reader.`

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
      content: responseText,
      metadata: {
        type,
        topic,
        tone: tone || 'professional',
        length: length || 'medium',
        keywords: keywords || [],
        language: language || 'English',
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/generate error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate content'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
