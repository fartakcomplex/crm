'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowRight,
  Save,
  FolderOpen,
  ImagePlus,
  Info,
  Zap,
  Eye,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// =============================================================================
// Props
// =============================================================================

interface CategoryEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCategory: {
    id: string
    name: string
    slug: string
    description: string
    image: string
    parentId: string | null
    productCount: number
  } | null
  form: {
    name: string
    slug: string
    description: string
    image: string
    parentId: string | null
  }
  onFormChange: (form: {
    name: string
    slug: string
    description: string
    image: string
    parentId: string | null
  }) => void
  onSave: () => void
  allCategories: Array<{ id: string; name: string; parentId: string | null }>
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

export default function CategoryEditor({
  open,
  onOpenChange,
  editingCategory,
  form,
  onFormChange,
  onSave,
  allCategories,
}: CategoryEditorProps) {
  // ── Local state ──
  const [editingSlug, setEditingSlug] = useState(false)
  const [tempSlug, setTempSlug] = useState(form.slug)

  // ── Computed ──
  const isEditing = !!editingCategory
  const pageTitle = isEditing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'

  // Filter parent candidates: exclude the category being edited and its descendants
  const parentCandidates = allCategories.filter((cat) => {
    if (!editingCategory) return true
    return cat.id !== editingCategory.id
  })

  // Group categories by parent for display
  const rootCategories = parentCandidates.filter((c) => !c.parentId)
  const childCategories = parentCandidates.filter((c) => c.parentId)

  const selectedParentName = allCategories.find((c) => c.id === form.parentId)?.name

  // ── Handlers ──

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value
      const newSlug = editingSlug ? form.slug : generateSlug(newName)
      if (!editingSlug) setTempSlug(newSlug)
      onFormChange({ ...form, name: newName, slug: newSlug })
    },
    [form, onFormChange, editingSlug],
  )

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTempSlug(e.target.value)
    },
    [],
  )

  const handleSlugConfirm = useCallback(() => {
    onFormChange({ ...form, slug: tempSlug })
    setEditingSlug(false)
    toast.success('پیوند یکتا ذخیره شد')
  }, [form, onFormChange, tempSlug])

  const handleSlugCancel = useCallback(() => {
    setTempSlug(form.slug)
    setEditingSlug(false)
  }, [form.slug])

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onFormChange({ ...form, description: e.target.value })
    },
    [form, onFormChange],
  )

  const handleParentChange = useCallback(
    (value: string) => {
      onFormChange({ ...form, parentId: value === 'none' ? null : value })
    },
    [form, onFormChange],
  )

  const handleSave = useCallback(() => {
    if (!form.name.trim()) {
      toast.error('لطفاً نام دسته‌بندی را وارد کنید')
      return
    }
    onSave()
  }, [form.name, onSave])

  const handleCopySlug = useCallback(() => {
    navigator.clipboard?.writeText(form.slug)
    toast.success('پیوند یکتا کپی شد')
  }, [form.slug])

  const handleSetImage = useCallback(() => {
    toast.info('انتخاب تصویر دسته‌بندی — قابلیت به زودی فعال می‌شود')
  }, [])

  const handleRemoveImage = useCallback(() => {
    onFormChange({ ...form, image: '' })
    toast.success('تصویر حذف شد')
  }, [form, onFormChange])

  const handlePreview = useCallback(() => {
    toast.info('پیش‌نمایش دسته‌بندی — قابلیت به زودی فعال می‌شود')
  }, [])

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
          {editingCategory && (
            <Badge
              variant="secondary"
              className="text-xs gap-1"
            >
              <FolderOpen className="size-3" />
              {editingCategory.productCount} محصول
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={handlePreview}
          >
            <Eye className="size-4" />
            پیش‌نمایش
          </Button>
          <Button
            size="sm"
            className="text-sm gap-1.5 bg-gradient-to-l from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-sm"
            onClick={handleSave}
          >
            <Save className="size-4" />
            ذخیره دسته‌بندی
          </Button>
        </div>
      </header>

      {/* ── Body: Two-Column Layout ── */}
      <div className="flex flex-1 min-h-0">
        {/* ─── Main Content (Right in RTL) ─── */}
        <ScrollArea className="flex-[7] border-l">
          <div className="p-6 space-y-6 max-w-none">
            {/* Name Input (Large) */}
            <div className="space-y-2">
              <Label htmlFor="cat-name" className="text-sm font-medium">
                نام دسته‌بندی
              </Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={handleNameChange}
                placeholder="مثلاً: لوازم الکترونیکی"
                className="text-xl font-semibold h-12 px-4"
                autoFocus
              />
            </div>

            {/* Slug Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">پیوند یکتا (Slug)</Label>
              {editingSlug ? (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm" dir="ltr">
                    https://example.com/category/
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
                    https://example.com/category/
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
            </div>

            <Separator />

            {/* Description Textarea */}
            <div className="space-y-2">
              <Label htmlFor="cat-desc" className="text-sm font-medium">
                توضیحات
              </Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={handleDescriptionChange}
                placeholder="توضیحاتی درباره این دسته‌بندی بنویسید…"
                className="resize-none min-h-[120px] text-sm leading-relaxed"
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                توضیحات معمولاً در صفحه دسته‌بندی نمایش داده می‌شود.
              </p>
            </div>

            <Separator />

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="cat-display-name" className="text-sm font-medium">
                نام نمایشی
              </Label>
              <Input
                id="cat-display-name"
                value={form.name}
                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                placeholder="نامی که در سایت نمایش داده می‌شود"
                className="h-10 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                نام نمایشی در منوها و عنوان صفحه استفاده می‌شود. در صورت خالی بودن، نام دسته‌بندی استفاده خواهد شد.
              </p>
            </div>

            <Separator />

            {/* Image Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">تصویر دسته‌بندی</Label>
              {form.image ? (
                <div className="glass-card rounded-lg overflow-hidden border">
                  <div className="flex items-center gap-4 p-4">
                    <div className="size-16 rounded-md bg-muted/60 flex items-center justify-center text-3xl border shrink-0">
                      {form.image}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium truncate">{form.name || 'بدون نام'}</p>
                      <p className="text-xs text-muted-foreground">تصویر شاخص دسته‌بندی</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 shrink-0"
                      onClick={handleRemoveImage}
                    >
                      حذف تصویر
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSetImage}
                  className="w-full glass-card rounded-lg border-2 border-dashed border-border hover:border-cyan-400 dark:hover:border-cyan-600 p-8 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group"
                >
                  <div className="size-14 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/30 transition-colors">
                    <ImagePlus className="size-6 text-muted-foreground group-hover:text-cyan-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      انتخاب تصویر دسته‌بندی
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      تصویری برای دسته‌بندی انتخاب کنید یا آن را بکشید و رها کنید
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* ─── Sidebar (Left in RTL) ─── */}
        <aside className="flex-[3] shrink-0 w-full max-w-sm">
          <ScrollArea className="h-[calc(100vh-57px)]">
            <div className="p-4 space-y-4">
              {/* ── Parent Category Card ── */}
              <div className="glass-card rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b">
                  <FolderOpen className="size-4 text-cyan-500" />
                  <h3 className="text-sm font-medium text-foreground">دسته‌بندی والد</h3>
                </div>
                <div className="p-4 space-y-3">
                  <Select
                    value={form.parentId ?? 'none'}
                    onValueChange={handleParentChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="بدون دسته‌بندی والد">
                        {selectedParentName ?? 'بدون والد (دسته‌بندی اصلی)'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون والد (دسته‌بندی اصلی)</SelectItem>
                      <SelectItem value="__separator_root" disabled>
                        ───── دسته‌بندی‌های اصلی ─────
                      </SelectItem>
                      {rootCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <FolderOpen className="size-3.5 text-muted-foreground" />
                            {cat.name}
                          </span>
                        </SelectItem>
                      ))}
                      {childCategories.length > 0 && (
                        <>
                          <SelectItem value="__separator_child" disabled>
                            ───── زیردسته‌ها ─────
                          </SelectItem>
                          {childCategories.map((cat) => {
                            const parentName = allCategories.find((p) => p.id === cat.parentId)?.name
                            return (
                              <SelectItem key={cat.id} value={cat.id}>
                                <span className="flex items-center gap-2">
                                  <span className="text-muted-foreground">└</span>
                                  {cat.name}
                                  <span className="text-xs text-muted-foreground">
                                    ({parentName})
                                  </span>
                                </span>
                              </SelectItem>
                            )
                          })}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    دسته‌بندی‌های والد برای سازماندهی سلسله‌مراتبی استفاده می‌شوند.
                  </p>
                </div>
              </div>

              {/* ── Info Card ── */}
              <div className="glass-card rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b">
                  <Info className="size-4 text-cyan-500" />
                  <h3 className="text-sm font-medium text-foreground">اطلاعات</h3>
                </div>
                <div className="p-4 space-y-3">
                  {editingCategory && (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">شناسه</span>
                        <span className="font-mono text-xs" dir="ltr">
                          {editingCategory.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">تعداد محصولات</span>
                        <Badge variant="secondary" className="text-xs">
                          {editingCategory.productCount} محصول
                        </Badge>
                      </div>
                    </div>
                  )}
                  {!editingCategory && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      دسته‌بندی‌ها به شما کمک می‌کنند محصولات فروشگاه خود را سازماندهی کنید.
                      هر دسته‌بندی می‌تواند دارای زیردسته‌بندی باشد.
                    </p>
                  )}
                </div>
              </div>

              {/* ── Quick Actions Card ── */}
              <div className="glass-card rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b">
                  <Zap className="size-4 text-amber-500" />
                  <h3 className="text-sm font-medium text-foreground">عملیات سریع</h3>
                </div>
                <div className="p-4 space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm justify-start gap-2 hover:bg-muted/60"
                    onClick={handlePreview}
                  >
                    <Eye className="size-4 text-muted-foreground" />
                    مشاهده دسته‌بندی
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm justify-start gap-2 hover:bg-muted/60"
                    onClick={handleSetImage}
                  >
                    <ImagePlus className="size-4 text-muted-foreground" />
                    تغییر تصویر
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm justify-start gap-2 hover:bg-muted/60"
                    onClick={handleCopySlug}
                  >
                    <Copy className="size-4 text-muted-foreground" />
                    کپی پیوند یکتا
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  )
}
