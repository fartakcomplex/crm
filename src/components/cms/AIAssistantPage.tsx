'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  Bot, Send, Sparkles, Loader2, BookOpen, HelpCircle, Lightbulb,
  Link, Code, TrendingUp, FileEdit, Search, Swords, Rocket, FileCheck,
  MessageSquare, RotateCcw, Copy, Check, Square, StopCircle, Trash2,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'دستیار هوشمند',
  subtitle: 'چت با AI و دستیار سئو',
  chatPlaceholder: 'پیام خود را بنویسید...',
  send: 'ارسال',
  clear: 'پاک کردن',
  clearChat: 'پاک کردن گفتگو',
  processing: 'در حال پردازش...',
  modelBadge: 'GLM-5',
  chatTab: 'چت',
  seoTab: 'دستیار سئو',
  noMessages: 'هنوز پیامی ندارید. گفتگو را شروع کنید!',
  guide: 'راهنما',
  whatIsSeo: 'سئو چیست',
  techniques: 'تکنیک‌ها',
  backlinks: 'بک‌لینک',
  schema: 'اسکیما',
  optimization: 'بهینه‌سازی',
  contentGen: 'تولید محتوا',
  keywords: 'کلمات کلیدی',
  competitors: 'رقبا',
  advanced: 'پیشرفته',
  pageSeo: 'سئو صفحه',
  analyze: 'تحلیل',
  generate: 'تولید',
  topic: 'موضوع',
  length: 'طول',
  tone: 'لحن',
  toneOptions: { formal: 'رسمی', informal: 'غیررسمی', persuasive: 'متقاعدکننده', educational: 'آموزشی' },
  lengthOptions: { short: 'کوتاه (۲۰۰ کلمه)', medium: 'متوسط (۵۰۰ کلمه)', long: 'بلند (۱۰۰۰ کلمه)' },
  typeOptions: { article: 'مقاله', blog: 'بلاگ', product: 'محصول', social: 'شبکه اجتماعی' },
  keywordsInput: 'کلمات کلیدی (با کاما جدا کنید)',
  urlInput: 'آدرس صفحه رقیب',
  contentInput: 'محتوای صفحه را وارد کنید...',
  results: 'نتایج',
  noResults: 'نتیجه‌ای یافت نشد',
  stop: 'توقف',
  copied: 'کپی شد!',
  charCount: 'کاراکتر',
  presetsTitle: 'قالب‌های آماده',
}

// ─── Preset Templates ────────────────────────────────────────────────────────

const presetTemplates = [
  { icon: '📝', label: 'تولید محتوا', prompt: 'یک مقاله جامع درباره [موضوع] بنویس', gradient: 'from-violet-500 to-purple-500' },
  { icon: '🔍', label: 'تحلیل سئو', prompt: 'تحلیل سئوی این محتوا را انجام بده:\n\n', gradient: 'from-emerald-500 to-teal-500' },
  { icon: '💡', label: 'ایده‌پردازی', prompt: '۵ ایده خلاقانه برای محتوای جدید پیشنهاد بده', gradient: 'from-amber-500 to-orange-500' },
  { icon: '✏️', label: 'بازنویسی', prompt: 'این متن را حرفه‌ای‌تر بازنویسی کن:\n\n', gradient: 'from-rose-500 to-pink-500' },
  { icon: '📋', label: 'خلاصه‌سازی', prompt: 'خلاصه‌ای از متن زیر بنویس:\n\n', gradient: 'from-sky-500 to-cyan-500' },
  { icon: '🏷️', label: 'کلمات کلیدی', prompt: 'کلمات کلیدی مرتبط با [موضوع] پیشنهاد بده', gradient: 'from-fuchsia-500 to-violet-500' },
]

// ─── SEO Static Content ───────────────────────────────────────────────────────

