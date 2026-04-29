'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Bot, Send, Sparkles, X, Trash2, MessageSquare, FileText, BarChart3, Lightbulb,
  StopCircle, ThumbsUp, ThumbsDown, Copy, Check, Search, TrendingUp, ClipboardList,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  reaction?: 'up' | 'down' | null
}

// ─── Constants ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'quick-ai-chat-history'

const suggestedActions = [
  {
    label: 'خلاصه‌سازی مقالات',
    icon: FileText,
    prompt: 'لطفاً خلاصه‌ای از آخرین مقالات سیستم ارائه بده',
    gradient: 'from-violet-500 to-purple-500',
    glow: 'hover:shadow-violet-500/30',
  },
  {
    label: 'تحلیل فروش ماهانه',
    icon: BarChart3,
    prompt: 'تحلیلی از وضعیت فروش و درآمد ماهانه سیستم ارائه بده',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'hover:shadow-emerald-500/30',
  },
  {
    label: 'پیشنهاد محتوا',
    icon: Lightbulb,
    prompt: '۵ ایده خلاقانه برای محتوای جدید پیشنهاد بده',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'hover:shadow-amber-500/30',
  },
  {
    label: 'بهینه‌سازی سئو',
    icon: TrendingUp,
    prompt: 'پیشنهادات بهینه‌سازی سئو برای سایت ارائه بده',
    gradient: 'from-cyan-500 to-sky-500',
    glow: 'hover:shadow-cyan-500/30',
  },
  {
    label: 'گزارش عملکرد',
    icon: Search,
    prompt: 'گزارش عملکرد کلی سیستم و تیم ارائه بده',
    gradient: 'from-rose-500 to-pink-500',
    glow: 'hover:shadow-rose-500/30',
  },
  {
    label: 'برنامه‌ریزی محتوا',
    icon: ClipboardList,
    prompt: 'یک برنامه محتوایی هفتگی پیشنهاد بده',
    gradient: 'from-fuchsia-500 to-purple-500',
    glow: 'hover:shadow-fuchsia-500/30',
  },
]

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  content: 'سلام! 👋 من دستیار هوشمند Smart CMS هستم.\n\nچطور می‌تونم کمکتون کنم؟ از دکمه‌های پیشنهادی زیر استفاده کنید یا سؤالتون رو مستقیماً بپرسید.',
  timestamp: Date.now(),
}

// ─── Helpers ────────────────────────────────────────────────────────────

function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m: ChatMessage) =>
        typeof m.role === 'string' &&
        typeof m.content === 'string' &&
        typeof m.timestamp === 'number' &&
        (m.role === 'user' || m.role === 'assistant')
    )
  } catch {
    return []
  }
}

function saveHistory(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    const trimmed = messages.slice(-50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // localStorage full — silently fail
  }
}

// ─── Typing Dots (using typing-dot CSS class) ──────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      <span className="typing-dot h-2 w-2 rounded-full bg-violet-500 dark:bg-violet-400" />
      <span className="typing-dot h-2 w-2 rounded-full bg-violet-500 dark:bg-violet-400" />
      <span className="typing-dot h-2 w-2 rounded-full bg-violet-500 dark:bg-violet-400" />
    </div>
  )
}

// ─── Copy Button ───────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('کپی شد')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('خطا در کپی')
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
      title="کپی متن"
    >
      {copied ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  )
}

// ─── Reaction Buttons ──────────────────────────────────────────────────

