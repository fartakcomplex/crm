'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
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
  BookOpen,
  Package,
  ChevronDown,
  X,
} from 'lucide-react'
import { allFeatures, categories, buildPrompt, buildImagePrompt, buildVideoPrompt, outputTypeLabels } from './ai-studio-features'
import type { AIFeature } from './ai-studio-features'

// ─── Types ──────────────────────────────────────────────────────────────────

interface MediaResult {
  type: 'image' | 'video' | 'audio'
  url: string
  blob?: Blob
}

interface ContentItem {
  id: string
  title: string
  content: string
  excerpt?: string
  description?: string
  type: 'post' | 'product'
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

  // ─── Content Picker State ────────────────────────────────────────────────
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [contentLoading, setContentLoading] = useState(false)
  const [contentSearch, setContentSearch] = useState('')
  const [showContentPicker, setShowContentPicker] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)

  // Fetch posts & products when dialog opens
  useEffect(() => {
    if (!dialogOpen) return

    const fetchContent = async () => {
      setContentLoading(true)
      try {
        const [postsRes, productsRes] = await Promise.all([
          fetch('/api/posts').catch(() => null),
          fetch('/api/products').catch(() => null),
        ])

        const items: ContentItem[] = []

        if (postsRes?.ok) {
          const postsData = await postsRes.json()
          const posts = postsData.posts || postsData.data || postsData || []
          for (const p of (Array.isArray(posts) ? posts : [])) {
            items.push({
              id: p.id,
              title: p.title || '',
              content: p.content || p.excerpt || '',
              excerpt: p.excerpt || '',
              type: 'post',
            })
          }
        }

        if (productsRes?.ok) {
          const prodsData = await productsRes.json()
          const prods = prodsData.products || prodsData.data || prodsData || []
          for (const p of (Array.isArray(prods) ? prods : [])) {
            items.push({
              id: p.id,
              title: p.name || p.title || '',
              content: p.description || p.content || '',
              type: 'product',
            })
          }
        }

        setContentItems(items)
      } catch {
        // silent fail — content picker is optional
      } finally {
        setContentLoading(false)
      }
    }

    fetchContent()
  }, [dialogOpen])

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
    setSelectedContent(null)
    setShowContentPicker(false)
    setContentSearch('')
    setDialogOpen(true)
  }, [])

  // ─── Content Picker: Auto-fill form from selected content ────────────────
  const handleSelectContent = useCallback((item: ContentItem) => {
    setSelectedContent(item)
    setShowContentPicker(false)
    setContentSearch('')

    // Auto-fill the first text/textarea field with content
    if (selectedFeature) {
      const newFormData: Record<string, string> = {}
      const fields = selectedFeature.inputFields

      for (const field of fields) {
        if (field.type === 'text' || field.type === 'textarea') {
          if (!newFormData[field.name]) {
            newFormData[field.name] = item.title
            // Put content/excerpt in the next available textarea
            continue
          }
        }
        if (field.type === 'textarea' && !newFormData[field.name]) {
          newFormData[field.name] = item.excerpt || item.content?.substring(0, 500) || ''
        }
      }

      // If no textarea field was filled with content, put it in the last text/textarea
      const hasContent = Object.values(newFormData).some(v => v.includes(item.excerpt || ''))
      if (!hasContent && fields.length > 0) {
        const lastField = fields[fields.length - 1]
        if (lastField.type === 'textarea' || lastField.type === 'text') {
          newFormData[lastField.name] = (item.excerpt || item.content || '').substring(0, 1000)
        }
      }

      setFormData(newFormData)
      toast.success(`${item.type === 'post' ? 'مقاله' : 'محصول'} "${item.title}" انتخاب شد ✅`)
    }
  }, [selectedFeature, toast])

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
    const prompt = buildImagePrompt(feature, data)

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

  // ─── Generate: Video (async polling — same pattern as image) ────────────
  const generateVideo = useCallback(async (feature: AIFeature, data: Record<string, string>) => {
    const prompt = buildVideoPrompt(feature, data)
    setVideoProgress('در حال ایجاد تسک تولید ویدئو...')

    // Step 1: POST to create task
    const res = await fetch('/api/ai/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, duration: 5, style: 'speed' }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.userMessage || err.error || `خطای سرور: ${res.status}`)
    }

    const { taskId } = await res.json()
    if (!taskId) throw new Error('تسک تولید ویدئو ایجاد نشد')

    setVideoProgress('ویدئو در حال پردازش... (این فرآیند ممکن است ۱ تا ۵ دقیقه طول بکشد)')

    // Step 2: Poll GET every 4 seconds until done
    const maxAttempts = 120 // 120 × 4s = 8 minutes
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 4000))

      const elapsed = ((i + 1) * 4)
      const mins = Math.floor(elapsed / 60)
      const secs = elapsed % 60
      setVideoProgress(`در حال تولید ویدئو... ${mins > 0 ? `${mins} دقیقه و ` : ''}${secs} ثانیه گذشته`)

      try {
        const pollRes = await fetch(`/api/ai/generate-video?id=${taskId}`)
        if (!pollRes.ok) {
          const err = await pollRes.json().catch(() => ({}))
          if (pollRes.status === 408) throw new Error(err.userMessage || 'زمان تولید ویدئو به پایان رسید')
          if (pollRes.status === 404) throw new Error('تسک یافت نشد یا منقضی شده')
          continue
        }

        const result = await pollRes.json()

        if (result.status === 'success' && result.videoUrl) {
          setMediaResult({ type: 'video', url: result.videoUrl })
          setVideoProgress('')
          return result.videoUrl
        }

        if (result.status === 'error') {
          throw new Error(result.userMessage || result.error || 'تولید ویدئو ناموفق بود')
        }

        // Still processing — continue polling
      } catch (pollErr) {
        if (pollErr instanceof Error && pollErr.message.includes('زمان')) throw pollErr
        if (pollErr instanceof Error && pollErr.message.includes('یافت نشد')) throw pollErr
        // Network error — continue polling
      }
    }

    throw new Error('زمان تولید ویدئو به پایان رسید. لطفاً دوباره تلاش کنید.')
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

  // Filtered content items for picker
  const filteredContent = useMemo(() => {
    if (!contentSearch.trim()) return contentItems
    const q = contentSearch.trim().toLowerCase()
    return contentItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.content?.toLowerCase().includes(q)
    )
  }, [contentItems, contentSearch])

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

                {/* ── Content Picker Section ──────────────────────────────────── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-violet-500" />
                      <span className="text-sm font-semibold text-foreground">
                        انتخاب از محتوای موجود
                      </span>
                    </div>
                    {selectedContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setSelectedContent(null)
                          setFormData({})
                        }}
                      >
                        <X className="h-3 w-3" />
                        پاک کردن
                      </Button>
                    )}
                  </div>

                  {/* Selected content badge */}
                  {selectedContent ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200/40 dark:border-violet-800/30">
                      {selectedContent.type === 'post' ? (
                        <BookOpen className="h-4 w-4 text-violet-500 shrink-0" />
                      ) : (
                        <Package className="h-4 w-4 text-emerald-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {selectedContent.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {selectedContent.type === 'post' ? 'مقاله' : 'محصول'} — عنوان و متن به فیلدها منتقل شد
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${
                          selectedContent.type === 'post'
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}
                      >
                        {selectedContent.type === 'post' ? 'مقاله' : 'محصول'}
                      </Badge>
                    </div>
                  ) : (
                    /* Content picker dropdown */
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-xs justify-between h-9"
                        onClick={() => setShowContentPicker(!showContentPicker)}
                        disabled={contentLoading}
                      >
                        <div className="flex items-center gap-2">
                          {contentLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Search className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {contentLoading
                              ? 'در حال بارگذاری...'
                              : `انتخاب از ${contentItems.length} مقاله و محصول`}
                          </span>
                        </div>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showContentPicker ? 'rotate-180' : ''}`} />
                      </Button>

                      {showContentPicker && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border border-border rounded-lg shadow-lg max-h-72 overflow-hidden flex flex-col">
                          {/* Search inside picker */}
                          <div className="p-2 border-b border-border">
                            <div className="relative">
                              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                value={contentSearch}
                                onChange={(e) => setContentSearch(e.target.value)}
                                placeholder="جستجوی عنوان..."
                                className="pr-8 h-8 text-xs"
                                autoFocus
                              />
                            </div>
                          </div>

                          {/* Items list */}
                          <div className="overflow-y-auto max-h-56 cms-scrollbar">
                            {filteredContent.length === 0 ? (
                              <div className="p-4 text-center text-xs text-muted-foreground">
                                موردی یافت نشد
                              </div>
                            ) : (
                              filteredContent.map((item) => (
                                <button
                                  key={item.id}
                                  className="w-full flex items-start gap-2.5 px-3 py-2.5 text-right hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                                  onClick={() => handleSelectContent(item)}
                                >
                                  {item.type === 'post' ? (
                                    <BookOpen className="h-4 w-4 text-violet-400 mt-0.5 shrink-0" />
                                  ) : (
                                    <Package className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground truncate">
                                      {item.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                      {item.type === 'post' ? 'مقاله' : 'محصول'} — {item.content?.substring(0, 60)}...
                                    </p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground px-1">یا دستی وارد کنید</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

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