const seoContent: Record<string, { title: string; content: string }> = {
  guide: { title: 'راهنمای جامع سئو', content: 'سئو (بهینه‌سازی موتورهای جستجو) فرآیندی است که وب‌سایت شما را برای رتبه‌بندی بالاتر در نتایج جستجوی ارگانیک بهینه می‌کند.\n\n📌 اصول کلیدی:\n• تحقیق کلمات کلیدی\n• بهینه‌سازی محتوا\n• ساخت لینک\n• سئو فنی\n• تجربه کاربری' },
  'what-is': { title: 'سئو چیست؟', content: 'سئو مخفف Search Engine Optimization است.\n\n🔑 انواع سئو:\n• سئوی درون‌صفحه (On-Page)\n• سئوی برون‌صفحه (Off-Page)\n• سئوی فنی (Technical SEO)\n• سئوی محلی (Local SEO)' },
  tips: { title: 'تکنیک‌های سئو', content: '۱. عنوان‌های جذاب بنویسید\n۲. از کلمات کلیدی طولانی استفاده کنید\n۳. محتوای جامع تولید کنید\n۴. تصاویر را بهینه‌سازی کنید\n۵. لینک‌سازی داخلی انجام دهید\n۶. سرعت صفحه را بهبود ببخشید' },
  backlinks: { title: 'استراتژی بک‌لینک', content: 'بک‌لینک‌ها یکی از مهم‌ترین عوامل رتبه‌بندی هستند.\n\n🔗 روش‌های ساخت بک‌لینک:\n• تولید محتوای با ارزش\n• پست مهمان\n• رپورتاژ آگهی\n• شبکه‌های اجتماعی' },
  schema: { title: 'اسکیما مارک‌آپ', content: 'اسکیما مارک‌آپ کدهایی هستند که به موتورهای جستجو کمک می‌کنند محتوای شما را بهتر درک کنند.\n\n📋 انواع اسکیما:\n• Article\n• Product\n• FAQ\n• HowTo' },
  optimization: { title: 'بهینه‌سازی', content: 'نکات بهینه‌سازی عملکرد:\n\n⚡ سرعت:\n• فشرده‌سازی تصاویر\n• کاهش کدهای CSS/JS\n• استفاده از CDN' },
  advanced: { title: 'سئوی پیشرفته', content: '🚀 تکنیک‌های پیشرفته سئو:\n\n• Core Web Vitals\n• E-E-A-T\n• AI Content Detection\n• Voice Search Optimization\n• International SEO' },
}

