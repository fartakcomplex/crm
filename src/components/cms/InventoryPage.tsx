'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Warehouse, Search, Package, AlertTriangle, CheckCircle,
  XCircle, TrendingDown, Boxes, ArrowUpCircle, ArrowDownCircle,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  minStock: number
  unitPrice: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
}

// ─── Labels ─────────────────────────────────────────────────────────────────

const labels = {
  title: 'انبار',
  subtitle: 'مدیریت موجودی کالاها و هشدارهای کمبود',
  adjust: 'تعدیل موجودی',
  add: 'افزودن',
  remove: 'کاهش',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو در اقلام...',
  noResults: 'قلمی یافت نشد',
  name: 'نام کالا',
  sku: 'SKU',
  category: 'دسته‌بندی',
  stock: 'موجودی',
  minStock: 'حداقل موجودی',
  unitPrice: 'قیمت واحد (تومان)',
  status: 'وضعیت',
  actions: 'عملیات',
  all: 'همه',
  adjustmentType: 'نوع تعدیل',
  quantity: 'تعداد',
  toman: 'تومان',
  lowStock: 'کم‌موجود',
  outOfStock: 'ناموجود',
}

const categoryLabels: Record<string, string> = {
  electronics: 'الکترونیک',
  clothing: 'پوشاک',
  food: 'مواد غذایی',
  home: 'خانه و آشپزخانه',
  stationery: 'لوازم‌التحریر',
  tools: 'ابزار و تجهیزات',
}

const statusLabels: Record<string, string> = {
  'in-stock': 'موجود',
  'low-stock': 'کم‌موجود',
  'out-of-stock': 'ناموجود',
}

const stockLevelConfig: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  'in-stock': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800/40' },
  'low-stock': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-200 dark:border-amber-800/40' },
  'out-of-stock': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', border: 'border-red-200 dark:border-red-800/40' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, d => persianDigits[parseInt(d)])
}

function getStatus(stock: number, minStock: number): InventoryItem['status'] {
  if (stock <= 0) return 'out-of-stock'
  if (stock <= minStock) return 'low-stock'
  return 'in-stock'
}

function formatPrice(price: number): string {
  return toPersianDigits(price.toLocaleString())
}

// ─── Sample data ────────────────────────────────────────────────────────────

