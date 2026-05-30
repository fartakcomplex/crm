import { NextRequest } from 'next/server'
import { getAIClient, type AIClient } from '@/lib/ai-client'

// ─── Type Definitions ───────────────────────────────────────────────────────

interface VoiceModel {
  id: string
  description: string
  gender: 'male' | 'female' | 'neutral'
}

interface TTSRequest {
  text: string
  voice?: string
  language?: string
  accent?: string
  dialect?: string
  tone?: string
  speed?: number
  pitch?: number
  addHarakat?: boolean
  outputFormat?: string
}

// ─── Voice Models Mapping ──────────────────────────────────────────────────
// Maps Persian voice names to TTS voice IDs. When more SDK voices become
// available, only these mappings need updating — all preprocessing stays the same.

const voiceModels: Record<string, VoiceModel> = {
  // Persian voices
  'tongtong': { id: 'tongtong', description: 'صدای طبیعی فارسی', gender: 'neutral' },
  'male-professional': { id: 'tongtong', description: 'مرد حرفه‌ای', gender: 'male' },
  'female-professional': { id: 'tongtong', description: 'زن حرفه‌ای', gender: 'female' },
  'male-warm': { id: 'tongtong', description: 'مرد صمیمی و گرم', gender: 'male' },
  'female-warm': { id: 'tongtong', description: 'زن صمیمی و گرم', gender: 'female' },
  'news-anchor': { id: 'tongtong', description: 'گزارشگر خبری', gender: 'male' },
  'narrator': { id: 'tongtong', description: 'نریاتور داستان', gender: 'male' },
  'teacher': { id: 'tongtong', description: 'معلم مهربان', gender: 'female' },
  'professor': { id: 'tongtong', description: 'استاد دانشگاه', gender: 'male' },
  'child': { id: 'tongtong', description: 'کودک', gender: 'neutral' },
  'elder-male': { id: 'tongtong', description: 'مرد مسن', gender: 'male' },
  'young-female': { id: 'tongtong', description: 'زن جوان و شاد', gender: 'female' },
  'teen-boy': { id: 'tongtong', description: 'پسر نوجوان', gender: 'male' },
  'teen-girl': { id: 'tongtong', description: 'دختر نوجوان', gender: 'female' },
  'sports-coach': { id: 'tongtong', description: 'مربی ورزشی', gender: 'male' },
  'tv-host': { id: 'tongtong', description: 'مجری تلویزیون', gender: 'female' },
}

// ─── Language & Accent Styles ──────────────────────────────────────────────
// These affect the LLM harakat preprocessing to adjust diacritics for the target dialect.

const languageStyles: Record<string, string> = {
  'fa-standard': 'Standard Persian (تهرانی)',
  'fa-afghan': 'Afghan Dari Persian (دری)',
  'fa-tajik': 'Tajik Persian (تاجیکی)',
  'ar-standard': 'Standard Arabic (فصحی)',
  'ar-egyptian': 'Egyptian Arabic (مصری)',
  'ar-levantine': 'Levantine Arabic (شامی)',
  'en-american': 'American English',
  'en-british': 'British English',
  'tr-standard': 'Standard Turkish',
  'ur-standard': 'Standard Urdu',
}

// ─── Tone Settings ─────────────────────────────────────────────────────────
// Maps tone names to speed values and Persian descriptions.

const toneSettings: Record<string, { speed: number; description: string }> = {
  'dramatic': { speed: 0.8, description: 'دراماتیک و حماسی' },
  'calm': { speed: 0.9, description: 'آرام و ملایم' },
  'normal': { speed: 1.0, description: 'عادی و طبیعی' },
  'energetic': { speed: 1.1, description: 'پرانرژی و سریع' },
  'fast': { speed: 1.3, description: 'سریع و تند' },
  'slow': { speed: 0.7, description: 'آهسته و با تأنی' },
  'educational': { speed: 0.9, description: 'آموزشی و واضح' },
  'news': { speed: 1.0, description: 'خبری و رسمی' },
  'storytelling': { speed: 0.85, description: 'داستان‌سرایی' },
  'commercial': { speed: 1.1, description: 'تبلیغاتی' },
}

// ─── Output Format Content Types ───────────────────────────────────────────

const outputFormats: Record<string, string> = {
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
}

// ─── Persian / Arabic Character Detection ──────────────────────────────────

const PERSIAN_ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

function hasPersianArabic(text: string): boolean {
  return PERSIAN_ARABIC_RE.test(text)
}

// ─── Voice Model Resolver ─────────────────────────────────────────────────

function resolveVoice(voice?: string): VoiceModel {
  if (voice && voiceModels[voice]) {
    return voiceModels[voice]
  }
  // Default to tongtong
  return voiceModels['tongtong']
}

// ─── Tone Resolver ─────────────────────────────────────────────────────────

