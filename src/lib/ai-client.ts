import ZAI from 'z-ai-web-dev-sdk'

// Singleton AI client instance - lazily initialized
let _client: InstanceType<typeof ZAI> | null = null

export async function getAIClient() {
  if (_client) return _client

  try {
    // Try static factory method first (reads from .z-ai-config)
    _client = await ZAI.create()
    return _client
  } catch {
    // Fall back to env-based config
    _client = new ZAI({
      baseUrl: process.env.ZAI_BASE_URL || 'https://z-ai.chatglm.cn',
      apiKey: process.env.ZAI_API_KEY || '',
    })
    return _client
  }
}

export type AIClient = InstanceType<typeof ZAI>
