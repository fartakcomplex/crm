'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Warehouse, Search, Package, AlertTriangle, CheckCircle,
  XCircle, TrendingDown, Boxes, ArrowUpCircle, ArrowDownCircle,
  Plus, FileBarChart, Truck, ArrowDownToLine, ArrowUpFromLine,
  BarChart3, TrendingUp, DollarSign, Clock, Filter, Loader2,
  ShoppingBag, Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCMSData } from '@/components/cms/useCMSData'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type {
  InventoryItem as APIInventoryItem,
  InboundRecord as APIInboundRecord,
  OutboundRecord as APIOutboundRecord,
  Product,
  Order,
} from '@/components/cms/types'
import { formatRelativeTime } from '@/components/cms/types'

// ─── Display Types (derived from API data) ────────────────────────────────

interface DisplayInventoryItem {
  id: string
  productId: string
  name: string
  sku: string
  category: string
  stock: number
  minStock: number
  unitPrice: number
  cost: number
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  warehouse: string
  location: string
  lastRestocked: string | null
  product: Product | undefined
  inboundRecords: APIInboundRecord[]
  outboundRecords: APIOutboundRecord[]
}

interface DisplayInboundRecord {
  id: string
  date: string
  itemName: string
  quantity: number
  supplier: string
  unitCost: number
  reference: string
  createdAt: string
  status: 'received' | 'pending'
}