function resolveTone(tone?: string, explicitSpeed?: number): { speed: number; tone: string } {
  if (tone && toneSettings[tone]) {
    const setting = toneSettings[tone]
    return {
      speed: typeof explicitSpeed === 'number' ? explicitSpeed : setting.speed,
      tone,
    }
  }
  return {
    speed: typeof explicitSpeed === 'number' ? explicitSpeed : 1.0,
    tone: 'normal',
  }
}

// ─── Language / Accent / Dialect Resolver ──────────────────────────────────

function resolveLanguage(language?: string, accent?: string, dialect?: string): string {
  // Priority: dialect > accent > language
  const raw = dialect || accent || language || 'fa-standard'
  // Validate against known styles, fallback to fa-standard
  return languageStyles[raw] ? raw : 'fa-standard'
}

// ─── Persian Harakat Engine ────────────────────────────────────────────────
// Uses LLM to add proper diacritics (harakat) to Persian/Arabic text for TTS.

async function addHarakat(
  text: string,
  client: AIClient,
  languageStyle: string,
  voiceInfo: VoiceModel
): Promise<{ processedText: string; harakatApplied: boolean }> {
  // Only apply harakat to Persian/Arabic text
  if (!hasPersianArabic(text)) {
    return { processedText: text, harakatApplied: false }
  }

  // If text is already heavily diacritized (>30% diacritics), skip
  const diacriticCount = (text.match(/[\u064B-\u065F\u0670]/g) || []).length
  const arabicCharCount = (text.match(/[\u0600-\u06FF]/g) || []).length
  if (arabicCharCount > 0 && diacriticCount / arabicCharCount > 0.3) {
    return { processedText: text, harakatApplied: false }
  }

  // Skip very short texts (single words or numbers)
  const cleanText = text.replace(/[\s\u0640،؛:.!؟؟\-\(\)\[\]{}«»""0-9]/g, '')
  if (cleanText.length < 3) {
    return { processedText: text, harakatApplied: false }
  }

  try {
    const dialectInstruction = languageStyle !== 'fa-standard'
      ? `\n\nIMPORTANT: This text is in the "${languageStyles[languageStyle]}" dialect. Apply diacritics according to the pronunciation rules of this specific dialect.`
      : ''

    const voiceContext = voiceInfo.gender !== 'neutral'
      ? `The voice reading this is ${voiceInfo.gender === 'male' ? 'male' : 'female'} (${voiceInfo.description}).`
      : ''

    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: `You are a Persian/Arabic diacritics (حرکت‌گذاری) expert. Your job is to add proper vowel marks (harakat) to Persian text for text-to-speech synthesis.${dialectInstruction}
${voiceContext}

CRITICAL RULES:
1. Add فتحه (َ), ضمه (ُ), کسره (ِ) to EVERY word
2. Add تشدید (ّ) to doubled consonants (e.g., دَقّیق not دَقیق)
3. Add سکون (ْ) to final silent consonants
4. Correctly mark:
   - Verb endings (past/present stems)
   - Prepositions (بِ، لِ، کِ instead of ب، ل، ک)
   - Conjunctions (وَ، فَ)
   - Definite article (الْ)
   - Pronoun suffixes
   - Tanween (ً ٌ ٍ) where grammatically correct
5. Special attention to commonly mispronounced words:
   - مُهمّ not مهم
   - دِین not دین
   - فِکر not فکر
   - عِلم not علم
   - حَقّ not حق
   - جَمیل not جمیل
   - قُرآن not قرآن
   - بِرنامه not برنامه
   - مُهمّان not مهمان
   - صَمیم not صمیم
   - عالِم not عالم
   - کَذِب not کذب
   - فَرمان not فرمان
   - نِظام not نظام
6. Keep original text structure — only ADD diacritics, don't change letters
7. Return ONLY the diacritized text, nothing else

Text to diacritize:
${text}`,
        },
      ],
      thinking: { type: 'disabled' },
    })

    const harakatText = completion.choices[0]?.message?.content?.trim()

    if (harakatText && hasPersianArabic(harakatText)) {
      // Verify the output is roughly the same length (not drastically different)
      const originalLen = text.replace(/\s/g, '').length
      const harakatLen = harakatText.replace(/[\s\u064B-\u065F\u0670]/g, '').length
      if (Math.abs(originalLen - harakatLen) / Math.max(originalLen, 1) < 0.15) {
        return { processedText: harakatText, harakatApplied: true }
      }
    }

    // Fallback to original text if harakat output looks wrong
    return { processedText: text, harakatApplied: false }
  } catch (err) {
    console.error('[tts-harakat] LLM harakat failed, using original text:', err)
    return { processedText: text, harakatApplied: false }
  }
}

// ─── Content Filter Detection ─────────────────────────────────────────────

