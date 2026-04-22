'use client'

import { useState, useCallback, type KeyboardEvent } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import RichTextEditor from './RichTextEditor'
import type { Post } from './types'
import {
  X,
  ChevronDown,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  Globe,
  ImagePlus,
  Tag,
  FolderOpen,
  Check,
  Edit3,
} from 'lucide-react'
import { toast } from 'sonner'

// =============================================================================
// Props
// =============================================================================

interface WordPressPostEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingPost: Post | null
  form: Partial<Post>
  onFormChange: (form: Partial<Post>) => void
  onSave: () => void
  categories: Array<{ id: string; name: string }>
  allTags?: string[]
}

// =============================================================================
// Helpers
// =============================================================================

const STATUS_MAP: Record<Post['status'], { label: string; variant: 'secondary' | 'default' | 'outline' }> = {
  draft: { label: 'پیش‌نویس', variant: 'secondary' },
  published: { label: 'منتشر شده', variant: 'default' },
  archived: { label: 'بایگانی', variant: 'outline' },
}

const EXCERPT_MAX_LENGTH = 200

function toPersianDate(dateStr: string | null): string {
  if (!dateStr) return 'بلافاصله پس از ذخیره'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\u06F0-\u06F9\u0600-\u06FFa-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// =============================================================================
// Sidebar Card — reusable wrapper
// =============================================================================

function SidebarCard({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="glass-card rounded-lg overflow-hidden">
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            {icon}
            <span>{title}</span>
          </div>
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function WordPressPostEditor({
  open,
  onOpenChange,
  editingPost,
  form,
  onFormChange,
  onSave,
  categories,
  allTags = [],
}: WordPressPostEditorProps) {
  // -----------------------------------------------------------------------
  // Local state
  // -----------------------------------------------------------------------
  const [editingSlug, setEditingSlug] = useState(false)
  const [tempSlug, setTempSlug] = useState(form.slug ?? '')
  const [tagInput, setTagInput] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private' | 'password'>('public')

  // Current tags as string array (form.tags may be Tag objects or strings)
  const currentTags: string[] = Array.isArray(form.tags)
    ? form.tags.map((t) => (typeof t === 'string' ? t : t.name))
    : []

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const updateField = useCallback(
    <K extends keyof Post>(key: K, value: Post[K]) => {
      onFormChange({ ...form, [key]: value })
    },
    [form, onFormChange],
  )

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value
      onFormChange({
        ...form,
        title: newTitle,
        slug: editingSlug ? form.slug : slugify(newTitle),
      })
      if (!editingSlug) {
        setTempSlug(slugify(newTitle))
      }
    },
    [form, onFormChange, editingSlug],
  )

  const handleSlugSave = useCallback(() => {
    onFormChange({ ...form, slug: tempSlug })
    setEditingSlug(false)
    toast.success('پیوند یکتا ذخیره شد')
  }, [form, onFormChange, tempSlug])

  const handleAddTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim()
      if (!trimmed || currentTags.includes(trimmed)) return
      const newTags = [...currentTags, trimmed]
      onFormChange({
        ...form,
        tags: newTags.map((name) => ({ id: name, name, slug: slugify(name) })),
      })
    },
    [currentTags, form, onFormChange],
  )

  const handleTagKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddTag(tagInput)
        setTagInput('')
      }
    },
    [handleAddTag, tagInput],
  )

  const handleRemoveTag = useCallback(
    (tagName: string) => {
      const newTags = currentTags.filter((t) => t !== tagName)
      onFormChange({
        ...form,
        tags: newTags.map((name) => ({ id: name, name, slug: slugify(name) })),
      })
    },
    [currentTags, form, onFormChange],
  )

  const handleSaveDraft = useCallback(() => {
    onFormChange({ ...form, status: 'draft' })
    onSave()
    toast.success('پیش‌نویس ذخیره شد')
  }, [form, onFormChange, onSave])

  const handlePublish = useCallback(() => {
    onFormChange({
      ...form,
      status: 'published',
      publishedAt: new Date().toISOString(),
    })
    onSave()
    toast.success('مطلب با موفقیت منتشر شد')
  }, [form, onFormChange, onSave])

  const handleCategoryChange = useCallback(
    (categoryId: string, checked: boolean) => {
      onFormChange({
        ...form,
        categoryId: checked ? categoryId : null,
      })
    },
    [form, onFormChange],
  )

  const handleSetFeaturedImage = useCallback(() => {
    toast.info('انتخاب تصویر شاخص — قابلیت به زودی فعال می‌شود')
  }, [])

  const handleRemoveFeaturedImage = useCallback(() => {
    toast.info('تصویر شاخص حذف شد')
  }, [])

  // -----------------------------------------------------------------------
  // Computed
  // -----------------------------------------------------------------------

  const isEditing = !!editingPost
  const pageTitle = isEditing ? 'ویرایش مطلب' : 'مطلب جدید'
  const excerptLength = (form.excerpt ?? '').length
  const statusInfo = STATUS_MAP[form.status ?? 'draft']

  // Popular tags — ones not already added
  const suggestedTags = allTags.filter((t) => !currentTags.includes(t)).slice(0, 8)

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        dir="rtl"
        className="sm:max-w-4xl w-full p-0 overflow-hidden"
      >
        {/* ── Header ── */}
        <SheetHeader className="flex-row items-center justify-between px-6 py-4 border-b shrink-0">
          <SheetTitle className="text-lg font-bold text-foreground">
            {pageTitle}
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
            <span className="sr-only">بستن</span>
          </Button>
        </SheetHeader>

        {/* ── Body: Two-Column Layout ── */}
        <div className="flex flex-1 min-h-0">
          {/* ─── Left (Main Content Area) ~70% ─── */}
          <ScrollArea className="flex-[7] border-l">
            <div className="p-6 space-y-5 max-w-none">
              {/* Title */}
              <div>
                <input
                  type="text"
                  value={form.title ?? ''}
                  onChange={handleTitleChange}
                  placeholder="عنوان مطلب را وارد کنید"
                  className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/40 py-2 leading-relaxed"
                />
              </div>

              {/* Permalink */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground whitespace-nowrap">
                  پیوند یکتا:
                </span>
                {editingSlug ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-muted-foreground text-xs" dir="ltr">
                      https://example.com/
                    </span>
                    <Input
                      value={tempSlug}
                      onChange={(e) => setTempSlug(e.target.value)}
                      className="h-7 text-xs flex-1 min-w-0"
                      dir="ltr"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSlugSave()
                        if (e.key === 'Escape') {
                          setTempSlug(form.slug ?? '')
                          setEditingSlug(false)
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
                      onClick={handleSlugSave}
                    >
                      <Check className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span
                      className="text-sm text-muted-foreground truncate"
                      dir="ltr"
                    >
                      https://example.com/{form.slug || '...'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => {
                        setTempSlug(form.slug ?? '')
                        setEditingSlug(true)
                      }}
                    >
                      <Edit3 className="size-3.5 ml-1" />
                      ویرایش
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Excerpt — Collapsible */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-full py-1">
                  <ChevronDown className="size-4" />
                  چکیده
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2 space-y-2">
                    <Textarea
                      value={form.excerpt ?? ''}
                      onChange={(e) => updateField('excerpt', e.target.value)}
                      placeholder="چکیده‌ای کوتاه از مطلب خود بنویسید…"
                      className="resize-none min-h-[60px] text-sm"
                      rows={2}
                      maxLength={EXCERPT_MAX_LENGTH}
                    />
                    <div className="text-xs text-muted-foreground text-left" dir="ltr">
                      {excerptLength}/{EXCERPT_MAX_LENGTH}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Content Editor */}
              <div>
                <Label className="text-sm font-medium text-foreground mb-2 block">
                  محتوا
                </Label>
                <RichTextEditor
                  value={form.content ?? ''}
                  onChange={(val) => updateField('content', val)}
                  placeholder="محتوای خود را بنویسید…"
                  className="min-h-[300px]"
                />
              </div>
            </div>
          </ScrollArea>

          {/* ─── Right (Sidebar) ~30% ─── */}
          <aside className="flex-[3] shrink-0">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4 sticky top-0">
                {/* ── Publish Card ── */}
                <SidebarCard
                  title="برنامه‌ریزی انتشار"
                  icon={<Calendar className="size-4 text-cyan-500" />}
                >
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      وضعیت
                    </Label>
                    <Badge variant={statusInfo.variant} className="text-xs">
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Visibility */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      دیدگاه
                    </Label>
                    <RadioGroup
                      value={visibility}
                      onValueChange={(val) =>
                        setVisibility(val as 'public' | 'private' | 'password')
                      }
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="public" id="vis-public" />
                        <Label
                          htmlFor="vis-public"
                          className="flex items-center gap-1.5 text-sm cursor-pointer font-normal"
                        >
                          <Globe className="size-3.5 text-muted-foreground" />
                          عمومی
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="private" id="vis-private" />
                        <Label
                          htmlFor="vis-private"
                          className="flex items-center gap-1.5 text-sm cursor-pointer font-normal"
                        >
                          <EyeOff className="size-3.5 text-muted-foreground" />
                          خصوصی
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="password" id="vis-password" />
                        <Label
                          htmlFor="vis-password"
                          className="flex items-center gap-1.5 text-sm cursor-pointer font-normal"
                        >
                          <Lock className="size-3.5 text-muted-foreground" />
                          رمزدار
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Password field — conditional */}
                  {visibility === 'password' && (
                    <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
                      <Input
                        type="password"
                        placeholder="رمز عبور مطلب…"
                        className="h-8 text-sm"
                        value={(form as Record<string, unknown>).password as string ?? ''}
                        onChange={(e) =>
                          onFormChange({
                            ...form,
                            password: e.target.value,
                          } as unknown as Partial<Post>)
                        }
                      />
                    </div>
                  )}

                  {/* Published date */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      تاریخ انتشار
                    </Label>
                    <div className="text-sm text-foreground flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {toPersianDate(form.publishedAt ?? null)}
                    </div>
                  </div>

                  <Separator />

                  {/* Action buttons */}
                  <div className="space-y-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-sm"
                      onClick={handleSaveDraft}
                    >
                      ذخیره پیش‌نویس
                    </Button>
                    <Button
                      size="sm"
                      className="w-full text-sm bg-gradient-to-l from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-sm"
                      onClick={handlePublish}
                    >
                      انتشار
                    </Button>
                  </div>
                </SidebarCard>

                {/* ── Categories Card ── */}
                <SidebarCard
                  title="دسته‌بندی"
                  icon={<FolderOpen className="size-4 text-cyan-500" />}
                >
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.length === 0 && (
                      <p className="text-xs text-muted-foreground py-2 text-center">
                        هیچ دسته‌بندی وجود ندارد
                      </p>
                    )}
                    {categories.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2.5 cursor-pointer rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors group"
                      >
                        <Checkbox
                          checked={form.categoryId === cat.id}
                          onCheckedChange={(checked) =>
                            handleCategoryChange(cat.id, !!checked)
                          }
                          className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                        />
                        <span
                          className={`text-sm transition-colors ${
                            form.categoryId === cat.id
                              ? 'text-cyan-600 dark:text-cyan-400 font-medium'
                              : 'text-foreground'
                          }`}
                        >
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors pt-1"
                  >
                    + افزودن دسته‌بندی جدید
                  </button>
                </SidebarCard>

                {/* ── Tags Card ── */}
                <SidebarCard
                  title="برچسب‌ها"
                  icon={<Tag className="size-4 text-cyan-500" />}
                >
                  {/* Current tags as badges */}
                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {currentTags.map((tagName) => (
                        <Badge
                          key={tagName}
                          variant="secondary"
                          className="text-xs gap-1 pr-1 pl-2 py-0.5 hover:bg-secondary/80 transition-colors"
                        >
                          {tagName}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tagName)}
                            className="hover:text-destructive transition-colors"
                            aria-label={`حذف برچسب ${tagName}`}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Add tag input */}
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="افزودن برچسب جدید…"
                    className="h-8 text-sm"
                  />

                  {/* Most used tags */}
                  {suggestedTags.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground font-medium">
                        محبوب‌ترین برچسب‌ها
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {suggestedTags.map((tagName) => (
                          <button
                            key={tagName}
                            type="button"
                            onClick={() => handleAddTag(tagName)}
                            className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
                          >
                            {tagName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </SidebarCard>

                {/* ── Featured Image Card ── */}
                <SidebarCard
                  title="تصویر شاخص"
                  icon={<ImagePlus className="size-4 text-cyan-500" />}
                >
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 flex flex-col items-center justify-center gap-3 min-h-[120px]">
                    <span className="text-4xl" role="img" aria-label="تصویر">
                      🖼️
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5"
                      onClick={handleSetFeaturedImage}
                    >
                      <ImagePlus className="size-3.5" />
                      تنظیم تصویر شاخص
                    </Button>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors pt-1 text-center w-full"
                    onClick={handleRemoveFeaturedImage}
                  >
                    حذف تصویر شاخص
                  </button>
                </SidebarCard>
              </div>
            </ScrollArea>
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  )
}
