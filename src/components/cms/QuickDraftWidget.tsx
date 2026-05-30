'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PenLine, Sparkles, Save, Trash2, FileText, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface Draft {
  id: string
  title: string
  content: string
  createdAt: number
}

export default function QuickDraftWidget() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isComposing, setIsComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSave = () => {
    if (!content.trim()) {
      toast.error('لطفاً محتوایی بنویسید')
      return
    }
    const draft: Draft = {
      id: Date.now().toString(),
      title: title.trim() || 'بدون عنوان',
      content: content.trim(),
      createdAt: Date.now(),
    }
    setDrafts(prev => [draft, ...prev])
    setTitle('')
    setContent('')
    setIsComposing(false)
    toast.success('پیش‌نویس ذخیره شد')
  }

  const handleDelete = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id))
    toast.success('پیش‌نویس حذف شد')
  }

  const handleClear = () => {
    setTitle('')
    setContent('')
    setIsComposing(false)
  }

  const formatTime = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 60000)
    if (diff < 1) return 'همین الان'
    if (diff < 60) return `${diff} دقیقه پیش`
    const hours = Math.floor(diff / 60)
    if (hours < 24) return `${hours} ساعت پیش`
    return `${Math.floor(hours / 24)} روز پیش`
  }

  return (
    <Card className="glass-card card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <PenLine className="h-4 w-4 text-amber-500" />
            <span>پیش‌نویس سریع</span>
            {drafts.length > 0 && (
              <Badge className="badge-gradient text-[10px]">{drafts.length}</Badge>
            )}
          </CardTitle>
          {!isComposing && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-500/30 transition-colors"
              onClick={() => setIsComposing(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              جدید
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Compose area */}
        {isComposing && (
          <div className="space-y-3 mb-4 p-3 rounded-lg bg-background/50 border border-border/40 animate-in">
            <Input
              placeholder="عنوان (اختیاری)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
            />
            <Textarea
              placeholder="محتوای خود را بنویسید..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-sm min-h-[100px] resize-none border-0 bg-transparent focus-visible:ring-0 p-0"
              autoFocus
            />
            <div className="flex items-center justify-between pt-2 border-t border-border/20">
              <Button size="sm" variant="ghost" className="gap-1 text-xs text-muted-foreground" onClick={handleClear}>
                <X className="h-3.5 w-3.5" />
                انصراف
              </Button>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs hover:bg-violet-500/10 hover:text-violet-600" onClick={() => {
                  setContent(prev => prev + '\n\n')
                }}>
                  <Sparkles className="h-3.5 w-3.5" />
                  AI
                </Button>
                <Button size="sm" className="gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5" />
                  ذخیره
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Drafts list */}
        {drafts.length > 0 ? (
          <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/40 transition-all group animate-in"
              >
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{draft.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{draft.content}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTime(draft.createdAt)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 shrink-0"
                  onClick={() => handleDelete(draft.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : !isComposing ? (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <PenLine className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm opacity-60">ایده‌ای دارید؟</p>
            <p className="text-xs mt-1 opacity-40">یک پیش‌نویس سریع بنویسید</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
