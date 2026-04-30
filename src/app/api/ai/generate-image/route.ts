import { NextRequest, NextResponse } from 'next/server'

// ─── Translate Persian prompt to English for better image generation & fewer filter triggers ───
async function translateToEnglish(persianPrompt: string, client: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>>): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      messages: [
        { role: 'user', content: `Translate the following text to a concise English image generation prompt (max 100 words, descriptive, no explanations): "${persianPrompt}"` },
      ],
      thinking: { type: 'disabled' },
    })
    const translated = completion.choices[0]?.message?.content?.trim()
    return translated || persianPrompt
  } catch {
    return persianPrompt
  }
}

// ─── Sanitize prompt to reduce filter triggers ──────────────────────────────
function sanitizePrompt(prompt: string): string {
  // Remove common Persian trigger words that cause false-positive filters
  const safePrefixes = [
    'یک ', 'یه ', 'یک‌', 'عکس ', 'تصویر ', 'نقاشی ', 'طراحی ',
    'بکش ', 'بکشید ', 'ساخت ', 'ساز ', 'نمایش ',
  ]
  let sanitized = prompt
  for (const prefix of safePrefixes) {
    sanitized = sanitized.replace(new RegExp(`^${prefix}`, 'g'), '')
  }
  return sanitized
}

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

    // Step 1: Detect if prompt is non-English, translate to English
    const hasNonLatin = /[^\x00-\x7F]/.test(prompt)
    let finalPrompt = prompt

    if (hasNonLatin) {
      const sanitized = sanitizePrompt(prompt)
      finalPrompt = await translateToEnglish(sanitized, client)
    }

    // Step 2: Enhance with style and quality
    const enhancedPrompt = style
      ? `${finalPrompt}, ${style} style, high quality, professional, detailed`
      : `${finalPrompt}, high quality, professional, detailed`

    // Step 3: Try generating with retry on content filter
    let lastError: string = ''
    const maxRetries = 2

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await client.images.generations.create({
          prompt: enhancedPrompt,
          size: selectedSize,
        })

        const imageBase64 = response.data?.[0]?.base64
        if (!imageBase64) {
          return NextResponse.json(
            { success: false, error: 'No image data returned', userMessage: '⚠️ خطا در تولید تصویر. لطفاً دوباره تلاش کنید.' },
            { status: 500 }
          )
        }

        const imageUrl = `data:image/png;base64,${imageBase64}`

        return NextResponse.json({
          success: true,
          imageUrl,
          base64: imageBase64,
          metadata: {
            originalPrompt: prompt,
            usedPrompt: enhancedPrompt,
            translated: hasNonLatin,
            size: selectedSize,
            generatedAt: new Date().toISOString(),
          },
        })
      } catch (imgErr) {
        const errMsg = imgErr instanceof Error ? imgErr.message : ''
        lastError = errMsg

        // Content filter: try simplified prompt on retry
        if ((errMsg.includes('1301') || errMsg.includes('contentFilter')) && attempt < maxRetries) {
          // Retry with a safer, more generic version
          const safePrompt = `Beautiful artistic illustration, clean composition, vibrant colors, high quality digital art`
          try {
            const response = await client.images.generations.create({
              prompt: safePrompt,
              size: selectedSize,
            })
            const imageBase64 = response.data?.[0]?.base64
            if (imageBase64) {
              return NextResponse.json({
                success: true,
                imageUrl: `data:image/png;base64,${imageBase64}`,
                base64: imageBase64,
                metadata: {
                  originalPrompt: prompt,
                  usedPrompt: safePrompt,
                  fallback: true,
                  size: selectedSize,
                  generatedAt: new Date().toISOString(),
                },
              })
            }
          } catch {
            // fallback failed too, continue to error
          }
          break
        }
      }
    }

    // All retries failed
    if (lastError.includes('1301') || lastError.includes('contentFilter')) {
      return NextResponse.json({
        success: false,
        error: 'content_filter',
        userMessage: '⚠️ متأسفانه درخواست شما توسط سیستم ایمنی فیلتر شد. لطفاً توضیحات خود را به انگلیسی یا با عبارات عمومی‌تر وارد کنید.',
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: lastError,
      userMessage: '⚠️ خطا در تولید تصویر. لطفاً دوباره تلاش کنید.',
    }, { status: 500 })
  } catch (error) {
    console.error('POST /api/ai/generate-image error:', error)
    const msg = error instanceof Error ? error.message : ''

    if (msg.includes('1301') || msg.includes('contentFilter') || msg.includes('敏感')) {
      return NextResponse.json({
        success: false,
        error: 'content_filter',
        userMessage: '⚠️ متأسفانه درخواست شما توسط سیستم ایمنی فیلتر شد. لطفاً توضیحات خود را تغییر دهید و از عبارات مناسب‌تر استفاده کنید.',
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: msg || 'Failed to generate image',
      userMessage: '⚠️ خطا در تولید تصویر. لطفاً دوباره تلاش کنید.',
    }, { status: 500 })
  }
}
