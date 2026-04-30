import { NextRequest, NextResponse } from 'next/server'

// ─── Types ─────────────────────────────────────────────────────────────────

type SdkClient = Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>>

interface VideoTask {
  id: string
  status: 'processing' | 'success' | 'error'
  videoUrl?: string
  audioUrl?: string
  error?: string
  userMessage?: string
  createdAt: number
  usedPrompt?: string
  translated?: boolean
  duration?: number
  size?: string
  platform?: string
  withAudio?: boolean
  harakatizedDialogue?: string
}

// ─── Platform-aware dimensions ─────────────────────────────────────────────

const platformSizes: Record<string, string> = {
  'youtube': '1920x1080',
  'instagram-reel': '1080x1920',
  'instagram-story': '1080x1920',
  'tiktok': '1080x1920',
  'facebook': '1280x720',
  'twitter': '1280x720',
  'linkedin': '1920x1080',
  'website-banner': '1920x1080',
  'custom': '1920x1080',
}

// ─── In-memory task store for polling ──────────────────────────────────────

const videoTasks = new Map<string, VideoTask>()

function generateTaskId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Translate Persian prompt to English for better video generation ───────

async function translateToEnglish(persianPrompt: string, client: SdkClient): Promise<string> {
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

// ─── Persian Harakat Engine ────────────────────────────────────────────────

async function addPersianHarakat(dialogue: string, client: SdkClient): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `You are a Persian/Arabic diacritics (حرکت‌گذاری) expert. Add proper harakat marks to the given Persian text.

Rules:
- Add fatha (َ), damma (ُ), kasra (ِ), shadda (ّ), sukun (ْ) to EVERY word
- Pay special attention to:
  - Proper verb conjugation endings
  - Correct pronunciation of ت and د (add shadda where needed: دَقّیق)
  - Silent letters (add sukun)
  - Long vowels (alef with madda, waw, ya)
  - Hamza placement (همزه)
  - Tanween (تنوین) where appropriate
- Keep the original text structure
- Return ONLY the diacritized text, nothing else
- Every single word must have appropriate vowel marks

Text: "${dialogue}"`
        },
      ],
      thinking: { type: 'disabled' },
    })
    const result = completion.choices[0]?.message?.content?.trim()
    // Validate: result should contain at least some harakat marks
    if (result && /[ًَُِّْ]/.test(result)) {
      return result
    }
    return dialogue
  } catch {
    return dialogue
  }
}

// ─── Helper: extract URLs and audio from result ────────────────────────────

function extractUrls(result: Record<string, unknown>) {
  const videoUrls = [
    result.video_result?.[0]?.url,
    result.video_url,
    result.url,
    result.video,
  ].filter(Boolean) as string[]

  const audioUrl = result.audio_url as string | undefined

  return { videoUrls, audioUrl }
}