interface DisplayOutboundRecord {
  id: string
  date: string
  itemName: string
  quantity: number
  destination: string
  reference: string
  orderNumber: string | null
  customerName: string | null
  createdAt: string
  status: 'shipped' | 'pending'
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
  search: 'جستجو...',
  noResults: 'قلمی یافت نشد',
  noData: 'داده‌ای موجود نیست. ابتدا محصول و انبار ثبت کنید.',
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
  productInfo: 'اطلاعات محصول',
  costBasis: 'قیمت تمام‌شده',
  salePrice: 'قیمت فروش',
  tabs: {
    inventory: 'موجودی',
    inbound: 'ورودی‌ها',
    outbound: 'خروجی‌ها',
    reports: 'گزارش‌ها',
  },
  inboundTab: {
    title: 'ورودی‌ها',
    subtitle: 'ثبت و پیگیری محموله‌های ورودی',
    date: 'تاریخ',
    itemName: 'نام کالا',
    quantity: 'تعداد',
    supplier: 'تأمین‌کننده',
    unitCost: 'قیمت واحد',
    reference: 'شماره مرجع',
    status: 'وضعیت',
    received: 'دریافت شده',
    pending: 'در انتظار',
    search: 'جستجو در ورودی‌ها...',
    allStatuses: 'همه وضعیت‌ها',
  },
  outboundTab: {
    title: 'خروجی‌ها',
    subtitle: 'ثبت و پیگیری ارسال‌های خروجی',
    date: 'تاریخ',
    itemName: 'نام کالا',
    quantity: 'تعداد',
    destination: 'مقصد / مشتری',
    reference: 'شماره مرجع',
    orderRef: 'سفارش',
    status: 'وضعیت',
    shipped: 'ارسال شده',
    pending: 'در انتظار',
    search: 'جستجو در خروجی‌ها...',
    allStatuses: 'همه وضعیت‌ها',
  },
  reportsTab: {
    title: 'گزارش‌ها',
    subtitle: 'تحلیل و آمار موجودی انبار',
    categoryDistribution: 'توزیع ارزش موجودی بر اساس دسته‌بندی',
    lowStockItems: 'اقلام کم‌موجود و ناموجود',
    totalValue: 'ارزش کل موجودی',
    totalCostValue: 'ارزش تمام‌شده',
    totalItems: 'تعداد کل اقلام',
    totalCategories: 'تعداد دسته‌بندی‌ها',
    stockTurnover: 'نرخ گردش موجودی',
    avgStockPerItem: 'میانگین موجودی هر قلم',
  },
  newItem: {
    title: 'افزودن قلم جدید',
    subtitle: 'اطلاعات کالای جدید را وارد کنید',
  },
  quickEdit: {
    title: 'تعدیل سریع موجودی',
    placeholder: 'موجودی جدید',
  },
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

const categoryColors: Record<string, { bar: string; bg: string; text: string; icon: string }> = {
  electronics: { bar: 'from-sky-400 to-blue-500', bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', icon: 'text-sky-500' },
  clothing: { bar: 'from-violet-400 to-purple-500', bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300', icon: 'text-violet-500' },
  food: { bar: 'from-emerald-400 to-green-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: 'text-emerald-500' },
  home: { bar: 'from-amber-400 to-orange-500', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-500' },
  stationery: { bar: 'from-cyan-400 to-teal-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', icon: 'text-cyan-500' },
  tools: { bar: 'from-rose-400 to-pink-500', bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', icon: 'text-rose-500' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, d => persianDigits[parseInt(d)])
}

function getStockStatus(stock: number, minStock: number): 'in-stock' | 'low-stock' | 'out-of-stock' {
  if (stock <= 0) return 'out-of-stock'
  if (stock <= minStock) return 'low-stock'
  return 'in-stock'
}

function formatPrice(price: number): string {
  return toPersianDigits(price.toLocaleString())
}

function formatValue(value: number): string {
  if (value >= 1e9) return toPersianDigits((value / 1e9).toFixed(1)) + ' میلیارد'
  if (value >= 1e6) return toPersianDigits((value / 1e6).toFixed(1)) + ' میلیون'
  return toPersianDigits(value.toLocaleString())
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function InventoryPage() {
  // ── Shared CMS Data Layer ──
  const {
    inventory, products, orders,
    updateInventoryItem, createInventoryItem,
  } = useCMSData()
  useEnsureData(['inventory', 'products', 'orders'])

  // ── Local UI State ──
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adjustingItem, setAdjustingItem] = useState<DisplayInventoryItem | null>(null)
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add')
  const [adjustQty, setAdjustQty] = useState(0)
  const [activeTab, setActiveTab] = useState('inventory')

  // New item dialog state
  const [newItemOpen, setNewItemOpen] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', sku: '', category: '', stock: 0, minStock: 0, unitPrice: 0 })

  // Quick edit state
  const [quickEditId, setQuickEditId] = useState<string | null>(null)
  const [quickEditValue, setQuickEditValue] = useState<number>(0)

  // Inbound/Outbound filter states
  const [inboundSearch, setInboundSearch] = useState('')
  const [inboundStatusFilter, setInboundStatusFilter] = useState('all')
  const [outboundSearch, setOutboundSearch] = useState('')
  const [outboundStatusFilter, setOutboundStatusFilter] = useState('all')

  // ── Derive display data from API ─────────────────────────────────────────

  const rawItems = (inventory.data as APIInventoryItem[] | undefined) ?? []
  const rawProducts = (products.data as Product[] | undefined) ?? []
  const rawOrders = (orders.data as Order[] | undefined) ?? []

  // Build a product lookup by ID for quick access
  const productMap = useMemo(() => {
    const map = new Map<string, Product>()
    rawProducts.forEach(p => map.set(p.id, p))
    return map
  }, [rawProducts])

  // Build an order lookup by ID
  const orderMap = useMemo(() => {
    const map = new Map<string, Order>()
    rawOrders.forEach(o => map.set(o.id, o))
    return map
  }, [rawOrders])

  // Map API InventoryItems to display items with product info
  const items = useMemo<DisplayInventoryItem[]>(() => {
    return rawItems.map(apiItem => {
      const product = apiItem.product ?? productMap.get(apiItem.productId)
      const name = product?.name ?? 'محل حذف‌شده'
      const sku = product?.sku ?? '—'
      const category = product?.productCategory?.name ?? ''
      const cost = product?.cost ?? 0
      const unitPrice = product?.price ?? 0
      const status = getStockStatus(apiItem.stock, apiItem.minStock)
      return {
        id: apiItem.id,
        productId: apiItem.productId,
        name,
        sku,
        category,
        stock: apiItem.stock,
        minStock: apiItem.minStock,
        unitPrice,
        cost,
        status,
        warehouse: apiItem.warehouse ?? '',
        location: apiItem.location ?? '',
        lastRestocked: apiItem.lastRestocked,
        product,
        inboundRecords: apiItem.inboundRecords ?? [],
        outboundRecords: apiItem.outboundRecords ?? [],
      }
    })
  }, [rawItems, productMap])

  // Flatten all inbound records across items
  const inboundRecords = useMemo<DisplayInboundRecord[]>(() => {
    const records: DisplayInboundRecord[] = []
    items.forEach(item => {
      item.inboundRecords.forEach(rec => {
        records.push({
          id: rec.id,
          date: rec.createdAt,
          itemName: item.name,
          quantity: rec.quantity,
          supplier: rec.supplier || '—',
          unitCost: rec.unitCost || 0,
          reference: rec.reference || '—',
          createdAt: rec.createdAt,
          status: 'received' as const,
        })
      })
    })
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [items])

  // Flatten all outbound records across items with order references
  const outboundRecords = useMemo<DisplayOutboundRecord[]>(() => {
    const records: DisplayOutboundRecord[] = []
    items.forEach(item => {
      item.outboundRecords.forEach(rec => {
        const order = rec.order ?? (rec.orderId ? orderMap.get(rec.orderId) : undefined)
        records.push({
          id: rec.id,
          date: rec.createdAt,
          itemName: item.name,
          quantity: rec.quantity,
          destination: order?.customer?.name
            ? `مشتری: ${order.customer.name}`
            : rec.notes || '—',
          reference: rec.reference || '—',
          orderNumber: order?.orderNumber ?? null,
          customerName: order?.customer?.name ?? null,
          createdAt: rec.createdAt,
          status: 'shipped' as const,
        })
      })
    })
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [items, orderMap])

  // ─── Computed Values ───────────────────────────────────────────────────

  const inStockCount = items.filter(i => i.status === 'in-stock').length
  const lowStockCount = items.filter(i => i.status === 'low-stock').length
  const outOfStockCount = items.filter(i => i.status === 'out-of-stock').length

  // Inventory valuation: use product.cost (cost basis) when available, fallback to unitPrice
  const totalInventoryValue = items.reduce((sum, i) => sum + i.stock * (i.cost || i.unitPrice), 0)
  const totalStockUnits = items.reduce((sum, i) => sum + i.stock, 0)

  const filtered = items.filter(i => {
    const matchSearch = i.name.includes(search) || i.sku.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || i.category === categoryFilter
    return matchSearch && matchCategory
  })

  // Category distribution for reports
  const categoryDistribution = useMemo(() => {
    const map: Record<string, { count: number; value: number; stock: number }> = {}
    items.forEach(item => {
      const cat = item.category || 'سایر'
      if (!map[cat]) {
        map[cat] = { count: 0, value: 0, stock: 0 }
      }
      map[cat].count++
      map[cat].value += item.stock * (item.cost || item.unitPrice)
      map[cat].stock += item.stock
    })
    return Object.entries(map)
      .map(([key, val]) => ({ category: key, ...val }))
      .sort((a, b) => b.value - a.value)
  }, [items])

  const maxCategoryValue = Math.max(...categoryDistribution.map(c => c.value), 1)

  // Inbound/Outbound filtered
  const filteredInbound = inboundRecords.filter(r => {
    const matchSearch = r.itemName.includes(inboundSearch) || r.supplier.includes(inboundSearch) || r.reference.includes(inboundSearch)
    const matchStatus = inboundStatusFilter === 'all' || r.status === inboundStatusFilter
    return matchSearch && matchStatus
  })

  const filteredOutbound = outboundRecords.filter(r => {
    const matchSearch = r.itemName.includes(outboundSearch) || r.destination.includes(outboundSearch) || r.reference.includes(outboundSearch) || (r.orderNumber ?? '').includes(outboundSearch)
    const matchStatus = outboundStatusFilter === 'all' || r.status === outboundStatusFilter
    return matchSearch && matchStatus
  })

  // ─── Handlers ──────────────────────────────────────────────────────────

  const openAdjust = (item: DisplayInventoryItem) => {
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

    updateInventoryItem.mutate(
      { id: adjustingItem.id, stock: newStock },
      {
        onSuccess: () => {
          const action = adjustType === 'add' ? 'افزوده' : 'کاهش'
          toast.success(`${toPersianDigits(adjustQty)} عدد ${action} شد`)
          setDialogOpen(false)
        },
        onError: () => {
          toast.error('خطا در بروزرسانی موجودی')
        },
      },
    )
  }

  const openQuickEdit = (item: DisplayInventoryItem) => {
    setQuickEditId(item.id)
    setQuickEditValue(item.stock)
  }

  const saveQuickEdit = (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (!item) return
    const newStock = Math.max(0, quickEditValue)
    updateInventoryItem.mutate(
      { id: itemId, stock: newStock },
      {
        onSuccess: () => {
          setQuickEditId(null)
          toast.success(`موجودی ${item.name} به ${toPersianDigits(newStock)} تغییر کرد`)
        },
        onError: () => {
          toast.error('خطا در بروزرسانی موجودی')
        },
      },
    )
  }

  const handleAddItem = () => {
    if (!newItem.name.trim() || !newItem.sku.trim()) {
      toast.error('نام و SKU الزامی است')
      return
    }
    createInventoryItem.mutate(
      {
        productId: newItem.name,
        stock: newItem.stock,
        minStock: newItem.minStock || 5,
        warehouse: 'main',
      },
      {
        onSuccess: () => {
          setNewItemOpen(false)
          setNewItem({ name: '', sku: '', category: '', stock: 0, minStock: 0, unitPrice: 0 })
          toast.success(`«${newItem.name}» با موفقیت اضافه شد`)
        },
        onError: () => {
          toast.error('خطا در ایجاد قلم جدید. ابتدا محصول مرتبط را ثبت کنید.')
        },
      },
    )
  }

  const getStockPercentage = (item: DisplayInventoryItem) => {
    if (item.minStock <= 0) return 100
    return Math.min(100, Math.round((item.stock / (item.minStock * 3)) * 100))
  }

  const getStockBarColor = (item: DisplayInventoryItem) => {
    if (item.status === 'out-of-stock') return 'from-red-400 to-red-500'
    if (item.status === 'low-stock') return 'from-amber-400 to-amber-500'
    return 'from-emerald-400 to-green-500'
  }

  // ─── Loading State ─────────────────────────────────────────────────────

  if (inventory.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
          <p className="text-sm text-muted-foreground">در حال بارگذاری داده‌های انبار...</p>
        </div>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{labels.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        {items.length > 0 && (
          <Badge variant="outline" className="text-xs gap-1.5 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-400">
            <Package className="h-3 w-3" />
            {toPersianDigits(items.length)} قلم انبار
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass-card-sky h-auto p-1 flex-wrap gap-1 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30">
          <TabsTrigger
            value="inventory"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-blue-500 data-[state=active]:text-white gap-2 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <Package className="h-4 w-4" />
            <span>{labels.tabs.inventory}</span>
          </TabsTrigger>
          <TabsTrigger
            value="inbound"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-blue-500 data-[state=active]:text-white gap-2 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <ArrowDownToLine className="h-4 w-4" />
            <span>{labels.tabs.inbound}</span>
            {inboundRecords.length > 0 && (
              <Badge className="h-5 min-w-[20px] flex items-center justify-center px-1 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border-0 text-[10px]">
                {toPersianDigits(inboundRecords.length)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="outbound"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-blue-500 data-[state=active]:text-white gap-2 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <ArrowUpFromLine className="h-4 w-4" />
            <span>{labels.tabs.outbound}</span>
            {outboundRecords.length > 0 && (
              <Badge className="h-5 min-w-[20px] flex items-center justify-center px-1 bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-0 text-[10px]">
                {toPersianDigits(outboundRecords.length)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-blue-500 data-[state=active]:text-white gap-2 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{labels.tabs.reports}</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: INVENTORY                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="inventory" className="space-y-6 animate-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          {items.length === 0 ? (
            <Card className="glass-card-sky shadow-sm">
              <CardContent className="p-12 flex flex-col items-center justify-center text-muted-foreground">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/20 dark:to-blue-800/20 flex items-center justify-center mb-4">
                  <Warehouse className="h-10 w-10 text-sky-300" />
                </div>
                <p className="text-base font-medium mb-1">{labels.noData}</p>
                <p className="text-xs text-muted-foreground">از ماژول فروشگاه، محصولات ثبت کنید تا انبار به‌صورت خودکار ایجاد شود.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
                <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated col-span-2 lg:col-span-1" style={{ animationDelay: '320ms', animationFillMode: 'both' }}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md shadow-green-500/25 shrink-0">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{labels.reportsTab.totalCostValue}</p>
                      <p className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400">{formatValue(totalInventoryValue)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Low stock alerts */}
              {(lowStockCount + outOfStockCount) > 0 && (
                <Card className="border-amber-300 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/10 shadow-sm animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
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

              {/* Category Distribution Mini-Bar Chart */}
              {categoryDistribution.length > 0 && (
                <Card className="glass-card-sky shadow-sm animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-sky-500" />
                      توزیع موجودی بر اساس دسته‌بندی
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {categoryDistribution.map((cat, idx) => {
                        const colors = categoryColors[cat.category] || { bar: 'from-gray-400 to-gray-500', bg: 'bg-gray-100', text: 'text-gray-700', icon: 'text-gray-500' }
                        const pct = Math.round((cat.value / maxCategoryValue) * 100)
                        return (
                          <div key={cat.category} className="animate-in" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className={`h-3 w-3 rounded-sm bg-gradient-to-r ${colors.bar}`} />
                                <span className={`text-sm font-medium ${colors.text}`}>{cat.category}</span>
                                <span className="text-xs text-muted-foreground">({toPersianDigits(cat.count)} قلم)</span>
                              </div>
                              <span className="text-sm font-bold tabular-nums">{formatValue(cat.value)}</span>
                            </div>
                            <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-1000`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Filters */}
              <Card className="glass-card-sky shadow-sm animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
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
                        {[...new Set(items.map(i => i.category).filter(Boolean))].map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      onClick={() => setNewItemOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">قلم جدید</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="glass-card-sky shadow-sm overflow-hidden animate-in" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
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
                            <TableHead className="hidden sm:table-cell">{labels.costBasis}</TableHead>
                            <TableHead>{labels.status}</TableHead>
                            <TableHead>{labels.actions}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((item, idx) => {
                            const sc = stockLevelConfig[item.status]
                            const isEditing = quickEditId === item.id
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
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm truncate">{item.name}</p>
                                      {/* Cross-module: Show product sale price */}
                                      {item.product?.salePrice != null && item.product.salePrice > 0 && item.product.salePrice < item.product.price && (
                                        <p className="text-xs text-rose-500 tabular-nums">
                                          <ShoppingBag className="h-3 w-3 inline ml-0.5" />
                                          تخفیف: {formatPrice(item.product.salePrice)}
                                        </p>
                                      )}
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
                                <TableCell className="hidden md:table-cell text-sm">
                                  {item.category ? (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Tag className="h-3 w-3" />
                                      {item.category}
                                    </Badge>
                                  ) : '—'}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={quickEditValue}
                                        onChange={e => setQuickEditValue(Number(e.target.value))}
                                        className="w-20 h-8 text-sm tabular-nums text-center"
                                        dir="ltr"
                                        autoFocus
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') saveQuickEdit(item.id)
                                          if (e.key === 'Escape') setQuickEditId(null)
                                        }}
                                      />
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500 hover:text-emerald-600" onClick={() => saveQuickEdit(item.id)}>
                                        <CheckCircle className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setQuickEditId(null)}>
                                        <XCircle className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <button
                                      className="flex items-center gap-2 group cursor-pointer hover:bg-muted/50 px-2 py-1 rounded-md transition-colors"
                                      onClick={() => openQuickEdit(item)}
                                      title={labels.quickEdit.title}
                                    >
                                      <span className={`font-bold tabular-nums text-sm ${item.status === 'out-of-stock' ? 'text-red-600 dark:text-red-400' : item.status === 'low-stock' ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                                        {toPersianDigits(item.stock)}
                                      </span>
                                      {item.status === 'low-stock' && (
                                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                                      )}
                                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground">
                                        ✎
                                      </span>
                                    </button>
                                  )}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground tabular-nums">{toPersianDigits(item.minStock)}</TableCell>
                                <TableCell className="hidden sm:table-cell text-sm font-medium tabular-nums">{formatPrice(item.cost || item.unitPrice)}</TableCell>
                                <TableCell>
                                  <Badge className={`${sc.bg} ${sc.text} border-0 gap-1.5 shadow-sm`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                    {statusLabels[item.status]}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-sky-500 hover:text-sky-600 hover:bg-sky-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={() => openAdjust(item)} title={labels.adjust}>
                                      <ArrowUpCircle className="h-4 w-4" />
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
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: INBOUND                                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="inbound" className="space-y-6 animate-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0">
                  <ArrowDownToLine className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">کل ورودی‌ها</p>
                  <p className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">{toPersianDigits(inboundRecords.length)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">دریافت شده</p>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{toPersianDigits(inboundRecords.filter(r => r.status === 'received').length)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">در انتظار</p>
                  <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{toPersianDigits(inboundRecords.filter(r => r.status === 'pending').length)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
                  <Boxes className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">کل تعداد ورودی</p>
                  <p className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{toPersianDigits(inboundRecords.reduce((s, r) => s + r.quantity, 0))}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="glass-card-sky shadow-sm animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={labels.inboundTab.search} value={inboundSearch} onChange={e => setInboundSearch(e.target.value)} className="pr-10" />
                </div>
                <Select value={inboundStatusFilter} onValueChange={setInboundStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{labels.inboundTab.allStatuses}</SelectItem>
                    <SelectItem value="received">{labels.inboundTab.received}</SelectItem>
                    <SelectItem value="pending">{labels.inboundTab.pending}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inbound Table */}
          <Card className="glass-card-sky shadow-sm overflow-hidden animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <CardContent className="p-0">
              {inboundRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ArrowDownToLine className="h-10 w-10 mx-auto mb-2 text-sky-300" />
                  <p className="text-sm">هنوز رکورد ورودی ثبت نشده است.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{labels.inboundTab.date}</TableHead>
                        <TableHead>{labels.inboundTab.itemName}</TableHead>
                        <TableHead className="hidden sm:table-cell">{labels.inboundTab.quantity}</TableHead>
                        <TableHead className="hidden md:table-cell">{labels.inboundTab.supplier}</TableHead>
                        <TableHead className="hidden lg:table-cell">{labels.inboundTab.unitCost}</TableHead>
                        <TableHead className="hidden lg:table-cell" dir="ltr">{labels.inboundTab.reference}</TableHead>
                        <TableHead>{labels.inboundTab.status}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInbound.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                            <ArrowDownToLine className="h-10 w-10 mx-auto mb-2 text-sky-300" />
                            <p>{labels.noResults}</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInbound.map((record, idx) => (
                          <TableRow
                            key={record.id}
                            className="hover-lift transition-all duration-200 animate-in"
                            style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                          >
                            <TableCell className="text-sm tabular-nums">
                              <span className="block">{formatRelativeTime(record.date)}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-800/30 flex items-center justify-center shrink-0">
                                  <Package className="h-4 w-4 text-sky-500" />
                                </div>
                                <span className="font-medium text-sm">{record.itemName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell font-bold tabular-nums text-sky-600 dark:text-sky-400">+{toPersianDigits(record.quantity)}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{record.supplier}</TableCell>
                            <TableCell className="hidden lg:table-cell text-sm tabular-nums">{record.unitCost > 0 ? formatPrice(record.unitCost) : '—'}</TableCell>
                            <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground" dir="ltr">{record.reference}</TableCell>
                            <TableCell>
                              <Badge className={record.status === 'received'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 gap-1.5 shadow-sm'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0 gap-1.5 shadow-sm'
                              }>
                                <span className={`h-1.5 w-1.5 rounded-full ${record.status === 'received' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {record.status === 'received' ? labels.inboundTab.received : labels.inboundTab.pending}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: OUTBOUND                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="outbound" className="space-y-6 animate-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
                  <ArrowUpFromLine className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">کل خروجی‌ها</p>
                  <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{toPersianDigits(outboundRecords.length)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">ارسال شده</p>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{toPersianDigits(outboundRecords.filter(r => r.status === 'shipped').length)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">در انتظار</p>
                  <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{toPersianDigits(outboundRecords.filter(r => r.status === 'pending').length)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                  <TrendingDown className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">کل تعداد خروجی</p>
                  <p className="text-2xl font-bold tabular-nums text-orange-600 dark:text-orange-400">{toPersianDigits(outboundRecords.reduce((s, r) => s + r.quantity, 0))}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="glass-card-sky shadow-sm animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={labels.outboundTab.search} value={outboundSearch} onChange={e => setOutboundSearch(e.target.value)} className="pr-10" />
                </div>
                <Select value={outboundStatusFilter} onValueChange={setOutboundStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{labels.outboundTab.allStatuses}</SelectItem>
                    <SelectItem value="shipped">{labels.outboundTab.shipped}</SelectItem>
                    <SelectItem value="pending">{labels.outboundTab.pending}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Outbound Table */}
          <Card className="glass-card-sky shadow-sm overflow-hidden animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <CardContent className="p-0">
              {outboundRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ArrowUpFromLine className="h-10 w-10 mx-auto mb-2 text-rose-300" />
                  <p className="text-sm">هنوز رکورد خروجی ثبت نشده است.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{labels.outboundTab.date}</TableHead>
                        <TableHead>{labels.outboundTab.itemName}</TableHead>
                        <TableHead className="hidden sm:table-cell">{labels.outboundTab.quantity}</TableHead>
                        <TableHead className="hidden md:table-cell">{labels.outboundTab.destination}</TableHead>
                        <TableHead className="hidden lg:table-cell">{labels.outboundTab.orderRef}</TableHead>
                        <TableHead className="hidden lg:table-cell" dir="ltr">{labels.outboundTab.reference}</TableHead>
                        <TableHead>{labels.outboundTab.status}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOutbound.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                            <ArrowUpFromLine className="h-10 w-10 mx-auto mb-2 text-rose-300" />
                            <p>{labels.noResults}</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOutbound.map((record, idx) => (
                          <TableRow
                            key={record.id}
                            className="hover-lift transition-all duration-200 animate-in"
                            style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                          >
                            <TableCell className="text-sm tabular-nums">
                              <span className="block">{formatRelativeTime(record.date)}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-100 to-pink-200 dark:from-rose-900/30 dark:to-pink-800/30 flex items-center justify-center shrink-0">
                                  <Package className="h-4 w-4 text-rose-500" />
                                </div>
                                <span className="font-medium text-sm">{record.itemName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell font-bold tabular-nums text-rose-600 dark:text-rose-400">-{toPersianDigits(record.quantity)}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{record.destination}</TableCell>
                            {/* Cross-module: Show order reference */}
                            <TableCell className="hidden lg:table-cell">
                              {record.orderNumber ? (
                                <Badge variant="outline" className="text-xs gap-1 font-mono" dir="ltr">
                                  <ShoppingBag className="h-3 w-3" />
                                  {record.orderNumber}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground" dir="ltr">{record.reference}</TableCell>
                            <TableCell>
                              <Badge className={record.status === 'shipped'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 gap-1.5 shadow-sm'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0 gap-1.5 shadow-sm'
                              }>
                                <span className={`h-1.5 w-1.5 rounded-full ${record.status === 'shipped' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {record.status === 'shipped' ? labels.outboundTab.shipped : labels.outboundTab.pending}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: REPORTS                                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="reports" className="space-y-6 animate-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          {items.length === 0 ? (
            <Card className="glass-card-sky shadow-sm">
              <CardContent className="p-12 flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-10 w-10 mx-auto mb-2 text-sky-300" />
                <p className="text-sm">داده‌ای برای گزارش موجود نیست.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Top Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md shadow-green-500/25 shrink-0">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{labels.reportsTab.totalCostValue}</p>
                      <p className="text-xl font-bold tabular-nums text-green-600 dark:text-green-400">{formatValue(totalInventoryValue)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-md shadow-sky-500/25 shrink-0">
                      <Boxes className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{labels.reportsTab.totalItems}</p>
                      <p className="text-xl font-bold tabular-nums text-sky-600 dark:text-sky-400">{toPersianDigits(items.length)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{labels.reportsTab.totalCategories}</p>
                      <p className="text-xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{toPersianDigits(categoryDistribution.length)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift shadow-sm animate-in card-elevated" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{labels.reportsTab.avgStockPerItem}</p>
                      <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{toPersianDigits(Math.round(totalStockUnits / items.length))}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category-wise Stock Value (Horizontal Bars) */}
              {categoryDistribution.length > 0 && (
                <Card className="glass-card-sky shadow-sm animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileBarChart className="h-4 w-4 text-sky-500" />
                      {labels.reportsTab.categoryDistribution}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {categoryDistribution.map((cat, idx) => {
                        const colors = categoryColors[cat.category] || { bar: 'from-gray-400 to-gray-500', bg: 'bg-gray-100', text: 'text-gray-700', icon: 'text-gray-500' }
                        const pct = Math.round((cat.value / maxCategoryValue) * 100)
                        const totalValuePct = totalInventoryValue > 0 ? Math.round((cat.value / totalInventoryValue) * 100) : 0
                        return (
                          <div key={cat.category} className="animate-in" style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-3">
                                <span className={`h-4 w-4 rounded-md bg-gradient-to-br ${colors.bar} shadow-sm`} />
                                <span className={`text-sm font-semibold ${colors.text}`}>{cat.category}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">{toPersianDigits(cat.count)} قلم • {toPersianDigits(cat.stock)} عدد</span>
                                <span className="text-sm font-bold tabular-nums min-w-[80px] text-left">{formatValue(cat.value)}</span>
                                <span className="text-xs text-muted-foreground min-w-[30px] text-left">({toPersianDigits(totalValuePct)}٪)</span>
                              </div>
                            </div>
                            <div className="w-full h-5 bg-muted/40 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-1000 shadow-sm`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Two Column: Low Stock Items + Stock Turnover */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Low Stock Items */}
                <Card className="glass-card-sky shadow-sm animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      {labels.reportsTab.lowStockItems}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <ScrollArea className="max-h-80">
                      <div className="space-y-2">
                        {items
                          .filter(i => i.status === 'low-stock' || i.status === 'out-of-stock')
                          .sort((a, b) => a.stock - b.stock)
                          .map((item, idx) => {
                            const deficit = item.minStock - item.stock
                            return (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-sm animate-in"
                                style={{
                                  animationDelay: `${idx * 50}ms`,
                                  animationFillMode: 'both',
                                  borderColor: item.status === 'out-of-stock' ? 'var(--color-red-200)' : 'var(--color-amber-200)',
                                  backgroundColor: item.status === 'out-of-stock' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
                                }}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    item.status === 'out-of-stock'
                                      ? 'bg-red-100 dark:bg-red-900/30'
                                      : 'bg-amber-100 dark:bg-amber-900/30'
                                  }`}>
                                    {item.status === 'out-of-stock'
                                      ? <XCircle className="h-4 w-4 text-red-500" />
                                      : <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    }
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    {/* Cross-module: Show product category */}
                                    <p className="text-xs text-muted-foreground">{item.category || item.sku}</p>
                                  </div>
                                </div>
                                <div className="text-left shrink-0 mr-3">
                                  <p className={`text-sm font-bold tabular-nums ${item.status === 'out-of-stock' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {toPersianDigits(item.stock)} / {toPersianDigits(item.minStock)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    کمبود: {toPersianDigits(deficit)} عدد
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        {items.filter(i => i.status === 'low-stock' || i.status === 'out-of-stock').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                            <p className="text-sm">همه اقلام در سطح مطلوب هستند</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Stock Turnover Indicators */}
                <Card className="glass-card-sky shadow-sm animate-in" style={{ animationDelay: '280ms', animationFillMode: 'both' }}>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      شاخص‌های گردش موجودی
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Health Score */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/20 dark:to-sky-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">نمره سلامت انبار</span>
                        <span className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {toPersianDigits(Math.round((inStockCount / items.length) * 100))}٪
                        </span>
                      </div>
                      <div className="w-full h-3 bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-500 transition-all duration-1000"
                          style={{ width: `${(inStockCount / items.length) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {toPersianDigits(inStockCount)} از {toPersianDigits(items.length)} قلم در وضعیت مطلوب
                      </p>
                    </div>

                    {/* Category Breakdown */}
                    <div className="space-y-3">
                      {categoryDistribution.map((cat, idx) => {
                        const catItems = items.filter(i => i.category === cat.category)
                        const healthyCount = catItems.filter(i => i.status === 'in-stock').length
                        const healthPct = catItems.length > 0 ? Math.round((healthyCount / catItems.length) * 100) : 0
                        const colors = categoryColors[cat.category] || { bar: 'from-gray-400 to-gray-500', text: 'text-gray-700' }
                        return (
                          <div key={cat.category} className="animate-in" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${colors.text}`}>{cat.category}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">{toPersianDigits(healthPct)}٪ سالم</span>
                            </div>
                            <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-1000`}
                                style={{ width: `${healthPct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-muted/30 border text-center">
                        <p className="text-xs text-muted-foreground mb-1">بیشترین ارزش</p>
                        {categoryDistribution.length > 0 && (
                          <>
                            <p className="text-sm font-semibold">{categoryDistribution[0].category}</p>
                            <p className="text-xs tabular-nums text-sky-600 dark:text-sky-400">{formatValue(categoryDistribution[0].value)}</p>
                          </>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-muted/30 border text-center">
                        <p className="text-xs text-muted-foreground mb-1">کمترین ارزش</p>
                        {categoryDistribution.length > 0 && (
                          <>
                            <p className="text-sm font-semibold">{categoryDistribution[categoryDistribution.length - 1].category}</p>
                            <p className="text-xs tabular-nums text-sky-600 dark:text-sky-400">{formatValue(categoryDistribution[categoryDistribution.length - 1].value)}</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Cross-module: Total movements */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200/50 dark:border-sky-800/30 text-center">
                        <p className="text-xs text-muted-foreground mb-1">کل ورودی‌ها</p>
                        <p className="text-lg font-bold tabular-nums text-sky-600 dark:text-sky-400">{toPersianDigits(inboundRecords.length)}</p>
                        <p className="text-xs text-muted-foreground">{toPersianDigits(inboundRecords.reduce((s, r) => s + r.quantity, 0))} عدد</p>
                      </div>
                      <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/30 text-center">
                        <p className="text-xs text-muted-foreground mb-1">کل خروجی‌ها</p>
                        <p className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400">{toPersianDigits(outboundRecords.length)}</p>
                        <p className="text-xs text-muted-foreground">{toPersianDigits(outboundRecords.reduce((s, r) => s + r.quantity, 0))} عدد</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                             */}
      {/* ═════════════════════════════════════════════════════════════════════ */}

      {/* Stock Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sky-700 dark:text-sky-300">
              {labels.adjust}: {adjustingItem?.name}
            </DialogTitle>
            <DialogDescription>
              موجودی فعلی: {adjustingItem ? toPersianDigits(adjustingItem.stock) : '۰'} عدد
              {adjustingItem?.product?.sku && (
                <span className="block mt-1 text-xs">SKU: {adjustingItem.product.sku}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Cross-module: Show product details in dialog */}
            {adjustingItem?.product && (
              <div className="p-3 rounded-lg bg-muted/30 border space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">دسته‌بندی:</span>
                  <span className="font-medium">{adjustingItem.product.productCategory?.name || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">قیمت فروش:</span>
                  <span className="tabular-nums font-medium">{formatPrice(adjustingItem.product.price)} {labels.toman}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">قیمت تمام‌شده:</span>
                  <span className="tabular-nums font-medium">{formatPrice(adjustingItem.product.cost)} {labels.toman}</span>
                </div>
              </div>
            )}
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
              disabled={adjustQty <= 0 || updateInventoryItem.isPending}
            >
              {updateInventoryItem.isPending && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Item Dialog */}
      <Dialog open={newItemOpen} onOpenChange={setNewItemOpen}>
        <DialogContent className="max-w-md glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sky-700 dark:text-sky-300 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {labels.newItem.title}
            </DialogTitle>
            <DialogDescription>{labels.newItem.subtitle}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{labels.name}</Label>
              <Input
                value={newItem.name}
                onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="نام محصول (شناسه محصول)"
              />
            </div>
            <div className="space-y-2">
              <Label>{labels.sku}</Label>
              <Input
                value={newItem.sku}
                onChange={e => setNewItem(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="SKU-XX-000"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>{labels.stock}</Label>
                <Input
                  type="number"
                  min={0}
                  value={newItem.stock}
                  onChange={e => setNewItem(prev => ({ ...prev, stock: Number(e.target.value) }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{labels.minStock}</Label>
                <Input
                  type="number"
                  min={0}
                  value={newItem.minStock}
                  onChange={e => setNewItem(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{labels.unitPrice}</Label>
                <Input
                  type="number"
                  min={0}
                  value={newItem.unitPrice}
                  onChange={e => setNewItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                  dir="ltr"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 برای ایجاد اقلام انبار، ابتدا از ماژول فروشگاه یک محصول ثبت کنید.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewItemOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button
              className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white shadow-md shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              onClick={handleAddItem}
              disabled={!newItem.name.trim() || !newItem.sku.trim() || createInventoryItem.isPending}
            >
              {createInventoryItem.isPending && <Loader2 className="h-4 w-4 ml-1 animate-spin" />}
              <Plus className="h-4 w-4 ml-1" />
              {labels.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
