import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'z-ai-web-dev-sdk'

const client = createClient({
  apiKey: process.env.ZAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, text, type, context } = body

    if (!type) {
      return NextResponse.json(
        { error: 'Analysis type is required (image, text, or both)' },
        { status: 400 }
      )
    }

    const validTypes = ['image', 'text', 'both']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    if (type === 'image' && !image) {
      return NextResponse.json(
        { error: 'Image data is required for image analysis' },
        { status: 400 }
      )
    }

    if (type === 'text' && !text) {
      return NextResponse.json(
        { error: 'Text content is required for text analysis' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert content analyst with capabilities in both visual and textual analysis. For images, you provide detailed descriptions, identify key elements, suggest alt text, and assess visual quality for web use. For text, you analyze tone, readability, sentiment, structure, and provide improvement suggestions. When analyzing both, you consider how the text and visuals work together as a unified content piece.`

    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = []

    if (image && (type === 'image' || type === 'both')) {
      userContent.push({
        type: 'image_url',
        image_url: { url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}` },
      })
    }

    const analysisPrompt = `Analyze the provided ${type === 'image' ? 'image' : type === 'text' ? 'text content' : 'image and text content'}:

${context ? `**Context**: ${context}` : ''}

Please provide:
1. **Content Description** - detailed description of what you see/read
2. **Key Elements/Themes** - main topics and elements identified
3. **Quality Assessment** - rate quality and relevance (1-10)
4. **Alt Text Suggestions** - SEO-friendly alt text if image is present
5. **Content Suggestions** - improvements and optimization tips
6. **Sentiment/Tone Analysis** - if text is present
7. **Readability Assessment** - if text is present
8. **Accessibility Notes** - any accessibility concerns or improvements
9. **SEO Recommendations** - how to optimize this content for search engines
10. **Content Strategy Ideas** - how this content could be used effectively

Format your response clearly using markdown.`

    if (text && (type === 'text' || type === 'both')) {
      userContent.push({ type: 'text', text: `${analysisPrompt}\n\n**Text to analyze**:\n${text}` })
    } else {
      userContent.push({ type: 'text', text: analysisPrompt })
    }

    const result = await client.chat.completions.create({
      model: 'GLM-5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      thinking: { type: 'disabled' },
    })

    const responseText = result.choices[0].message.content

    return NextResponse.json({
      success: true,
      analysis: responseText,
      metadata: {
        type,
        hasImage: !!image,
        hasText: !!text,
        textLength: text?.length || 0,
        analyzedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/analyze error:', error)
    const message = error instanceof Error ? error.message : 'Failed to analyze content'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
