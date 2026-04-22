'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ShoppingCart, Plus, Pencil, Trash2, Search, Package, DollarSign,
  ShoppingBag, TrendingUp, Star, Filter,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
  status: 'active' | 'inactive' | 'draft'
  description: string
  image: string
  rating: number
  sales: number
}

// ─── Labels ─────────────────────────────────────────────────────────────────

const labels = {
  title: 'فروشگاه',
  subtitle: 'مدیریت کاتالوگ محصولات و موجودی',
  addProduct: 'افزودن محصول',
  editProduct: 'ویرایش محصول',
  delete: 'حذف محصول',
  deleteConfirm: 'آیا مطمئن هستید؟',
  deleteDesc: 'این عمل قابل بازگشت نیست.',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو در محصولات...',
  noResults: 'محصولی یافت نشد',
  noProducts: 'هنوز محصولی ثبت نشده است',
  productName: 'نام محصول',
  price: 'قیمت (تومان)',
  category: 'دسته‌بندی',
  stock: 'تعداد موجودی',
  status: 'وضعیت',
  description: 'توضیحات',
  toman: 'تومان',
  actions: 'عملیات',
  all: 'همه',
}

const statusLabels: Record<string, string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  draft: 'پیش‌نویس',
}

const categoryLabels: Record<string, string> = {
  digital: 'دیجیتال',
  clothing: 'پوشاک',
  food: 'مواد غذایی',
  home: 'خانه و آشپزخانه',
}

const categoryGradients: Record<string, string> = {
  digital: 'from-violet-500 to-purple-600',
  clothing: 'from-pink-500 to-rose-600',
  food: 'from-emerald-500 to-green-600',
  home: 'from-amber-500 to-orange-600',
}

const categoryIcons: Record<string, string> = '💻'

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  inactive: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-700 dark:text-gray-300' },
  draft: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
}

// ─── Persian digit converter ────────────────────────────────────────────────

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, d => persianDigits[parseInt(d)])
}

function formatPrice(price: number): string {
  return toPersianDigits(price.toLocaleString())
}

// ─── Sample data ────────────────────────────────────────────────────────────

const initialProducts: Product[] = [
  { id: '1', name: 'لپ‌تاپ ایسوس زنف‌بوک', price: 45000000, category: 'digital', stock: 25, status: 'active', description: 'لپ‌تاپ سبک و قدرتمند با پردازنده نسل ۱۳ اینتل', image: '💻', rating: 4.5, sales: 128 },
  { id: '2', name: 'گوشی سامسونگ گلکسی S24', price: 38000000, category: 'digital', stock: 40, status: 'active', description: 'گوشی پرچمدار سامسونگ با دوربین ۲۰۰ مگاپیکسل', image: '📱', rating: 4.8, sales: 256 },
  { id: '3', name: 'هدفون سونی WH-1000XM5', price: 12000000, category: 'digital', stock: 15, status: 'active', description: 'هدفون بی‌سیم با قابلیت نویزکنسلینگ', image: '🎧', rating: 4.7, sales: 89 },
  { id: '4', name: 'پیراهن مردانه کلاسیک', price: 850000, category: 'clothing', stock: 120, status: 'active', description: 'پیراهن رسمی با پارچه نخی درجه یک', image: '👔', rating: 4.2, sales: 340 },
  { id: '5', name: 'کفش ورزشی نایکی ایرمکس', price: 4200000, category: 'clothing', stock: 60, status: 'active', description: 'کفش ورزشی راحت برای استفاده روزانه', image: '👟', rating: 4.6, sales: 195 },
  { id: '6', name: 'عسل طبیعی کوهستان', price: 350000, category: 'food', stock: 200, status: 'active', description: 'عسل خالص و طبیعی از دامنه‌های زاگرس', image: '🍯', rating: 4.9, sales: 520 },
  { id: '7', name: 'چای سبز ارگانیک', price: 180000, category: 'food', stock: 0, status: 'inactive', description: 'چای سبز پرکیفیت از باغ‌های لاهیجان', image: '🍵', rating: 4.3, sales: 410 },
  { id: '8', name: 'ست آشپزخانه ۱۲ پارچه', price: 2800000, category: 'home', stock: 35, status: 'active', description: 'ست قابلمه و تابه با روکش سرامیکی', image: '🍳', rating: 4.4, sales: 75 },
  { id: '9', name: 'مبل ال شکل مدرن', price: 32000000, category: 'home', stock: 8, status: 'active', description: 'مبل راحتی ال شکل با پارچه ضد لک', image: '🛋️', rating: 4.1, sales: 23 },
  { id: '10', name: 'تبلت اپل آیپد ایر', price: 28000000, category: 'digital', stock: 0, status: 'draft', description: 'تبلت اپل با صفحه نمایش ۱۰.۹ اینچی', image: '📱', rating: 4.7, sales: 0 },
  { id: '11', name: 'مانتو زنانه بهاره', price: 1200000, category: 'clothing', stock: 80, status: 'active', description: 'مانتو شیک با طرح گلدوزی دستی', image: '👗', rating: 4.5, sales: 167 },
  { id: '12', name: 'زعفران نگین سرگل', price: 950000, category: 'food', stock: 150, status: 'active', description: 'زعفران درجه یک قائنات', image: '🌸', rating: 5.0, sales: 890 },
]

