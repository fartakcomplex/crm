import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, style, size } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Image prompt is required' },
        { status: 400 }
      )
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const client = await ZAI.create()

    const validSizes = [
      '1024x1024', '768x1344', '864x1152',
      '1344x768', '1152x864', '1440x720', '720x1440',
    ]
    const selectedSize = validSizes.includes(size) ? size : '1024x1024'

    const enhancedPrompt = style
      ? `${prompt}, ${style} style, high quality, professional`
      : `${prompt}, high quality, professional`

    const response = await client.images.generations.create({
      prompt: enhancedPrompt,
      size: selectedSize,
    })

    const imageBase64 = response.data?.[0]?.base64

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'No image data returned from the generation service' },
        { status: 500 }
      )
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`

    return NextResponse.json({
      success: true,
      imageUrl,
      base64: imageBase64,
      metadata: {
        prompt: enhancedPrompt,
        size: selectedSize,
        style: style || 'default',
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/generate-image error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate image'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
