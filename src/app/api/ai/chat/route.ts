import { NextRequest, NextResponse } from 'next/server'
import { getAIClient } from '@/lib/ai-client'

export async function POST(request: NextRequest) {
  try {
    const client = await getAIClient()
    const body = await request.json()
    const { messages, systemPrompt, maxTokens, stream = false } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array with at least one message is required' },
        { status: 400 }
      )
    }

    const hasUserMessage = messages.some((msg: { role: string; content: string }) => msg.role === 'user')
    if (!hasUserMessage) {
      return NextResponse.json(
        { error: 'At least one user message is required' },
        { status: 400 }
      )
    }

    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { error: 'Each message must have a role and content' },
          { status: 400 }
        )
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        return NextResponse.json(
          { error: 'Invalid message role. Must be: system, user, or assistant' },
          { status: 400 }
        )
      }
    }

    const defaultSystemPrompt = `You are an intelligent AI assistant integrated into a Smart CMS platform. You help content creators, marketers, and SEO specialists with:
- Content creation and editing
- SEO optimization and analysis
- Keyword research and strategy
- Competitor analysis
- Technical SEO recommendations
- Content strategy planning
- Writing improvement suggestions

Always provide actionable, specific, and well-structured responses. Use markdown formatting for better readability when appropriate. Be concise but thorough. If you need more information to provide a better answer, ask for it.`

    const apiMessages = [
      { role: 'system' as const, content: systemPrompt || defaultSystemPrompt },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    // ─── Streaming path ─────────────────────────────────────────────────────
    if (stream) {
      const completion = await client.chat.completions.create({
        model: 'GLM-5-turbo',
        messages: apiMessages,
        thinking: { type: 'disabled' },
        stream: true,
      })

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const delta = chunk.choices[0]?.delta?.content
              if (delta) {
                const data = JSON.stringify({ content: delta })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Stream error'
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`))
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // ─── Non-streaming path (original behavior) ────────────────────────────
    const result = await client.chat.completions.create({
      model: 'GLM-5-turbo',
      messages: apiMessages,
      thinking: { type: 'disabled' },
    })

    const responseText = result.choices[0].message.content

    return NextResponse.json({
      success: true,
      message: responseText,
      metadata: {
        messageCount: messages.length,
        tokens: result.usage,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('POST /api/ai/chat error:', error)
    const message = error instanceof Error ? error.message : 'Failed to process chat request'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
