'use client'

import { useState, useMemo } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  X,
  ChevronDown,
  Package,
  DollarSign,
  Truck,
  Link2,
  Layers,
  Tag,
  FolderOpen,
  Calendar,
  ImagePlus,
  Trash2,
  Plus,
  GripVertical,
  Check,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import RichTextEditor from './RichTextEditor'
import { cn } from '@/lib/utils'

// =============================================================================
// Local Product Type
// =============================================================================

interface Product {
  id: string
  name: string
  slug: string
  shortDesc: string
  fullDesc: string
  price: number
  salePrice: number
  sku: string
  stock: number
  minStock: number
  category: string
  tags: string[]
  image: string
  gallery: string[]
  status: 'active' | 'inactive' | 'draft'
  weight: number
  dimensions: string
  createdAt: string
}

// =============================================================================
// Props Interface
// =============================================================================

interface WooCommerceProductEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingProduct: Product | null
  form: Omit<Product, 'id' | 'createdAt'>
  onFormChange: (form: Omit<Product, 'id' | 'createdAt'>) => void
  onSave: () => void
  categories: string[]
  allTags?: string[]
}

// =============================================================================
// Attribute Row Type
// =============================================================================

interface AttributeRow {
  name: string
  value: string
  visible: boolean
}

// =============================================================================
// Linked Product Type
// =============================================================================

interface LinkedProductOption {
  id: string
  name: string
  emoji: string
}

// =============================================================================
// Helper: Persian Digits
// =============================================================================

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)])
}

// =============================================================================
// Collapsible Sidebar Card
// =============================================================================

