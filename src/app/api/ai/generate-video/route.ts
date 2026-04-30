import { NextRequest, NextResponse } from 'next/server'

async function translateToEnglish(persianPrompt: string, client: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>>): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      messages: [
        { role: 'user', content: `Translate to a concise English video generation prompt (max 80 words, descriptive, no explanations): "${persianPrompt}"` },
      ],
      thinking: { type: 'disabled' },
    })
    return completion.choices[0]?.message?.content?.trim() || persianPrompt
  } catch {
    return persianPrompt
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, duration, style } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video prompt is required' },
        { status: 400 }
      )
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const client = await ZAI.create()

    const validDurations = [5, 10]
    const selectedDuration = validDurations.includes(Number(duration)) ? Number(duration) : 5

    const quality = style === 'high-quality' ? 'quality' : 'speed'

    // Translate Persian to English to reduce filter triggers
    const hasNonLatin = /[^\x00-\x7F]/.test(prompt)
    const finalPrompt = hasNonLatin ? await translateToEnglish(prompt, client) : prompt

    const task = await client.video.generations.create({
      prompt: finalPrompt,
      quality,
      with_audio: false,
      size: '1920x1080',
      fps: 30,
      duration: selectedDuration,
    })

    if (!task?.id) {
      return NextResponse.json(
        { success: false, error: 'Video generation task creation failed' },
        { status: 500 }
      )
    }

    // Poll for results (max 60 attempts × 5s = 5 minutes)
    const maxPolls = 60
    const pollInterval = 5000
    let pollCount = 0
    let result = task as Record<string, unknown>

    while (
      result.task_status === 'PROCESSING' &&
      pollCount < maxPolls
    ) {
      pollCount++
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
      result = await client.async.result.query(task.id)
    }

    if (result.task_status === 'SUCCESS') {
      const videoUrl =
        result.video_result?.[0]?.url ||
        result.video_url ||
        result.url ||
        result.video ||
        null

      if (!videoUrl) {
        return NextResponse.json(
          { success: false, error: 'Video generated but URL not found in response' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        videoUrl,
        metadata: {
          prompt,
          duration: selectedDuration,
          quality,
          taskId: task.id,
          pollCount,
          generatedAt: new Date().toISOString(),
        },
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: `Video generation ${result.task_status || 'failed'}`,
        metadata: {
          taskId: task.id,
          taskStatus: result.task_status,
          pollCount,
        },
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('POST /api/ai/generate-video error:', error)
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
      error: msg || 'Failed to generate video',
      userMessage: '⚠️ خطا در تولید ویدئو. لطفاً دوباره تلاش کنید.',
    }, { status: 500 })
  }
}