function isContentFilterError(msg: string): boolean {
  return msg.includes('1301') || msg.includes('contentFilter') || msg.includes('敏感')
}

// ─── Validate & Clamp Helpers ─────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ─── POST Handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json()
    const {
      text,
      voice: voiceParam,
      language: languageParam,
      accent: accentParam,
      dialect: dialectParam,
      tone: toneParam,
      speed: speedParam,
      pitch: pitchParam,
      addHarakat: addHarakatParam,
      outputFormat: outputFormatParam,
    } = body

    // ─── Validate required fields ────────────────────────────────────────
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'missing_text',
          userMessage: '⚠️ متن مورد نظر برای تبدیل به صدا وارد نشده است. لطفاً متنی بنویسید.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'text_too_long',
          userMessage: '⚠️ متن بسیار طولانی است. حداکثر ۵۰۰۰ کاراکتر مجاز است.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ─── Resolve all parameters ──────────────────────────────────────────
    const voiceInfo = resolveVoice(voiceParam)
    const selectedVoice = voiceInfo.id
    const { speed: resolvedSpeed, tone: resolvedTone } = resolveTone(toneParam, speedParam)
    const finalSpeed = clamp(resolvedSpeed, 0.5, 2.0)
    const finalPitch = typeof pitchParam === 'number' ? clamp(pitchParam, -20, 20) : 0
    const languageStyle = resolveLanguage(languageParam, accentParam, dialectParam)
    const format = outputFormats[outputFormatParam || 'wav'] ? outputFormatParam || 'wav' : 'wav'
    const contentType = outputFormats[format]
    const shouldAddHarakat = addHarakatParam !== false // Default true for all languages

    // ─── Initialize AI client ────────────────────────────────────────────
    const client = await getAIClient()

    // ─── Preprocess: Add Harakat (diacritics) if needed ──────────────────
    let processedText = text.trim()
    let harakatApplied = false

    if (shouldAddHarakat && hasPersianArabic(processedText)) {
      const result = await addHarakat(processedText, client, languageStyle, voiceInfo)
      processedText = result.processedText
      harakatApplied = result.harakatApplied
      console.log(`[tts] Harakat ${harakatApplied ? 'applied' : 'skipped'} for language style: ${languageStyle}`)
    }

    // ─── Call TTS SDK ────────────────────────────────────────────────────
    const ttsResponse = await client.audio.tts.create({
      input: processedText,
      voice: selectedVoice,
      speed: finalSpeed,
      response_format: format,
      stream: false,
    })

    const arrayBuffer = await ttsResponse.arrayBuffer()
    const audioBuffer = new Uint8Array(arrayBuffer)

    // ─── Return audio with metadata headers ──────────────────────────────
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'public, max-age=3600',
        'X-Voice-Model': selectedVoice,
        'X-Voice-Gender': voiceInfo.gender,
        'X-Language': languageStyle,
        'X-Harakat-Applied': String(harakatApplied),
        'X-Speed': String(finalSpeed),
        'X-Pitch': String(finalPitch),
        'X-Tone': resolvedTone,
        'X-Output-Format': format,
      },
    })
  } catch (error) {
    console.error('POST /api/ai/generate-tts error:', error)
    const msg = error instanceof Error ? error.message : ''

    if (isContentFilterError(msg)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'content_filter',
          userMessage: '⚠️ متأسفانه متن شما توسط سیستم ایمنی فیلتر شد. لطفاً از عبارات مناسب‌تر استفاده کنید.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: msg || 'tts_generation_failed',
        userMessage: '⚠️ خطا در تولید صدا. لطفاً دوباره تلاش کنید.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// ─── GET Handler: Return available voice models & configuration ────────────
// Allows the frontend to discover available voices, tones, and language options.

export async function GET() {
  const voicesList = Object.entries(voiceModels).map(([key, model]) => ({
    id: key,
    description: model.description,
    gender: model.gender,
  }))

  const tonesList = Object.entries(toneSettings).map(([key, setting]) => ({
    id: key,
    speed: setting.speed,
    description: setting.description,
  }))

  const languagesList = Object.entries(languageStyles).map(([key, label]) => ({
    id: key,
    label,
  }))

  const formatsList = Object.entries(outputFormats).map(([key, mime]) => ({
    id: key,
    mimeType: mime,
  }))

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        voices: voicesList,
        tones: tonesList,
        languages: languagesList,
        outputFormats: formatsList,
        defaults: {
          voice: 'tongtong',
          tone: 'normal',
          language: 'fa-standard',
          speed: 1.0,
          pitch: 0,
          addHarakat: true,
          outputFormat: 'wav',
        },
        limits: {
          maxTextLength: 5000,
          speedRange: { min: 0.5, max: 2.0 },
          pitchRange: { min: -20, max: 20 },
        },
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
      },
    }
  )
}
