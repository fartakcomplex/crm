import { NextRequest, NextResponse } from 'next/server'

// ─── Translate Persian prompt to English for better video generation ───
async function translateToEnglish(persianPrompt: string, client: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>>): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `You are an expert video prompt engineer. Convert the following text into a detailed English VIDEO generation prompt.

Rules:
- Output ONLY the video prompt, nothing else
- Describe the VISUAL SCENE: subjects, actions, environment, camera movement, lighting
- Add cinematic quality terms (e.g., cinematic lighting, 1080p, smooth camera)
- If text is in Persian/Arabic, translate the SUBJECT MATTER to English — ignore instructions like "please generate" or "output in Persian"
- Keep under 80 words
- Focus on what the camera should SEE and SHOW

Text: "${persianPrompt}"`
        },
      ],
      thinking: { type: 'disabled' },
    })
    return completion.choices[0]?.message?.content?.trim() || persianPrompt
  } catch {
    return persianPrompt
  }
}

// ─── In-memory task store for polling ───────────────────────────────────────
interface VideoTask {
  id: string
  status: 'processing' | 'success' | 'error'
  videoUrl?: string
  error?: string
  userMessage?: string
  createdAt: number
  usedPrompt?: string
  translated?: boolean
  duration?: number
}
const videoTasks = new Map<string, VideoTask>()

function generateTaskId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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
    let finalPrompt = prompt
    if (hasNonLatin) {
      const sanitized = prompt
        .replace(/^(یک |یه |ویدئو |تصویر |ساخت |نمایش |لطفاً |خروجی |فارسی )+/g, '')
        .replace(/(به زبان فارسی|فرمت خوانا|حرفه‌ای|ایموجی|فرمت‌بندی|تولید کن|بساز|ایجاد کن).*/g, '')
        .trim()
      finalPrompt = await translateToEnglish(sanitized, client)
    }

    // Create task and return immediately
    const taskId = generateTaskId()
    videoTasks.set(taskId, {
      id: taskId,
      status: 'processing',
      createdAt: Date.now(),
      usedPrompt: finalPrompt,
      translated: hasNonLatin,
      duration: selectedDuration,
    })

    // Fire and forget — client will poll GET for result
    ;(async () => {
      try {
        const task = await client.video.generations.create({
          prompt: finalPrompt,
          quality,
          with_audio: false,
          size: '1920x1080',
          fps: 30,
          duration: selectedDuration,
        })

        if (!task?.id) {
          const storedTask = videoTasks.get(taskId)
          if (storedTask) {
            storedTask.status = 'error'
            storedTask.error = 'no_task_id'
            storedTask.userMessage = '⚠️ خطا در ایجاد تسک تولید ویدئو.'
          }
          return
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
          try {
            result = await client.async.result.query(task.id)
          } catch {
            // Continue polling even if one query fails
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }
        }

        const storedTask = videoTasks.get(taskId)

        if (result.task_status === 'SUCCESS') {
          const videoUrl =
            result.video_result?.[0]?.url ||
            result.video_url ||
            result.url ||
            result.video ||
            null

          if (!videoUrl || storedTask?.status === 'error') {
            if (storedTask && !videoUrl) {
              storedTask.status = 'error'
              storedTask.error = 'no_url'
              storedTask.userMessage = '⚠️ ویدئو تولید شد اما URL یافت نشد.'
            }
            return
          }

          if (storedTask) {
            storedTask.status = 'success'
            storedTask.videoUrl = videoUrl as string
          }
        } else {
          // FAILED or TIMEOUT or UNKNOWN
          if (storedTask) {
            storedTask.status = 'error'
            storedTask.error = result.task_status || 'failed'
            storedTask.userMessage = `⚠️ تولید ویدئو ناموفق بود: ${result.task_status === 'TIMEOUT' ? 'زمان به پایان رسید' : result.task_status || 'خطای ناشناخته'}`
          }
        }
      } catch (vidErr) {
        const errMsg = vidErr instanceof Error ? vidErr.message : ''
        const storedTask = videoTasks.get(taskId)

        if ((errMsg.includes('1301') || errMsg.includes('contentFilter') || errMsg.includes('敏感')) && storedTask) {
          storedTask.status = 'error'
          storedTask.error = 'content_filter'
          storedTask.userMessage = '⚠️ متأسفانه درخواست شما توسط سیستم ایمنی فیلتر شد. لطفاً توضیحات خود را تغییر دهید و از عبارات مناسب‌تر استفاده کنید.'
        } else if (storedTask) {
          storedTask.status = 'error'
          storedTask.error = errMsg
          storedTask.userMessage = '⚠️ خطا در تولید ویدئو. لطفاً دوباره تلاش کنید.'
        }
      }
    })()

    // Clean up old tasks after 10 minutes
    setTimeout(() => { videoTasks.delete(taskId) }, 10 * 60 * 1000)

    // Return task ID immediately — client polls GET /api/ai/generate-video?id=xxx
    return NextResponse.json({
      success: true,
      taskId,
      status: 'processing',
      message: 'تسک تولید ویدئو ایجاد شد. در حال پردازش...',
    })
  } catch (error) {
    console.error('POST /api/ai/generate-video error:', error)
    const msg = error instanceof Error ? error.message : ''
    return NextResponse.json({
      success: false,
      error: msg || 'Failed to start video generation',
      userMessage: '⚠️ خطا در شروع تولید ویدئو. لطفاً دوباره تلاش کنید.',
    }, { status: 500 })
  }
}

// ─── GET: Poll for video task result ──────────────────────────────────────
export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('id')

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
  }

  const task = videoTasks.get(taskId)

  if (!task) {
    return NextResponse.json({ error: 'Task not found or expired' }, { status: 404 })
  }

  // If still processing, check if it's been too long (8 min for video)
  if (task.status === 'processing' && Date.now() - task.createdAt > 8 * 60 * 1000) {
    videoTasks.delete(taskId)
    return NextResponse.json({ error: 'Task timed out', userMessage: '⚠️ زمان تولید ویدئو به پایان رسید. لطفاً دوباره تلاش کنید.' }, { status: 408 })
  }

  if (task.status === 'success') {
    videoTasks.delete(taskId) // clean up
    return NextResponse.json({
      success: true,
      status: 'success',
      videoUrl: task.videoUrl,
      metadata: {
        usedPrompt: task.usedPrompt,
        translated: task.translated,
        duration: task.duration,
        generatedAt: new Date().toISOString(),
      },
    })
  }

  if (task.status === 'error') {
    videoTasks.delete(taskId) // clean up
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