function getTabIcon(id: string) {
  const map: Record<string, React.ReactNode> = {
    guide: <BookOpen className="h-4 w-4" />, 'what-is': <HelpCircle className="h-4 w-4" />, tips: <Lightbulb className="h-4 w-4" />,
    backlinks: <Link className="h-4 w-4" />, schema: <Code className="h-4 w-4" />, optimization: <TrendingUp className="h-4 w-4" />,
    'content-gen': <FileEdit className="h-4 w-4" />, keywords: <Search className="h-4 w-4" />, competitor: <Swords className="h-4 w-4" />,
    advanced: <Rocket className="h-4 w-4" />, 'page-seo': <FileCheck className="h-4 w-4" />,
  }
  return map[id] ?? <Sparkles className="h-4 w-4" />
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 5) return 'همین الان'
  if (diffSec < 60) return `${diffSec} ثانیه پیش`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} دقیقه پیش`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} ساعت پیش`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} روز پیش`
}

// ─── Typing Animation Dots ────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// ─── Markdown Message Bubble ──────────────────────────────────────────────────

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-2 prose-blockquote:my-2 prose-code:text-violet-600 dark:prose-code:text-violet-400 prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-strong:text-foreground">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  useEnsureData([])
  const { stats } = useCMS()
  const { toast } = useToast()

  interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [activeSeoTab, setActiveSeoTab] = useState('guide')
  const [seoLoading, setSeoLoading] = useState(false)
  const [seoResult, setSeoResult] = useState('')

  const [genType, setGenType] = useState('article')
  const [genTopic, setGenTopic] = useState('')
  const [genLength, setGenLength] = useState('medium')
  const [genTone, setGenTone] = useState('formal')
  const [kwInput, setKwInput] = useState('')
  const [kwResult, setKwResult] = useState('')
  const [compUrl, setCompUrl] = useState('')
  const [compResult, setCompResult] = useState('')
  const [pageSeoContent, setPageSeoContent] = useState('')
  const [pageSeoResult, setPageSeoResult] = useState('')

  // Update relative timestamps every 30s
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, streamingMessage])

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    if (streamingMessage) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: streamingMessage, timestamp: new Date() }])
    }
    setStreamingMessage(null)
    setChatLoading(false)
  }, [streamingMessage])

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    const newMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: userMsg, timestamp: new Date() }]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)
    setStreamingMessage('')

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // Build the messages array for the API (exclude timestamps)
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
        signal: abortController.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

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
            if (parsed.error) {
              throw new Error(parsed.error)
            }
            if (parsed.content) {
              accumulated += parsed.content
              setStreamingMessage(accumulated)
            }
          } catch {
            // ignore parse errors for partial data
          }
        }
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: accumulated, timestamp: new Date() }])
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User stopped streaming
      } else {
        const errMsg = err instanceof Error ? err.message : 'خطا در ارتباط با سرور.'
        setChatMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}`, timestamp: new Date() }])
      }
    } finally {
      setStreamingMessage(null)
      setChatLoading(false)
      abortControllerRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() }
  }

  const handleCopyMessage = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
      toast({ title: labels.copied, duration: 2000 })
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      toast({ title: 'خطا در کپی کردن', variant: 'destructive', duration: 2000 })
    }
  }

  const handlePresetClick = (prompt: string) => {
    setChatInput(prev => prev + prompt)
  }

  const handleClearChat = () => {
    if (chatLoading) stopStreaming()
    setChatMessages([])
    setStreamingMessage(null)
    toast({ title: labels.clearChat, duration: 1500 })
  }

  const handleContentGen = async () => {
    if (!genTopic.trim() || seoLoading) return
    setSeoLoading(true); setSeoResult('')
    try {
      const res = await fetch('/api/ai/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: genType, topic: genTopic, length: genLength, tone: genTone }) })
      const data = await res.json(); setSeoResult(data.result ?? data.content ?? '')
    } catch { setSeoResult('خطا در تولید محتوا.') } finally { setSeoLoading(false) }
  }

  const handleKeywords = async () => {
    if (!kwInput.trim() || seoLoading) return
    setSeoLoading(true); setKwResult('')
    try {
      const res = await fetch('/api/ai/keywords', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: kwInput }) })
      const data = await res.json(); setKwResult(data.result ?? data.content ?? '')
    } catch { setKwResult('خطا در تحلیل کلمات کلیدی.') } finally { setSeoLoading(false) }
  }

  const handleCompetitor = async () => {
    if (!compUrl.trim() || seoLoading) return
    setSeoLoading(true); setCompResult('')
    try {
      const res = await fetch('/api/ai/competitor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: compUrl }) })
      const data = await res.json(); setCompResult(data.result ?? data.content ?? '')
    } catch { setCompResult('خطا در تحلیل رقبا.') } finally { setSeoLoading(false) }
  }

  const handlePageSeo = async () => {
    if (!pageSeoContent.trim() || seoLoading) return
    setSeoLoading(true); setPageSeoResult('')
    try {
      const res = await fetch('/api/ai/seo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: pageSeoContent }) })
      const data = await res.json(); setPageSeoResult(data.result ?? data.content ?? '')
    } catch { setPageSeoResult('خطا در تحلیل سئو.') } finally { setSeoLoading(false) }
  }

  function SeoResultPanel({ result, loading }: { result: string; loading: boolean }) {
    if (loading) return (
      <div className="flex items-center gap-3 py-8 justify-center text-violet-500 animate-in">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{labels.processing}</span>
        <TypingDots />
      </div>
    )
    if (!result) return null
    return (
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-800/10 border border-violet-200/50 dark:border-violet-800/30 animate-in shadow-sm">
        <p className="text-sm font-medium mb-2 text-violet-700 dark:text-violet-300">{labels.results}:</p>
        <div className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">{result}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {chatMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
              onClick={handleClearChat}
            >
              <Trash2 className="h-3.5 w-3.5 ml-1" />
              {labels.clearChat}
            </Button>
          )}
          <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 w-fit gap-1.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            {labels.modelBadge}
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="bg-violet-100 dark:bg-violet-900/30 h-11 shadow-sm">
          <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200">
            <MessageSquare className="h-4 w-4" />
            {labels.chatTab}
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200">
            <Search className="h-4 w-4" />
            {labels.seoTab}
          </TabsTrigger>
        </TabsList>

        {/* CHAT TAB */}
        <TabsContent value="chat">
          <Card className="glass-card shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-violet-700 dark:text-violet-300 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                گفتگو با AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-violet-200/30 dark:border-violet-800/30 bg-background/50 h-[480px] flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {chatMessages.length === 0 && !streamingMessage ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/20 dark:to-violet-800/20 flex items-center justify-center mb-4">
                        <Bot className="h-8 w-8 text-violet-300" />
                      </div>
                      <p className="text-sm font-medium">{labels.noMessages}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`} style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm relative group ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-violet-600 to-violet-500 text-white rounded-br-md'
                              : 'bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/30 dark:to-violet-800/20 text-foreground rounded-bl-md border border-violet-200/30 dark:border-violet-800/20'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <MarkdownMessage content={msg.content} />
                            ) : (
                              <span>{msg.content}</span>
                            )}

                            {/* Timestamp */}
                            <div className={`text-[10px] mt-1.5 ${
                              msg.role === 'user' ? 'text-violet-200 text-left' : 'text-muted-foreground/60 text-left'
                            }`}>
                              {formatRelativeTime(msg.timestamp)}
                            </div>

                            {/* Copy button for assistant messages */}
                            {msg.role === 'assistant' && (
                              <button
                                onClick={() => handleCopyMessage(msg.content, i)}
                                className="absolute -left-2 top-1/2 -translate-y-1/2 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-700 shadow-sm hover:bg-violet-50 dark:hover:bg-violet-900/50"
                                title="کپی"
                              >
                                {copiedIndex === i ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Streaming message (in-progress) */}
                      {streamingMessage !== null && (
                        <div className="flex justify-start animate-in">
                          <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5 text-sm shadow-sm bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/30 dark:to-violet-800/20 text-foreground border border-violet-200/30 dark:border-violet-800/20">
                            {streamingMessage ? (
                              <>
                                <MarkdownMessage content={streamingMessage} />
                                <span className="inline-block w-1.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle rounded-sm" />
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-violet-500 text-sm">
                                <TypingDots />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div ref={chatEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Preset Templates */}
                <div className="px-3 pt-2 border-t border-violet-200/20 dark:border-violet-800/20">
                  <p className="text-[11px] text-muted-foreground mb-2 font-medium">{labels.presetsTitle}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {presetTemplates.map((tpl, i) => (
                      <button
                        key={i}
                        onClick={() => handlePresetClick(tpl.prompt)}
                        disabled={chatLoading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap text-white bg-gradient-to-r ${tpl.gradient} shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shrink-0`}
                      >
                        <span>{tpl.icon}</span>
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input area */}
                <div className="p-3 border-t border-violet-200/20 dark:border-violet-800/20 bg-gradient-to-t from-violet-50/50 to-transparent dark:from-violet-900/10">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={labels.chatPlaceholder}
                        rows={1}
                        className="resize-none min-h-[40px] transition-all duration-200 focus:shadow-sm pr-3"
                        disabled={chatLoading}
                      />
                      <span className="absolute left-3 bottom-1.5 text-[10px] text-muted-foreground/60 pointer-events-none">
                        {chatInput.length} {labels.charCount}
                      </span>
                    </div>
                    {chatLoading ? (
                      <Button
                        size="icon"
                        onClick={stopStreaming}
                        className="shrink-0 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
                      >
                        <StopCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        onClick={handleChatSend}
                        disabled={!chatInput.trim()}
                        className="shrink-0 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO TAB */}
        <TabsContent value="seo">
          <Card className="glass-card shadow-sm">
            <CardContent className="p-4">
              <Tabs value={activeSeoTab} onValueChange={setActiveSeoTab} className="space-y-4">
                <TabsList className="flex flex-wrap h-auto gap-1 bg-violet-100/50 dark:bg-violet-900/20 p-1">
                  {[
                    { id: 'guide', label: labels.guide }, { id: 'what-is', label: labels.whatIsSeo },
                    { id: 'tips', label: labels.techniques }, { id: 'backlinks', label: labels.backlinks },
                    { id: 'schema', label: labels.schema }, { id: 'optimization', label: labels.optimization },
                    { id: 'content-gen', label: labels.contentGen }, { id: 'keywords', label: labels.keywords },
                    { id: 'competitor', label: labels.competitors }, { id: 'advanced', label: labels.advanced },
                    { id: 'page-seo', label: labels.pageSeo },
                  ].map(tab => (
                    <TabsTrigger key={tab.id} value={tab.id} className="text-xs px-3 py-1.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-200">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(seoContent).map(([key, val]) => (
                  <TabsContent key={key} value={key}>
                    <div className="space-y-3 animate-in">
                      <div className="flex items-center gap-2 text-lg font-semibold text-violet-700 dark:text-violet-300">
                        {getTabIcon(key)}
                        {val.title}
                      </div>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground p-4 rounded-xl bg-background/50">{val.content}</div>
                    </div>
                  </TabsContent>
                ))}

                <TabsContent value="content-gen">
                  <div className="space-y-4 animate-in">
                    <div className="flex items-center gap-2 text-lg font-semibold text-violet-700 dark:text-violet-300">
                      <FileEdit className="h-5 w-5" />{labels.contentGen}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-2"><Label>{'نوع محتوا'}</Label><Select value={genType} onValueChange={setGenType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="article">{labels.typeOptions.article}</SelectItem><SelectItem value="blog">{labels.typeOptions.blog}</SelectItem><SelectItem value="product">{labels.typeOptions.product}</SelectItem><SelectItem value="social">{labels.typeOptions.social}</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>{labels.length}</Label><Select value={genLength} onValueChange={setGenLength}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="short">{labels.lengthOptions.short}</SelectItem><SelectItem value="medium">{labels.lengthOptions.medium}</SelectItem><SelectItem value="long">{labels.lengthOptions.long}</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label>{labels.tone}</Label><Select value={genTone} onValueChange={setGenTone}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="formal">{labels.toneOptions.formal}</SelectItem><SelectItem value="informal">{labels.toneOptions.informal}</SelectItem><SelectItem value="persuasive">{labels.toneOptions.persuasive}</SelectItem><SelectItem value="educational">{labels.toneOptions.educational}</SelectItem></SelectContent></Select></div>
                    </div>
                    <div className="space-y-2"><Label>{labels.topic}</Label><Input value={genTopic} onChange={e => setGenTopic(e.target.value)} placeholder="موضوع محتوا را وارد کنید..." /></div>
                    <Button onClick={handleContentGen} disabled={!genTopic.trim() || seoLoading} className="gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
                      {seoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{labels.generate}
                    </Button>
                    <SeoResultPanel result={seoResult} loading={seoLoading && activeSeoTab === 'content-gen'} />
                  </div>
                </TabsContent>

                <TabsContent value="keywords">
                  <div className="space-y-4 animate-in">
                    <div className="flex items-center gap-2 text-lg font-semibold text-violet-700 dark:text-violet-300"><Search className="h-5 w-5" />{labels.keywords}</div>
                    <div className="space-y-2"><Label>{labels.keywordsInput}</Label><Input value={kwInput} onChange={e => setKwInput(e.target.value)} placeholder="مثال: سئو، بهینه‌سازی، وب‌سایت" dir="ltr" /></div>
                    <Button onClick={handleKeywords} disabled={!kwInput.trim() || seoLoading} className="gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
                      {seoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{labels.analyze}
                    </Button>
                    <SeoResultPanel result={kwResult} loading={seoLoading && activeSeoTab === 'keywords'} />
                  </div>
                </TabsContent>

                <TabsContent value="competitor">
                  <div className="space-y-4 animate-in">
                    <div className="flex items-center gap-2 text-lg font-semibold text-violet-700 dark:text-violet-300"><Swords className="h-5 w-5" />{labels.competitors}</div>
                    <div className="space-y-2"><Label>{labels.urlInput}</Label><Input value={compUrl} onChange={e => setCompUrl(e.target.value)} placeholder="https://example.com" dir="ltr" /></div>
                    <Button onClick={handleCompetitor} disabled={!compUrl.trim() || seoLoading} className="gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
                      {seoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}{labels.analyze}
                    </Button>
                    <SeoResultPanel result={compResult} loading={seoLoading && activeSeoTab === 'competitor'} />
                  </div>
                </TabsContent>

                <TabsContent value="page-seo">
                  <div className="space-y-4 animate-in">
                    <div className="flex items-center gap-2 text-lg font-semibold text-violet-700 dark:text-violet-300"><FileCheck className="h-5 w-5" />{labels.pageSeo}</div>
                    <div className="space-y-2"><Label>{labels.contentInput}</Label><Textarea value={pageSeoContent} onChange={e => setPageSeoContent(e.target.value)} rows={5} placeholder="عنوان و محتوای صفحه را وارد کنید..." /></div>
                    <Button onClick={handlePageSeo} disabled={!pageSeoContent.trim() || seoLoading} className="gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
                      {seoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}{labels.analyze}
                    </Button>
                    <SeoResultPanel result={pageSeoResult} loading={seoLoading && activeSeoTab === 'page-seo'} />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
