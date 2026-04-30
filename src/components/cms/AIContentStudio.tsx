'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Sparkles,
  Search,
  Loader2,
  Copy,
  Check,
  Download,
  Wand2,
  FileText,
  Image as ImageIcon,
  Video,
  Volume2,
  RotateCcw,
} from 'lucide-react'
import { allFeatures, categories, buildPrompt, outputTypeLabels } from './ai-studio-features'
import type { AIFeature } from './ai-studio-features'

// ─── Types ──────────────────────────────────────────────────────────────────

interface MediaResult {
  type: 'image' | 'video' | 'audio'
  url: string
  blob?: Blob
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AIContentStudio() {
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('text-gen')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFeature, setSelectedFeature] = useState<AIFeature | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState('')
  const [copied, setCopied] = useState(false)
  const [mediaResult, setMediaResult] = useState<MediaResult | null>(null)
  const [videoProgress, setVideoProgress] = useState<string>('')
  const audioRef = useRef<HTMLAudioElement>(null)

  // Feature counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allFeatures.forEach(f => {
      counts[f.category] = (counts[f.category] || 0) + 1
    })
    return counts
  }, [])

  // Filtered features
  const filteredFeatures = useMemo(() => {
    let features = allFeatures.filter(f => f.category === activeTab)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      features = allFeatures.filter(f =>
        f.title.includes(q) ||
        f.description.includes(q) ||
        f.category.includes(q)
      )
    }
    return features
  }, [activeTab, searchQuery])

  const handleOpenFeature = useCallback((feature: AIFeature) => {
    setSelectedFeature(feature)
    setFormData({})
    setGeneratedResult('')
    setCopied(false)
    setMediaResult(null)
    setVideoProgress('')
    setDialogOpen(true)
  }, [])

  // ─── Generate: Text (streaming) ──────────────────────────────────────────
  const generateText = useCallback(async (feature: AIFeature, data: Record<string, string>) => {
    const prompt = buildPrompt(feature, data)
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'تو یک دستیار هوشمند تولید محتوا برای CMS فارسی هستی. همه پاسخ‌ها باید به زبان فارسی و با فرمت خوانا باشند. از ایموجی و فرمت‌بندی مناسب استفاده کن.',
          },
          { role: 'user', content: prompt },
        ],
        stream: true,
      }),
    })

    if (!res.ok) throw new Error(`خطای سرور: ${res.status}`)

    const reader = res.body?.getReader()
    if (!reader) throw new Error('خطا در دریافت پاسخ')

    const decoder = new TextDecoder()
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const payload = trimmed.slice(6)
        if (payload === '[DONE]') continue

        try {
          const parsed = JSON.parse(payload)
          if (parsed.content) {
            accumulated += parsed.content
            setGeneratedResult(accumulated)
          }
        } catch {
          // ignore partial JSON
        }
      }
    }

    return accumulated
  }, [])

  // ─── Generate: Image (async with polling to avoid gateway timeout) ────────
  const generateImage = useCallback(async (feature: AIFeature, data: Record<string, string>, signal?: AbortSignal) => {
    const prompt = buildPrompt(feature, data)

    // Determine size based on feature description hints
    const size = feature.description.includes('پرتره') || feature.description.includes('عمودی')
      ? '768x1344'
      : feature.description.includes('افقی') || feature.description.includes('بنر')
        ? '1344x768'
        : '1024x1024'

    // Step 1: Start task
    const res = await fetch('/api/ai/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, size, style: 'professional' }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.userMessage || err.error || `خطای سرور: ${res.status}`)
    }

    const taskResult = await res.json()

    // Step 2: If already has image (shouldn't happen but just in case)
    if (taskResult.imageUrl) {
      setMediaResult({ type: 'image', url: taskResult.imageUrl })
      return taskResult.imageUrl
    }

    // Step 3: Poll for result
    const taskId = taskResult.taskId
    if (!taskId) throw new Error('تسک تولید تصویر ایجاد نشد')

    setVideoProgress('تصویر در حال تولید... (حدود ۳۰ ثانیه)')

    const maxPolls = 60 // 60 × 3s = 3 min max
    for (let i = 0; i < maxPolls; i++) {
      if (signal?.aborted) throw new Error('لغو شد')

      await new Promise(r => setTimeout(r, 3000)) // poll every 3s

      const pollRes = await fetch(`/api/ai/generate-image?id=${taskId}`)
      const pollData = await pollRes.json()

      if (pollData.status === 'success' && pollData.imageUrl) {
        setMediaResult({ type: 'image', url: pollData.imageUrl })
        setVideoProgress('')
        return pollData.imageUrl
      }

      if (pollData.status === 'error') {
        throw new Error(pollData.userMessage || pollData.error || 'خطا در تولید تصویر')
      }

      // Still processing — update progress
      const elapsed = pollData.elapsed || Math.round((i + 1) * 3)
      setVideoProgress(`تصویر در حال تولید... ${elapsed} ثانیه گذشت`)
    }

    throw new Error('زمان تولید تصویر به پایان رسید. لطفاً دوباره تلاش کنید.')
  }, [])

  // ─── Generate: Video ─────────────────────────────────────────────────────
  const generateVideo = useCallback(async (feature: AIFeature, data: Record<string, string>) => {
    const prompt = buildPrompt(feature, data)
    setVideoProgress('در حال ایجاد تسک تولید ویدئو...')

    const res = await fetch('/api/ai/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration: 5, style: 'speed' }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.userMessage || err.error || `خطای سرور: ${res.status}`)
    }

    setVideoProgress('ویدئو در حال پردازش... (این فرآیند ممکن است ۱ تا ۵ دقیقه طول بکشد)')

    const result = await res.json()
    if (!result.videoUrl) throw new Error(result.userMessage || result.error || 'ویدئویی تولید نشد')

    setMediaResult({ type: 'video', url: result.videoUrl })
    setVideoProgress('')
    return result.videoUrl
  }, [])

  // ─── Generate: Audio ─────────────────────────────────────────────────────
  const generateAudio = useCallback(async (feature: AIFeature, data: Record<string, string>) => {
    const prompt = buildPrompt(feature, data)

    // First generate text content, then convert to speech
    const textContent = await generateText(feature, data)

    // Now use TTS
    setVideoProgress('در حال تبدیل متن به صدا...')

    const res = await fetch('/api/ai/generate-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: textContent,
        voice: 'tongtong',
        speed: 1.0,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.userMessage || err.error || `خطای سرور: ${res.status}`)
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    setMediaResult({ type: 'audio', url, blob })
    setVideoProgress('')
    return url
  }, [generateText])

  // ─── Main Generate Handler ───────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!selectedFeature) return

    const hasContent = selectedFeature.inputFields.some(f => formData[f.name]?.trim())
    if (!hasContent) {
      toast.error('لطفاً حداقل یک فیلد را پر کنید')
      return
    }

    setIsGenerating(true)
    setGeneratedResult('')
    setMediaResult(null)
    setVideoProgress('')

    try {
      const outputType = selectedFeature.outputType

      switch (outputType) {
        case 'image':
          await generateImage(selectedFeature, formData)
          toast.success('تصویر با موفقیت تولید شد! 🎨')
          break

        case 'video':
          await generateVideo(selectedFeature, formData)
          toast.success('ویدئو با موفقیت تولید شد! 🎬')
          break

        case 'audio':
          await generateAudio(selectedFeature, formData)
          toast.success('صدا با موفقیت تولید شد! 🔊')
          break

        default:
          await generateText(selectedFeature, formData)
          toast.success('محتوا با موفقیت تولید شد! ✨')
          break
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطای ناشناخته'
      if (selectedFeature.outputType === 'text') {
        setGeneratedResult(`⚠️ خطا در تولید محتوا: ${message}`)
      } else {
        toast.error(`خطا: ${message}`)
        setVideoProgress('')
      }
    } finally {
      setIsGenerating(false)
    }
  }, [selectedFeature, formData, generateText, generateImage, generateVideo, generateAudio, toast])

  const handleCopy = useCallback(async () => {
    if (!generatedResult) return
    try {
      await navigator.clipboard.writeText(generatedResult)
      setCopied(true)
      toast.success('کپی شد!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('خطا در کپی کردن')
    }
  }, [generatedResult, toast])

  const handleDownload = useCallback(() => {
    if (!selectedFeature) return

    if (mediaResult?.blob) {
      // Download blob (audio)
      const ext = mediaResult.type === 'audio' ? 'wav' : 'mp4'
      const url = URL.createObjectURL(mediaResult.blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedFeature.id}-${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('فایل دانلود شد')
      return
    }

    if (mediaResult?.url && mediaResult.type === 'image') {
      // Download image
      const a = document.createElement('a')
      a.href = mediaResult.url
      a.download = `${selectedFeature.id}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success('تصویر دانلود شد')
      return
    }

    if (mediaResult?.url && mediaResult.type === 'video') {
      window.open(mediaResult.url, '_blank')
      toast.success('ویدئو در تب جدید باز شد')
      return
    }

    if (!generatedResult) return
    const blob = new Blob([generatedResult], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedFeature.id}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('فایل دانلود شد')
  }, [generatedResult, selectedFeature, mediaResult, toast])

  const handleRegenerate = useCallback(() => {
    setGeneratedResult('')
    setMediaResult(null)
    setVideoProgress('')
    handleGenerate()
  }, [handleGenerate])

  // Determine dialog size based on output type
  const dialogMaxWidth = selectedFeature?.outputType === 'image'
    ? 'max-w-2xl'
    : selectedFeature?.outputType === 'video'
      ? 'max-w-3xl'
      : 'max-w-lg'

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6 page-enter">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient-violet">
              استودیو محتوای هوشمند
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              ۱۰۰ ابزار هوش مصنوعی برای تولید و مدیریت محتوا
            </p>
          </div>
        </div>
        <Badge className="badge-gradient bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 w-fit gap-1.5 shadow-sm text-sm px-3 py-1">
          <Sparkles className="h-3.5 w-3.5" />
          ۱۰۰ ابزار هوشمند
        </Badge>
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────────────── */}
      <div className="glass-card card-elevated p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در ۱۰۰ ابزار هوشمند..."
            className="pr-10 h-11 text-base bg-background/50 border-violet-200/30 dark:border-violet-800/30 focus:border-violet-400 dark:focus:border-violet-600 transition-colors"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </Button>
          )}
        </div>
        {searchQuery.trim() && (
          <p className="text-xs text-muted-foreground mt-2">
            {filteredFeatures.length} نتیجه یافت شد
          </p>
        )}
      </div>

      {/* ── Category Tabs ──────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-violet-100/50 dark:bg-violet-900/20 p-1.5 w-full">
          {categories.map((cat) => {
            const CatIcon = cat.icon
            const count = categoryCounts[cat.id] || 0
            return (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm transition-all duration-200 rounded-lg"
              >
                <CatIcon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{cat.name}</span>
                <span className="sm:hidden">{cat.name.split(' ')[0]}</span>
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 min-w-[18px] flex items-center justify-center bg-violet-200/60 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300"
                >
                  {count}
                </Badge>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* ── Feature Cards Grid ──────────────────────────────────────────── */}
        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {filteredFeatures
                .filter((f) => !searchQuery.trim() || f.category === cat.id || searchQuery.trim())
                .map((feature) => {
                  const FeatureIcon = feature.icon
                  const catInfo = categories.find((c) => c.id === feature.category)
                  const outputInfo = outputTypeLabels[feature.outputType]
                  const OutputIcon = outputInfo?.icon || FileText

                  return (
                    <Card
                      key={feature.id}
                      className={`glass-card card-elevated card-gradient-border card-press cursor-pointer group overflow-hidden hover-lift ${catInfo?.glowClass || ''}`}
                      onClick={() => handleOpenFeature(feature)}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Top row: icon + output type badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={`h-11 w-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-md shrink-0 transition-transform duration-300 group-hover:scale-110`}
                          >
                            <FeatureIcon className="h-5 w-5 text-white" />
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-2 py-0 h-5 bg-gradient-to-r ${outputInfo?.color || 'from-gray-400 to-gray-500'} text-white shrink-0`}
                          >
                            <OutputIcon className="h-3 w-3 ml-1" />
                            {outputInfo?.label || 'متن'}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-sm text-foreground leading-relaxed group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
                          {feature.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {feature.description}
                        </p>

                        {/* Action button */}
                        <Button
                          size="sm"
                          className={`w-full gap-2 text-xs bg-gradient-to-r ${feature.gradient} hover:opacity-90 text-white shine-effect btn-press transition-all duration-200`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenFeature(feature)
                          }}
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                          اجرای هوشمند
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>

            {filteredFeatures.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Search className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-base font-medium">ابزاری یافت نشد</p>
                <p className="text-sm mt-1">عبارت جستجو را تغییر دهید</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* ── Feature Execution Dialog ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={`${dialogMaxWidth} max-h-[90vh] overflow-hidden flex flex-col glass-card card-elevated`}>
          {selectedFeature && (
            <>
              <DialogHeader className="shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-xl bg-gradient-to-br ${selectedFeature.gradient} flex items-center justify-center shadow-md`}
                  >
                    {(() => {
                      const Icon = selectedFeature.icon
                      return <Icon className="h-5 w-5 text-white" />
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base font-bold text-foreground truncate">
                      {selectedFeature.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-0.5">
                      {selectedFeature.description}
                    </DialogDescription>
                  </div>
                  {/* Output type indicator */}
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-2 py-0 h-5 bg-gradient-to-r ${outputTypeLabels[selectedFeature.outputType]?.color || 'from-gray-400 to-gray-500'} text-white shrink-0`}
                  >
                    {selectedFeature.outputType === 'image' && <ImageIcon className="h-3 w-3 ml-1" />}
                    {selectedFeature.outputType === 'video' && <Video className="h-3 w-3 ml-1" />}
                    {selectedFeature.outputType === 'audio' && <Volume2 className="h-3 w-3 ml-1" />}
                    {selectedFeature.outputType === 'text' && <FileText className="h-3 w-3 ml-1" />}
                    {outputTypeLabels[selectedFeature.outputType]?.label || 'متن'}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-4 -mx-6 px-6">
                {/* Input fields */}
                {selectedFeature.inputFields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <Label className="text-sm font-medium">{field.label}</Label>
                    {field.type === 'text' && (
                      <Input
                        value={formData[field.name] || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                        }
                        placeholder={field.placeholder || field.label}
                        className="h-10 text-sm"
                        dir="rtl"
                      />
                    )}
                    {field.type === 'textarea' && (
                      <Textarea
                        value={formData[field.name] || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field.name]: e.target.value }))
                        }
                        placeholder={field.placeholder || field.label}
                        rows={4}
                        className="text-sm resize-none"
                        dir="rtl"
                      />
                    )}
                    {field.type === 'select' && field.options && (
                      <Select
                        value={formData[field.name] || ''}
                        onValueChange={(val) =>
                          setFormData((prev) => ({ ...prev, [field.name]: val }))
                        }
                      >
                        <SelectTrigger className="h-10 text-sm w-full">
                          <SelectValue placeholder={field.label} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={`w-full gap-2 bg-gradient-to-r ${selectedFeature.gradient} hover:opacity-90 text-white shine-effect btn-press transition-all duration-200`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال تولید...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {selectedFeature.outputType === 'image' && 'تولید تصویر'}
                      {selectedFeature.outputType === 'video' && 'تولید ویدئو'}
                      {selectedFeature.outputType === 'audio' && 'تولید صدا'}
                      {selectedFeature.outputType === 'text' && 'تولید'}
                    </>
                  )}
                </Button>

                {/* Loading state (no result yet) */}
                {isGenerating && !generatedResult && !mediaResult && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-violet-500">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-medium">
                      {selectedFeature.outputType === 'image' && 'هوش مصنوعی در حال خلق تصویر... 🎨'}
                      {selectedFeature.outputType === 'video' && 'هوش مصنوعی در حال خلق ویدئو... 🎬'}
                      {selectedFeature.outputType === 'audio' && 'هوش مصنوعی در حال تولید صدا... 🔊'}
                      {selectedFeature.outputType === 'text' && 'هوش مصنوعی در حال پردازش... ✨'}
                    </span>
                    {videoProgress && (
                      <span className="text-xs text-muted-foreground text-center max-w-xs">
                        {videoProgress}
                      </span>
                    )}
                  </div>
                )}

                {/* ── Image Result ──────────────────────────────────────────── */}
                {mediaResult?.type === 'image' && !isGenerating && (
                  <div className="space-y-3 animate-in">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                        🎨 تصویر تولید شده:
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={handleDownload}
                        >
                          <Download className="h-3.5 w-3.5" />
                          دانلود
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={handleRegenerate}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          تولید مجدد
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-violet-200/40 dark:border-violet-800/30 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-800/10">
                      <img
                        src={mediaResult.url}
                        alt={selectedFeature.title}
                        className="w-full h-auto max-h-[500px] object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* Image loading */}
                {isGenerating && selectedFeature.outputType === 'image' && videoProgress && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <ImageIcon className="h-8 w-8 text-violet-500 animate-pulse" />
                    <div className="text-center">
                      <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                        {videoProgress}
                      </p>
                      <div className="mt-3 w-64 h-2 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        تولید تصویر معمولاً ۲۰ تا ۴۰ ثانیه طول می‌کشد
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Video Result ──────────────────────────────────────────── */}
                {mediaResult?.type === 'video' && !isGenerating && (
                  <div className="space-y-3 animate-in">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                        🎬 ویدئو تولید شده:
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={handleDownload}
                        >
                          <Download className="h-3.5 w-3.5" />
                          دانلود
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={handleRegenerate}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          تولید مجدد
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-violet-200/40 dark:border-violet-800/30 bg-black">
                      <video
                        src={mediaResult.url}
                        controls
                        autoPlay
                        loop
                        className="w-full max-h-[500px]"
                      />
                    </div>
                  </div>
                )}

                {/* Video progress */}
                {isGenerating && selectedFeature.outputType === 'video' && videoProgress && (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Video className="h-8 w-8 text-violet-500 animate-pulse" />
                    <div className="text-center">
                      <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                        {videoProgress}
                      </p>
                      <div className="mt-3 w-64 h-2 bg-violet-100 dark:bg-violet-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Audio Result ──────────────────────────────────────────── */}
                {mediaResult?.type === 'audio' && !isGenerating && (
                  <div className="space-y-3 animate-in">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                        🔊 صدا تولید شده:
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={handleDownload}
                        >
                          <Download className="h-3.5 w-3.5" />
                          دانلود
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={handleRegenerate}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          تولید مجدد
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-800/10 border border-violet-200/40 dark:border-violet-800/30">
                      <audio
                        ref={audioRef}
                        src={mediaResult.url}
                        controls
                        autoPlay
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Audio progress */}
                {isGenerating && selectedFeature.outputType === 'audio' && (
                  <div className="space-y-3">
                    {/* Show generated text while converting to audio */}
                    {generatedResult && (
                      <div className="space-y-2 animate-in">
                        <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                          ✨ متن تولید شده (در حال تبدیل به صدا...):
                        </p>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-800/10 border border-violet-200/40 dark:border-violet-800/30 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto cms-scrollbar">
                          {generatedResult}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2 text-violet-500 py-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">{videoProgress || 'در حال تبدیل به صدا...'}</span>
                    </div>
                  </div>
                )}

                {/* ── Text Result (streaming) ───────────────────────────────── */}
                {generatedResult && isGenerating && selectedFeature.outputType === 'text' && (
                  <div className="space-y-2 animate-in">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                        در حال تولید...
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                        <span className="text-xs text-muted-foreground">زنده</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-800/10 border border-violet-200/40 dark:border-violet-800/30 text-sm leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto cms-scrollbar">
                      {generatedResult}
                      <span className="inline-block w-1.5 h-4 bg-violet-400 animate-pulse mr-1 align-middle rounded-sm" />
                    </div>
                  </div>
                )}

                {/* ── Text Result (complete) ───────────────────────────────── */}
                {generatedResult && !isGenerating && selectedFeature.outputType === 'text' && (
                  <div className="space-y-3 animate-in">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                        نتیجه تولید شده:
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={handleCopy}
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          {copied ? 'کپی شد!' : 'کپی'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={handleDownload}
                        >
                          <Download className="h-3.5 w-3.5" />
                          دانلود
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs"
                          onClick={handleRegenerate}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          مجدد
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-800/10 border border-violet-200/40 dark:border-violet-800/30 text-sm leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto cms-scrollbar">
                      {generatedResult}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="shrink-0 pt-2 border-t border-violet-200/20 dark:border-violet-800/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                  className="text-xs"
                >
                  بستن
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
