'use client'

import { useState, useRef, useEffect } from 'react'
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
import {
  Bot, Send, Sparkles, Loader2, BookOpen, HelpCircle, Lightbulb,
  Link, Code, TrendingUp, FileEdit, Search, Swords, Rocket, FileCheck,
  MessageSquare, RotateCcw,
} from 'lucide-react'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'دستیار هوشمند',
  subtitle: 'چت با AI و دستیار سئو',
  chatPlaceholder: 'پیام خود را بنویسید...',
  send: 'ارسال',
  clear: 'پاک کردن',
  processing: 'در حال پردازش...',
  modelBadge: 'GLM-5-turbo',
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
}

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  useEnsureData([])
  const { stats } = useCMS()

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.result ?? data.content ?? 'پاسخی دریافت نشد.' }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'خطا در ارتباط با سرور.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() }
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
        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 w-fit gap-1.5 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          {labels.modelBadge}
        </Badge>
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
              <div className="rounded-xl border border-violet-200/30 dark:border-violet-800/30 bg-background/50 h-[420px] flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {chatMessages.length === 0 ? (
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
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-br from-violet-600 to-violet-500 text-white rounded-br-md'
                              : 'bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/30 dark:to-violet-800/20 text-foreground rounded-bl-md border border-violet-200/30 dark:border-violet-800/20'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start animate-in">
                          <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-900/30 dark:to-violet-800/20 rounded-2xl rounded-bl-md px-4 py-3.5 border border-violet-200/30 dark:border-violet-800/20 shadow-sm">
                            <div className="flex items-center gap-2 text-violet-500 text-sm">
                              <TypingDots />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="p-3 border-t border-violet-200/20 dark:border-violet-800/20 bg-gradient-to-t from-violet-50/50 to-transparent dark:from-violet-900/10">
                  <div className="flex gap-2">
                    <Textarea
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={labels.chatPlaceholder}
                      rows={1}
                      className="resize-none min-h-[40px] transition-all duration-200 focus:shadow-sm"
                    />
                    <Button
                      size="icon"
                      onClick={handleChatSend}
                      disabled={!chatInput.trim() || chatLoading}
                      className="shrink-0 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
                    >
                      {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              {chatMessages.length > 0 && (
                <div className="mt-2 flex justify-end">
                  <Button variant="ghost" size="sm" className="text-violet-500 hover:text-violet-600 hover:bg-violet-500/10 transition-all duration-200" onClick={() => setChatMessages([])}>
                    <RotateCcw className="h-3.5 w-3.5 ml-1" />
                    {labels.clear}
                  </Button>
                </div>
              )}
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
