import { NextRequest, NextResponse } from 'next/server'
import { withSDKMutex, markSuccess, markRateLimited, isRateLimitError, isRateLimited, isSDKBusy, getCooldownSeconds } from '@/lib/rate-limit'

// ─── Types ─────────────────────────────────────────────────────────────────

interface VideoTask {
  id: string
  status: 'processing' | 'success' | 'error'
  videoUrl?: string
  audioUrl?: string
  error?: string
  userMessage?: string
  createdAt: number
  usedPrompt?: string
  duration?: number
  size?: string
  platform?: string
  withAudio?: boolean
  lastPollResult?: string
}

// ─── Platform-aware dimensions ─────────────────────────────────────────────

const platformSizes: Record<string, string> = {
  'youtube': '1920x1080',
  'instagram-reel': '768x1344',
  'instagram-story': '768x1344',
  'tiktok': '768x1344',
  'facebook': '1344x768',
  'twitter': '1344x768',
  'linkedin': '1920x1080',
  'website-banner': '1920x1080',
  'custom': '1024x1024',
}

// ─── In-memory task store ─────────────────────────────────────────────────

const videoTasks = new Map<string, VideoTask>()

function generateTaskId(): string {
  return `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Deep URL extraction ──────────────────────────────────────────────────

function deepExtractVideoUrls(obj: unknown, depth = 0): string[] {
  if (depth > 5 || obj === null || obj === undefined) return []

  const urls: string[] = []

  if (typeof obj === 'string') {
    if (/^https?:\/\/.+\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i.test(obj)) {
      urls.push(obj)
    }
    return urls
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        urls.push(...deepExtractVideoUrls(item, depth + 1))
      } else if (typeof item === 'string' && /^https?:\/\/.+\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i.test(item)) {
        urls.push(item)
      }
    }
    return urls
  }

  if (typeof obj === 'object') {
    const record = obj as Record<string, unknown>
    const knownFields = ['url', 'video_url', 'videoUrl', 'video', 'download_url', 'file_url', 'src', 'source', 'output_url', 'result_url', 'media_url', 'play_url', 'stream_url']
    for (const field of knownFields) {
      const val = record[field]
      if (typeof val === 'string' && val.startsWith('http')) {
        urls.push(val)
      } else if (typeof val === 'object' && val !== null) {
        urls.push(...deepExtractVideoUrls(val, depth + 1))
      }
    }
    for (const key of Object.keys(record)) {
      if (knownFields.includes(key)) continue
      const val = record[key]
      if (typeof val === 'object' && val !== null) {
        urls.push(...deepExtractVideoUrls(val, depth + 1))
      } else if (typeof val === 'string' && /^https?:\/\/.+\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i.test(val)) {
        urls.push(val)
      }
    }
  }

  return urls
}

function extractUrls(result: Record<string, unknown>) {
  const videoUrls = [
    result.video_result?.[0]?.url,
    result.video_result?.[0]?.video_url,
    result.video_result?.[0]?.download_url,
    result.video_url,
    result.url,
    result.video,
    (result.output as Record<string, unknown>)?.video_url,
    (result.output as Record<string, unknown>)?.url,
    result.results?.[0]?.url,
    result.data?.[0]?.url,
  ].filter(Boolean) as string[]

  const deepUrls = deepExtractVideoUrls(result)
  const allUrls = [...videoUrls, ...deepUrls].filter((url, idx, arr) => arr.indexOf(url) === idx)
  const audioUrl = result.audio_url as string | undefined

  return { videoUrls: allUrls, audioUrl }
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
    } = body as {
      prompt: string
      duration?: number
      style?: string
      withAudio?: boolean
      platform?: string
      size?: string
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Video prompt is required' },
        { status: 400 }
      )
    }

    // Check if globally rate-limited
    if (isRateLimited()) {
      const waitSec = getCooldownSeconds()
      return NextResponse.json({
        success: false, error: 'rate_limited',
        userMessage: `⚠️ سرور در حال بارگذاری بالاست. لطفاً ${waitSec > 0 ? `حدود ${waitSec} ثانیه` : 'کمی'} دیگر دوباره تلاش کنید.`,
      }, { status: 429 })
    }

    // Check if SDK is busy
    if (isSDKBusy()) {
      return NextResponse.json({
        success: false, error: 'busy',
        userMessage: '⚠️ یه تولید دیگه در حال انجامه. لطفاً صبر کنید تا اون تموم بشه.',
      }, { status: 429 })
    }

    // Duration: SDK supports 5 and 10 only
    const requestedDuration = Number(duration)
    let selectedDuration: number
    if (requestedDuration === 5 || requestedDuration === 10) {
      selectedDuration = requestedDuration
    } else if (requestedDuration > 5) {
      selectedDuration = 10
    } else {
      selectedDuration = 5
    }

    const enableAudio = withAudio !== false

    // Platform size
    let selectedSize: string
    if (size && typeof size === 'string' && /^\d+x\d+$/.test(size)) {
      selectedSize = size
    } else if (platform && platformSizes[platform]) {
      selectedSize = platformSizes[platform]
    } else {
      selectedSize = '1920x1080'
    }

    // Use prompt directly — skip translation to save API quota
    let finalPrompt = prompt
    if (/[^\x00-\x7F]/.test(prompt)) {
      finalPrompt = prompt
        .replace(/^(یک |یه |ویدئو |تصویر |ساخت |نمایش |لطفاً |خروجی |فارسی )+/g, '')
        .replace(/(به زبان فارسی|فرمت خوانا|حرفه‌ای|ایموجی|فرمت‌بندی|تولید کن|بساز|ایجاد کن).*/g, '')
        .trim()
    }

    // Create task and return immediately
    const taskId = generateTaskId()
    videoTasks.set(taskId, {
      id: taskId,
      status: 'processing',
      createdAt: Date.now(),
      usedPrompt: finalPrompt,
      duration: selectedDuration,
      size: selectedSize,
      platform: platform || undefined,
      withAudio: enableAudio,
    })

    // Fire and forget — ALL SDK calls go through the global mutex
    ;(async () => {
      try {
        console.log(`[video-gen] Task ${taskId}: starting, duration=${selectedDuration}s, size=${selectedSize}`)

        const ZAI = (await import('z-ai-web-dev-sdk')).default
        const client = await ZAI.create()

        // Step 1: Create video task via SDK mutex
        const task = await withSDKMutex(
          () => client.video.generations.create({
            prompt: finalPrompt,
            quality: 'speed',
            with_audio: enableAudio,
            size: selectedSize,
            fps: 30,
            duration: selectedDuration,
          }),
          'Video gen create',
          120000, // 2 min timeout for initial creation
        )

        if (!(task as unknown as Record<string, unknown>)?.id) {
          console.log(`[video-gen] No task.id returned`)
          const storedTask = videoTasks.get(taskId)
          if (storedTask) { storedTask.status = 'error'; storedTask.error = 'no_task_id'; storedTask.userMessage = '⚠️ خطا در ایجاد تسک ویدئو. لطفاً دوباره تلاش کنید.' }
          return
        }

        // Check if result already embedded
        const initialTask = task as unknown as Record<string, unknown>
        const { videoUrls: initialUrls, audioUrl: initialAudio } = extractUrls(initialTask)

        if (initialUrls.length > 0) {
          const storedTask = videoTasks.get(taskId)
          if (storedTask) {
            storedTask.status = 'success'
            storedTask.videoUrl = initialUrls[0]
            storedTask.audioUrl = initialAudio
          }
          markSuccess()
          return
        }

        // Step 2: Poll for result — each poll goes through SDK mutex too
        const maxTimeMs = selectedDuration >= 7 ? 25 * 60 * 1000 : 15 * 60 * 1000
        const startTime = Date.now()
        let pollCount = 0
        let result = initialTask

        let currentStatus = String(result.task_status || '').toUpperCase()

        const shouldContinue = () =>
          (currentStatus === 'PROCESSING' || currentStatus === 'PENDING' || currentStatus === '' || currentStatus === 'UNDEFINED') &&
          (Date.now() - startTime) < maxTimeMs

        while (shouldContinue()) {
          pollCount++
          // Wait BEFORE polling (not inside mutex, so it doesn't block other calls)
          await new Promise(r => setTimeout(r, 15000)) // 15s between polls

          try {
            // Each poll goes through the SDK mutex
            result = await withSDKMutex(
              () => client.async.result.query(task.id),
              `Video poll #${pollCount}`,
              30000, // 30s timeout per poll
            ) as Record<string, unknown>

            currentStatus = String(result.task_status || '').toUpperCase()

            const { videoUrls: pollUrls, audioUrl: pollAudio } = extractUrls(result)

            if (pollUrls.length > 0 || currentStatus === 'SUCCESS' || currentStatus === 'COMPLETED') {
              const videoUrl = pollUrls[0] || String(result.video_url || result.url || result.video || '')
              const storedTask = videoTasks.get(taskId)
              if (storedTask) {
                storedTask.status = 'success'
                storedTask.videoUrl = videoUrl
                storedTask.audioUrl = pollAudio
                storedTask.lastPollResult = JSON.stringify(result).substring(0, 500)
              }
              markSuccess()
              return
            }

            if (currentStatus === 'FAIL') {
              console.log(`[video-gen] FAIL at poll ${pollCount}`)
              const storedTask = videoTasks.get(taskId)
              if (storedTask) { storedTask.status = 'error'; storedTask.error = 'model_fail'; storedTask.userMessage = '⚠️ تولید ویدئو ناموفق بود. لطفاً دوباره تلاش کنید.' }
              return
            }
          } catch (pollErr) {
            const errMsg = pollErr instanceof Error ? pollErr.message : String(pollErr)

            if (isRateLimitError(pollErr)) {
              console.log(`[video-gen] Rate limit on poll ${pollCount}: ${errMsg.substring(0, 100)}`)
              markRateLimited()
              // Wait extra time before next poll
              await new Promise(r => setTimeout(r, 30000))
            } else if (errMsg.includes('1301') || errMsg.includes('contentFilter')) {
              const storedTask = videoTasks.get(taskId)
              if (storedTask) {
                storedTask.status = 'error'
                storedTask.error = 'content_filter'
                storedTask.userMessage = '⚠️ درخواست شما توسط سیستم ایمنی فیلتر شد.'
              }
              return
            } else if (errMsg.includes('timeout')) {
              console.log(`[video-gen] Poll ${pollCount} timed out, retrying...`)
              // Continue polling on timeout
            } else {
              console.log(`[video-gen] Poll ${pollCount} error: ${errMsg.substring(0, 100)}`)
            }
          }
        }

        // Timed out — try one final check
        console.log(`[video-gen] Polling timed out after ${pollCount} polls`)
        try {
          await new Promise(r => setTimeout(r, 5000))
          const finalResult = await withSDKMutex(
            () => client.async.result.query(task.id),
            'Video final poll',
            30000,
          ) as Record<string, unknown> | null
          if (finalResult) {
            const { videoUrls } = extractUrls(finalResult)
            const fs = String(finalResult?.task_status || '').toUpperCase()
            if (videoUrls.length > 0 || fs === 'SUCCESS') {
              const storedTask = videoTasks.get(taskId)
              if (storedTask) {
                storedTask.status = 'success'
                storedTask.videoUrl = videoUrls[0] || String(finalResult.video_url || '')
                storedTask.lastPollResult = JSON.stringify(finalResult).substring(0, 500)
              }
              markSuccess()
              return
            }
          }
        } catch { /* ignore */ }

        // Final timeout
        const storedTask = videoTasks.get(taskId)
        if (storedTask && storedTask.status === 'processing') {
          storedTask.status = 'error'
          storedTask.error = 'timeout'
          storedTask.userMessage = '⚠️ زمان تولید ویدئو به پایان رسید. لطفاً دوباره تلاش کنید.'
        }

      } catch (createErr) {
        const errMsg = createErr instanceof Error ? createErr.message : String(createErr)
        console.error(`[video-gen] Error:`, errMsg.substring(0, 200))
        const storedTask = videoTasks.get(taskId)
        if (storedTask && storedTask.status === 'processing') {
          if (isRateLimitError(createErr)) {
            markRateLimited()
            storedTask.status = 'error'
            storedTask.error = 'rate_limited'
            storedTask.userMessage = '⚠️ سرور در حال بارگذاری بالاست. لطفاً ۲ الی ۳ دقیقه دیگر دوباره تلاش کنید.'
          } else if (errMsg.includes('1301') || errMsg.includes('contentFilter')) {
            storedTask.status = 'error'
            storedTask.error = 'content_filter'
            storedTask.userMessage = '⚠️ درخواست شما توسط سیستم ایمنی فیلتر شد.'
          } else {
            storedTask.status = 'error'
            storedTask.error = errMsg.substring(0, 200)
            storedTask.userMessage = '⚠️ خطا در تولید ویدئو. لطفاً دوباره تلاش کنید.'
          }
        }
      }
    })()

    // Clean up after 25 minutes
    setTimeout(() => { videoTasks.delete(taskId) }, 25 * 60 * 1000)

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

  if (task.status === 'processing' && Date.now() - task.createdAt > 25 * 60 * 1000) {
    videoTasks.delete(taskId)
    return NextResponse.json({ error: 'Task timed out', userMessage: '⚠️ زمان تولید ویدئو به پایان رسید. لطفاً دوباره تلاش کنید.' }, { status: 408 })
  }

  if (task.status === 'success') {
    videoTasks.delete(taskId)
    return NextResponse.json({
      success: true,
      status: 'success',
      videoUrl: task.videoUrl,
      ...(task.audioUrl ? { audioUrl: task.audioUrl } : {}),
      metadata: {
        usedPrompt: task.usedPrompt,
        duration: task.duration,
        size: task.size,
        platform: task.platform,
        withAudio: task.withAudio,
        generatedAt: new Date().toISOString(),
      },
    })
  }

  if (task.status === 'error') {
    videoTasks.delete(taskId)
    return NextResponse.json({
      success: false,
      status: 'error',
      error: task.error,
      userMessage: task.userMessage,
      ...(task.lastPollResult ? { debugInfo: task.lastPollResult } : {}),
    }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    status: 'processing',
    elapsed: Math.round((Date.now() - task.createdAt) / 1000),
  })
}
