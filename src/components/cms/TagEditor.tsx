'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ArrowRight,
  Save,
  Tag,
  Info,
  Package,
  Copy,
  Lightbulb,
} from 'lucide-react'
import { toast } from 'sonner'

// =============================================================================
// Props
// =============================================================================

interface TagEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTag: {
    id: string
    name: string
    slug: string
    productCount: number
  } | null
  form: { name: string; slug: string }
  onFormChange: (form: { name: string; slug: string }) => void
  onSave: () => void
}

// =============================================================================
// Helpers
// =============================================================================

function generateSlug(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FF\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

// =============================================================================
// Component
// =============================================================================

export default function TagEditor({
  open,
  onOpenChange,
  editingTag,
  form,
  onFormChange,
  onSave,
}: TagEditorProps) {
  // ── Local state ──
  const [editingSlug, setEditingSlug] = useState(false)
  const [tempSlug, setTempSlug] = useState(form.slug)

  // ── Computed ──
  const isEditing = !!editingTag
  const pageTitle = isEditing ? 'ویرایش برچسب' : 'برچسب جدید'

  // ── Handlers ──

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value
      const newSlug = editingSlug ? form.slug : generateSlug(newName)
      if (!editingSlug) setTempSlug(newSlug)
      onFormChange({ name: newName, slug: newSlug })
    },
    [form.slug, onFormChange, editingSlug],
  )

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTempSlug(e.target.value)
  }, [])

  const handleSlugConfirm = useCallback(() => {
    onFormChange({ ...form, slug: tempSlug })
    setEditingSlug(false)
    toast.success('پیوند یکتا ذخیره شد')
  }, [form, onFormChange, tempSlug])

  const handleSlugCancel = useCallback(() => {
    setTempSlug(form.slug)
    setEditingSlug(false)
  }, [form.slug])

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      toast.error('لطفاً نام برچسب را وارد کنید')
      return
    }
    onSave()
  }, [form.name, onSave])

  const handleCopySlug = useCallback(() => {
    navigator.clipboard?.writeText(form.slug)
    toast.success('پیوند یکتا کپی شد')
  }, [form.slug])

  // ── Guard ──
  if (!open) return null

  // ── Render ──
  return (
    <div
      className="fixed inset-0 z-50 bg-background animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      dir="rtl"
    >
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <ArrowRight className="size-4" />
            <span className="sr-only">بازگشت</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-lg font-bold text-foreground">{pageTitle}</h1>
          {editingTag && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Tag className="size-3" />
              {editingTag.productCount} محصول
            </Badge>
          )}
        </div>

        <Button
          size="sm"
          className="text-sm gap-1.5 bg-gradient-to-l from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-sm"
          onClick={handleSave}
        >
          <Save className="size-4" />
          ذخیره برچسب
        </Button>
      </header>

      {/* ── Body: Centered Single Column ── */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-2xl p-6 space-y-6">
          {/* Name Input (Large) */}
          <div className="space-y-3">
            <Label htmlFor="tag-name" className="text-sm font-medium">
              نام برچسب
            </Label>
            <Input
              id="tag-name"
              value={form.name}
              onChange={handleNameChange}
              placeholder="مثلاً: تخفیف ویژه، پرفروش، جدید"
              className="text-xl font-semibold h-14 px-4"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              نام برچسب باید کوتاه، گویا و مرتبط با محصولات باشد.
            </p>
          </div>

          {/* Slug Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">پیوند یکتا (Slug)</Label>
            {editingSlug ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm" dir="ltr">
                  https://example.com/tag/
                </span>
                <Input
                  value={tempSlug}
                  onChange={handleSlugChange}
                  className="h-9 text-sm flex-1 font-mono"
                  dir="ltr"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSlugConfirm()
                    if (e.key === 'Escape') handleSlugCancel()
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3 text-xs shrink-0"
                  onClick={handleSlugConfirm}
                >
                  تأیید
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-3 text-xs text-muted-foreground shrink-0"
                  onClick={handleSlugCancel}
                >
                  لغو
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/40 text-sm">
                <span className="text-muted-foreground" dir="ltr">
                  https://example.com/tag/
                </span>
                <span className="font-mono text-foreground" dir="ltr">
                  {form.slug || '...'}
                </span>
                <div className="flex items-center gap-1 mr-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setTempSlug(form.slug)
                      setEditingSlug(true)
                    }}
                  >
                    ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={handleCopySlug}
                  >
                    <Copy className="size-3" />
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              پیوند یکتا بخشی از آدرس URL این برچسب خواهد بود. از آن در لینک‌دهی و سئو استفاده می‌شود.
            </p>
          </div>

          <Separator />

          {/* Info Section: What Tags Are For */}
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Info className="size-4 text-cyan-500" />
              <h3 className="text-sm font-medium text-foreground">درباره برچسب‌ها</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                برچسب‌ها ابزاری قدرتمند برای دسته‌بندی و مرتب‌سازی محصولات هستند. برخلاف دسته‌بندی‌ها که سلسله‌مراتبی هستند، برچسب‌ها انعطاف‌پذیرتر بوده و هر محصول می‌تواند چندین برچسب داشته باشد.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                  <div className="size-8 rounded-md bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Package className="size-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">فیلتر محصولات</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      مشتریان می‌توانند با کلیک روی برچسب، تمام محصولات مرتبط را مشاهده کنند.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                  <div className="size-8 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">سئو و بهینه‌سازی</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      برچسب‌های مرتبط به بهبود سئو و افزایش ترافیک ارگانیک سایت کمک می‌کنند.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                  <div className="size-8 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Tag className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">جستجوی آسان</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      مشتریان به راحتی می‌توانند محصولات مورد نظر خود را با برچسب‌ها پیدا کنند.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">نمونه برچسب‌های پرکاربرد</Label>
            <div className="flex flex-wrap gap-2">
              {[
                'تخفیف ویژه',
                'پرفروش',
                'جدید',
                'ارسال رایگان',
                'محدود',
                'ویژه زمستان',
                'پیشنهاد لحظه‌ای',
                'محصولات ارگانیک',
              ].map((example) => (
                <Badge
                  key={example}
                  variant="outline"
                  className="text-xs px-3 py-1 cursor-default hover:bg-muted/60 transition-colors"
                >
                  <Tag className="size-3 ml-1" />
                  {example}
                </Badge>
              ))}
            </div>
          </div>

          {/* Existing Tag Info */}
          {editingTag && (
            <>
              <Separator />
              <div className="glass-card rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b">
                  <Info className="size-4 text-cyan-500" />
                  <h3 className="text-sm font-medium text-foreground">اطلاعات برچسب</h3>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">شناسه</span>
                    <span className="font-mono text-xs" dir="ltr">
                      {editingTag.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">تعداد محصولات</span>
                    <Badge variant="secondary" className="text-xs">
                      {editingTag.productCount} محصول
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Bottom padding for scroll */}
          <div className="h-8" />
        </div>
      </ScrollArea>
    </div>
  )
}