function ReactionButtons({ messageIndex, messages, setMessages }: {
  messageIndex: number
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
}) {
  const msg = messages[messageIndex]

  const handleReaction = useCallback((type: 'up' | 'down') => {
    setMessages(prev => prev.map((m, i) => {
      if (i !== messageIndex) return m
      const currentReaction = m.reaction
      const newReaction = currentReaction === type ? null : type
      return { ...m, reaction: newReaction }
    }))
  }, [messageIndex, setMessages])

  if (msg.role !== 'assistant') return null

  return (
    <div className="flex items-center gap-0.5 mt-1">
      <button
        onClick={() => handleReaction('up')}
        className={`p-0.5 rounded transition-colors cursor-pointer ${
          msg.reaction === 'up'
            ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
            : 'text-muted-foreground/40 hover:text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10'
        }`}
        title="مفید بود"
      >
        <ThumbsUp className="h-3 w-3" />
      </button>
      <button
        onClick={() => handleReaction('down')}
        className={`p-0.5 rounded transition-colors cursor-pointer ${
          msg.reaction === 'down'
            ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
            : 'text-muted-foreground/40 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/10'
        }`}
        title="مفید نبود"
      >
        <ThumbsDown className="h-3 w-3" />
      </button>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────

export function QuickAIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingContentRef = useRef<string>('')

  // Keep ref in sync with state
  useEffect(() => {
    streamingContentRef.current = streamingContent ?? ''
  }, [streamingContent])

  // Check if chat is "empty" (only has welcome message)
  const isEmpty = messages.length === 0 ||
    (messages.length === 1 && messages[0].role === 'assistant' && messages[0].content === WELCOME_MESSAGE.content)

  // ── Load history from localStorage on mount ──
  useEffect(() => {
    const history = loadHistory()
    if (history.length > 0) {
      setMessages(history)
      setUnreadCount(0)
    } else {
      setMessages([WELCOME_MESSAGE])
    }
    setHasLoadedHistory(true)
  }, [])

  // ── Persist messages whenever they change ──
  useEffect(() => {
    if (!hasLoadedHistory) return
    saveHistory(messages)
  }, [messages, hasLoadedHistory])

  // ── Auto-scroll to bottom on new messages ──
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingContent, isOpen])

  // ── Focus input when panel opens ──
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350)
    }
  }, [isOpen])

  // ── Send message handler ──
  const handleSend = useCallback(async (text?: string) => {
    const userText = (text ?? input).trim()
    if (!userText || isLoading) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
        signal: abortController.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `خطای سرور (${res.status})`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('پاسخی از سرور دریافت نشد')

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
              setStreamingContent(accumulated)
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
              // Silently skip malformed chunks
            }
          }
        }
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: accumulated,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, assistantMsg])

      if (!isOpen) {
        setUnreadCount(prev => prev + 1)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        const partial = streamingContentRef.current
        if (partial) {
          const partialMsg: ChatMessage = {
            role: 'assistant',
            content: partial + '\n\n_⏹ پاسخ متوقف شد_',
            timestamp: Date.now(),
          }
          setMessages(prev => [...prev, partialMsg])
        }
      } else {
        const errMsg = err instanceof Error ? err.message : 'خطای ناشناخته'
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: `⚠️ ${errMsg}`,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, errorMsg])
      }
    } finally {
      setStreamingContent(null)
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [input, isLoading, messages, isOpen])

  // ── Stop streaming ──
  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  // ── Clear chat ──
  const handleClear = useCallback(() => {
    if (isLoading) handleStop()
    setMessages([WELCOME_MESSAGE])
    setStreamingContent(null)
    setUnreadCount(0)
    localStorage.removeItem(STORAGE_KEY)
    toast.success('گفتگو پاک شد')
  }, [isLoading, handleStop])

  // ── Toggle panel ──
  const togglePanel = useCallback(() => {
    setIsOpen(prev => {
      if (prev) {
        setUnreadCount(0)
      }
      return !prev
    })
  }, [])

  // ── Quick action handler ──
  const handleQuickAction = useCallback((prompt: string) => {
    if (isLoading) return
    setInput('')
    handleSend(prompt)
  }, [isLoading, handleSend])

  // ── Keyboard handler ──
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // ── Render message content (basic markdown-like formatting) ──
  const renderContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g)
      const rendered = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>
        }
        const codeParts = part.split(/(`[^`]+`)/g)
        return codeParts.map((cp, k) => {
          if (cp.startsWith('`') && cp.endsWith('`')) {
            return (
              <code key={`${j}-${k}`} className="px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs font-mono">
                {cp.slice(1, -1)}
              </code>
            )
          }
          return <span key={`${j}-${k}`}>{cp}</span>
        })
      })

      if (line === '') {
        return <br key={i} />
      }
      return <span key={i}>{rendered}</span>
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" style={{ direction: 'ltr' }}>
      {/* ─── Chat Panel ─── */}
      <div
        className={`
          w-[360px] h-[520px] sm:w-[400px] sm:h-[560px]
          rounded-2xl overflow-hidden
          flex flex-col
          shadow-2xl shadow-violet-500/10 dark:shadow-violet-500/5
          transition-all duration-300 ease-out
          origin-bottom-right
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
          }
          glass-card
        `}
        style={{ direction: 'rtl' }}
      >
        {/* ─── Header ─── */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-violet-100/60 dark:border-violet-800/30 bg-gradient-to-l from-violet-50/80 to-white/80 dark:from-violet-900/20 dark:to-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">دستیار هوشمند</h3>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[11px] text-muted-foreground">آنلاین</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Clear chat button */}
            {!isEmpty && (
              <button
                onClick={handleClear}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                title="پاک کردن گفتگو"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {/* Close button */}
            <button
              onClick={togglePanel}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Messages Area ─── */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30 dark:bg-gray-900/30"
        >
          {/* Suggested Prompts Panel - shown when chat is empty */}
          {isEmpty && !isLoading && streamingContent === null && (
            <div className="flex flex-col items-center gap-3 py-2 animate-in">
              <div className="text-center mb-1">
                <p className="text-xs text-muted-foreground/80">چه کاری براتون انجام بدم؟</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                {suggestedActions.map((action, i) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={isLoading}
                    className={`
                      group flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium
                      text-white cursor-pointer
                      bg-gradient-to-br ${action.gradient}
                      shadow-sm ${action.glow} hover:shadow-md
                      hover:scale-[1.03] active:scale-95
                      transition-all duration-200
                      disabled:opacity-50 disabled:pointer-events-none
                      stagger-children
                    `}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                      <action.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-right leading-snug">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={`${i}-${msg.timestamp}`}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              style={{
                animation: 'fadeIn 0.3s ease-out, slideUp 0.3s ease-out',
                animationFillMode: 'both',
              }}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-violet-500 text-white rounded-br-md'
                    : 'bg-white dark:bg-gray-800 text-foreground rounded-bl-md border border-violet-100/60 dark:border-violet-800/30'
                }`}
              >
                {/* Role indicator + Copy button for AI */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {msg.role === 'user' ? (
                      <MessageSquare className="h-3 w-3 text-violet-200" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                    )}
                    <span className={`text-[10px] font-medium ${
                      msg.role === 'user' ? 'text-violet-200' : 'text-violet-500 dark:text-violet-400'
                    }`}>
                      {msg.role === 'user' ? 'شما' : 'AI دستیار'}
                    </span>
                  </div>
                  {msg.role === 'assistant' && (
                    <CopyButton text={msg.content} />
                  )}
                </div>

                {/* Message content */}
                <div className="whitespace-pre-wrap">
                  {renderContent(msg.content)}
                </div>

                {/* Timestamp */}
                <div className={`text-[10px] mt-1.5 ${
                  msg.role === 'user' ? 'text-violet-200/70' : 'text-muted-foreground/50'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>

                {/* Reactions for AI messages */}
                {msg.role === 'assistant' && (
                  <ReactionButtons
                    messageIndex={i}
                    messages={messages}
                    setMessages={setMessages}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streamingContent !== null && (
            <div className="flex justify-end animate-in">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed shadow-sm bg-white dark:bg-gray-800 text-foreground border border-violet-100/60 dark:border-violet-800/30">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-violet-500 dark:text-violet-400" />
                    <span className="text-[10px] font-medium text-violet-500 dark:text-violet-400">AI دستیار</span>
                  </div>
                </div>
                {streamingContent ? (
                  <>
                    <div className="whitespace-pre-wrap">{renderContent(streamingContent)}</div>
                    <span className="inline-block w-1.5 h-4 bg-violet-400 animate-pulse mr-0.5 align-middle rounded-sm" />
                  </>
                ) : (
                  <TypingDots />
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── Quick Actions (compact bar) ─── */}
        {!isEmpty && (
          <div className="shrink-0 px-3 pt-2 pb-1 border-t border-violet-100/40 dark:border-violet-800/20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestedActions.slice(0, 4).map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  disabled={isLoading}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                    whitespace-nowrap text-white
                    bg-gradient-to-r ${action.gradient}
                    shadow-sm hover:scale-105 active:scale-95
                    transition-all duration-200
                    disabled:opacity-50 disabled:pointer-events-none
                    shrink-0 cursor-pointer
                  `}
                >
                  <action.icon className="h-3 w-3" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Input Area ─── */}
        <div className="shrink-0 p-3 border-t border-violet-100/40 dark:border-violet-800/20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="پیام خود را بنویسید..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none min-h-[40px] max-h-[100px] rounded-xl bg-gray-50 dark:bg-gray-800 border border-violet-100/60 dark:border-violet-800/30 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300 dark:focus:border-violet-600 transition-all disabled:opacity-50"
              dir="rtl"
            />
            {isLoading ? (
              <button
                onClick={handleStop}
                className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="توقف"
              >
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white flex items-center justify-center shadow-sm shadow-violet-500/25 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none cursor-pointer"
                title="ارسال"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className="text-[10px] text-muted-foreground/50">
              {input.length} کاراکتر
            </span>
            <span className="text-[10px] text-muted-foreground/50">
              Enter برای ارسال • Shift+Enter خط جدید
            </span>
          </div>
        </div>
      </div>

      {/* ─── Floating Button ─── */}
      <button
        onClick={togglePanel}
        className={`
          h-14 w-14 rounded-full
          flex items-center justify-center
          shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50
          transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          cursor-pointer
          relative
          ${isOpen
            ? 'bg-gradient-to-br from-gray-700 to-gray-800 dark:from-gray-600 dark:to-gray-700 rotate-0'
            : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
          }
        `}
        title={isOpen ? 'بستن گفتگو' : 'گفتگوی سریع با AI'}
      >
        {/* Unread indicator */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 badge-pop">
            {unreadCount > 9 ? '۹+' : unreadCount}
          </span>
        )}

        {/* Animated ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full border-2 border-violet-400/40 animate-ping opacity-30" />
        )}

        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Sparkles className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  )
}