const emptyProduct: Omit<Product, 'id'> = {
  name: '', price: 0, category: 'digital', stock: 0,
  status: 'draft', description: '', image: '📦', rating: 0, sales: 0,
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<Omit<Product, 'id'>>(emptyProduct)

  const activeCount = products.filter(p => p.status === 'active').length
  const todayOrders = 23
  const todayRevenue = 12500000

  const filtered = products.filter(p => {
    const matchSearch = p.name.includes(search) || p.description.includes(search)
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchSearch && matchCategory
  })

  const categories = ['all', 'digital', 'clothing', 'food', 'home']

  const openCreate = () => {
    setEditingProduct(null)
    setForm(emptyProduct)
    setDialogOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name, price: product.price, category: product.category,
      stock: product.stock, status: product.status, description: product.description,
      image: product.image, rating: product.rating, sales: product.sales,
    })
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    toast.success('محصول با موفقیت حذف شد')
  }

  const handleSave = () => {
    if (!form.name) return
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...form } : p))
      toast.success('اطلاعات محصول بروزرسانی شد')
    } else {
      const newProduct: Product = {
        ...form, id: Date.now().toString(),
      }
      setProducts(prev => [...prev, newProduct])
      toast.success('محصول جدید ایجاد شد')
    }
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{labels.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />{labels.addProduct}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md shadow-pink-500/25 shrink-0">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">کل محصولات</p>
              <p className="text-2xl font-bold tabular-nums text-pink-600 dark:text-pink-400">{toPersianDigits(products.length)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">محصولات فعال</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{toPersianDigits(activeCount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">سفارشات امروز</p>
              <p className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{toPersianDigits(todayOrders)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">درآمد امروز</p>
              <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">{toPersianDigits('۱۲.۵M')} تومان</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card-pink shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
            </div>
          </div>
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => {
              const isActive = categoryFilter === cat
              const label = cat === 'all' ? 'همه' : categoryLabels[cat]
              const count = cat === 'all' ? products.length : products.filter(p => p.category === cat).length
              const grad = cat === 'all'
                ? 'from-gray-500 to-gray-600'
                : categoryGradients[cat]
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`
                    px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${isActive
                      ? `bg-gradient-to-r ${grad} text-white shadow-md hover:scale-[1.03] active:scale-[0.97]`
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  {label} ({toPersianDigits(count)})
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <Card className="glass-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-200 dark:from-pink-900/20 dark:to-rose-800/20 flex items-center justify-center mb-4">
              <ShoppingCart className="h-10 w-10 text-pink-300" />
            </div>
            <p className="text-base font-medium">{search ? labels.noResults : labels.noProducts}</p>
            <p className="text-sm mt-1 opacity-60">محصول جدیدی ایجاد کنید</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product, idx) => {
            const grad = categoryGradients[product.category] ?? 'from-gray-400 to-gray-500'
            const sc = statusColors[product.status] ?? statusColors.draft
            const isOutOfStock = product.stock === 0
            return (
              <Card
                key={product.id}
                className="overflow-hidden group hover-lift shine-effect shadow-sm hover:shadow-xl transition-all duration-300 animate-in border-0"
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
              >
                {/* Image area with gradient overlay */}
                <div className={`relative h-40 bg-gradient-to-br ${grad} flex items-center justify-center overflow-hidden`}>
                  <span className="text-5xl group-hover:scale-110 transition-transform duration-500 drop-shadow-lg">
                    {product.image}
                  </span>
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {/* Status badge */}
                  <Badge className={`absolute top-3 right-3 ${sc.bg} ${sc.text} border-0 text-[10px] shadow-sm backdrop-blur-sm`}>
                    {statusLabels[product.status]}
                  </Badge>
                  {/* Stock badge */}
                  {isOutOfStock && (
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white border-0 text-[10px] shadow-sm animate-pulse">
                      ناموجود
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  {/* Category */}
                  <Badge variant="outline" className="text-[10px] border-current/20 text-muted-foreground">
                    {categoryLabels[product.category]}
                  </Badge>
                  {/* Name */}
                  <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground mr-1">{toPersianDigits(product.rating)}</span>
                  </div>
                  {/* Price + Stock */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <div>
                      <p className="text-lg font-bold text-pink-600 dark:text-pink-400 tabular-nums">
                        {formatPrice(product.price)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{labels.toman}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium tabular-nums">
                        {toPersianDigits(product.stock)} عدد
                      </p>
                      <p className={`text-[10px] ${isOutOfStock ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {isOutOfStock ? 'ناموجود' : 'موجودی'}
                      </p>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-8 text-xs hover:scale-[1.03] active:scale-[0.97] transition-all duration-200" onClick={() => openEdit(product)}>
                      <Pencil className="h-3 w-3" />ویرایش
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-pink-700 dark:text-pink-300">
              {editingProduct ? labels.editProduct : labels.addProduct}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'اطلاعات محصول را ویرایش کنید' : 'اطلاعات محصول جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{labels.productName}</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.price}</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: Number(e.target.value) })}
                  dir="ltr"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>{labels.category}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">{categoryLabels.digital}</SelectItem>
                    <SelectItem value="clothing">{categoryLabels.clothing}</SelectItem>
                    <SelectItem value="food">{categoryLabels.food}</SelectItem>
                    <SelectItem value="home">{categoryLabels.home}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.stock}</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                  dir="ltr"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>{labels.status}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Product['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{statusLabels.active}</SelectItem>
                    <SelectItem value="inactive">{statusLabels.inactive}</SelectItem>
                    <SelectItem value="draft">{statusLabels.draft}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.description}</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSave} disabled={!form.name}>
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
