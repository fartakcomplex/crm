import { NextRequest, NextResponse } from 'next/server'

// ─── In-memory cache (10 minutes TTL) ───────────────────────────────────────
interface ResearchCacheEntry {
  researchContext: string
  searchResults: Array<{ title: string; url: string; snippet: string }>
  language: string
  createdAt: number
}
const researchCache = new Map<string, ResearchCacheEntry>()

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function getCacheKey(title: string, type: string, content?: string): string {
  const contentSnippet = content ? content.slice(0, 100) : ''
  return `research:${type}:${title}:${contentSnippet}`.toLowerCase().trim()
}

// ─── Translate Persian/Arabic text to English for web search ────────────────
async function translateToEnglish(
  text: string,
  client: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>>
): Promise<string> {
  try {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `Translate the following text to English. Output ONLY the English translation, nothing else. Keep it concise (under 20 words), focused on key terms suitable for a web search query.

Text: "${text}"`
        },
      ],
      thinking: { type: 'disabled' },
    })
    return completion.choices[0]?.message?.content?.trim() || text
  } catch {
    return text
  }
}

// ─── Build a smart search query from title + content ────────────────────────
function buildSearchQuery(englishTitle: string, englishContent?: string): string {
  if (!englishContent) return `"${englishTitle}"`

  // Extract key terms from content (first 200 chars, remove filler words)
  const fillerWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'because', 'but', 'and', 'or', 'if', 'while', 'about', 'this',
    'that', 'these', 'those', 'it', 'its', 'we', 'our', 'they', 'their',
    'what', 'which', 'who', 'whom',
  ])

  const words = englishContent
    .slice(0, 200)
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !fillerWords.has(w.toLowerCase()))

  // Take top 5 most relevant terms (first unique ones)
  const seen = new Set<string>()
  const keyTerms: string[] = []
  for (const word of words) {
    const lower = word.toLowerCase()
    if (!seen.has(lower)) {
      seen.add(lower)
      keyTerms.push(word)
      if (keyTerms.length >= 5) break
    }
  }

  if (keyTerms.length === 0) return `"${englishTitle}"`

  return `"${englishTitle}" ${keyTerms.join(' ')}`
}

// ─── Build research analysis prompt based on media type ─────────────────────
function getResearchPrompt(
  type: 'image' | 'video' | 'audio',
  title: string,
  content: string,
  searchResults: string
): string {
  const baseInstructions = `You are a media research analyst. Analyze the following web search results about a topic and create a detailed research context that will be used to generate better ${type} content.

TOPIC: "${title}"
${content ? `DESCRIPTION: "${content}"` : ''}

WEB SEARCH RESULTS:
${searchResults}

Based on the search results, create a research context for generating ${type} content about this topic.`

  switch (type) {
    case 'image':
      return `${baseInstructions}

For IMAGE generation, your research context MUST include:
1. Visual elements: What objects, products, or subjects should be depicted
2. Colors and palette: Suggested color schemes and dominant colors
3. Composition: Layout suggestions (centered, rule of thirds, close-up, wide shot)
4. Style references: Photographic style (product photography, lifestyle, editorial, minimalist, etc.)
5. Lighting: Suggested lighting setup (studio, natural, dramatic, soft)
6. Background: Recommended background treatment
7. Mood/feeling: The emotional tone the image should convey

Output a concise but detailed research context in English (under 200 words). Focus on VISUAL details that would help an AI image generator create the best possible result. Do NOT include any Persian text in your output.`

    case 'video':
      return `${baseInstructions}

For VIDEO generation, your research context MUST include:
1. Scene descriptions: Key scenes or sequences that should be shown
2. Mood and atmosphere: The overall emotional tone (energetic, calm, dramatic, etc.)
3. Visual flow: How scenes transition from one to another
4. Subject/actor actions: What the main subject should be doing
5. Environment: Settings, backgrounds, and props
6. Camera movement suggestions: Panning, zooming, static shots
7. Style references: Cinematic style (documentary, commercial, cinematic, etc.)
8. Duration and pacing: Fast-paced or slow, action-heavy or contemplative

Output a concise but detailed research context in English (under 250 words). Focus on VISUAL and MOTION details that would help an AI video generator. Do NOT include any Persian text in your output.`

    case 'audio':
      return `${baseInstructions}

For AUDIO generation, your research context MUST include:
1. Tone and mood: Emotional quality of the audio (upbeat, melancholic, energetic, etc.)
2. Genre suggestions: Music genre or audio style (electronic, acoustic, orchestral, etc.)
3. Pace and rhythm: Tempo recommendations (fast, moderate, slow)
4. Instrumentation: Suggested instruments or sound elements
5. Vocal characteristics: If voice is involved, describe the tone (warm, deep, energetic)
6. Sound effects: Any ambient or effect sounds that would enhance the audio
7. Cultural context: Any regional or cultural audio elements relevant to the topic
8. Structure: Suggested structure (intro, build, climax, outro)

Output a concise but detailed research context in English (under 200 words). Focus on AUDIO details that would help an AI audio generator. Do NOT include any Persian text in your output.`
  }
}