function SidebarCard({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-t-lg border border-b-0 bg-gradient-to-l from-rose-50/60 to-transparent dark:from-rose-950/20 dark:to-transparent hover:from-rose-50/80 dark:hover:from-rose-950/30 transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon className="h-4 w-4 text-rose-500" />
            {title}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 border rounded-b-lg space-y-3 bg-background">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function WooCommerceProductEditor({
  open,
  onOpenChange,
  editingProduct,
  form,
  onFormChange,
  onSave,
  categories,
  allTags = [],
}: WooCommerceProductEditorProps) {
  // ── Local State ──
  const [attributes, setAttributes] = useState<AttributeRow[]>([
    { name: 'رنگ', value: '', visible: true },
  ])
  const [scheduleSaleOpen, setScheduleSaleOpen] = useState(false)
  const [upsellsOpen, setUpsellsOpen] = useState(false)
  const [crossSellsOpen, setCrossSellsOpen] = useState(false)
  const [manageStock, setManageStock] = useState(form.stock > 0)
  const [tagInput, setTagInput] = useState('')
  const [saleStartDate, setSaleStartDate] = useState('')
  const [saleEndDate, setSaleEndDate] = useState('')

  // Sample linked products for demonstration
  const sampleLinkedProducts: LinkedProductOption[] = [
    { id: 'lp1', name: 'لپ‌تاپ ایسوس زنف‌بوک ۱۴', emoji: '💻' },
    { id: 'lp2', name: 'گوشی سامسونگ گلکسی S24', emoji: '📱' },
    { id: 'lp3', name: 'هدفون سونی WH-1000XM5', emoji: '🎧' },
    { id: 'lp4', name: 'کیف لپ‌تاپ چرمی', emoji: '👜' },
    { id: 'lp5', name: 'محافظ صفحه نمایش', emoji: '🛡️' },
  ]

  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([])
  const [selectedCrossSells, setSelectedCrossSells] = useState<string[]>([])

  // ── Computed Values ──
  const discountPercent = useMemo(() => {
    if (form.price > 0 && form.salePrice > 0 && form.salePrice < form.price) {
      return Math.round(((form.price - form.salePrice) / form.price) * 100)
    }
    return 0
  }, [form.price, form.salePrice])

  const stockStatus = useMemo(() => {
    if (!manageStock) return 'instock'
    if (form.stock <= 0) return 'outofstock'
    if (form.stock <= form.minStock) return 'onbackorder'
    return 'instock'
  }, [manageStock, form.stock, form.minStock])

  // ── Form Updaters ──
  const updateField = <K extends keyof Omit<Product, 'id' | 'createdAt'>>(
    key: K,
    value: Omit<Product, 'id' | 'createdAt'>[K]
  ) => {
    onFormChange({ ...form, [key]: value })
  }

  const updateDimension = (key: 'weight' | 'dimensions', value: string | number) => {
    onFormChange({ ...form, [key]: value })
  }

  // Parse dimensions string into parts
  const parseDimensions = (dimStr: string): { length: string; width: string; height: string } => {
    if (!dimStr) return { length: '', width: '', height: '' }
    const parts = dimStr.split('×').map((s) => s.trim())
    return {
      length: parts[0] || '',
      width: parts[1] || '',
      height: parts[2] || '',
    }
  }

  const setDimensionPart = (part: 'length' | 'width' | 'height', value: string) => {
    const current = parseDimensions(form.dimensions)
    const updated = { ...current, [part]: value }
    const dimStr = [updated.length, updated.width, updated.height]
      .filter(Boolean)
      .join(' × ')
    onFormChange({ ...form, dimensions: dimStr })
  }

  // ── Tag Management ──
  const addTag = () => {
    const trimmed = tagInput.trim()
    if (!trimmed) return
    if (form.tags.includes(trimmed)) {
      toast.error('این برچسب قبلاً اضافه شده است')
      return
    }
    updateField('tags', [...form.tags, trimmed])
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    updateField(
      'tags',
      form.tags.filter((t) => t !== tag)
    )
  }

  // ── Attribute Management ──
  const addAttribute = () => {
    setAttributes([...attributes, { name: '', value: '', visible: true }])
  }

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const updateAttribute = (
    index: number,
    field: keyof AttributeRow,
    value: string | boolean
  ) => {
    const updated = [...attributes]
    updated[index] = { ...updated[index], [field]: value }
    setAttributes(updated)
  }

  // ── Linked Products ──
  const toggleUpsell = (id: string) => {
    setSelectedUpsells((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const toggleCrossSell = (id: string) => {
    setSelectedCrossSells((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  // ── Gallery Management ──
  const addGalleryItem = () => {
    const emojis = ['🖼️', '📸', '🖼️', '🖼️', '🖼️']
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
    updateField('gallery', [...form.gallery, randomEmoji])
    toast.success('تصویر جدید به گالری اضافه شد')
  }

  const removeGalleryItem = (index: number) => {
    updateField(
      'gallery',
      form.gallery.filter((_, i) => i !== index)
    )
  }

  // ── Handle Save ──
  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('لطفاً نام محصول را وارد کنید')
      return
    }
    onSave()
  }

  const handleDraftSave = () => {
    updateField('status', 'draft')
    onSave()
  }

  // ── Stock Status Labels ──
  const stockStatusLabel: Record<string, { text: string; className: string }> = {
    instock: {
      text: 'موجود',
      className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    outofstock: {
      text: 'ناموجود',
      className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    },
    onbackorder: {
      text: 'موجودی محدود',
      className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
  }

  const currentDim = parseDimensions(form.dimensions)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-5xl w-full p-0 overflow-hidden"
        dir="rtl"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-l from-rose-50/60 to-transparent dark:from-rose-950/20 dark:to-transparent">
          <SheetTitle className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-rose-500" />
              {editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}
            </span>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  form.status === 'active'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : form.status === 'draft'
                      ? 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'border-gray-300 bg-gray-50 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300'
                }
              >
                {form.status === 'active'
                  ? 'فعال'
                  : form.status === 'draft'
                    ? 'پیش‌نویس'
                    : 'غیرفعال'}
              </Badge>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* ── Body: Two Column Layout ── */}
        <div className="flex h-[calc(100vh-65px)] overflow-hidden">
          {/* ── Left Column (Main Content) ── */}
          <ScrollArea className="flex-1 p-6" dir="rtl">
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Product Title */}
              <div>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="نام محصول را وارد کنید"
                  className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 focus:ring-0 p-0"
                  dir="rtl"
                />
                <Separator className="mt-2" />
              </div>

              {/* Product Data Tabs */}
              <Tabs defaultValue="general" dir="rtl" className="w-full">
                <TabsList className="w-full grid grid-cols-5 mb-4 h-auto p-1 bg-muted/50 rounded-lg">
                  <TabsTrigger
                    value="general"
                    className="flex items-center gap-1.5 text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    عمومی
                  </TabsTrigger>
                  <TabsTrigger
                    value="inventory"
                    className="flex items-center gap-1.5 text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <Package className="h-3.5 w-3.5" />
                    موجودی
                  </TabsTrigger>
                  <TabsTrigger
                    value="shipping"
                    className="flex items-center gap-1.5 text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <Truck className="h-3.5 w-3.5" />
                    ارسال
                  </TabsTrigger>
                  <TabsTrigger
                    value="linked"
                    className="flex items-center gap-1.5 text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    پیوندها
                  </TabsTrigger>
                  <TabsTrigger
                    value="attributes"
                    className="flex items-center gap-1.5 text-xs py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    ویژگی‌ها
                  </TabsTrigger>
                </TabsList>

                {/* ── Tab: General ── */}
                <TabsContent value="general" className="glass-card rounded-lg p-5 space-y-5">
                  {/* Regular Price */}
                  <div className="space-y-2">
                    <Label htmlFor="regular-price" className="text-sm font-medium">
                      قیمت منظم
                    </Label>
                    <div className="relative">
                      <Input
                        id="regular-price"
                        type="number"
                        min="0"
                        value={form.price || ''}
                        onChange={(e) => updateField('price', Number(e.target.value))}
                        placeholder="0"
                        className="pl-16 text-left"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        تومان
                      </span>
                    </div>
                  </div>

                  {/* Sale Price */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sale-price" className="text-sm font-medium">
                        قیمت حراجی
                      </Label>
                      {discountPercent > 0 && (
                        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                          <Check className="h-3 w-3 ml-1" />
                          {toPersianDigits(discountPercent)}٪ تخفیف
                        </Badge>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="sale-price"
                        type="number"
                        min="0"
                        value={form.salePrice || ''}
                        onChange={(e) => updateField('salePrice', Number(e.target.value))}
                        placeholder="0"
                        className="pl-16 text-left"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        تومان
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Schedule Sale */}
                  <Collapsible open={scheduleSaleOpen} onOpenChange={setScheduleSaleOpen}>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                      >
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">برنامه‌ریزی تخفیف</span>
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 mr-auto transition-transform duration-200',
                            scheduleSaleOpen && 'rotate-180'
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-2 gap-4 mt-4 p-4 rounded-lg border bg-muted/30">
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">تاریخ شروع</Label>
                          <Input
                            type="date"
                            value={saleStartDate}
                            onChange={(e) => setSaleStartDate(e.target.value)}
                            className="text-sm"
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">تاریخ پایان</Label>
                          <Input
                            type="date"
                            value={saleEndDate}
                            onChange={(e) => setSaleEndDate(e.target.value)}
                            className="text-sm"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </TabsContent>

                {/* ── Tab: Inventory ── */}
                <TabsContent value="inventory" className="glass-card rounded-lg p-5 space-y-5">
                  {/* Manage Stock Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">مدیریت موجودی</Label>
                      <p className="text-xs text-muted-foreground">موجودی را به صورت دستی مدیریت کنید</p>
                    </div>
                    <Switch
                      checked={manageStock}
                      onCheckedChange={(checked) => setManageStock(checked)}
                    />
                  </div>

                  {manageStock && (
                    <>
                      {/* SKU */}
                      <div className="space-y-2">
                        <Label htmlFor="sku" className="text-sm font-medium">
                          SKU (کد محصول)
                        </Label>
                        <Input
                          id="sku"
                          type="text"
                          value={form.sku}
                          onChange={(e) => updateField('sku', e.target.value)}
                          placeholder="مثال: PROD-001"
                          className="text-sm"
                          dir="ltr"
                        />
                        <p className="text-xs text-muted-foreground">
                          کد یکتای شناسایی محصول (اختیاری)
                        </p>
                      </div>

                      {/* Stock Quantity */}
                      <div className="space-y-2">
                        <Label htmlFor="stock-qty" className="text-sm font-medium">
                          تعداد موجودی
                        </Label>
                        <Input
                          id="stock-qty"
                          type="number"
                          min="0"
                          value={form.stock || ''}
                          onChange={(e) => updateField('stock', Number(e.target.value))}
                          placeholder="0"
                          className="text-sm"
                          dir="ltr"
                        />
                      </div>

                      {/* Low Stock Threshold */}
                      <div className="space-y-2">
                        <Label htmlFor="min-stock" className="text-sm font-medium">
                          آستانه موجودی کم
                        </Label>
                        <Input
                          id="min-stock"
                          type="number"
                          min="0"
                          value={form.minStock || ''}
                          onChange={(e) => updateField('minStock', Number(e.target.value))}
                          placeholder="5"
                          className="text-sm"
                          dir="ltr"
                        />
                        <p className="text-xs text-muted-foreground">
                          هنگامی که موجودی به این مقدار برسد، هشدار نمایش داده می‌شود
                        </p>
                      </div>
                    </>
                  )}

                  {/* Stock Status Display */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">وضعیت موجودی</Label>
                    <div className="flex items-center gap-3">
                      <Select
                        value={stockStatus}
                        onValueChange={(val) => {
                          if (val === 'outofstock') updateField('stock', 0)
                        }}
                      >
                        <SelectTrigger className="w-full text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instock">موجود</SelectItem>
                          <SelectItem value="outofstock">ناموجود</SelectItem>
                          <SelectItem value="onbackorder">موجودی محدود (پیش‌سفارش)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', stockStatusLabel[stockStatus]?.className)}
                    >
                      {stockStatusLabel[stockStatus]?.text}
                    </Badge>
                  </div>
                </TabsContent>

                {/* ── Tab: Shipping ── */}
                <TabsContent value="shipping" className="glass-card rounded-lg p-5 space-y-5">
                  {/* Weight */}
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium">
                      وزن
                    </Label>
                    <div className="relative">
                      <Input
                        id="weight"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.weight || ''}
                        onChange={(e) => updateDimension('weight', Number(e.target.value))}
                        placeholder="0"
                        className="pl-14 text-left"
                        dir="ltr"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        kg
                      </span>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">ابعاد (طول × عرض × ارتفاع)</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground block">طول (cm)</span>
                        <Input
                          type="text"
                          value={currentDim.length}
                          onChange={(e) => setDimensionPart('length', e.target.value)}
                          placeholder="0"
                          className="text-sm text-center"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground block">عرض (cm)</span>
                        <Input
                          type="text"
                          value={currentDim.width}
                          onChange={(e) => setDimensionPart('width', e.target.value)}
                          placeholder="0"
                          className="text-sm text-center"
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground block">ارتفاع (cm)</span>
                        <Input
                          type="text"
                          value={currentDim.height}
                          onChange={(e) => setDimensionPart('height', e.target.value)}
                          placeholder="0"
                          className="text-sm text-center"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Shipping Class */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">کلاس ارسال</Label>
                    <Select>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder="بدون کلاس ارسال" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون کلاس ارسال</SelectItem>
                        <SelectItem value="standard">ارسال عادی</SelectItem>
                        <SelectItem value="express">ارسال سریع</SelectItem>
                        <SelectItem value="free">ارسال رایگان</SelectItem>
                        <SelectItem value="heavy">بار سنگین</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      کلاس ارسال می‌تواند بر هزینه ارسال تأثیر بگذارد
                    </p>
                  </div>
                </TabsContent>

                {/* ── Tab: Linked Products ── */}
                <TabsContent value="linked" className="space-y-4">
                  {/* Up-sells */}
                  <div className="glass-card rounded-lg overflow-hidden">
                    <Collapsible open={upsellsOpen} onOpenChange={setUpsellsOpen}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-l from-violet-50/60 to-transparent dark:from-violet-950/20 dark:to-transparent hover:from-violet-50/80 dark:hover:from-violet-950/30 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <TrendingUp className="h-4 w-4 text-violet-500" />
                            محصولات مرتبط (Up-sells)
                            {selectedUpsells.length > 0 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5">
                                {toPersianDigits(selectedUpsells.length)}
                              </Badge>
                            )}
                          </span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform duration-200',
                              upsellsOpen && 'rotate-180'
                            )}
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 space-y-2">
                          <p className="text-xs text-muted-foreground mb-3">
                            محصولاتی که می‌خواهید به جای محصول فعلی به مشتری پیشنهاد دهید
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sampleLinkedProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => toggleUpsell(product.id)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all duration-200',
                                  selectedUpsells.includes(product.id)
                                    ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-700 shadow-sm'
                                    : 'bg-background text-muted-foreground border-border hover:border-violet-300 dark:hover:border-violet-700 hover:text-foreground'
                                )}
                              >
                                <span>{product.emoji}</span>
                                <span>{product.name}</span>
                                {selectedUpsells.includes(product.id) && (
                                  <Check className="h-3 w-3" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* Cross-sells */}
                  <div className="glass-card rounded-lg overflow-hidden">
                    <Collapsible open={crossSellsOpen} onOpenChange={setCrossSellsOpen}>
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center justify-between w-full px-4 py-3 bg-gradient-to-l from-cyan-50/60 to-transparent dark:from-cyan-950/20 dark:to-transparent hover:from-cyan-50/80 dark:hover:from-cyan-950/30 transition-colors"
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Package className="h-4 w-4 text-cyan-500" />
                            محصولات مکمل (Cross-sells)
                            {selectedCrossSells.length > 0 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5">
                                {toPersianDigits(selectedCrossSells.length)}
                              </Badge>
                            )}
                          </span>
                          <ChevronDown
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform duration-200',
                              crossSellsOpen && 'rotate-180'
                            )}
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 space-y-2">
                          <p className="text-xs text-muted-foreground mb-3">
                            محصولاتی که همراه با محصول فعلی به مشتری پیشنهاد داده می‌شوند
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sampleLinkedProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => toggleCrossSell(product.id)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all duration-200',
                                  selectedCrossSells.includes(product.id)
                                    ? 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 shadow-sm'
                                    : 'bg-background text-muted-foreground border-border hover:border-cyan-300 dark:hover:border-cyan-700 hover:text-foreground'
                                )}
                              >
                                <span>{product.emoji}</span>
                                <span>{product.name}</span>
                                {selectedCrossSells.includes(product.id) && (
                                  <Check className="h-3 w-3" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </TabsContent>

                {/* ── Tab: Attributes ── */}
                <TabsContent value="attributes" className="glass-card rounded-lg p-5 space-y-4">
                  <div className="space-y-3">
                    {attributes.map((attr, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 rounded-lg border bg-muted/20 group"
                      >
                        <GripVertical className="h-4 w-4 mt-2.5 text-muted-foreground/50 cursor-grab shrink-0" />
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground">نام ویژگی</span>
                            <Input
                              type="text"
                              value={attr.name}
                              onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                              placeholder="مثال: رنگ"
                              className="text-sm h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground">مقدار</span>
                            <Input
                              type="text"
                              value={attr.value}
                              onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                              placeholder="مثال: قرمز, آبی, سبز"
                              className="text-sm h-9"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 mt-2">
                          <Checkbox
                            checked={attr.visible}
                            onCheckedChange={(checked) =>
                              updateAttribute(index, 'visible', !!checked)
                            }
                            aria-label="نمایش عمومی"
                            className="scale-75"
                          />
                          <span className="text-[9px] text-muted-foreground">عمومی</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttribute(index)}
                          className="mt-2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                          aria-label="حذف ویژگی"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAttribute}
                    className="w-full border-dashed text-xs text-muted-foreground hover:text-foreground hover:border-rose-300 dark:hover:border-rose-700"
                  >
                    <Plus className="h-3.5 w-3.5 ml-1.5" />
                    افزودن ویژگی
                  </Button>
                </TabsContent>
              </Tabs>

              {/* ── Short Description ── */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  توضیح کوتاه
                </Label>
                <Textarea
                  value={form.shortDesc}
                  onChange={(e) => updateField('shortDesc', e.target.value)}
                  placeholder="توضیح کوتاه محصول را وارد کنید…"
                  rows={3}
                  className="text-sm resize-y min-h-[80px]"
                />
              </div>

              {/* ── Full Description ── */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  توضیحات کامل
                </Label>
                <RichTextEditor
                  value={form.fullDesc}
                  onChange={(val) => updateField('fullDesc', val)}
                  placeholder="توضیحات کامل محصول را بنویسید…"
                />
              </div>

              {/* Bottom padding for scroll */}
              <div className="h-8" />
            </div>
          </ScrollArea>

          {/* ── Right Column (Sidebar) ── */}
          <div className="w-[340px] shrink-0 border-r bg-muted/20 overflow-y-auto" dir="rtl">
            <div className="p-4 space-y-4">
              {/* ── Publish Card ── */}
              <SidebarCard title="انتشار" icon={Package}>
                <div className="space-y-3">
                  {/* Status Dropdown */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">وضعیت محصول</Label>
                    <Select
                      value={form.status}
                      onValueChange={(val) =>
                        updateField('status', val as 'active' | 'inactive' | 'draft')
                      }
                    >
                      <SelectTrigger className="w-full text-sm h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">فعال (انتشار یافته)</SelectItem>
                        <SelectItem value="draft">پیش‌نویس</SelectItem>
                        <SelectItem value="inactive">غیرفعال (خصوصی)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Catalog Visibility */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">نمایش در کاتالوگ</Label>
                    <RadioGroup
                      defaultValue="search"
                      className="space-y-2"
                      dir="rtl"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="search" id="vis-search" className="scale-90" />
                        <Label htmlFor="vis-search" className="text-xs font-normal cursor-pointer">
                          جستجو و نتایج
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="catalog" id="vis-catalog" className="scale-90" />
                        <Label htmlFor="vis-catalog" className="text-xs font-normal cursor-pointer">
                          فقط کاتالوگ
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="hidden" id="vis-hidden" className="scale-90" />
                        <Label htmlFor="vis-hidden" className="text-xs font-normal cursor-pointer">
                          مخفی
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-9 text-xs"
                      onClick={handleDraftSave}
                    >
                      ذخیره پیش‌نویس
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="w-full h-9 text-xs bg-gradient-to-l from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-sm transition-all hover:shadow-md"
                      onClick={handleSave}
                    >
                      <Check className="h-3.5 w-3.5 ml-1.5" />
                      انتشار
                    </Button>
                  </div>
                </div>
              </SidebarCard>

              {/* ── Product Image Card ── */}
              <SidebarCard title="تصویر محصول" icon={ImagePlus}>
                <div className="space-y-3">
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                      form.image
                        ? 'border-rose-300 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/10'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/40 bg-muted/20'
                    )}
                  >
                    {form.image ? (
                      <div className="text-center">
                        <span className="text-5xl block mb-2">{form.image}</span>
                        <p className="text-xs text-muted-foreground">تصویر شاخص محصول</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-4xl block mb-2 opacity-40">📷</span>
                        <p className="text-xs text-muted-foreground">تصویری انتخاب نشده است</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => toast.info('انتخاب تصویر محصول - در نسخه بعدی فعال می‌شود')}
                    >
                      <ImagePlus className="h-3.5 w-3.5 ml-1" />
                      تنظیم تصویر محصول
                    </Button>
                    {form.image && (
                      <button
                        type="button"
                        onClick={() => updateField('image', '')}
                        className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        حذف تصویر
                      </button>
                    )}
                  </div>
                </div>
              </SidebarCard>

              {/* ── Product Gallery Card ── */}
              <SidebarCard title="گالری محصول" icon={Layers}>
                <div className="space-y-3">
                  {form.gallery.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {form.gallery.map((item, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square rounded-lg border bg-muted/30 flex items-center justify-center"
                        >
                          <span className="text-2xl">{item}</span>
                          <button
                            type="button"
                            onClick={() => removeGalleryItem(index)}
                            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            aria-label="حذف تصویر"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      تصویری در گالری نیست
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs border-dashed"
                    onClick={addGalleryItem}
                  >
                    <Plus className="h-3.5 w-3.5 ml-1" />
                    افزودن تصاویر گالری
                  </Button>
                </div>
              </SidebarCard>

              {/* ── Categories Card ── */}
              <SidebarCard title="دسته‌بندی" icon={FolderOpen}>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      دسته‌بندی موجود نیست
                    </p>
                  ) : (
                    categories.map((cat) => (
                      <label
                        key={cat}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors text-sm',
                          form.category === cat
                            ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'hover:bg-muted/50 text-foreground'
                        )}
                      >
                        <Checkbox
                          checked={form.category === cat}
                          onCheckedChange={(checked) => {
                            if (checked) updateField('category', cat)
                          }}
                          className={cn(
                            'scale-90',
                            form.category === cat && 'data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500'
                          )}
                        />
                        <span className="text-xs">{cat}</span>
                      </label>
                    ))
                  )}
                </div>
              </SidebarCard>

              {/* ── Tags Card ── */}
              <SidebarCard title="برچسب‌ها" icon={Tag}>
                <div className="space-y-3">
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[11px] px-2 py-0.5 gap-1 hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer group"
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <X className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                      placeholder="برچسب جدید…"
                      className="flex-1 text-xs h-8"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 shrink-0"
                      onClick={addTag}
                      disabled={!tagInput.trim()}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {allTags.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">برچسب‌های پرکاربرد:</p>
                      <div className="flex flex-wrap gap-1">
                        {allTags.slice(0, 6).map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (!form.tags.includes(tag)) {
                                updateField('tags', [...form.tags, tag])
                              }
                            }}
                            className="text-[10px] text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SidebarCard>

              {/* ── Product Type Card ── */}
              <SidebarCard title="نوع محصول" icon={Package}>
                <RadioGroup
                  defaultValue="simple"
                  className="space-y-2"
                  dir="rtl"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="simple" id="type-simple" className="scale-90" />
                    <Label htmlFor="type-simple" className="text-xs font-normal cursor-pointer flex-1">
                      محصول ساده
                    </Label>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      فعال
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <RadioGroupItem value="variable" id="type-variable" className="scale-90" disabled />
                    <Label htmlFor="type-variable" className="text-xs font-normal cursor-not-allowed flex-1">
                      متغیر
                    </Label>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      به زودی
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <RadioGroupItem value="grouped" id="type-grouped" className="scale-90" disabled />
                    <Label htmlFor="type-grouped" className="text-xs font-normal cursor-not-allowed flex-1">
                      گروهی
                    </Label>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      به زودی
                    </Badge>
                  </div>
                </RadioGroup>
              </SidebarCard>

              {/* Bottom spacing */}
              <div className="h-4" />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// =============================================================================
// Re-export for convenience
// =============================================================================

export type { WooCommerceProductEditorProps, Product }