const initialItems: InventoryItem[] = [
  { id: '1', name: 'لپ‌تاپ ایسوس زنف‌بوک', sku: 'SKU-EL-001', category: 'electronics', stock: 25, minStock: 10, unitPrice: 45000000, status: 'in-stock' },
  { id: '2', name: 'گوشی سامسونگ گلکسی S24', sku: 'SKU-EL-002', category: 'electronics', stock: 5, minStock: 10, unitPrice: 38000000, status: 'low-stock' },
  { id: '3', name: 'هدفون سونی WH-1000XM5', sku: 'SKU-EL-003', category: 'electronics', stock: 0, minStock: 5, unitPrice: 12000000, status: 'out-of-stock' },
  { id: '4', name: 'پیراهن مردانه کلاسیک', sku: 'SKU-CL-001', category: 'clothing', stock: 120, minStock: 30, unitPrice: 850000, status: 'in-stock' },
  { id: '5', name: 'کفش ورزشی نایکی', sku: 'SKU-CL-002', category: 'clothing', stock: 8, minStock: 15, unitPrice: 4200000, status: 'low-stock' },
  { id: '6', name: 'مانتو زنانه بهاره', sku: 'SKU-CL-003', category: 'clothing', stock: 0, minStock: 20, unitPrice: 1200000, status: 'out-of-stock' },
  { id: '7', name: 'عسل طبیعی کوهستان', sku: 'SKU-FD-001', category: 'food', stock: 200, minStock: 50, unitPrice: 350000, status: 'in-stock' },
  { id: '8', name: 'زعفران نگین سرگل', sku: 'SKU-FD-002', category: 'food', stock: 12, minStock: 20, unitPrice: 950000, status: 'low-stock' },
  { id: '9', name: 'چای سبز ارگانیک', sku: 'SKU-FD-003', category: 'food', stock: 0, minStock: 30, unitPrice: 180000, status: 'out-of-stock' },
  { id: '10', name: 'ست آشپزخانه ۱۲ پارچه', sku: 'SKU-HM-001', category: 'home', stock: 35, minStock: 10, unitPrice: 2800000, status: 'in-stock' },
  { id: '11', name: 'مبل ال شکل مدرن', sku: 'SKU-HM-002', category: 'home', stock: 3, minStock: 5, unitPrice: 32000000, status: 'low-stock' },
  { id: '12', name: 'دستگاه قهوه‌ساز دلونگی', sku: 'SKU-HM-003', category: 'home', stock: 18, minStock: 5, unitPrice: 8500000, status: 'in-stock' },
  { id: '13', name: 'کاغذ A4 کپی', sku: 'SKU-ST-001', category: 'stationery', stock: 500, minStock: 100, unitPrice: 85000, status: 'in-stock' },
  { id: '14', name: 'خودکار استدلر', sku: 'SKU-ST-002', category: 'stationery', stock: 0, minStock: 50, unitPrice: 25000, status: 'out-of-stock' },
  { id: '15', name: 'دریل بوش چکشی', sku: 'SKU-TL-001', category: 'tools', stock: 7, minStock: 3, unitPrice: 6500000, status: 'in-stock' },
  { id: '16', name: 'بکس ۴۵ تکه اینتکس', sku: 'SKU-TL-002', category: 'tools', stock: 2, minStock: 5, unitPrice: 3200000, status: 'low-stock' },
]

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null)
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add')
  const [adjustQty, setAdjustQty] = useState(0)

  const inStockCount = items.filter(i => i.status === 'in-stock').length
  const lowStockCount = items.filter(i => i.status === 'low-stock').length
  const outOfStockCount = items.filter(i => i.status === 'out-of-stock').length

  const filtered = items.filter(i => {
    const matchSearch = i.name.includes(search) || i.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || i.category === categoryFilter
    return matchSearch && matchCategory
  })

  const categories = ['all', ...new Set(items.map(i => i.category))]

  const openAdjust = (item: InventoryItem) => {
    setAdjustingItem(item)
    setAdjustType('add')
    setAdjustQty(0)
    setDialogOpen(true)
  }

  const handleAdjust = () => {
    if (!adjustingItem || adjustQty <= 0) return
    const newStock = adjustType === 'add'
      ? adjustingItem.stock + adjustQty
      : Math.max(0, adjustingItem.stock - adjustQty)

    setItems(prev => prev.map(i =>
      i.id === adjustingItem.id
        ? { ...i, stock: newStock, status: getStatus(newStock, i.minStock) }
        : i
    ))

    const action = adjustType === 'add' ? 'افزوده' : 'کاهش'
    toast.success(`${toPersianDigits(adjustQty)} عدد ${action} شد`)
    setDialogOpen(false)
  }

  const getStockPercentage = (item: InventoryItem) => {
    if (item.minStock <= 0) return 100
    return Math.min(100, Math.round((item.stock / (item.minStock * 3)) * 100))
  }

  const getStockBarColor = (item: InventoryItem) => {
    if (item.status === 'out-of-stock') return 'from-red-400 to-red-500'
    if (item.status === 'low-stock') return 'from-amber-400 to-amber-500'
    return 'from-emerald-400 to-green-500'
  }

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{labels.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0">
              <Boxes className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">کل اقلام</p>
              <p className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">{toPersianDigits(items.length)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">اقلام موجود</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{toPersianDigits(inStockCount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{labels.lowStock}</p>
              <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{toPersianDigits(lowStockCount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
              <XCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{labels.outOfStock}</p>
              <p className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">{toPersianDigits(outOfStockCount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alerts */}
      {lowStockCount > 0 && (
        <Card className="border-amber-300 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">هشدارهای کمبود موجودی</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {items.filter(i => i.status === 'low-stock' || i.status === 'out-of-stock').map(item => (
                <Badge key={item.id} variant="outline" className="text-xs gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${item.status === 'out-of-stock' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  {item.name} ({toPersianDigits(item.stock)}/{toPersianDigits(item.minStock)})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="glass-card-sky shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.all}</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card-sky shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/20 dark:to-blue-800/20 flex items-center justify-center mb-4">
                <Warehouse className="h-10 w-10 text-sky-300" />
              </div>
              <p className="text-base font-medium">{search ? labels.noResults : 'قلمی یافت نشد'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{labels.name}</TableHead>
                    <TableHead className="hidden sm:table-cell">{labels.sku}</TableHead>
                    <TableHead className="hidden md:table-cell">{labels.category}</TableHead>
                    <TableHead>{labels.stock}</TableHead>
                    <TableHead className="hidden lg:table-cell">{labels.minStock}</TableHead>
                    <TableHead className="hidden sm:table-cell">{labels.unitPrice}</TableHead>
                    <TableHead>{labels.status}</TableHead>
                    <TableHead>{labels.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item, idx) => {
                    const sc = stockLevelConfig[item.status]
                    return (
                      <TableRow
                        key={item.id}
                        className={`hover-lift transition-all duration-200 animate-in ${sc.border}`}
                        style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${item.status === 'out-of-stock' ? 'from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30' : item.status === 'low-stock' ? 'from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30' : 'from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-800/30'} flex items-center justify-center shrink-0`}>
                              <Package className={`h-4 w-4 ${item.status === 'out-of-stock' ? 'text-red-500' : item.status === 'low-stock' ? 'text-amber-500' : 'text-sky-500'}`} />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              {/* Stock level bar */}
                              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${getStockBarColor(item)} transition-all duration-700`}
                                  style={{ width: `${getStockPercentage(item)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground" dir="ltr">{item.sku}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{categoryLabels[item.category] ?? item.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold tabular-nums text-sm ${item.status === 'out-of-stock' ? 'text-red-600 dark:text-red-400' : item.status === 'low-stock' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                              {toPersianDigits(item.stock)}
                            </span>
                            {item.status === 'low-stock' && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground tabular-nums">{toPersianDigits(item.minStock)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm font-medium tabular-nums">{formatPrice(item.unitPrice)}</TableCell>
                        <TableCell>
                          <Badge className={`${sc.bg} ${sc.text} border-0 gap-1.5 shadow-sm`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                            {statusLabels[item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={() => openAdjust(item)} title={labels.adjust}>
                              {adjustType === 'add' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sky-700 dark:text-sky-300">
              {labels.adjust}: {adjustingItem?.name}
            </DialogTitle>
            <DialogDescription>
              موجودی فعلی: {adjustingItem ? toPersianDigits(adjustingItem.stock) : '۰'} عدد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{labels.adjustmentType}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={adjustType === 'add' ? 'default' : 'outline'}
                  className={adjustType === 'add' ? 'bg-gradient-to-r from-emerald-600 to-green-500 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200' : 'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200'}
                  onClick={() => setAdjustType('add')}
                >
                  <ArrowUpCircle className="h-4 w-4 ml-1" />
                  {labels.add}
                </Button>
                <Button
                  type="button"
                  variant={adjustType === 'remove' ? 'default' : 'outline'}
                  className={adjustType === 'remove' ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200' : 'hover:scale-[1.02] active:scale-[0.98] transition-all duration-200'}
                  onClick={() => setAdjustType('remove')}
                >
                  <ArrowDownCircle className="h-4 w-4 ml-1" />
                  {labels.remove}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.quantity}</Label>
              <Input
                type="number"
                min={1}
                value={adjustQty}
                onChange={e => setAdjustQty(Number(e.target.value))}
                dir="ltr"
              />
            </div>
            {/* Preview */}
            {adjustingItem && adjustQty > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">موجودی فعلی:</span>
                  <span className="tabular-nums font-medium">{toPersianDigits(adjustingItem.stock)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${adjustType === 'add' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {adjustType === 'add' ? '+' : '-'}{toPersianDigits(adjustQty)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-border/50 pt-1">
                  <span>موجودی جدید:</span>
                  <span className="tabular-nums text-sky-600 dark:text-sky-400">
                    {toPersianDigits(adjustType === 'add' ? adjustingItem.stock + adjustQty : Math.max(0, adjustingItem.stock - adjustQty))}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button
              className={`hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm ${adjustType === 'add' ? 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white' : 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white'}`}
              onClick={handleAdjust}
              disabled={adjustQty <= 0}
            >
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
