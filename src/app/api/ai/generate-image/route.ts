import { NextRequest, NextResponse } from 'next/server'
import { withSDKMutex, isRateLimitError, isRateLimited, isSDKBusy, getCooldownSeconds, markSuccess, markRateLimited } from '@/lib/rate-limit'

// ─── In-memory task store ──────────────────────────────────────────────────
interface ImageTask {
  id: string
  status: 'processing' | 'success' | 'error'
  imageUrl?: string
  base64?: string
  error?: string
  userMessage?: string
  createdAt: number
  usedPrompt?: string
}
const imageTasks = new Map<string, ImageTask>()

function generateTaskId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── POST: Start image generation ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, style, size } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Image prompt is required' }, { status: 400 })
    }

    if (isRateLimited()) {
      const waitSec = getCooldownSeconds()
      return NextResponse.json({
        success: false, error: 'rate_limited',
        userMessage: `⚠️ سرور در حال بارگذاری بالاست. لطفاً ${waitSec > 0 ? `${waitSec} ثانیه` : 'کمی'} دیگر دوباره تلاش کنید.`,
      }, { status: 429 })
    }

    if (isSDKBusy()) {
      return NextResponse.json({
        success: false, error: 'busy',
        userMessage: '⚠️ یه تولید دیگه در حال انجامه. لطفاً صبر کنید.',
      }, { status: 429 })
    }

    const validSizes = ['1024x1024', '768x1344', '864x1152', '1344x768', '1152x864', '1440x720', '720x1440']
    const selectedSize = validSizes.includes(size) ? size : '1024x1024'

    const enhancedPrompt = style ? `${prompt}, ${style} style` : prompt

    const taskId = generateTaskId()
    imageTasks.set(taskId, {
      id: taskId, status: 'processing', createdAt: Date.now(), usedPrompt: enhancedPrompt,
    })

    // Fire and forget — uses global SDK mutex for serialization
    ;(async () => {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default
        const client = await ZAI.create()

        // Single attempt with SDK mutex — no retry to avoid double-calling
        const response = await withSDKMutex(
          () => client.images.generations.create({ prompt: enhancedPrompt, size: selectedSize }),
          'Image gen',
          120000, // 2 min timeout
        )

        const imageBase64 = response.data?.[0]?.base64
        if (imageBase64) {
          const t = imageTasks.get(taskId)
          if (t) { t.status = 'success'; t.imageUrl = `data:image/png;base64,${imageBase64}`; t.base64 = imageBase64 }
          markSuccess()
        } else {
          const t = imageTasks.get(taskId)
          if (t) { t.status = 'error'; t.error = 'no_data'; t.userMessage = '⚠️ داده‌ای از سرویس دریافت نشد.' }
        }
      } catch (imgErr) {
        const errMsg = imgErr instanceof Error ? imgErr.message : ''
        console.error('[image-gen] Error:', errMsg.substring(0, 200))
        const t = imageTasks.get(taskId)
        if (t) {
          if (errMsg.includes('1301') || errMsg.includes('contentFilter')) {
            t.status = 'error'; t.error = 'content_filter'
            t.userMessage = '⚠️ درخواست فیلتر شد. لطفاً توضیحات را تغییر دهید.'
          } else if (isRateLimitError(imgErr)) {
            markRateLimited()
            t.status = 'error'; t.error = 'rate_limited'
            t.userMessage = '⚠️ سرور در حال بارگذاری بالاست. لطفاً ۲ الی ۳ دقیقه دیگر دوباره تلاش کنید.'
          } else {
            t.status = 'error'; t.error = errMsg.substring(0, 200)
            t.userMessage = '⚠️ خطا در تولید تصویر. لطفاً دوباره تلاش کنید.'
          }
        }
      }
    })()

    setTimeout(() => { imageTasks.delete(taskId) }, 10 * 60 * 1000)

    return NextResponse.json({ success: true, taskId, status: 'processing', message: 'تسک تولید تصویر ایجاد شد.' })
  } catch (error) {
    console.error('POST /api/ai/generate-image error:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed', userMessage: '⚠️ خطا در تولید تصویر.' }, { status: 500 })
  }
}

// ─── GET: Poll for result ──────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const taskId = request.nextUrl.searchParams.get('id')
  if (!taskId) return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })

  const task = imageTasks.get(taskId)
  if (!task) return NextResponse.json({ error: 'Task not found or expired' }, { status: 404 })

  if (task.status === 'processing' && Date.now() - task.createdAt > 5 * 60 * 1000) {
    imageTasks.delete(taskId)
    return NextResponse.json({ error: 'Task timed out', userMessage: '⚠️ زمان تولید تصویر به پایان رسید.' }, { status: 408 })
  }

  if (task.status === 'success') {
    imageTasks.delete(taskId)
    return NextResponse.json({ success: true, status: 'success', imageUrl: task.imageUrl, base64: task.base64, metadata: { usedPrompt: task.usedPrompt, generatedAt: new Date().toISOString() } })
  }

  if (task.status === 'error') {
    imageTasks.delete(taskId)
    return NextResponse.json({ success: false, status: 'error', error: task.error, userMessage: task.userMessage }, { status: 400 })
  }

  return NextResponse.json({ success: true, status: 'processing', elapsed: Math.round((Date.now() - task.createdAt) / 1000) })
}
