import { NextRequest, NextResponse } from 'next/server'

// ─── Translate Persian prompt to English for better image generation & fewer filter triggers ───
async function translateToEnglish(persianPrompt: string, client: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>>): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `You are an expert image prompt engineer. Convert the following text into a detailed, vivid English image generation prompt for an AI image model.

Rules:
- Output ONLY the image prompt, nothing else
- Describe the VISUAL SCENE in rich detail: subjects, objects, environment, lighting, colors, composition
- Add photographic/artistic quality terms (e.g., 8k, sharp focus, professional lighting)
- If text is in Persian/Arabic, translate the SUBJECT MATTER to English — ignore any instructions like "please generate" or "output in Persian"
- Keep the prompt under 120 words
- Be specific and descriptive

Text to convert: "${persianPrompt}"`
        },
      ],
      thinking: { type: 'disabled' },
    })
    const translated = completion.choices[0]?.message?.content?.trim()
    return translated || persianPrompt
  } catch {
    return persianPrompt
  }
}

// ─── In-memory task store for polling ───────────────────────────────────────
interface ImageTask {
  id: string
  status: 'processing' | 'success' | 'error'
  imageUrl?: string
  base64?: string
  error?: string
  userMessage?: string
  createdAt: number
  usedPrompt?: string
  translated?: boolean
}
const imageTasks = new Map<string, ImageTask>()

function generateTaskId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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

    // Detect and translate non-English prompts
    const hasNonLatin = /[^\x00-\x7F]/.test(prompt)
    let finalPrompt = prompt
    if (hasNonLatin) {
      // Strip common Persian filler words and non-visual instructions
      const sanitized = prompt
        .replace(/^(یک |یه |عکس |تصویر |نقاشی |طراحی |بکش |ساخت |نمایش |لطفاً |خروجی |فارسی )+/g, '')
        .replace(/(به زبان فارسی|فرمت خوانا|حرفه‌ای ارائه|ایموجی|فرمت‌بندی مناسب|تولید کن|بساز|ایجاد کن).*/g, '')
        .trim()
      finalPrompt = await translateToEnglish(sanitized, client)
    }

    // The buildImagePrompt already adds quality modifiers, so only add style if requested
    const enhancedPrompt = style
      ? `${finalPrompt}, ${style} style`
      : finalPrompt

    // Create task and start generation in background
    const taskId = generateTaskId()
    imageTasks.set(taskId, {
      id: taskId,
      status: 'processing',
      createdAt: Date.now(),
      usedPrompt: enhancedPrompt,
      translated: hasNonLatin,
    })

    // Fire and forget — client will poll for result
    ;(async () => {
      try {
        const response = await client.images.generations.create({
          prompt: enhancedPrompt,
          size: selectedSize,
        })

        const imageBase64 = response.data?.[0]?.base64

        if (!imageBase64) {
          const task = imageTasks.get(taskId)
          if (task) {
            task.status = 'error'
            task.error = 'no_data'
            task.userMessage = '⚠️ خطا در تولید تصویر. داده‌ای از سرویس دریافت نشد.'
          }
          return
        }

        const task = imageTasks.get(taskId)
        if (task) {
          task.status = 'success'
          task.imageUrl = `data:image/png;base64,${imageBase64}`
          task.base64 = imageBase64
        }
      } catch (imgErr) {
        const errMsg = imgErr instanceof Error ? imgErr.message : ''
        const task = imageTasks.get(taskId)

        // If content filter triggered, try safe fallback
        if ((errMsg.includes('1301') || errMsg.includes('contentFilter')) && task) {
          try {
            const safePrompt = 'Beautiful artistic illustration, clean composition, vibrant colors, high quality digital art'
            const response = await client.images.generations.create({
              prompt: safePrompt,
              size: selectedSize,
            })
            const imageBase64 = response.data?.[0]?.base64
            if (imageBase64) {
              task.status = 'success'
              task.imageUrl = `data:image/png;base64,${imageBase64}`
              task.base64 = imageBase64
              task.usedPrompt = safePrompt
              return
            }
          } catch {
            // fallback failed
          }
          task.status = 'error'
          task.error = 'content_filter'
          task.userMessage = '⚠️ متأسفانه درخواست شما توسط سیستم ایمنی فیلتر شد. لطفاً توضیحات را به انگلیسی یا با عبارات عمومی‌تر وارد کنید.'
        } else if (task) {
          task.status = 'error'
          task.error = errMsg
          task.userMessage = '⚠️ خطا در تولید تصویر. لطفاً دوباره تلاش کنید.'
        }
      }
    })()

    // Clean up old tasks after 10 minutes
    setTimeout(() => { imageTasks.delete(taskId) }, 10 * 60 * 1000)

    // Return task ID immediately — client polls GET /api/ai/generate-image?id=xxx
    return NextResponse.json({
      success: true,
      taskId,
      status: 'processing',
      message: 'تسک تولید تصویر ایجاد شد. در حال پردازش...',
    })
  } catch (error) {
    console.error('POST /api/ai/generate-image error:', error)
    const msg = error instanceof Error ? error.message : ''
    return NextResponse.json({
      success: false,
      error: msg || 'Failed to start image generation',
      userMessage: '⚠️ خطا در شروع تولید تصویر. لطفاً دوباره تلاش کنید.',
    }, { status: 500 })
  }
}

// ─── GET: Poll for task result ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('id')

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
  }

  const task = imageTasks.get(taskId)

  if (!task) {
    return NextResponse.json({ error: 'Task not found or expired' }, { status: 404 })
  }

  // If still processing, check if it's been too long (5 min)
  if (task.status === 'processing' && Date.now() - task.createdAt > 5 * 60 * 1000) {
    imageTasks.delete(taskId)
    return NextResponse.json({ error: 'Task timed out', userMessage: '⚠️ زمان تولید تصویر به پایان رسید. لطفاً دوباره تلاش کنید.' }, { status: 408 })
  }

  if (task.status === 'success') {
    imageTasks.delete(taskId) // clean up
    return NextResponse.json({
      success: true,
      status: 'success',
      imageUrl: task.imageUrl,
      base64: task.base64,
      metadata: {
        usedPrompt: task.usedPrompt,
        translated: task.translated,
        generatedAt: new Date().toISOString(),
      },
    })
  }

  if (task.status === 'error') {
    imageTasks.delete(taskId) // clean up
    return NextResponse.json({
      success: false,
      status: 'error',
      error: task.error,
      userMessage: task.userMessage,
    }, { status: 400 })
  }

  // Still processing
  return NextResponse.json({
    success: true,
    status: 'processing',
    elapsed: Math.round((Date.now() - task.createdAt) / 1000),
  })
}
