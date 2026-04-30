import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice, speed } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Text is required for TTS' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const client = await ZAI.create()

    const validVoices = ['tongtong']
    const selectedVoice = validVoices.includes(voice) ? voice : 'tongtong'

    const clampedSpeed = typeof speed === 'number'
      ? Math.min(Math.max(speed, 0.5), 2.0)
      : 1.0

    const ttsResponse = await client.audio.tts.create({
      input: text,
      voice: selectedVoice,
      speed: clampedSpeed,
      response_format: 'wav',
      stream: false,
    })

    const arrayBuffer = await ttsResponse.arrayBuffer()
    const audioBuffer = new Uint8Array(arrayBuffer)

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('POST /api/ai/generate-tts error:', error)
    const msg = error instanceof Error ? error.message : ''

    const errBody = msg.includes('1301') || msg.includes('contentFilter') || msg.includes('敏感')
      ? { success: false, error: 'content_filter', userMessage: '⚠️ متأسفانه متن شما توسط سیستم ایمنی فیلتر شد. لطفاً از عبارات مناسب‌تر استفاده کنید.' }
      : { success: false, error: msg || 'Failed to generate speech', userMessage: '⚠️ خطا در تولید صدا. لطفاً دوباره تلاش کنید.' }

    return new Response(
      JSON.stringify(errBody),
      {
        status: msg.includes('1301') || msg.includes('contentFilter') ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
