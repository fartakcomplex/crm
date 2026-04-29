import { NextRequest, NextResponse } from 'next/server'

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

    const task = await client.video.generations.create({
      prompt,
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
    const message = error instanceof Error ? error.message : 'Failed to generate video'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
