'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Package, ShoppingCart, FolderOpen, Tag, Settings,
  Plus, Pencil, Trash2, Search, CheckCircle, FileEdit,
  AlertTriangle, Clock, Loader2, Eye, X, Upload,
  Store, CreditCard, Truck, Percent, Coins,
  CheckSquare, Trash, MapPin, Phone, Mail,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Persian Helpers ──────────────────────────────────────────────────────────

function toPersianDigits(num: number | string): string {
  const pd = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, d => pd[parseInt(d)])
}

function formatPrice(price: number): string {
  return toPersianDigits(price.toLocaleString())
}

function relativeDate(daysAgo: number): string {
  if (daysAgo === 0) return 'امروز'
  if (daysAgo === 1) return 'دیروز'
  return `${toPersianDigits(daysAgo)} روز پیش`
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ProductStatus = 'published' | 'draft' | 'hidden'
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'

interface Product {
  id: string
  name: string
  slug: string
  sku: string
  price: number
  salePrice: number
  category: string
  tags: string[]
  stock: number
  maxStock: number
  status: ProductStatus
  description: string
  emoji: string
  date: string
}

interface OrderItem {
  name: string
  qty: number
  price: number
  emoji: string
}

interface Order {
  id: string
  number: string
  customer: string
  email: string
  phone: string
  address: string
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  status: OrderStatus
  date: string
  note: string
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  color: string
  productCount: number
  parent: string
}

interface StoreTag {
  id: string
  name: string
  count: number
}

// ─── Labels ──────────────────────────────────────────────────────────────────

const tabLabels = {
  products: 'محصولات',
  orders: 'سفارشات',
  categories: 'دسته‌بندی‌ها',
  tags: 'برچسب‌ها',
  settings: 'تنظیمات',
}

const productStatusLabel: Record<ProductStatus, string> = {
  published: 'منتشر شده',
  draft: 'پیش‌نویس',
  hidden: 'مخفی',
}

const orderStatusLabel: Record<OrderStatus, string> = {
  pending: 'در انتظار پرداخت',
  processing: 'درحال پردازش',
  shipped: 'ارسال شده',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
}

const productStatusColors: Record<ProductStatus, { bg: string; text: string }> = {
  published: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  draft: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  hidden: { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-600 dark:text-gray-400' },
}

const orderStatusColors: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  processing: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-300' },
  shipped: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
}

// ─── Sample Data ─────────────────────────────────────────────────────────────

const initialProducts: Product[] = [
  { id: '1', name: 'لپ‌تاپ ایسوس زنف‌بوک ۱۴', slug: 'asus-zenbook-14', sku: 'ASU-ZB14-001', price: 45000000, salePrice: 42500000, category: 'الکترونیک و دیجیتال', tags: ['ویژه تخفیف', 'پرفروش', 'گارانتی اصلی'], stock: 25, maxStock: 100, status: 'published', description: 'لپ‌تاپ سبک و قدرتمند با پردازنده نسل ۱۳ اینتل و حافظه ۱۶ گیگابایت', emoji: '💻', date: '2' },
  { id: '2', name: 'گوشی سامسونگ گلکسی S24', slug: 'samsung-galaxy-s24', sku: 'SAM-S24-002', price: 38000000, salePrice: 36000000, category: 'الکترونیک و دیجیتال', tags: ['محبوب', 'جدید', 'گارانتی اصلی'], stock: 40, maxStock: 80, status: 'published', description: 'گوشی پرچمدار سامسونگ با دوربین ۲۰۰ مگاپیکسل و پردازنده اسنپ‌دراگون', emoji: '📱', date: '3' },
  { id: '3', name: 'پیراهن مردانه کلاسیک', slug: 'mens-classic-shirt', sku: 'CLS-MSH-003', price: 1250000, salePrice: 0, category: 'پوشاک و فشن', tags: ['پرفروش'], stock: 120, maxStock: 200, status: 'published', description: 'پیراهن رسمی با پارچه نخی درجه یک و دوخت عالی', emoji: '👔', date: '5' },
  { id: '4', name: 'ست آشپزخانه ۱۲ پارچه', slug: 'kitchen-set-12', sku: 'KIT-SET-004', price: 3200000, salePrice: 2850000, category: 'خانه و آشپزخانه', tags: ['ویژه تخفیف', 'جدید'], stock: 35, maxStock: 60, status: 'published', description: 'ست قابلمه و تابه با روکش سرامیکی و دسته چوبی', emoji: '🍳', date: '1' },
  { id: '5', name: 'کفش ورزشی نایکی ایرمکس', slug: 'nike-airmax-sport', sku: 'NIK-AMX-005', price: 5200000, salePrice: 4800000, category: 'لوازم ورزشی', tags: ['محبوب', 'پرفروش'], stock: 60, maxStock: 100, status: 'published', description: 'کفش ورزشی راحت برای استفاده روزانه با زیره بادی', emoji: '👟', date: '7' },
  { id: '6', name: 'عسل طبیعی کوهستان', slug: 'natural-mountain-honey', sku: 'HON-MNT-006', price: 380000, salePrice: 350000, category: 'مواد غذایی', tags: ['اورجینال', 'پرفروش'], stock: 200, maxStock: 300, status: 'published', description: 'عسل خالص و طبیعی از دامنه‌های زاگرس با طعم بی‌نظیر', emoji: '🍯', date: '4' },
  { id: '7', name: 'مانتو زنانه بهاره', slug: 'womens-spring-coat', sku: 'MNT-SPR-007', price: 1800000, salePrice: 0, category: 'پوشاک و فشن', tags: ['جدید'], stock: 80, maxStock: 150, status: 'draft', description: 'مانتو شیک با طرح گلدوزی دستی و پارچه لنین', emoji: '👗', date: '10' },
  { id: '8', name: 'هدفون سونی WH-1000XM5', slug: 'sony-wh1000xm5', sku: 'SNY-WH5-008', price: 14500000, salePrice: 12800000, category: 'الکترونیک و دیجیتال', tags: ['ویژه تخفیف', 'گارانتی اصلی', 'محبوب'], stock: 8, maxStock: 50, status: 'published', description: 'هدفون بی‌سیم با قابلیت نویزکنسلینگ و باتری ۳۰ ساعته', emoji: '🎧', date: '6' },
  { id: '9', name: 'مجموعه کتاب شاهنامه فردوسی', slug: 'shahnameh-ferdowsi', sku: 'BOK-SHN-009', price: 2500000, salePrice: 2200000, category: 'کتاب و لوازم التحریر', tags: ['جدید', 'ارسال رایگان'], stock: 45, maxStock: 100, status: 'published', description: 'مجموعه کامل شاهنامه فردوسی در ۸ جلد با تصویرگری', emoji: '📚', date: '8' },
  { id: '10', name: 'کرم ضد آفتاب spf50', slug: 'sunscreen-spf50', sku: 'BTY-SPF-010', price: 450000, salePrice: 390000, category: 'زیبایی و بهداشت', tags: ['ویژه تخفیف', 'ضد آب'], stock: 5, maxStock: 200, status: 'published', description: 'کرم ضد آفتاب با SPF50 و فرمولاسیون ضد آب', emoji: '🧴', date: '3' },
  { id: '11', name: 'ربورن لگو شهر بزرگ', slug: 'lego-city-creator', sku: 'TOY-LGC-011', price: 3500000, salePrice: 0, category: 'اسباب بازی', tags: ['محبوب', 'جدید'], stock: 0, maxStock: 40, status: 'draft', description: 'ربورن لگو شهری با ۱۲۰۰ قطعه برای کودکان ۸ سال به بالا', emoji: '🧩', date: '15' },
  { id: '12', name: 'تبلت اپل آیپد ایر M2', slug: 'apple-ipad-air-m2', sku: 'APL-IPA-012', price: 31000000, salePrice: 29500000, category: 'الکترونیک و دیجیتال', tags: ['ویژه تخفیف', 'گارانتی اصلی', 'محبوب'], stock: 12, maxStock: 30, status: 'published', description: 'تبلت اپل با تراشه M2 و صفحه نمایش ۱۰.۹ اینچی', emoji: '📱', date: '0' },
]

const initialOrders: Order[] = [
  { id: '1', number: '#۱۰۴۵', customer: 'علی محمدی', email: 'ali@example.com', phone: '۰۹۱۲۱۲۳۴۵۶۷', address: 'تهران، خیابان ولیعصر، پلاک ۱۲۰', items: [{ name: 'لپ‌تاپ ایسوس زنف‌بوک ۱۴', qty: 1, price: 42500000, emoji: '💻' }, { name: 'هدفون سونی WH-1000XM5', qty: 1, price: 12800000, emoji: '🎧' }], subtotal: 55300000, discount: 1500000, shipping: 0, total: 53800000, status: 'completed', date: '0', note: '' },
  { id: '2', number: '#۱۰۴۴', customer: 'سارا احمدی', email: 'sara@example.com', phone: '۰۹۳۵۱۲۳۴۵۶۷', address: 'اصفهان، خیابان چهارباغ، کوچه ۵', items: [{ name: 'مانتو زنانه بهاره', qty: 2, price: 1800000, emoji: '👗' }, { name: 'کرم ضد آفتاب spf50', qty: 1, price: 390000, emoji: '🧴' }], subtotal: 3990000, discount: 200000, shipping: 45000, total: 3835000, status: 'shipped', date: '1', note: 'لطفاً بسته‌بندی ویژه شود.' },
  { id: '3', number: '#۱۰۴۳', customer: 'محمد رضایی', email: 'mrezaei@example.com', phone: '۰۹۱۳۱۲۳۴۵۶۷', address: 'شیراز، بلوار ارم، خیابان ۲۰', items: [{ name: 'گوشی سامسونگ گلکسی S24', qty: 1, price: 36000000, emoji: '📱' }], subtotal: 36000000, discount: 0, shipping: 0, total: 36000000, status: 'processing', date: '1', note: '' },
  { id: '4', number: '#۱۰۴۲', customer: 'فاطمه حسینی', email: 'fatemeh@example.com', phone: '۰۹۳۶۱۲۳۴۵۶۷', address: 'تبریز، خیابان استقلال، پلاک ۸۵', items: [{ name: 'مجموعه کتاب شاهنامه فردوسی', qty: 1, price: 2200000, emoji: '📚' }, { name: 'ست آشپزخانه ۱۲ پارچه', qty: 1, price: 2850000, emoji: '🍳' }], subtotal: 5050000, discount: 0, shipping: 65000, total: 5115000, status: 'pending', date: '2', note: '' },
  { id: '5', number: '#۱۰۴۱', customer: 'رضا کریمی', email: 'reza.k@example.com', phone: '۰۹۱۴۱۲۳۴۵۶۷', address: 'مشهد، خیابان امام رضا، نبش کوچه ۳', items: [{ name: 'کفش ورزشی نایکی ایرمکس', qty: 1, price: 4800000, emoji: '👟' }, { name: 'پیراهن مردانه کلاسیک', qty: 3, price: 1250000, emoji: '👔' }], subtotal: 8550000, discount: 300000, shipping: 0, total: 8250000, status: 'completed', date: '3', note: 'اندازه پیراهن: L' },
  { id: '6', number: '#۱۰۴۰', customer: 'مریم نوری', email: 'maryam@example.com', phone: '۰۹۳۳۱۲۳۴۵۶۷', address: 'کرج، مهرشهر، فاز ۴، بلوار ارم', items: [{ name: 'عسل طبیعی کوهستان', qty: 3, price: 350000, emoji: '🍯' }], subtotal: 1050000, discount: 50000, shipping: 35000, total: 1035000, status: 'completed', date: '5', note: '' },
  { id: '7', number: '#۱۰۳۹', customer: 'امیر حسین جعفری', email: 'amirh@example.com', phone: '۰۹۱۶۱۲۳۴۵۶۷', address: 'اهواز، خیابان کیانپارس، پلاک ۲۲', items: [{ name: 'تبلت اپل آیپد ایر M2', qty: 1, price: 29500000, emoji: '📱' }], subtotal: 29500000, discount: 1000000, shipping: 0, total: 28500000, status: 'processing', date: '2', note: 'پیش‌فاضل پرداخت شده' },
  { id: '8', number: '#۱۰۳۸', customer: 'زهرا صادقی', email: 'zahra.s@example.com', phone: '۰۹۳۸۱۲۳۴۵۶۷', address: 'رشت، خیابان سعدی، پلاک ۴۵', items: [{ name: 'ربورن لگو شهر بزرگ', qty: 2, price: 3500000, emoji: '🧩' }], subtotal: 7000000, discount: 0, shipping: 55000, total: 7055000, status: 'pending', date: '0', note: '' },
  { id: '9', number: '#۱۰۳۷', customer: 'حسین موسوی', email: 'hossein@example.com', phone: '۰۹۱۹۱۲۳۴۵۶۷', address: 'قم، خیابان معلم، کوچه ۱۲', items: [{ name: 'لپ‌تاپ ایسوس زنف‌بوک ۱۴', qty: 1, price: 42500000, emoji: '💻' }], subtotal: 42500000, discount: 2000000, shipping: 0, total: 40500000, status: 'cancelled', date: '7', note: 'درخواست لغو توسط مشتری' },
  { id: '10', number: '#۱۰۳۶', customer: 'نرگس رحمانی', email: 'narges@example.com', phone: '۰۹۳۱۱۲۳۴۵۶۷', address: 'یزد، خیابان امام، پلاک ۹۰', items: [{ name: 'کرم ضد آفتاب spf50', qty: 2, price: 390000, emoji: '🧴' }, { name: 'مانتو زنانه بهاره', qty: 1, price: 1800000, emoji: '👗' }], subtotal: 2580000, discount: 100000, shipping: 45000, total: 2525000, status: 'completed', date: '10', note: '' },
]

const initialCategories: Category[] = [
  { id: '1', name: 'الکترونیک و دیجیتال', slug: 'electronics-digital', description: 'گوشی، لپ‌تاپ، تبلت و لوازم جانبی', color: '#8b5cf6', productCount: 4, parent: '' },
  { id: '2', name: 'پوشاک و فشن', slug: 'clothing-fashion', description: 'پوشاک مردانه و زنانه، کیف و کفش', color: '#ec4899', productCount: 2, parent: '' },
  { id: '3', name: 'خانه و آشپزخانه', slug: 'home-kitchen', description: 'لوازم آشپزخانه و دکوراسیون منزل', color: '#f59e0b', productCount: 1, parent: '' },
  { id: '4', name: 'لوازم ورزشی', slug: 'sports-equipment', description: 'لوازم ورزشی و تناسب اندام', color: '#10b981', productCount: 1, parent: '' },
  { id: '5', name: 'کتاب و لوازم التحریر', slug: 'books-stationery', description: 'کتاب، لوازم‌التحریر و مقالات', color: '#06b6d4', productCount: 1, parent: '' },
  { id: '6', name: 'زیبایی و بهداشت', slug: 'beauty-health', description: 'لوازم آرایشی، بهداشتی و مراقبت از پوست', color: '#f43f5e', productCount: 1, parent: '' },
  { id: '7', name: 'مواد غذایی', slug: 'food-grocery', description: 'مواد غذایی، خشکبار و نوشیدنی', color: '#84cc16', productCount: 1, parent: '' },
  { id: '8', name: 'اسباب بازی', slug: 'toys-games', description: 'اسباب‌بازی، بازی و سرگرمی کودکان', color: '#f97316', productCount: 1, parent: '' },
]

const initialTags: StoreTag[] = [
  { id: '1', name: 'ویژه تخفیف', count: 6 },
  { id: '2', name: 'پرفروش', count: 5 },
  { id: '3', name: 'جدید', count: 5 },
  { id: '4', name: 'محبوب', count: 4 },
  { id: '5', name: 'ارسال رایگان', count: 3 },
  { id: '6', name: 'گارانتی اصلی', count: 4 },
  { id: '7', name: 'اورجینال', count: 3 },
  { id: '8', name: 'ضد آب', count: 2 },
]

const emptyProduct: Omit<Product, 'id'> = {
  name: '', slug: '', sku: '', price: 0, salePrice: 0,
  category: 'الکترونیک و دیجیتال', tags: [], stock: 0, maxStock: 100,
  status: 'draft', description: '', emoji: '📦', date: '0',
}

const emptyCategory: Omit<Category, 'id'> = {
  name: '', slug: '', description: '', color: '#6366f1', productCount: 0, parent: '',
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function StorePage() {
  const [activeTab, setActiveTab] = useState<string>('products')

  // Products state
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [prodSearch, setProdSearch] = useState('')
  const [prodCatFilter, setProdCatFilter] = useState('all')
  const [prodStatusFilter, setProdStatusFilter] = useState('all')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>(emptyProduct)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingType, setDeletingType] = useState<'product' | 'category'>('product')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Orders state
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [orderNote, setOrderNote] = useState('')
  const [orderNewStatus, setOrderNewStatus] = useState<OrderStatus>('pending')

  // Categories state
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [catForm, setCatForm] = useState<Omit<Category, 'id'>>(emptyCategory)

  // Tags state
  const [tags, setTags] = useState<StoreTag[]>(initialTags)
  const [tagSearch, setTagSearch] = useState('')
  const [newTagName, setNewTagName] = useState('')

  // Settings state
  const [settings, setSettings] = useState({
    storeName: 'فروشگاه من',
    storeDesc: 'بهترین محصولات با کیفیت عالی و قیمت مناسب',
    storeUrl: 'https://myshop.ir',
    storeEmail: 'info@myshop.ir',
    gateway: 'zarinpal',
    testMode: false,
    apiKey: '',
    shippingMethod: 'post',
    freeShippingThreshold: 500000,
    deliveryDays: '۳ تا ۵ روز کاری',
    taxEnabled: false,
    taxRate: 9,
    taxByProvince: false,
    currency: 'toman',
    currencySymbol: 'تومان',
    symbolPosition: 'after',
  })

  // ─── Tab config ─────────────────────────────────────────────────────────

  const tabs = [
    { id: 'products', label: tabLabels.products, icon: Package, color: 'text-rose-600 dark:text-rose-400' },
    { id: 'orders', label: tabLabels.orders, icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400' },
    { id: 'categories', label: tabLabels.categories, icon: FolderOpen, color: 'text-amber-600 dark:text-amber-400' },
    { id: 'tags', label: tabLabels.tags, icon: Tag, color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'settings', label: tabLabels.settings, icon: Settings, color: 'text-slate-600 dark:text-slate-400' },
  ]

  // ─── Product Helpers ─────────────────────────────────────────────────────

  const categoryList = categories.map(c => c.name)

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.includes(prodSearch) || p.sku.includes(prodSearch)
    const matchCat = prodCatFilter === 'all' || p.category === prodCatFilter
    const matchStatus = prodStatusFilter === 'all' || p.status === prodStatusFilter
    return matchSearch && matchCat && matchStatus
  })

  const allProductsSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.has(p.id))
  const someProductsSelected = filteredProducts.some(p => selectedProducts.has(p.id)) && !allProductsSelected

  const toggleProductSelect = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllProducts = () => {
    if (allProductsSelected) {
      setSelectedProducts(prev => {
        const next = new Set(prev)
        filteredProducts.forEach(p => next.delete(p.id))
        return next
      })
    } else {
      setSelectedProducts(prev => {
        const next = new Set(prev)
        filteredProducts.forEach(p => next.add(p.id))
        return next
      })
    }
  }

  const generateSlug = (name: string) => {
    return name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9آ-ی۰-۹\-]/g, '').toLowerCase()
  }

  const openCreateProduct = () => {
    setEditingProduct(null)
    setProductForm({ ...emptyProduct })
    setProductDialogOpen(true)
  }

  const openEditProduct = (p: Product) => {
    setEditingProduct(p)
    setProductForm({ name: p.name, slug: p.slug, sku: p.sku, price: p.price, salePrice: p.salePrice, category: p.category, tags: [...p.tags], stock: p.stock, maxStock: p.maxStock, status: p.status, description: p.description, emoji: p.emoji, date: p.date })
    setProductDialogOpen(true)
  }

  const handleSaveProduct = () => {
    if (!productForm.name) return
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productForm } : p))
      toast.success('محصول با موفقیت بروزرسانی شد')
    } else {
      setProducts(prev => [...prev, { ...productForm, id: Date.now().toString() }])
      toast.success('محصول جدید با موفقیت ایجاد شد')
    }
    setProductDialogOpen(false)
  }

  const handleBulkPublish = () => {
    setProducts(prev => prev.map(p => selectedProducts.has(p.id) ? { ...p, status: 'published' as ProductStatus } : p))
    toast.success(`${toPersianDigits(selectedProducts.size)} محصول منتشر شد`)
    setSelectedProducts(new Set())
  }

  const handleBulkDeleteProducts = () => {
    setProducts(prev => prev.filter(p => !selectedProducts.has(p.id)))
    toast.success(`${toPersianDigits(selectedProducts.size)} محصول حذف شد`)
    setSelectedProducts(new Set())
    setDeleteDialogOpen(false)
  }

  const getStockColor = (stock: number, max: number) => {
    const ratio = max > 0 ? stock / max : 0
    if (stock === 0) return 'bg-red-500'
    if (ratio < 0.2) return 'bg-red-500'
    if (ratio < 0.5) return 'bg-amber-500'
    return 'bg-green-500'
  }

  const getStockTextColor = (stock: number, max: number) => {
    const ratio = max > 0 ? stock / max : 0
    if (stock === 0) return 'text-red-600 dark:text-red-400'
    if (ratio < 0.2) return 'text-red-600 dark:text-red-400'
    if (ratio < 0.5) return 'text-amber-600 dark:text-amber-400'
    return 'text-green-600 dark:text-green-400'
  }

  // ─── Order Helpers ───────────────────────────────────────────────────────

  const filteredOrders = orders.filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter)

  const openViewOrder = (order: Order) => {
    setViewingOrder(order)
    setOrderNewStatus(order.status)
    setOrderNote(order.note)
    setOrderDialogOpen(true)
  }

  const handleSaveOrderStatus = () => {
    if (!viewingOrder) return
    setOrders(prev => prev.map(o => o.id === viewingOrder.id ? { ...o, status: orderNewStatus, note: orderNote } : o))
    toast.success('وضعیت سفارش بروزرسانی شد')
    setOrderDialogOpen(false)
  }

  const orderStatusTabs = ['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'] as const
  const orderStatusTabLabels: Record<string, string> = {
    all: 'همه',
    pending: 'در انتظار',
    processing: 'پردازش',
    shipped: 'ارسال شده',
    completed: 'تکمیل شده',
    cancelled: 'لغو شده',
  }

  // ─── Category Helpers ────────────────────────────────────────────────────

  const openCreateCategory = () => {
    setEditingCategory(null)
    setCatForm({ ...emptyCategory })
    setCatDialogOpen(true)
  }

  const openEditCategory = (c: Category) => {
    setEditingCategory(c)
    setCatForm({ name: c.name, slug: c.slug, description: c.description, color: c.color, productCount: c.productCount, parent: c.parent })
    setCatDialogOpen(true)
  }

  const handleSaveCategory = () => {
    if (!catForm.name) return
    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...catForm } : c))
      toast.success('دسته‌بندی بروزرسانی شد')
    } else {
      setCategories(prev => [...prev, { ...catForm, id: Date.now().toString() }])
      toast.success('دسته‌بندی جدید ایجاد شد')
    }
    setCatDialogOpen(false)
  }

  // ─── Tag Helpers ────────────────────────────────────────────────────────

  const filteredTags = tags.filter(t => t.name.includes(tagSearch))

  const handleAddTag = () => {
    const name = newTagName.trim()
    if (!name) return
    if (tags.some(t => t.name === name)) { toast.error('این برچسب قبلاً وجود دارد'); return }
    setTags(prev => [...prev, { id: Date.now().toString(), name, count: 0 }])
    setNewTagName('')
    toast.success('برچسب جدید اضافه شد')
  }

  const handleDeleteTag = (id: string) => {
    setTags(prev => prev.filter(t => t.id !== id))
    toast.success('برچسب حذف شد')
  }

  // ─── Settings Helpers ───────────────────────────────────────────────────

  const handleSaveSettings = () => {
    toast.success('تنظیمات با موفقیت ذخیره شد')
  }

  // ─── Stats ───────────────────────────────────────────────────────────────

  const publishedCount = products.filter(p => p.status === 'published').length
  const draftCount = products.filter(p => p.status === 'draft').length
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < p.maxStock * 0.2).length

  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const processingOrders = orders.filter(o => o.status === 'processing').length
  const completedOrders = orders.filter(o => o.status === 'completed').length

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6 page-enter content-area">
      {/* ─── Header ─── */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8 glass-card shine-effect">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-orange-500/10 pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-rose-400/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/25 animate-in">
              <Store className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">مدیریت فروشگاه</h1>
              <p className="text-sm text-muted-foreground mt-1 animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>مدیریت محصولات، سفارشات و تنظیمات فروشگاه</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tab Bar ─── */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-xl overflow-x-auto animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 gap-2 rounded-lg h-11 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                isActive
                  ? 'bg-background shadow-sm text-foreground hover:bg-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? tab.color : ''}`} />
              <span className="hidden sm:inline truncate">{tab.label}</span>
            </Button>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── PRODUCTS TAB ───────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'کل محصولات', value: toPersianDigits(products.length), icon: Package, gradient: 'from-slate-400 to-slate-600', textColor: 'text-slate-600 dark:text-slate-400' },
              { label: 'منتشر شده', value: toPersianDigits(publishedCount), icon: CheckCircle, gradient: 'from-emerald-400 to-emerald-600', textColor: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'پیش‌نویس', value: toPersianDigits(draftCount), icon: FileEdit, gradient: 'from-amber-400 to-amber-600', textColor: 'text-amber-600 dark:text-amber-400' },
              { label: 'موجودی کم', value: toPersianDigits(lowStockCount), icon: AlertTriangle, gradient: 'from-rose-400 to-rose-600', textColor: 'text-rose-600 dark:text-rose-400' },
            ].map((stat, i) => (
              <Card key={stat.label} className="glass-card stat-card-gradient hover-lift card-inner-glow shadow-sm overflow-hidden transition-all duration-300 animate-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md shrink-0`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xl font-bold tabular-nums ${stat.textColor}`}>{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Toolbar */}
          <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="جستجو در محصولات..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} className="pr-10" />
              </div>
              <Select value={prodCatFilter} onValueChange={setProdCatFilter}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="دسته‌بندی" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                  {categoryList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={prodStatusFilter} onValueChange={setProdStatusFilter}>
                <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="وضعیت" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="published">منتشر شده</SelectItem>
                  <SelectItem value="draft">پیش‌نویس</SelectItem>
                  <SelectItem value="hidden">مخفی</SelectItem>
                </SelectContent>
              </Select>
              <Button className="gap-2 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm shrink-0" onClick={openCreateProduct}>
                <Plus className="h-4 w-4" />افزودن محصول
              </Button>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className="glass-card shadow-sm overflow-hidden animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox checked={allProductsSelected ? true : someProductsSelected ? 'indeterminate' : false} onCheckedChange={toggleAllProducts} aria-label="انتخاب همه" />
                      </TableHead>
                      <TableHead>تصویر</TableHead>
                      <TableHead>نام محصول</TableHead>
                      <TableHead className="hidden md:table-cell">دسته‌بندی</TableHead>
                      <TableHead>قیمت</TableHead>
                      <TableHead className="hidden lg:table-cell">موجودی</TableHead>
                      <TableHead className="hidden sm:table-cell">وضعیت</TableHead>
                      <TableHead className="hidden xl:table-cell">تاریخ</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product, idx) => {
                      const sc = productStatusColors[product.status]
                      const stockPct = product.maxStock > 0 ? Math.round((product.stock / product.maxStock) * 100) : 0
                      return (
                        <TableRow key={product.id} className="hover-lift transition-all duration-200 animate-in" style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}>
                          <TableCell>
                            <Checkbox checked={selectedProducts.has(product.id)} onCheckedChange={() => toggleProductSelect(product.id)} aria-label={`انتخاب ${product.name}`} />
                          </TableCell>
                          <TableCell>
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center text-xl shadow-sm">{product.emoji}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono" dir="ltr">{product.sku}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="tabular-nums text-sm font-semibold text-rose-600 dark:text-rose-400">{formatPrice(product.salePrice > 0 ? product.salePrice : product.price)}</div>
                            {product.salePrice > 0 && (
                              <div className="text-[10px] text-muted-foreground line-through tabular-nums">{formatPrice(product.price)}</div>
                            )}
                            <div className="text-[10px] text-muted-foreground">تومان</div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <Progress value={stockPct} className={`h-2 flex-1 [&>div]:${getStockColor(product.stock, product.maxStock)}`} />
                              <span className={`text-xs font-medium tabular-nums w-8 text-left ${getStockTextColor(product.stock, product.maxStock)}`}>
                                {toPersianDigits(product.stock)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge className={`${sc.bg} ${sc.text} border-0 shadow-sm text-[10px]`}>{productStatusLabel[product.status]}</Badge>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                            {relativeDate(parseInt(product.date))}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={() => openEditProduct(product)} title="ویرایش">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={() => { setDeletingType('product'); setDeletingId(product.id); setDeleteDialogOpen(true) }} title="حذف">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Action Bar */}
          {selectedProducts.size > 0 && (
            <div className="glass-card sticky bottom-0 z-10 border-t border-border/60 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300 shadow-lg">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span>{toPersianDigits(selectedProducts.size)} مورد انتخاب شده</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" className="gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleBulkPublish}>
                  <CheckCircle className="h-3.5 w-3.5" />انتشار انتخابی
                </Button>
                <Button size="sm" className="gap-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={() => { setDeletingType('product'); setDeletingId('bulk'); setDeleteDialogOpen(true) }}>
                  <Trash className="h-3.5 w-3.5" />حذف انتخابی
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── ORDERS TAB ────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'کل سفارشات', value: toPersianDigits(orders.length), icon: ShoppingCart, gradient: 'from-blue-400 to-blue-600', textColor: 'text-blue-600 dark:text-blue-400' },
              { label: 'در انتظار', value: toPersianDigits(pendingOrders), icon: Clock, gradient: 'from-amber-400 to-amber-600', textColor: 'text-amber-600 dark:text-amber-400' },
              { label: 'درحال پردازش', value: toPersianDigits(processingOrders), icon: Loader2, gradient: 'from-violet-400 to-violet-600', textColor: 'text-violet-600 dark:text-violet-400' },
              { label: 'تکمیل شده', value: toPersianDigits(completedOrders), icon: CheckCircle, gradient: 'from-emerald-400 to-emerald-600', textColor: 'text-emerald-600 dark:text-emerald-400' },
            ].map((stat, i) => (
              <Card key={stat.label} className="glass-card stat-card-gradient hover-lift card-inner-glow shadow-sm overflow-hidden transition-all duration-300 animate-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md shrink-0`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xl font-bold tabular-nums ${stat.textColor}`}>{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl overflow-x-auto animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            {orderStatusTabs.map(s => {
              const isActive = orderStatusFilter === s
              return (
                <Button key={s} variant="ghost" size="sm" onClick={() => setOrderStatusFilter(s)}
                  className={`flex-1 min-w-0 rounded-lg text-xs font-medium transition-all duration-200 ${isActive ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}>
                  {orderStatusTabLabels[s]}
                </Button>
              )
            })}
          </div>

          {/* Orders Table */}
          <Card className="glass-card shadow-sm overflow-hidden animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>شماره سفارش</TableHead>
                      <TableHead>مشتری</TableHead>
                      <TableHead className="hidden md:table-cell">محصولات</TableHead>
                      <TableHead>مبلغ کل</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead className="hidden sm:table-cell">تاریخ</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order, idx) => {
                      const osc = orderStatusColors[order.status]
                      return (
                        <TableRow key={order.id} className="hover-lift transition-all duration-200 animate-in" style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}>
                          <TableCell className="font-mono text-sm font-semibold">{order.number}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{order.customer}</div>
                            <div className="text-[11px] text-muted-foreground">{order.email}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {toPersianDigits(order.items.reduce((sum, item) => sum + item.qty, 0))} محصول
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm tabular-nums text-blue-600 dark:text-blue-400">{formatPrice(order.total)}</div>
                            <div className="text-[10px] text-muted-foreground">تومان</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${osc.bg} ${osc.text} border-0 shadow-sm text-[10px]`}>{orderStatusLabel[order.status]}</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{relativeDate(parseInt(order.date))}</TableCell>
                          <TableCell>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={() => openViewOrder(order)} title="مشاهده">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── CATEGORIES TAB ────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <h2 className="text-lg font-semibold text-amber-700 dark:text-amber-300">مدیریت دسته‌بندی‌ها</h2>
            <Button className="gap-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={openCreateCategory}>
              <Plus className="h-4 w-4" />افزودن دسته‌بندی
            </Button>
          </div>
          <Card className="glass-card shadow-sm overflow-hidden animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>نام</TableHead>
                      <TableHead className="hidden md:table-cell">اسلاگ</TableHead>
                      <TableHead>تعداد محصولات</TableHead>
                      <TableHead className="hidden lg:table-cell">توضیحات</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat, idx) => (
                      <TableRow key={cat.id} className="hover-lift transition-all duration-200 animate-in" style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="font-medium text-sm">{cat.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono" dir="ltr">{cat.slug}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs tabular-nums">{toPersianDigits(cat.productCount)}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[250px] truncate">{cat.description}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={() => openEditCategory(cat)} title="ویرایش">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={() => { setDeletingType('category'); setDeletingId(cat.id); setDeleteDialogOpen(true) }} title="حذف">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── TAGS TAB ──────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'tags' && (
        <div className="space-y-4">
          {/* Add Tag */}
          <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <CardContent className="p-4 flex gap-3">
              <Input placeholder="نام برچسب جدید..." value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag()} className="flex-1" />
              <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm shrink-0" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />افزودن
              </Button>
            </CardContent>
          </Card>

          {/* Search Tags */}
          <div className="relative animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="جستجو در برچسب‌ها..." value={tagSearch} onChange={e => setTagSearch(e.target.value)} className="pr-10" />
          </div>

          {/* Tags Cloud */}
          <div className="flex flex-wrap gap-2 animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            {filteredTags.map((tag, idx) => (
              <Badge key={tag.id} variant="secondary" className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-full hover-lift transition-all duration-200 animate-in" style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}>
                <Tag className="h-3 w-3 text-emerald-500" />
                <span>{tag.name}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">({toPersianDigits(tag.count)})</span>
                <button onClick={() => handleDeleteTag(tag.id)} className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-colors mr-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filteredTags.length === 0 && (
              <div className="w-full text-center py-10 text-muted-foreground">
                <Tag className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm">برچسبی یافت نشد</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── SETTINGS TAB ──────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* General */}
          <Card className="glass-card hover-lift card-inner-glow shadow-sm animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-sm">
                  <Store className="h-4 w-4 text-white" />
                </div>
                عمومی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Store className="h-3.5 w-3.5 text-slate-500" />نام فروشگاه</Label>
                <Input value={settings.storeName} onChange={e => setSettings({ ...settings, storeName: e.target.value })} className="hover:border-slate-400 transition-colors" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Store className="h-3.5 w-3.5 text-slate-500" />توضیحات فروشگاه</Label>
                <Textarea value={settings.storeDesc} onChange={e => setSettings({ ...settings, storeDesc: e.target.value })} rows={2} className="hover:border-slate-400 transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Store className="h-3.5 w-3.5 text-slate-500" />آدرس سایت</Label>
                  <Input value={settings.storeUrl} onChange={e => setSettings({ ...settings, storeUrl: e.target.value })} dir="ltr" className="hover:border-slate-400 transition-colors" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-500" />ایمیل فروشگاه</Label>
                  <Input value={settings.storeEmail} onChange={e => setSettings({ ...settings, storeEmail: e.target.value })} dir="ltr" className="hover:border-slate-400 transition-colors" />
                </div>
              </div>
              <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
                ذخیره تنظیمات عمومی
              </Button>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="glass-card hover-lift card-inner-glow shadow-sm animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-sm">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-rose-500" />درگاه فعال</Label>
                <Select value={settings.gateway} onValueChange={v => setSettings({ ...settings, gateway: v })}>
                  <SelectTrigger className="hover:border-rose-400 transition-colors"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zarinpal">زرین‌پال</SelectItem>
                    <SelectItem value="melli">ملی</SelectItem>
                    <SelectItem value="pay">پی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-rose-500" />حالت آزمایشی</Label>
                <Switch checked={settings.testMode} onCheckedChange={v => setSettings({ ...settings, testMode: v })} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-rose-500" />کلید API</Label>
                <Input value={settings.apiKey} onChange={e => setSettings({ ...settings, apiKey: e.target.value })} type="password" dir="ltr" placeholder="کلید API درگاه پرداخت" className="hover:border-rose-400 transition-colors" />
              </div>
              <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
                ذخیره تنظیمات پرداخت
              </Button>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card className="glass-card hover-lift card-inner-glow shadow-sm animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                ارسال
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-blue-500" />روش ارسال پیش‌فرض</Label>
                <Select value={settings.shippingMethod} onValueChange={v => setSettings({ ...settings, shippingMethod: v })}>
                  <SelectTrigger className="hover:border-blue-400 transition-colors"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="post">پست پیشتاز</SelectItem>
                    <SelectItem value="express">پیک موتوری</SelectItem>
                    <SelectItem value="tipax">تیپاکس</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-blue-500" />ارسال رایگان بالای مبلغ (تومان)</Label>
                <Input value={settings.freeShippingThreshold} onChange={e => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })} type="number" dir="ltr" className="hover:border-blue-400 transition-colors" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-blue-500" />زمان تحویل پیش‌فرض</Label>
                <Input value={settings.deliveryDays} onChange={e => setSettings({ ...settings, deliveryDays: e.target.value })} placeholder="مثلاً: ۳ تا ۵ روز کاری" className="hover:border-blue-400 transition-colors" />
              </div>
              <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
                ذخیره تنظیمات ارسال
              </Button>
            </CardContent>
          </Card>

          {/* Tax */}
          <Card className="glass-card hover-lift card-inner-glow shadow-sm animate-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-violet-700 dark:text-violet-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-sm">
                  <Percent className="h-4 w-4 text-white" />
                </div>
                مالیات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><Percent className="h-3.5 w-3.5 text-violet-500" />فعال‌سازی مالیات</Label>
                <Switch checked={settings.taxEnabled} onCheckedChange={v => setSettings({ ...settings, taxEnabled: v })} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Percent className="h-3.5 w-3.5 text-violet-500" />نرخ مالیات (درصد)</Label>
                <Input value={settings.taxRate} onChange={e => setSettings({ ...settings, taxRate: Number(e.target.value) })} type="number" dir="ltr" className="hover:border-violet-400 transition-colors" disabled={!settings.taxEnabled} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5"><Percent className="h-3.5 w-3.5 text-violet-500" />مالیات بر اساس استان</Label>
                <Switch checked={settings.taxByProvince} onCheckedChange={v => setSettings({ ...settings, taxByProvince: v })} disabled={!settings.taxEnabled} />
              </div>
              <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
                ذخیره تنظیمات مالیات
              </Button>
            </CardContent>
          </Card>

          {/* Currency */}
          <Card className="glass-card hover-lift card-inner-glow shadow-sm animate-in" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                  <Coins className="h-4 w-4 text-white" />
                </div>
                واحد پول
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Coins className="h-3.5 w-3.5 text-emerald-500" />واحد پول</Label>
                  <Select value={settings.currency} onValueChange={v => setSettings({ ...settings, currency: v })}>
                    <SelectTrigger className="hover:border-emerald-400 transition-colors"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toman">تومان</SelectItem>
                      <SelectItem value="rial">ریال</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Coins className="h-3.5 w-3.5 text-emerald-500" />نماد پول</Label>
                  <Input value={settings.currencySymbol} onChange={e => setSettings({ ...settings, currencySymbol: e.target.value })} className="hover:border-emerald-400 transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><Coins className="h-3.5 w-3.5 text-emerald-500" />موقعیت نماد</Label>
                <Select value={settings.symbolPosition} onValueChange={v => setSettings({ ...settings, symbolPosition: v })}>
                  <SelectTrigger className="hover:border-emerald-400 transition-colors"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="after">بعد از قیمت</SelectItem>
                    <SelectItem value="before">قبل از قیمت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm">
                ذخیره تنظیمات واحد پول
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ─── DIALOGS ───────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-rose-700 dark:text-rose-300">
              {editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'اطلاعات محصول را ویرایش کنید' : 'اطلاعات محصول جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>نام محصول</Label>
                <Input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value, slug: generateSlug(e.target.value) })} placeholder="نام محصول را وارد کنید" />
              </div>
              <div className="space-y-2">
                <Label>نامک (Slug)</Label>
                <Input value={productForm.slug} onChange={e => setProductForm({ ...productForm, slug: e.target.value })} dir="ltr" placeholder="auto-generated-slug" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} rows={3} placeholder="توضیحات محصول..." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>قیمت عادی (تومان)</Label>
                <Input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} dir="ltr" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>قیمت تخفیفی (تومان)</Label>
                <Input type="number" value={productForm.salePrice} onChange={e => setProductForm({ ...productForm, salePrice: Number(e.target.value) })} dir="ltr" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>دسته‌بندی</Label>
                <Select value={productForm.category} onValueChange={v => setProductForm({ ...productForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>برچسب‌ها</Label>
                <Select value={productForm.tags.join(',')} onValueChange={v => setProductForm({ ...productForm, tags: v.split(',') })}>
                  <SelectTrigger><SelectValue placeholder="انتخاب برچسب‌ها" /></SelectTrigger>
                  <SelectContent>
                    {tags.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>موجودی</Label>
                <Input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })} dir="ltr" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} dir="ltr" placeholder="SKU-001" />
              </div>
              <div className="space-y-2">
                <Label>وضعیت</Label>
                <Select value={productForm.status} onValueChange={v => setProductForm({ ...productForm, status: v as ProductStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">منتشر شده</SelectItem>
                    <SelectItem value="draft">پیش‌نویس</SelectItem>
                    <SelectItem value="hidden">مخفی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Image placeholder */}
            <div className="space-y-2">
              <Label>تصویر شاخص</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:border-rose-400/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/20 dark:to-pink-900/20 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-rose-400" />
                </div>
                <p className="text-sm text-muted-foreground">تصویر را اینجا بکشید و رها کنید یا کلیک کنید</p>
                <p className="text-[10px] text-muted-foreground/60">PNG, JPG حداکثر ۲ مگابایت</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">انصراف</Button>
            <Button className="bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-700 hover:to-pink-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSaveProduct} disabled={!productForm.name}>
              ذخیره محصول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              جزئیات سفارش {viewingOrder?.number}
            </DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="space-y-5">
              {/* Customer Info */}
              <div className="rounded-xl bg-muted/30 border p-4 space-y-3">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />اطلاعات مشتری
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">نام:</span> <span className="font-medium">{viewingOrder.customer}</span></div>
                  <div><span className="text-muted-foreground">تلفن:</span> <span className="font-medium" dir="ltr">{viewingOrder.phone}</span></div>
                  <div className="sm:col-span-2"><span className="text-muted-foreground">ایمیل:</span> <span className="font-medium" dir="ltr">{viewingOrder.email}</span></div>
                  <div className="sm:col-span-2"><span className="text-muted-foreground">آدرس:</span> <span className="font-medium">{viewingOrder.address}</span></div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">لیست محصولات</h4>
                <div className="rounded-xl border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>محصول</TableHead>
                        <TableHead className="text-center">تعداد</TableHead>
                        <TableHead className="text-left">قیمت واحد</TableHead>
                        <TableHead className="text-left">جمع</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingOrder.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{item.emoji}</span>
                              <span className="text-sm font-medium">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">{toPersianDigits(item.qty)}</TableCell>
                          <TableCell className="text-left tabular-nums text-sm">{formatPrice(item.price)}</TableCell>
                          <TableCell className="text-left tabular-nums text-sm font-semibold">{formatPrice(item.qty * item.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Totals */}
              <div className="rounded-xl bg-muted/30 border p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">جمع محصولات</span><span className="tabular-nums">{formatPrice(viewingOrder.subtotal)} تومان</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">تخفیف</span><span className="tabular-nums text-red-500">-{formatPrice(viewingOrder.discount)} تومان</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">هزینه ارسال</span><span className="tabular-nums">{viewingOrder.shipping > 0 ? `${formatPrice(viewingOrder.shipping)} تومان` : 'رایگان'}</span></div>
                <Separator />
                <div className="flex justify-between text-base font-bold"><span>مبلغ نهایی</span><span className="tabular-nums text-blue-600 dark:text-blue-400">{formatPrice(viewingOrder.total)} تومان</span></div>
              </div>

              {/* Status & Notes */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>تغییر وضعیت</Label>
                    <Select value={orderNewStatus} onValueChange={v => setOrderNewStatus(v as OrderStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(orderStatusLabel).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>یادداشت سفارش</Label>
                  <Textarea value={orderNote} onChange={e => setOrderNote(e.target.value)} rows={3} placeholder="یادداشت یا توضیحی اضافه کنید..." />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">بستن</Button>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSaveOrderStatus}>
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-amber-700 dark:text-amber-300">
              {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>نام دسته‌بندی</Label>
              <Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value, slug: generateSlug(e.target.value) })} placeholder="نام دسته‌بندی" />
            </div>
            <div className="space-y-2">
              <Label>اسلاگ</Label>
              <Input value={catForm.slug} onChange={e => setCatForm({ ...catForm, slug: e.target.value })} dir="ltr" placeholder="category-slug" />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} rows={2} placeholder="توضیحات دسته‌بندی..." />
            </div>
            <div className="space-y-2">
              <Label>دسته‌بندی والد</Label>
              <Select value={catForm.parent} onValueChange={v => setCatForm({ ...catForm, parent: v })}>
                <SelectTrigger><SelectValue placeholder="بدون والد" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون والد (دسته‌بندی اصلی)</SelectItem>
                  {categories.filter(c => c.id !== editingCategory?.id).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">انصراف</Button>
            <Button className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSaveCategory} disabled={!catForm.name}>
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingType === 'product'
                ? (deletingId === 'bulk'
                  ? `تمام ${toPersianDigits(selectedProducts.size)} محصول انتخاب‌شده حذف خواهند شد. این عمل قابل بازگشت نیست.`
                  : 'این محصول حذف خواهد شد. این عمل قابل بازگشت نیست.')
                : 'این دسته‌بندی حذف خواهد شد. این عمل قابل بازگشت نیست.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingType === 'product') {
                  if (deletingId === 'bulk') { handleBulkDeleteProducts() }
                  else if (deletingId) {
                    setProducts(prev => prev.filter(p => p.id !== deletingId))
                    toast.success('محصول حذف شد')
                    setDeleteDialogOpen(false)
                  }
                } else if (deletingType === 'category' && deletingId) {
                  setCategories(prev => prev.filter(c => c.id !== deletingId))
                  toast.success('دسته‌بندی حذف شد')
                  setDeleteDialogOpen(false)
                }
              }}
              className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
