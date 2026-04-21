'use client'

import { useState, useRef, useCallback, type ReactNode, type KeyboardEvent } from 'react'
import Markdown from 'react-markdown'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Eye,
  EyeOff,
  X,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'محتوای خود را بنویسید…',
  className,
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // -----------------------------------------------------------------------
  // Helpers – textarea manipulation (all use refs only in callbacks, not during render)
  // -----------------------------------------------------------------------

  const doWrap = useCallback((before: string, after: string, defaultText: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.substring(start, end) || defaultText
    const next = value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      const selStart = start + before.length
      ta.setSelectionRange(selStart, selStart + selected.length)
    })
  }, [value, onChange])

  const doTogglePrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const cursor = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', cursor - 1) + 1
    const lineEnd = value.indexOf('\n', cursor)
    const end = lineEnd === -1 ? value.length : lineEnd
    const line = value.substring(lineStart, end)
    let next: string, selStart: number, selEnd: number
    if (line.startsWith(prefix)) {
      next = value.substring(0, lineStart) + line.substring(prefix.length) + value.substring(end)
      selStart = lineStart; selEnd = lineStart + line.length - prefix.length
    } else {
      next = value.substring(0, lineStart) + prefix + line + value.substring(end)
      selStart = lineStart + prefix.length; selEnd = end + prefix.length
    }
    onChange(next)
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(selStart, selEnd) })
  }, [value, onChange])

  const submitLink = useCallback(() => {
    const url = linkUrl.trim()
    if (url) doWrap('[', `](${url})`, 'متن لینک')
    setShowLinkInput(false); setLinkUrl('')
  }, [linkUrl, doWrap])

  const onLinkKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submitLink() }
    else if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl('') }
  }, [submitLink])

  // -----------------------------------------------------------------------
  // Markdown preview components
  // -----------------------------------------------------------------------

  const mdComponents = {
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="text-xl font-bold mt-4 mb-2 text-foreground">{children}</h1>
    ),
    h2: ({ children }: { children?: ReactNode }) => (
      <h2 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3 className="text-base font-semibold mt-3 mb-1 text-foreground">{children}</h3>
    ),
    p: ({ children }: { children?: ReactNode }) => <p className="mb-3 leading-7">{children}</p>,
    strong: ({ children }: { children?: ReactNode }) => <strong className="font-bold text-foreground">{children}</strong>,
    em: ({ children }: { children?: ReactNode }) => <em className="italic">{children}</em>,
    ul: ({ children }: { children?: ReactNode }) => <ul className="list-disc list-inside mb-3 space-y-1 mr-2">{children}</ul>,
    ol: ({ children }: { children?: ReactNode }) => <ol className="list-decimal list-inside mb-3 space-y-1 mr-2">{children}</ol>,
    li: ({ children }: { children?: ReactNode }) => <li className="leading-7">{children}</li>,
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="border-r-4 border-violet-400 dark:border-violet-500 pr-4 my-3 italic text-muted-foreground">{children}</blockquote>
    ),
    pre: ({ children }: { children?: ReactNode }) => (
      <pre className="bg-muted/60 dark:bg-muted/30 rounded-lg p-3 my-3 overflow-x-auto text-sm font-mono border">{children}</pre>
    ),
    code: ({ children, className: cls }: { children?: ReactNode; className?: string }) => {
      if (cls) return <code className="text-sm">{children}</code>
      return <code className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    },
    a: ({ children, href }: { children?: ReactNode; href?: string }) => (
      <a href={href} className="text-violet-600 dark:text-violet-400 underline decoration-violet-300 dark:decoration-violet-700 underline-offset-2 hover:text-violet-700 dark:hover:text-violet-300 transition-colors" target="_blank" rel="noopener noreferrer">{children}</a>
    ),
    hr: () => <hr className="my-4 border-border" />,
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const btnClass = 'h-8 w-8 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 hover:scale-110 active:scale-95 transition-all duration-150'

  return (
    <div className={cn('glass-card rounded-lg border overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-gradient-to-l from-violet-50/60 to-transparent dark:from-violet-950/20 dark:to-transparent">
        <div className="flex items-center gap-0.5 flex-1 flex-wrap">
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className={btnClass} onClick={() => doWrap('**', '**', 'متن بولد')} disabled={isPreview}><Bold className="h-4 w-4" /><span className="sr-only">بولد</span></Button></TooltipTrigger><TooltipContent side="bottom" className="text-xs">بولد</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className={btnClass} onClick={() => doWrap('*', '*', 'متن ایتالیک')} disabled={isPreview}><Italic className="h-4 w-4" /><span className="sr-only">ایتالیک</span></Button></TooltipTrigger><TooltipContent side="bottom" className="text-xs">ایتالیک</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className={btnClass} onClick={() => doTogglePrefix('## ')} disabled={isPreview}><Heading2 className="h-4 w-4" /><span className="sr-only">تیتر</span></Button></TooltipTrigger><TooltipContent side="bottom" className="text-xs">تیتر</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className={btnClass} onClick={() => doTogglePrefix('- ')} disabled={isPreview}><List className="h-4 w-4" /><span className="sr-only">لیست</span></Button></TooltipTrigger><TooltipContent side="bottom" className="text-xs">لیست</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className={btnClass} onClick={() => doTogglePrefix('1. ')} disabled={isPreview}><ListOrdered className="h-4 w-4" /><span className="sr-only">لیست شماره‌دار</span></Button></TooltipTrigger><TooltipContent side="bottom" className="text-xs">لیست شماره‌دار</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className={btnClass} onClick={() => doTogglePrefix('> ')} disabled={isPreview}><Quote className="h-4 w-4" /><span className="sr-only">نقل قول</span></Button></TooltipTrigger><TooltipContent side="bottom" className="text-xs">نقل قول</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className={btnClass} onClick={() => doWrap('`', '`', 'code')} disabled={isPreview}><Code className="h-4 w-4" /><span className="sr-only">کد</span></Button></TooltipTrigger><TooltipContent side="bottom" className="text-xs">کد</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className={btnClass} onClick={() => { setShowLinkInput(true); setLinkUrl('') }} disabled={isPreview}><Link2 className="h-4 w-4" /><span className="sr-only">لینک</span></Button></TooltipTrigger><TooltipContent side="bottom" className="text-xs">لینک</TooltipContent></Tooltip>
        </div>

        <div className="w-px h-6 bg-border mx-1 shrink-0" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isPreview ? 'default' : 'ghost'}
              size="icon"
              className={cn('h-8 w-8 shrink-0 transition-all duration-200 hover:scale-110 active:scale-95', isPreview ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm' : btnClass)}
              onClick={() => setIsPreview(p => !p)}
              aria-label={isPreview ? 'حالت ویرایش' : 'پیش‌نمایش مارک‌داون'}
            >
              {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{isPreview ? 'ویرایش' : 'پیش‌نمایش'}</TooltipContent>
        </Tooltip>
      </div>

      {/* Link input bar */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 border-b bg-violet-50/60 dark:bg-violet-950/20 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <Link2 className="h-4 w-4 text-violet-500 shrink-0" />
          <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} onKeyDown={onLinkKeyDown} placeholder="https://example.com" className="h-8 text-sm flex-1" dir="ltr" autoFocus />
          <Button type="button" size="sm" className="h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs px-3" onClick={submitLink} disabled={!linkUrl.trim()}>تأیید</Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0" onClick={() => { setShowLinkInput(false); setLinkUrl('') }}><X className="h-4 w-4" /></Button>
        </div>
      )}

      {/* Content area */}
      {isPreview ? (
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 text-sm" dir="auto">
          {value ? <Markdown components={mdComponents}>{value}</Markdown> : <p className="text-muted-foreground italic">{placeholder}</p>}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[200px] max-h-[400px] w-full resize-y p-4 text-sm leading-relaxed bg-transparent outline-none placeholder:text-muted-foreground/50"
          dir="auto"
          aria-label="ویرایشگر محتوا"
        />
      )}
    </div>
  )
}