// ─── Format search results for LLM context ──────────────────────────────────
function formatResultsForLLM(
  results: Array<{ title: string; url: string; snippet: string }>
): string {
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n    ${r.snippet}\n    URL: ${r.url}`)
    .join('\n\n')
}

// ─── POST: Research a topic before media generation ─────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, type, language } = body

    // ── Validate required fields ────────────────────────────────────────────
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'missing_title',
          userMessage: '⚠️ عنوان الزامی است. لطفاً عنوانی برای تحقیق وارد کنید.',
        },
        { status: 400 }
      )
    }

    const validTypes = ['image', 'video', 'audio']
    const mediaType = validTypes.includes(type) ? type : 'image'

    const detectedLanguage = language || 'fa' // default Persian

    // ── Check cache first ───────────────────────────────────────────────────
    const cacheKey = getCacheKey(title.trim(), mediaType, content)
    const cached = researchCache.get(cacheKey)
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        researchContext: cached.researchContext,
        searchResults: cached.searchResults,
        language: cached.language,
        cached: true,
      })
    }

    // ── Initialize AI client ────────────────────────────────────────────────
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const client = await ZAI.create()

    // ── Step 1: Translate title to English for better web search ────────────
    const hasNonLatin = /[^\x00-\x7F]/.test(title)
    let englishTitle = title.trim()

    if (hasNonLatin) {
      // Strip Persian filler/instruction words
      const sanitizedTitle = title
        .trim()
        .replace(/^(یک |یه |عنوان |موضوع |درباره |نام |برای |از )+/g, '')
        .replace(/(به زبان فارسی|فارسی|تولید کن|بساز|ایجاد کن).*/g, '')
        .trim()

      englishTitle = await translateToEnglish(sanitizedTitle, client)
    }

    // ── Step 2: Also translate content if present and non-Latin ─────────────
    let englishContent: string | undefined
    if (content && typeof content === 'string' && content.trim().length > 0) {
      const contentHasNonLatin = /[^\x00-\x7F]/.test(content)
      if (contentHasNonLatin) {
        const sanitizedContent = content
          .trim()
          .replace(/^(یک |یه |این |آن |با |است |می‌باشد )+/g, '')
          .slice(0, 300)
        englishContent = await translateToEnglish(sanitizedContent, client)
      } else {
        englishContent = content.trim().slice(0, 300)
      }
    }

    // ── Step 3: Build search query and search the web ───────────────────────
    const searchQuery = buildSearchQuery(englishTitle, englishContent)
    console.log(`[ai-research] Search query: "${searchQuery}"`)

    const searchResults = await client.functions.invoke('web_search', {
      query: searchQuery,
      num: 8,
    })

    // ── Normalize search results ────────────────────────────────────────────
    const normalizedResults: Array<{ title: string; url: string; snippet: string }> = []

    const rawResults = Array.isArray(searchResults)
      ? searchResults
      : (searchResults as Record<string, unknown>)?.results
        ? Array.from((searchResults as Record<string, unknown>).results as unknown[])
        : []

    for (const item of rawResults.slice(0, 8)) {
      const r = item as Record<string, unknown>
      const title = String(r.title || r.name || '')
      const url = String(r.url || r.link || '')
      const snippet = String(r.snippet || r.description || r.text || '')
      if (title || snippet) {
        normalizedResults.push({ title, url, snippet })
      }
    }

    if (normalizedResults.length === 0) {
      return NextResponse.json({
        success: true,
        researchContext: `Research context for "${englishTitle}": This appears to be a unique or niche topic with limited web references. Generate ${mediaType} content based on the title "${englishTitle}"${englishContent ? ` and description "${englishContent.slice(0, 100)}"` : ''} with professional quality and modern aesthetic.`,
        searchResults: [],
        language: 'en',
      })
    }

    // ── Step 4: Limit to top 5 results for LLM to avoid token overflow ──────
    const topResults = normalizedResults.slice(0, 5)
    const resultsText = formatResultsForLLM(topResults)

    // ── Step 5: Use LLM to analyze results and create research context ──────
    const researchPrompt = getResearchPrompt(
      mediaType,
      englishTitle,
      englishContent || '',
      resultsText
    )

    const completion = await client.chat.completions.create({
      messages: [
        { role: 'user', content: researchPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const researchContext =
      completion.choices[0]?.message?.content?.trim() ||
      `Visual representation of "${englishTitle}" with professional quality, modern aesthetic, and clean composition.`

    // ── Step 6: Cache the result ────────────────────────────────────────────
    researchCache.set(cacheKey, {
      researchContext,
      searchResults: normalizedResults,
      language: 'en',
      createdAt: Date.now(),
    })

    // Clean up expired cache entries
    for (const [key, entry] of researchCache.entries()) {
      if (Date.now() - entry.createdAt >= CACHE_TTL_MS) {
        researchCache.delete(key)
      }
    }

    // ── Return response ─────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      researchContext,
      searchResults: normalizedResults,
      language: 'en',
    })
  } catch (error) {
    console.error('POST /api/ai/research error:', error)

    const errMsg = error instanceof Error ? error.message : ''

    // Content filter detection (same pattern as video/image routes)
    if (errMsg.includes('1301') || errMsg.includes('contentFilter') || errMsg.includes('敏感')) {
      return NextResponse.json(
        {
          success: false,
          error: 'content_filter',
          userMessage:
            '⚠️ متأسفانه درخواست شما توسط سیستم ایمنی فیلتر شد. لطفاً عنوان یا توضیحات خود را تغییر دهید و از عبارات مناسب‌تر استفاده کنید.',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: errMsg || 'research_failed',
        userMessage: '⚠️ خطا در تحقیق و جستجوی اطلاعات. لطفاً دوباره تلاش کنید.',
      },
      { status: 500 }
    )
  }
}