// ─── POST: Start video generation ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prompt,
      duration,
      style,
      withAudio,
      platform,
      size,
      dialogue,
    } = body as {
      prompt: string
      duration?: number
      style?: string
      withAudio?: boolean
      platform?: string
      size?: string
      dialogue?: string
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video prompt is required' },
        { status: 400 }
      )
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const client = await ZAI.create()

    // ── Duration: support 3, 5, 7, 10 — clamp to nearest valid value ──
    const validDurations = [3, 5, 7, 10]
    const requestedDuration = Number(duration)
    let selectedDuration: number
    if (validDurations.includes(requestedDuration)) {
      selectedDuration = requestedDuration
    } else if (requestedDuration > 0) {
      // Clamp to nearest valid value
      selectedDuration = validDurations.reduce((prev, curr) =>
        Math.abs(curr - requestedDuration) < Math.abs(prev - requestedDuration) ? curr : prev
      )
    } else {
      selectedDuration = 5 // default
    }

    // ── Quality ──
    const quality: 'speed' | 'quality' = style === 'high-quality' ? 'quality' : 'speed'

    // ── Audio: default true ──
    const enableAudio = withAudio !== false // true unless explicitly set to false

    // ── Platform-aware dimensions ──
    let selectedSize: string
    if (size && typeof size === 'string' && /^\d+x\d+$/.test(size)) {
      // Explicit size override
      selectedSize = size
    } else if (platform && platformSizes[platform]) {
      selectedSize = platformSizes[platform]
    } else {
      selectedSize = '1920x1080' // default
    }

    const targetPlatform = platform || undefined

    // ── Persian Harakat Engine ──
    let harakatizedDialogue: string | undefined
    let finalPrompt = prompt

    if (dialogue && typeof dialogue === 'string' && dialogue.trim().length > 0) {
      console.log(`[video-gen] Running harakat engine for dialogue`)
      harakatizedDialogue = await addPersianHarakat(dialogue.trim(), client)
      console.log(`[video-gen] Harakat result: "${harakatizedDialogue}"`)
    }

    // Translate Persian to English to reduce filter triggers
    const hasNonLatin = /[^\x00-\x7F]/.test(prompt)
    if (hasNonLatin) {
      const sanitized = prompt
        .replace(/^(یک |یه |ویدئو |تصویر |ساخت |نمایش |لطفاً |خروجی |فارسی )+/g, '')
        .replace(/(به زبان فارسی|فرمت خوانا|حرفه‌ای|ایموجی|فرمت‌بندی|تولید کن|بساز|ایجاد کن).*/g, '')
        .trim()
      finalPrompt = await translateToEnglish(sanitized, client)
    }

    // Append harakatized dialogue instruction to prompt
    if (harakatizedDialogue) {
      finalPrompt = `${finalPrompt} with clear dialogue in Persian saying: ${harakatizedDialogue}`
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
      size: selectedSize,
      platform: targetPlatform,
      withAudio: enableAudio,
      harakatizedDialogue,
    })

    // Fire and forget — client will poll GET for result
    ;(async () => {
      try {
        console.log(`[video-gen] Starting video generation for task ${taskId}`)
        console.log(`[video-gen] Params: quality=${quality}, withAudio=${enableAudio}, size=${selectedSize}, duration=${selectedDuration}`)
        const task = await client.video.generations.create({
          prompt: finalPrompt,
          quality,
          with_audio: enableAudio,
          size: selectedSize,
          fps: 30,
          duration: selectedDuration,
        })

        console.log(`[video-gen] SDK returned task:`, JSON.stringify(task).substring(0, 500))

        if (!task?.id) {
          console.log(`[video-gen] No task.id returned`)
          const storedTask = videoTasks.get(taskId)
          if (storedTask) {
            storedTask.status = 'error'
            storedTask.error = 'no_task_id'
            storedTask.userMessage = '⚠️ خطا در ایجاد تسک تولید ویدئو.'
          }
          return
        }

        // Check if result is already embedded (some SDKs return result directly)
        const initialTask = task as Record<string, unknown>
        const { videoUrls: initialUrls, audioUrl: initialAudio } = extractUrls(initialTask)

        if (initialUrls.length > 0) {
          console.log(`[video-gen] Got direct URL from SDK response`)
          const storedTask = videoTasks.get(taskId)
          if (storedTask) {
            storedTask.status = 'success'
            storedTask.videoUrl = initialUrls[0]
            storedTask.audioUrl = initialAudio
          }
          return
        }

        // Poll for results with exponential backoff to avoid 429 rate limits
        // Video typically takes 1-3 min, so start with 15s interval
        const maxPolls = 40
        const baseInterval = 15000 // 15 seconds base
        let pollCount = 0
        let consecutiveRateLimits = 0
        let result = initialTask

        // If initial status is not PROCESSING, query once immediately
        let currentStatus = String(result.task_status || '').toUpperCase()
        console.log(`[video-gen] Initial task_status: "${currentStatus}"`)

        while (
          (currentStatus === 'PROCESSING' || currentStatus === 'PENDING' || currentStatus === '' || currentStatus === 'UNDEFINED') &&
          pollCount < maxPolls
        ) {
          pollCount++

          // Calculate wait time: base + exponential backoff on rate limits
          let waitTime = baseInterval
          if (consecutiveRateLimits > 0) {
            // Exponential backoff: 30s, 60s, 90s, 120s (capped at 120s)
            waitTime = Math.min(30000 * consecutiveRateLimits, 120000)
            console.log(`[video-gen] Backoff: ${consecutiveRateLimits} consecutive 429s, waiting ${waitTime / 1000}s`)
          }

          await new Promise((resolve) => setTimeout(resolve, waitTime))

          try {
            result = await client.async.result.query(task.id) as Record<string, unknown>
            currentStatus = String(result.task_status || '').toUpperCase()
            console.log(`[video-gen] Poll ${pollCount}: status="${currentStatus}"`)

            // Reset backoff on successful poll
            consecutiveRateLimits = 0

            // Check if video URL appeared in polling result
            const { videoUrls: pollUrls, audioUrl: pollAudio } = extractUrls(result)

            if (pollUrls.length > 0 || currentStatus === 'SUCCESS' || currentStatus === 'COMPLETED') {
              console.log(`[video-gen] Got URL or success status at poll ${pollCount}`)
              const storedTask = videoTasks.get(taskId)
              if (storedTask) {
                storedTask.status = 'success'
                storedTask.videoUrl = (pollUrls[0] || result.video_url || result.url || '') as string
                storedTask.audioUrl = pollAudio
              }
              return
            }
          } catch (pollErr) {
            const errMsg = pollErr instanceof Error ? pollErr.message : String(pollErr)
            console.log(`[video-gen] Poll ${pollCount} error:`, errMsg)

            // Detect 429 rate limit and apply backoff
            if (errMsg.includes('429') || errMsg.includes('Too many requests') || errMsg.includes('rate')) {
              consecutiveRateLimits++
              // Extra penalty wait for rate limit
              await new Promise((resolve) => setTimeout(resolve, 10000))
            } else {
              // Non-429 error: small delay and reset backoff
              consecutiveRateLimits = 0
              await new Promise((resolve) => setTimeout(resolve, 5000))
            }
          }
        }

        const storedTask = videoTasks.get(taskId)

        // Final check — wait longer then try once more
        if (storedTask && storedTask.status === 'processing') {
          console.log(`[video-gen] All polls exhausted, waiting 30s for final check...`)
          await new Promise((resolve) => setTimeout(resolve, 30000))

          const finalResult = await client.async.result.query(task.id).catch(() => null) as Record<string, unknown> | null
          const { videoUrls: finalUrls, audioUrl: finalAudio } = extractUrls(finalResult ?? {})
          const finalStatus = String(finalResult?.task_status || '').toUpperCase()

          if (finalUrls.length > 0 || finalStatus === 'SUCCESS' || finalStatus === 'COMPLETED') {
            storedTask.status = 'success'
            storedTask.videoUrl = (finalUrls[0] || finalResult?.video_url || finalResult?.url || '') as string
            storedTask.audioUrl = finalAudio
            console.log(`[video-gen] Final poll succeeded`)
            return
          }

          // If still rate-limited, set a retry-after message instead of hard failure
          if (!finalResult) {
            console.log(`[video-gen] Final poll also rate-limited, marking as retryable`)
            storedTask.status = 'error'
            storedTask.error = 'rate_limited'
            storedTask.userMessage = '⚠️ سرور تولید ویدئو در حال بارگذاری بالاست. لطفاً ۲ الی ۳ دقیقه دیگر دوباره تلاش کنید.'
          } else {
            console.log(`[video-gen] Final poll failed: status="${finalStatus}", polls=${pollCount}`)
            storedTask.status = 'error'
            storedTask.error = finalStatus || `timeout_${pollCount}`
            storedTask.userMessage = `⚠️ تولید ویدئو ناموفق بود: ${finalStatus === 'TIMEOUT' ? 'زمان به پایان رسید' : finalStatus || 'خطای ناشناخته'} (${pollCount} تلاش)`
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

  // If still processing, check if it's been too long (15 min for video with backoff)
  if (task.status === 'processing' && Date.now() - task.createdAt > 15 * 60 * 1000) {
    videoTasks.delete(taskId)
    return NextResponse.json({ error: 'Task timed out', userMessage: '⚠️ زمان تولید ویدئو به پایان رسید. لطفاً دوباره تلاش کنید.' }, { status: 408 })
  }

  if (task.status === 'success') {
    videoTasks.delete(taskId) // clean up
    return NextResponse.json({
      success: true,
      status: 'success',
      videoUrl: task.videoUrl,
      ...(task.audioUrl ? { audioUrl: task.audioUrl } : {}),
      metadata: {
        usedPrompt: task.usedPrompt,
        translated: task.translated,
        duration: task.duration,
        size: task.size,
        platform: task.platform,
        withAudio: task.withAudio,
        ...(task.harakatizedDialogue ? { harakatizedDialogue: task.harakatizedDialogue } : {}),
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
