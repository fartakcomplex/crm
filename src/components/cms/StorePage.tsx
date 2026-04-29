'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ShoppingCart, Plus, Pencil, Trash2, Search, Package, DollarSign,
  ShoppingBag, TrendingUp, Tag, FolderOpen, Settings, ChevronDown,
  ChevronUp, Eye, MoreVertical, Copy, Percent, Gift, Truck,
  CreditCard, Receipt, Building2, Palette, MonitorCheck,
  Clock, CheckCircle2, XCircle, AlertCircle, Archive, RotateCcw,
  Filter, Boxes, Store, BarChart3, CalendarDays, Hash, Weight,
  Ruler, Image, Layers, FileText, ArrowUpDown, PackageCheck, Warehouse,
  TriangleAlert, UserCircle, FileCheck, CircleDollarSign, ArrowLeftRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRegisterStoreData, ContactCrossRef, ModuleBadge, CrossModuleSyncStatus } from '@/components/CrossModulePanel'
import { useCrossModuleStore } from '@/lib/cross-module-store'
import { useCMSData } from './useCMSData'
import { useEnsureData } from './useEnsureData'
import type {
  Product as ApiProduct, Order as ApiOrder, OrderItem as ApiOrderItem,
  ProductCategory as ApiProductCategory, Coupon as ApiCoupon,
  InventoryItem as ApiInventoryItem, Invoice as ApiInvoice, Customer,
} from './types'
import { formatDate } from './types'
import WooCommerceProductEditor from './WooCommerceProductEditor'
import CategoryEditor from './CategoryEditor'
import TagEditor from './TagEditor'

// ─── Helpers ────────────────────────────────────────────────────────────────

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, d => persianDigits[parseInt(d)])
}

function formatPrice(price: number): string {
  return toPersianDigits(price.toLocaleString())
}

function generateSlug(text: string): string {
  return text
    .replace(/\s+/g, '-')
    .replace(/[^\u0600-\u06FF\w-]/g, '')
    .toLowerCase()
}

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface Order {
  id: string
  orderNumber: string
  customer: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'returned'
  shippingAddress: string
  notes: string
  createdAt: string
}

interface OrderItem {
  name: string
  quantity: number
  price: number
  total: number
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  image: string
  parentId: string | null
  productCount: number
}

interface Tag {
  id: string
  name: string
  slug: string
  productCount: number
}

interface Coupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  minOrder: number
  maxDiscount: number
  usedCount: number
  maxUsage: number
  startDate: string
  expiryDate: string
  allowedProducts: string
  allowedCategories: string
  active: boolean
}

interface StoreSettings {
  storeName: string
  storeAddress: string
  country: string
  province: string
  city: string
  postalCode: string
  currency: string
  shippingMethod: string
  shippingCost: number
  freeShippingMin: number
  paymentZarinpal: boolean
  paymentIdpay: boolean
  paymentNextpay: boolean
  paymentCod: boolean
  taxEnabled: boolean
  taxRate: number
  taxExemptRegions: string
  productsPerPage: number
  showStock: boolean
  showTags: boolean
}

// ─── Status Configs ─────────────────────────────────────────────────────────

const orderStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'در انتظار پرداخت', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' },
  paid: { label: 'پرداخت شده', color: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-100 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800' },
  processing: { label: 'در حال پردازش', color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800' },
  shipped: { label: 'ارسال شده', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' },
  completed: { label: 'تکمیل شده', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' },
  cancelled: { label: 'لغو شده', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800' },
  returned: { label: 'مرجوع شده', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800' },
}

const productStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'فعال', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' },
  inactive: { label: 'غیرفعال', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700' },
  draft: { label: 'پیش‌نویس', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' },
}

// ─── Sample Data ────────────────────────────────────────────────────────────

const initialProducts: Product[] = [
  { id: 'p1', name: 'لپ‌تاپ ایسوس زنف‌بوک ۱۴', slug: 'asus-zenbook-14', shortDesc: 'لپ‌تاپ سبک و قدرتمند', fullDesc: 'لپ‌تاپ سبک و قدرتمند با پردازنده نسل ۱۳ اینتل و ۱۶ گیگابایت رم', price: 45000000, salePrice: 42000000, sku: 'ASU-ZB14-001', stock: 25, minStock: 5, category: 'لوازم الکترونیکی', tags: ['پرفروش', 'تخفیف ویژه'], image: '💻', gallery: ['💻', '🖥️'], status: 'active', weight: 1.4, dimensions: '۳۲×۲۲×۱.۸', createdAt: '۱۴۰۳/۰۹/۱۵' },
  { id: 'p2', name: 'گوشی سامسونگ گلکسی S24', slug: 'samsung-galaxy-s24', shortDesc: 'گوشی پرچمدار سامسونگ', fullDesc: 'گوشی پرچمدار سامسونگ با دوربین ۲۰۰ مگاپیکسل و پردازنده اسنپ‌دراگون ۸ نسل ۳', price: 38000000, salePrice: 36000000, sku: 'SAM-S24-001', stock: 40, minStock: 10, category: 'لوازم الکترونیکی', tags: ['پرفروش', 'جدید'], image: '📱', gallery: ['📱'], status: 'active', weight: 0.17, dimensions: '۱۵×۷×۰.۸', createdAt: '۱۴۰۳/۰۹/۱۰' },
  { id: 'p3', name: 'هدفون سونی WH-1000XM5', slug: 'sony-wh1000xm5', shortDesc: 'هدفون بی‌سیم با نویزکنسلینگ', fullDesc: 'هدفون بی‌سیم با قابلیت نویزکنسلینگ فعال و باتری ۳۰ ساعته', price: 12000000, salePrice: 0, sku: 'SON-WH1K-001', stock: 15, minStock: 3, category: 'لوازم الکترونیکی', tags: ['ویژه زمستان'], image: '🎧', gallery: ['🎧'], status: 'active', weight: 0.25, dimensions: '۲۲×۱۸×۸', createdAt: '۱۴۰۳/۰۸/۲۰' },
  { id: 'p4', name: 'پیراهن مردانه کلاسیک', slug: 'classic-mens-shirt', shortDesc: 'پیراهن رسمی با پارچه نخی', fullDesc: 'پیراهن رسمی با پارچه نخی درجه یک، مناسب فصل بهار و تابستان', price: 850000, salePrice: 0, sku: 'CLO-SHR-001', stock: 120, minStock: 20, category: 'پوشاک و مد', tags: ['جدید'], image: '👔', gallery: ['👔'], status: 'active', weight: 0.2, dimensions: '۴۰×۳۰×۲', createdAt: '۱۴۰۳/۰۸/۲۵' },
  { id: 'p5', name: 'کفش ورزشی نایکی ایرمکس', slug: 'nike-airmax-sport', shortDesc: 'کفش ورزشی راحت', fullDesc: 'کفش ورزشی راحت برای استفاده روزانه با زیره انعطاف‌پذیر', price: 4200000, salePrice: 3500000, sku: 'CLO-NKE-001', stock: 60, minStock: 10, category: 'پوشاک و مد', tags: ['تخفیف ویژه', 'پرفروش'], image: '👟', gallery: ['👟'], status: 'active', weight: 0.8, dimensions: '۳۰×۱۲×۱۰', createdAt: '۱۴۰۳/۰۹/۰۱' },
  { id: 'p6', name: 'عسل طبیعی کوهستان ۵۰۰ گرم', slug: 'natural-mountain-honey', shortDesc: 'عسل خالص و طبیعی', fullDesc: 'عسل خالص و طبیعی از دامنه‌های زاگرس، بدون افزودنی', price: 350000, salePrice: 0, sku: 'FOD-HNY-001', stock: 200, minStock: 30, category: 'مواد غذایی و آشامیدنی', tags: ['پرفروش', 'ارسال رایگان'], image: '🍯', gallery: ['🍯'], status: 'active', weight: 0.55, dimensions: '۱۰×۱۰×۱۲', createdAt: '۱۴۰۳/۰۷/۱۰' },
  { id: 'p7', name: 'چای سبز ارگانیک', slug: 'organic-green-tea', shortDesc: 'چای سبز پرکیفیت', fullDesc: 'چای سبز پرکیفیت از باغ‌های لاهیجان', price: 180000, salePrice: 0, sku: 'FOD-TEA-001', stock: 0, minStock: 20, category: 'مواد غذایی و آشامیدنی', tags: [], image: '🍵', gallery: ['🍵'], status: 'inactive', weight: 0.1, dimensions: '۱۰×۱۰×۱۵', createdAt: '۱۴۰۳/۰۶/۱۵' },
  { id: 'p8', name: 'ست آشپزخانه ۱۲ پارچه', slug: 'kitchen-set-12pc', shortDesc: 'ست قابلمه و تابه سرامیکی', fullDesc: 'ست قابلمه و تابه با روکش سرامیکی و دسته‌های ضد حرارت', price: 2800000, salePrice: 2400000, sku: 'HOM-KIT-001', stock: 35, minStock: 5, category: 'خانه و دکوراسیون', tags: ['تخفیف ویژه'], image: '🍳', gallery: ['🍳'], status: 'active', weight: 5.2, dimensions: '۵۰×۳۰×۲۵', createdAt: '۱۴۰۳/۰۸/۰۵' },
  { id: 'p9', name: 'مبل ال شکل مدرن', slug: 'modern-l-shape-sofa', shortDesc: 'مبل راحتی ال شکل', fullDesc: 'مبل راحتی ال شکل با پارچه ضد لک و اسکلت فلزی محکم', price: 32000000, salePrice: 0, sku: 'HOM-SFA-001', stock: 8, minStock: 2, category: 'خانه و دکوراسیون', tags: ['محدود'], image: '🛋️', gallery: ['🛋️'], status: 'active', weight: 85, dimensions: '۲۵۰×۱۸۰×۸۵', createdAt: '۱۴۰۳/۰۷/۲۰' },
  { id: 'p10', name: 'تبلت اپل آیپد ایر', slug: 'apple-ipad-air', shortDesc: 'تبلت اپل با M1', fullDesc: 'تبلت اپل آیپد ایر نسل ۵ با چیپ M1 و صفحه نمایش ۱۰.۹ اینچی', price: 28000000, salePrice: 0, sku: 'ELC-IPA-001', stock: 0, minStock: 3, category: 'لوازم الکترونیکی', tags: ['محدود'], image: '📱', gallery: ['📱'], status: 'draft', weight: 0.46, dimensions: '۲۵×۱۷×۰.۶', createdAt: '۱۴۰۳/۰۹/۲۰' },
  { id: 'p11', name: 'مانتو زنانه بهاره', slug: 'spring-womens-coat', shortDesc: 'مانتو شیک با گلدوزی', fullDesc: 'مانتو شیک با طرح گلدوزی دستی، سایز ۳۸ تا ۴۸', price: 1200000, salePrice: 990000, sku: 'CLO-MNT-001', stock: 80, minStock: 15, category: 'پوشاک و مد', tags: ['تخفیف ویژه', 'جدید'], image: '👗', gallery: ['👗'], status: 'active', weight: 0.4, dimensions: '۴۵×۳۵×۳', createdAt: '۱۴۰۳/۰۹/۰۵' },
  { id: 'p12', name: 'زعفران نگین سرگل ۵ گرم', slug: 'saffron-negin-5g', shortDesc: 'زعفران درجه یک قائنات', fullDesc: 'زعفران نگین درجه یک از مزارع قائنات، بسته‌بندی طلایی', price: 950000, salePrice: 0, sku: 'FOD-SAF-001', stock: 150, minStock: 25, category: 'مواد غذایی و آشامیدنی', tags: ['پرفروش', 'ارسال رایگان'], image: '🌸', gallery: ['🌸'], status: 'active', weight: 0.01, dimensions: '۵×۵×۸', createdAt: '۱۴۰۳/۰۵/۱۰' },
  { id: 'p13', name: 'سرم ویتامین C پوستی', slug: 'vitamin-c-serum', shortDesc: 'سرم ضد لک و روشن‌کننده', fullDesc: 'سرم ویتامین C با غلظت ۲۰٪ برای روشن‌سازی و جوانسازی پوست', price: 450000, salePrice: 380000, sku: 'BEA-SER-001', stock: 90, minStock: 15, category: 'زیبایی و بهداشت', tags: ['تخفیف ویژه'], image: '✨', gallery: ['✨'], status: 'active', weight: 0.05, dimensions: '۴×۴×۱۲', createdAt: '۱۴۰۳/۰۸/۳۰' },
  { id: 'p14', name: 'مجموعه اشعار حافظ', slug: 'hafez-poetry-book', shortDesc: 'دیوان حافظ با تصحیح قاسم غنی', fullDesc: 'مجموعه اشعار حافظ شیرازی با تصحیح قاسم غنی و Giovanni، چاپ امیرکبیر', price: 280000, salePrice: 0, sku: 'BOK-HAF-001', stock: 200, minStock: 30, category: 'کتاب و لوازم تحریر', tags: ['پرفروش'], image: '📖', gallery: ['📖'], status: 'active', weight: 0.35, dimensions: '۲۰×۱۴×۲', createdAt: '۱۴۰۳/۰۶/۰۱' },
  { id: 'p15', name: 'دمبل ۱۰ کیلویی جفتی', slug: 'dumbbell-10kg-pair', shortDesc: 'دمبل روکش لاستیکی', fullDesc: 'دمبل ۱۰ کیلویی جفتی با روکش لاستیکی ضد لغزش و دسته ارگونومیک', price: 1800000, salePrice: 1500000, sku: 'SPT-DMB-001', stock: 45, minStock: 8, category: 'ورزش و سفر', tags: ['تخفیف ویژه'], image: '🏋️', gallery: ['🏋️'], status: 'active', weight: 21, dimensions: '۳۵×۱۵×۱۵', createdAt: '۱۴۰۳/۰۸/۱۵' },
]

const initialOrders: Order[] = [
  { id: 'o1', orderNumber: 'ORD-1403091', customer: 'علی محمدی', customerPhone: '۰۹۱۲۱۲۳۴۵۶۷', items: [{ name: 'لپ‌تاپ ایسوس زنف‌بوک ۱۴', quantity: 1, price: 42000000, total: 42000000 }], subtotal: 42000000, shippingCost: 50000, tax: 2100000, total: 44150000, status: 'completed', shippingAddress: 'تهران، خیابان ولیعصر، پلاک ۱۲۳', notes: 'لطفاً قبل از ارسال تماس بگیرید', createdAt: '۱۴۰۳/۰۹/۱۵' },
  { id: 'o2', orderNumber: 'ORD-1403092', customer: 'فاطمه احمدی', customerPhone: '۰۹۳۵۱۲۳۴۵۶۷', items: [{ name: 'گوشی سامسونگ گلکسی S24', quantity: 1, price: 36000000, total: 36000000 }, { name: 'قاب گوشی', quantity: 1, price: 150000, total: 150000 }], subtotal: 36150000, shippingCost: 35000, tax: 1807500, total: 37992500, status: 'shipped', shippingAddress: 'اصفهان، خیابان چهارباغ، کوچه ۵', notes: '', createdAt: '۱۴۰۳/۰۹/۱۴' },
  { id: 'o3', orderNumber: 'ORD-1403093', customer: 'رضا کریمی', customerPhone: '۰۹۱۳۱۲۳۴۵۶۷', items: [{ name: 'عسل طبیعی کوهستان ۵۰۰ گرم', quantity: 3, price: 350000, total: 1050000 }, { name: 'زعفران نگین سرگل ۵ گرم', quantity: 2, price: 950000, total: 1900000 }], subtotal: 2950000, shippingCost: 0, tax: 147500, total: 3097500, status: 'paid', shippingAddress: 'شیراز، بلوار ارم، خیابان ۲۳', notes: 'ارسال رایگان', createdAt: '۱۴۰۳/۰۹/۱۴' },
  { id: 'o4', orderNumber: 'ORD-1403094', customer: 'مریم حسینی', customerPhone: '۰۹۳۶۱۲۳۴۵۶۷', items: [{ name: 'مانتو زنانه بهاره', quantity: 2, price: 990000, total: 1980000 }], subtotal: 1980000, shippingCost: 25000, tax: 99000, total: 2104000, status: 'processing', shippingAddress: 'مشهد، خیابان امام رضا، پلاک ۴۵', notes: '', createdAt: '۱۴۰۳/۰۹/۱۳' },
  { id: 'o5', orderNumber: 'ORD-1403095', customer: 'حسین رضایی', customerPhone: '۰۹۱۴۱۲۳۴۵۶۷', items: [{ name: 'ست آشپزخانه ۱۲ پارچه', quantity: 1, price: 2400000, total: 2400000 }], subtotal: 2400000, shippingCost: 45000, tax: 120000, total: 2565000, status: 'pending', shippingAddress: 'تبریز، خیابان ائل‌گلی، پلاک ۸۸', notes: 'لطفاً فاکتور همراه مرسوله باشد', createdAt: '۱۴۰۳/۰۹/۱۳' },
  { id: 'o6', orderNumber: 'ORD-1403096', customer: 'زهرا موسوی', customerPhone: '۰۹۳۷۱۲۳۴۵۶۷', items: [{ name: 'سرم ویتامین C پوستی', quantity: 2, price: 380000, total: 760000 }], subtotal: 760000, shippingCost: 20000, tax: 38000, total: 818000, status: 'completed', shippingAddress: 'کرج، مهرشهر، فاز ۴، پلاک ۲۰', notes: '', createdAt: '۱۴۰۳/۰۹/۱۲' },
  { id: 'o7', orderNumber: 'ORD-1403097', customer: 'محمد جعفری', customerPhone: '۰۹۱۸۱۲۳۴۵۶۷', items: [{ name: 'دمبل ۱۰ کیلویی جفتی', quantity: 1, price: 1500000, total: 1500000 }, { name: 'کفش ورزشی نایکی ایرمکس', quantity: 1, price: 3500000, total: 3500000 }], subtotal: 5000000, shippingCost: 0, tax: 250000, total: 5250000, status: 'shipped', shippingAddress: 'اهواز، کیانپارس، بلوار ۲۴', notes: 'ارسال رایگان', createdAt: '۱۴۰۳/۰۹/۱۲' },
  { id: 'o8', orderNumber: 'ORD-1403098', customer: 'سارا نوری', customerPhone: '۰۹۳۸۱۲۳۴۵۶۷', items: [{ name: 'مجموعه اشعار حافظ', quantity: 1, price: 280000, total: 280000 }], subtotal: 280000, shippingCost: 15000, tax: 14000, total: 309000, status: 'cancelled', shippingAddress: 'قم، خیابان معلم، کوچه ۳', notes: 'مشتری درخواست لغو کرد', createdAt: '۱۴۰۳/۰۹/۱۱' },
  { id: 'o9', orderNumber: 'ORD-1403099', customer: 'امیر صادقی', customerPhone: '۰۹۱۹۱۲۳۴۵۶۷', items: [{ name: 'هدفون سونی WH-1000XM5', quantity: 1, price: 12000000, total: 12000000 }], subtotal: 12000000, shippingCost: 30000, tax: 600000, total: 12630000, status: 'returned', shippingAddress: 'رشت، خیابان سعدی، پلاک ۱۵', notes: 'کالا معیوب بود', createdAt: '۱۴۰۳/۰۹/۱۰' },
  { id: 'o10', orderNumber: 'ORD-1403100', customer: 'نرگس رحمانی', customerPhone: '۰۹۲۰۱۲۳۴۵۶۷', items: [{ name: 'پیراهن مردانه کلاسیک', quantity: 3, price: 850000, total: 2550000 }, { name: 'مانتو زنانه بهاره', quantity: 1, price: 990000, total: 990000 }], subtotal: 3540000, shippingCost: 35000, tax: 177000, total: 3752000, status: 'paid', shippingAddress: 'یزد، خیابان امیرچخماق، پلاک ۷۰', notes: '', createdAt: '۱۴۰۳/۰۹/۱۰' },
  { id: 'o11', orderNumber: 'ORD-1403101', customer: 'کیان باقری', customerPhone: '۰۹۱۱۲۲۳۳۴۴۵', items: [{ name: 'مبل ال شکل مدرن', quantity: 1, price: 32000000, total: 32000000 }], subtotal: 32000000, shippingCost: 150000, tax: 1600000, total: 33750000, status: 'processing', shippingAddress: 'تهران، سعادت‌آباد، بلوار دریا', notes: 'تحویل درب ساختمان', createdAt: '۱۴۰۳/۰۹/۰۹' },
  { id: 'o12', orderNumber: 'ORD-1403102', customer: 'مهسا تقوی', customerPhone: '۰۹۳۳۲۲۳۳۴۴۵', items: [{ name: 'چای سبز ارگانیک', quantity: 5, price: 180000, total: 900000 }, { name: 'عسل طبیعی کوهستان ۵۰۰ گرم', quantity: 2, price: 350000, total: 700000 }], subtotal: 1600000, shippingCost: 0, tax: 80000, total: 1680000, status: 'completed', shippingAddress: 'کرمانشاه، خیابان طالقانی، پلاک ۳۳', notes: '', createdAt: '۱۴۰۳/۰۹/۰۸' },
  { id: 'o13', orderNumber: 'ORD-1403103', customer: 'آرش فرهادی', customerPhone: '۰۹۱۶۲۲۳۳۴۴۵', items: [{ name: 'کفش ورزشی نایکی ایرمکس', quantity: 1, price: 3500000, total: 3500000 }], subtotal: 3500000, shippingCost: 25000, tax: 175000, total: 3700000, status: 'pending', shippingAddress: 'ساری، خیابان ۲۲ بهمن، پلاک ۱۱', notes: 'لطفاً سایز ۴۳ باشد', createdAt: '۱۴۰۳/۰۹/۰۸' },
  { id: 'o14', orderNumber: 'ORD-1403104', customer: 'لیلا کشاورز', customerPhone: '۰۹۳۹۲۲۳۳۴۴۵', items: [{ name: 'زعفران نگین سرگل ۵ گرم', quantity: 10, price: 950000, total: 9500000 }], subtotal: 9500000, shippingCost: 0, tax: 475000, total: 9975000, status: 'completed', shippingAddress: 'مشهد، بلوار وکیل‌آباد، پلاک ۱۴۰', notes: 'خرید عمده', createdAt: '۱۴۰۳/۰۹/۰۷' },
  { id: 'o15', orderNumber: 'ORD-1403105', customer: 'بهنام خانی', customerPhone: '۰۹۱۲۳۳۴۴۵۵۶', items: [{ name: 'تبلت اپل آیپد ایر', quantity: 1, price: 28000000, total: 28000000 }, { name: 'قلم اپل پنسیل', quantity: 1, price: 3500000, total: 3500000 }], subtotal: 31500000, shippingCost: 40000, tax: 1575000, total: 33115000, status: 'shipped', shippingAddress: 'تهران، ونک، خیابان گاندی، پلاک ۹۰', notes: '', createdAt: '۱۴۰۳/۰۹/۰۶' },
  { id: 'o16', orderNumber: 'ORD-1403106', customer: 'سمیرا عباسی', customerPhone: '۰۹۳۴۳۳۴۴۵۵۶', items: [{ name: 'سرم ویتامین C پوستی', quantity: 1, price: 380000, total: 380000 }, { name: 'مجموعه اشعار حافظ', quantity: 2, price: 280000, total: 560000 }], subtotal: 940000, shippingCost: 20000, tax: 47000, total: 1007000, status: 'paid', shippingAddress: 'بجنورد، بلوار شهید آوینی', notes: '', createdAt: '۱۴۰۳/۰۹/۰۵' },
]

const initialCategories: Category[] = [
  { id: 'c1', name: 'لوازم الکترونیکی', slug: 'electronics', description: 'گوشی، لپ‌تاپ، تبلت و لوازم جانبی', image: '💻', parentId: null, productCount: 4 },
  { id: 'c2', name: 'گوشی موبایل', slug: 'mobile-phones', description: 'انواع گوشی موبایل', image: '📱', parentId: 'c1', productCount: 1 },
  { id: 'c3', name: 'لپ‌تاپ و کامپیوتر', slug: 'laptops-computers', description: 'لپ‌تاپ و کامپیوترهای رومیزی', image: '💻', parentId: 'c1', productCount: 1 },
  { id: 'c4', name: 'پوشاک و مد', slug: 'clothing-fashion', description: 'پوشاک مردانه و زنانه', image: '👔', parentId: null, productCount: 3 },
  { id: 'c5', name: 'پوشاک مردانه', slug: 'mens-clothing', description: 'پیراهن، شلوار و کفش مردانه', image: '👔', parentId: 'c4', productCount: 1 },
  { id: 'c6', name: 'پوشاک زنانه', slug: 'womens-clothing', description: 'مانتو، بلوز و کیف زنانه', image: '👗', parentId: 'c4', productCount: 1 },
  { id: 'c7', name: 'مواد غذایی و آشامیدنی', slug: 'food-beverages', description: 'مواد غذایی و نوشیدنی‌ها', image: '🍯', parentId: null, productCount: 3 },
  { id: 'c8', name: 'خانه و دکوراسیون', slug: 'home-decoration', description: 'لوازم خانه و دکوراسیون', image: '🏠', parentId: null, productCount: 2 },
  { id: 'c9', name: 'زیبایی و بهداشت', slug: 'beauty-health', description: 'محصولات آرایشی و بهداشتی', image: '✨', parentId: null, productCount: 1 },
  { id: 'c10', name: 'کتاب و لوازم تحریر', slug: 'books-stationery', description: 'کتاب، دفتر و لوازم‌التحریر', image: '📖', parentId: null, productCount: 1 },
  { id: 'c11', name: 'ورزش و سفر', slug: 'sports-travel', description: 'لوازم ورزشی و سفر', image: '🏋️', parentId: null, productCount: 1 },
  { id: 'c12', name: 'اسباب‌بازی', slug: 'toys', description: 'اسباب‌بازی و بازی‌های فکری', image: '🧸', parentId: null, productCount: 0 },
]

const initialTags: Tag[] = [
  { id: 't1', name: 'تخفیف ویژه', slug: 'special-discount', productCount: 7 },
  { id: 't2', name: 'پرفروش', slug: 'bestseller', productCount: 5 },
  { id: 't3', name: 'جدید', slug: 'new', productCount: 4 },
  { id: 't4', name: 'محدود', slug: 'limited', productCount: 3 },
  { id: 't5', name: 'ویژه زمستان', slug: 'winter-special', productCount: 1 },
  { id: 't6', name: 'ارسال رایگان', slug: 'free-shipping', productCount: 3 },
]

const initialCoupons: Coupon[] = [
  { id: 'cp1', code: 'WINTER20', type: 'percent', value: 20, minOrder: 500000, maxDiscount: 2000000, usedCount: 145, maxUsage: 500, startDate: '۱۴۰۳/۰۹/۰۱', expiryDate: '۱۴۰۳/۱۱/۳۰', allowedProducts: '', allowedCategories: 'همه', active: true },
  { id: 'cp2', code: 'FIRST50', type: 'fixed', value: 500000, minOrder: 2000000, maxDiscount: 500000, usedCount: 89, maxUsage: 200, startDate: '۱۴۰۳/۰۱/۰۱', expiryDate: '۱۴۰۴/۰۱/۰۱', allowedProducts: '', allowedCategories: 'همه', active: true },
  { id: 'cp3', code: 'FREEDELIVERY', type: 'fixed', value: 0, minOrder: 1000000, maxDiscount: 100000, usedCount: 312, maxUsage: 0, startDate: '۱۴۰۳/۰۶/۰۱', expiryDate: '۱۴۰۳/۱۲/۲۹', allowedProducts: '', allowedCategories: 'همه', active: true },
  { id: 'cp4', code: 'VIP30', type: 'percent', value: 30, minOrder: 5000000, maxDiscount: 5000000, usedCount: 23, maxUsage: 50, startDate: '۱۴۰۳/۰۸/۰۱', expiryDate: '۱۴۰۳/۱۰/۳۰', allowedProducts: '', allowedCategories: 'لوازم الکترونیکی', active: true },
  { id: 'cp5', code: 'SUMMER15', type: 'percent', value: 15, minOrder: 300000, maxDiscount: 1000000, usedCount: 0, maxUsage: 1000, startDate: '۱۴۰۴/۰۴/۰۱', expiryDate: '۱۴۰۴/۰۶/۳۱', allowedProducts: '', allowedCategories: 'پوشاک و مد', active: false },
  { id: 'cp6', code: 'BOOK10', type: 'percent', value: 10, minOrder: 100000, maxDiscount: 200000, usedCount: 67, maxUsage: 300, startDate: '۱۴۰۳/۰۵/۰۱', expiryDate: '۱۴۰۴/۰۵/۳۱', allowedProducts: '', allowedCategories: 'کتاب و لوازم تحریر', active: true },
  { id: 'cp7', code: 'SPRING25', type: 'percent', value: 25, minOrder: 1000000, maxDiscount: 3000000, usedCount: 178, maxUsage: 400, startDate: '۱۴۰۳/۰۱/۰۱', expiryDate: '۱۴۰۳/۰۳/۳۱', allowedProducts: '', allowedCategories: 'همه', active: false },
  { id: 'cp8', code: 'LOYALTY100', type: 'fixed', value: 1000000, minOrder: 8000000, maxDiscount: 1000000, usedCount: 12, maxUsage: 100, startDate: '۱۴۰۳/۰۷/۰۱', expiryDate: '۱۴۰۴/۰۶/۳۱', allowedProducts: '', allowedCategories: 'همه', active: true },
  { id: 'cp9', code: 'BEAUTY5', type: 'percent', value: 5, minOrder: 200000, maxDiscount: 500000, usedCount: 95, maxUsage: 0, startDate: '۱۴۰۳/۰۳/۰۱', expiryDate: '۱۴۰۴/۰۲/۳۰', allowedProducts: '', allowedCategories: 'زیبایی و بهداشت', active: true },
]

const initialSettings: StoreSettings = {
  storeName: 'فروشگاه آنلاین مگامارکت',
  storeAddress: 'تهران، خیابان ولیعصر، پلاک ۱۰۰',
  country: 'ایران',
  province: 'تهران',
  city: 'تهران',
  postalCode: '۱۲۳۴۵۶۷۸۹۰',
  currency: 'تومان',
  shippingMethod: 'پست پیشتاز',
  shippingCost: 50000,
  freeShippingMin: 1000000,
  paymentZarinpal: true,
  paymentIdpay: true,
  paymentNextpay: false,
  paymentCod: true,
  taxEnabled: true,
  taxRate: 9,
  taxExemptRegions: 'مناطق آزاد تجاری، کیش',
  productsPerPage: 12,
  showStock: true,
  showTags: true,
}

// ─── Empty Templates ───────────────────────────────────────────────────────

const emptyProduct: Omit<Product, 'id' | 'createdAt'> = {
  name: '', slug: '', shortDesc: '', fullDesc: '', price: 0, salePrice: 0,
  sku: '', stock: 0, minStock: 5, category: 'لوازم الکترونیکی', tags: [],
  image: '📦', gallery: [], status: 'draft', weight: 0, dimensions: '',
}

const emptyCategory: Omit<Category, 'id' | 'productCount'> = {
  name: '', slug: '', description: '', image: '📁', parentId: null,
}

const emptyTag: Omit<Tag, 'id' | 'productCount'> = {
  name: '', slug: '',
}

const emptyCoupon: Omit<Coupon, 'id'> = {
  code: '', type: 'percent', value: 0, minOrder: 0, maxDiscount: 0,
  usedCount: 0, maxUsage: 0, startDate: '', expiryDate: '',
  allowedProducts: '', allowedCategories: '', active: true,
}

// ─── Revenue Dashboard Cards (extracted to avoid useMemo-in-JSX lint error) ──────────

function RevenueDashboardCards({ orders }: { orders: Order[] }) {
  const statusRevenue = useMemo(() => {
    const map = new Map<string, number>()
    orders.forEach(o => {
      const current = map.get(o.status) ?? 0
      map.set(o.status, current + o.total)
    })
    return map
  }, [orders])

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
  const completedRevenue = statusRevenue.get('completed') ?? 0
  const pendingRevenue = (statusRevenue.get('pending') ?? 0) + (statusRevenue.get('processing') ?? 0)
  const returnedAmount = statusRevenue.get('returned') ?? 0

  return (
    <>
      {[
        { label: 'کل فروش', value: totalRevenue, color: 'text-foreground', icon: CircleDollarSign },
        { label: 'تکمیل شده', value: completedRevenue, color: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
        { label: 'در انتظار/پردازش', value: pendingRevenue, color: 'text-amber-600 dark:text-amber-400', icon: Clock },
        { label: 'مرجوع شده', value: returnedAmount, color: 'text-red-600 dark:text-red-400', icon: RotateCcw },
      ].map(item => (
        <div key={item.label} className="p-3 rounded-lg border bg-background/40">
          <div className="flex items-center gap-1.5 mb-1">
            <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
          <p className={`text-sm font-bold tabular-nums ${item.color}`}>{formatPrice(item.value)} <span className="text-[10px] font-normal text-muted-foreground">تومان</span></p>
        </div>
      ))}
    </>
  )
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function StorePage() {
  // ── API Data Layer ──
  const cms = useCMSData()
  useEnsureData(['products', 'orders', 'product-categories', 'coupons', 'inventory', 'invoices', 'customers'])

  const apiProducts = (cms.products.data ?? []) as ApiProduct[]
  const apiOrders = (cms.orders.data ?? []) as ApiOrder[]
  const apiProductCategories = (cms.productCategories.data ?? []) as ApiProductCategory[]
  const apiCoupons = (cms.coupons.data ?? []) as ApiCoupon[]
  const apiInventory = (cms.inventory.data ?? []) as ApiInventoryItem[]
  const apiInvoices = (cms.invoices.data ?? []) as ApiInvoice[]
  const apiCustomers = (cms.customers.data ?? []) as Customer[]

  const isDataLoading = cms.products.isLoading || cms.orders.isLoading

  // ── Inventory Lookup ──
  const inventoryByProduct = useMemo(() => {
    const map = new Map<string, ApiInventoryItem>()
    apiInventory.forEach(inv => { if (inv.productId) map.set(inv.productId, inv) })
    return map
  }, [apiInventory])

  // ── Invoice Lookup by Order ──
  const invoicesByOrder = useMemo(() => {
    const map = new Map<string, ApiInvoice[]>()
    apiInvoices.forEach(inv => {
      if (inv.orderId) {
        const existing = map.get(inv.orderId) ?? []
        existing.push(inv)
        map.set(inv.orderId, existing)
      }
    })
    return map
  }, [apiInvoices])

  // ── Customer Lookup ──
  const customerById = useMemo(() => {
    const map = new Map<string, Customer>()
    apiCustomers.forEach(c => map.set(c.id, c))
    return map
  }, [apiCustomers])

  // ── Derived data from API (useMemo avoids set-state-in-effect lint error) ──
  const apiMappedProducts = useMemo<Product[]>(() => {
    if (apiProducts.length === 0) return initialProducts
    return apiProducts.map(p => {
      const inv = inventoryByProduct.get(p.id)
      return {
        id: p.id,
        name: p.name,
        slug: p.sku?.toLowerCase().replace(/\s+/g, '-') ?? '',
        shortDesc: p.description?.slice(0, 80) ?? '',
        fullDesc: p.description ?? '',
        price: p.price ?? 0,
        salePrice: p.salePrice ?? 0,
        sku: p.sku ?? '',
        stock: inv?.stock ?? 0,
        minStock: inv?.minStock ?? 5,
        category: p.productCategory?.name ?? '',
        tags: [],
        image: '📦',
        gallery: [],
        status: (p.status === 'active' || p.status === 'inactive' || p.status === 'draft') ? p.status : 'draft',
        weight: 0,
        dimensions: '',
        createdAt: formatDate(p.createdAt),
      }
    })
  }, [apiProducts, inventoryByProduct])

  const apiMappedOrders = useMemo<Order[]>(() => {
    if (apiOrders.length === 0) return initialOrders
    return apiOrders.map(o => {
      const cust = customerById.get(o.customerId)
      return {
        id: o.id,
        orderNumber: o.orderNumber ?? '',
        customer: cust?.name ?? o.customerId ?? '',
        customerPhone: cust?.phone ?? '',
        items: (o.items ?? []).map((item: ApiOrderItem) => ({
          name: item.product?.name ?? 'محصول',
          quantity: item.quantity ?? 1,
          price: item.unitPrice ?? 0,
          total: item.totalPrice ?? 0,
        })),
        subtotal: o.subtotal ?? 0,
        shippingCost: o.shippingCost ?? 0,
        tax: o.tax ?? 0,
        total: o.total ?? 0,
        status: (['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'returned'].includes(o.status) ? o.status : 'pending') as Order['status'],
        shippingAddress: o.shippingAddress ?? '',
        notes: o.notes ?? '',
        createdAt: formatDate(o.createdAt),
      }
    })
  }, [apiOrders, customerById])

  const apiMappedCategories = useMemo<Category[]>(() => {
    if (apiProductCategories.length === 0) return initialCategories
    return apiProductCategories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      image: '📁',
      parentId: null,
      productCount: c.products?.length ?? 0,
    }))
  }, [apiProductCategories])

  const apiMappedCoupons = useMemo<Coupon[]>(() => {
    if (apiCoupons.length === 0) return initialCoupons
    return apiCoupons.map(c => ({
      id: c.id,
      code: c.code ?? '',
      type: (c.type === 'percent' || c.type === 'fixed') ? c.type : 'percent',
      value: c.value ?? 0,
      minOrder: c.minPurchase ?? 0,
      maxDiscount: 0,
      usedCount: c.usedCount ?? 0,
      maxUsage: c.maxUses ?? 0,
      startDate: c.createdAt ? formatDate(c.createdAt) : '',
      expiryDate: c.expiresAt ? formatDate(c.expiresAt) : '',
      allowedProducts: '',
      allowedCategories: '',
      active: c.active ?? false,
    }))
  }, [apiCoupons])

  // ── Mutable local state (starts from API-mapped data, supports CRUD) ──
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)

  // One-time sync from API to local state when API data first loads.
  // This is an intentional one-time sync, not a reactive effect pattern.
  const apiSynced = useMemo(() => apiProducts.length > 0 || apiOrders.length > 0, [apiProducts.length, apiOrders.length])
  useEffect(() => {
    if (apiSynced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-time API→local state sync
      setProducts(apiMappedProducts)
      setOrders(apiMappedOrders)
      setCategories(apiMappedCategories)
      setCoupons(apiMappedCoupons)
    }
  }, [apiSynced])
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [productStatusFilter, setProductStatusFilter] = useState('all')
  const [productSelected, setProductSelected] = useState<Set<string>>(new Set())
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<Omit<Product, 'id' | 'createdAt'>>(emptyProduct)
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  // ── Orders State (local UI only) ──
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // ── Categories State (local UI only) ──
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState<Omit<Category, 'id' | 'productCount'>>(emptyCategory)
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  // ── Tags State ──
  const [tags, setTags] = useState<Tag[]>(initialTags)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [tagForm, setTagForm] = useState<Omit<Tag, 'id' | 'productCount'>>(emptyTag)
  const [tagSelected, setTagSelected] = useState<Set<string>>(new Set())
  const [deleteTagDialogOpen, setDeleteTagDialogOpen] = useState(false)

  // ── Coupons State (local UI only) ──
  const [couponDialogOpen, setCouponDialogOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [couponForm, setCouponForm] = useState<Omit<Coupon, 'id'>>(emptyCoupon)

  // ── Settings State ──
  const [settings, setSettings] = useState<StoreSettings>(initialSettings)

  // ── Cross-Module Data Registration ──
  useRegisterStoreData(orders, products)
  const { getContactByName, getProductByName } = useCrossModuleStore()

  // ── Quick Stats ──
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length
  const monthRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0)
  const avgOrder = orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0

  // ── Product Helpers ──
  const categoryNames = useMemo(() => [...new Set(categories.map(c => c.name))], [categories])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !productSearch || p.name.includes(productSearch) || p.sku.includes(productSearch)
      const matchCategory = productCategoryFilter === 'all' || p.category === productCategoryFilter
      const matchStatus = productStatusFilter === 'all' || p.status === productStatusFilter
      return matchSearch && matchCategory && matchStatus
    })
  }, [products, productSearch, productCategoryFilter, productStatusFilter])

  const toggleProductSelect = (id: string) => {
    setProductSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleProductSelectAll = () => {
    if (productSelected.size === filteredProducts.length) {
      setProductSelected(new Set())
    } else {
      setProductSelected(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const handleProductSave = () => {
    if (!productForm.name) return
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productForm } : p))
      toast.success('محصول با موفقیت بروزرسانی شد')
    } else {
      const newProduct: Product = { ...productForm, id: Date.now().toString(), createdAt: '۱۴۰۳/۰۹/۲۰' }
      setProducts(prev => [...prev, newProduct])
      toast.success('محصول جدید با موفقیت ایجاد شد')
    }
    setProductDialogOpen(false)
  }

  const handleProductDelete = () => {
    if (!deletingProductId) return
    setProducts(prev => prev.filter(p => p.id !== deletingProductId))
    setDeleteProductDialogOpen(false)
    setDeletingProductId(null)
    toast.success('محصول با موفقیت حذف شد')
  }

  const handleBulkAction = (action: string) => {
    if (productSelected.size === 0) {
      toast.error('لطفاً حداقل یک محصول انتخاب کنید')
      return
    }
    if (action === 'delete') {
      setProducts(prev => prev.filter(p => !productSelected.has(p.id)))
      toast.success(`${toPersianDigits(productSelected.size)} محصول حذف شد`)
    } else if (action === 'active') {
      setProducts(prev => prev.map(p => productSelected.has(p.id) ? { ...p, status: 'active' } : p))
      toast.success(`${toPersianDigits(productSelected.size)} محصول فعال شد`)
    } else if (action === 'inactive') {
      setProducts(prev => prev.map(p => productSelected.has(p.id) ? { ...p, status: 'inactive' } : p))
      toast.success(`${toPersianDigits(productSelected.size)} محصول غیرفعال شد`)
    } else if (action === 'draft') {
      setProducts(prev => prev.map(p => productSelected.has(p.id) ? { ...p, status: 'draft' } : p))
      toast.success(`${toPersianDigits(productSelected.size)} محصول به پیش‌نویس تغییر یافت`)
    }
    setProductSelected(new Set())
  }

  const openProductCreate = () => {
    setEditingProduct(null)
    setProductForm(emptyProduct)
    setProductDialogOpen(true)
  }

  const openProductEdit = (product: Product) => {
    setEditingProduct(product)
    const { id, createdAt, ...rest } = product
    setProductForm(rest)
    setProductDialogOpen(true)
  }

  // ── Order Helpers ──
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = !orderSearch || o.orderNumber.includes(orderSearch) || o.customer.includes(orderSearch)
      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter
      return matchSearch && matchStatus
    })
  }, [orders, orderSearch, orderStatusFilter])

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    setOrderDetailOpen(true)
  }

  const handleOrderStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    toast.success('وضعیت سفارش بروزرسانی شد')
  }

  // ── Category Helpers ──
  const openCategoryCreate = () => {
    setEditingCategory(null)
    setCategoryForm(emptyCategory)
    setCategoryDialogOpen(true)
  }

  const openCategoryEdit = (cat: Category) => {
    setEditingCategory(cat)
    const { id, productCount, ...rest } = cat
    setCategoryForm(rest)
    setCategoryDialogOpen(true)
  }

  const handleCategorySave = () => {
    if (!categoryForm.name) return
    const slug = categoryForm.slug || generateSlug(categoryForm.name)
    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...categoryForm, slug } : c))
      toast.success('دسته‌بندی بروزرسانی شد')
    } else {
      const newCat: Category = { ...categoryForm, slug, id: Date.now().toString(), productCount: 0 }
      setCategories(prev => [...prev, newCat])
      toast.success('دسته‌بندی جدید ایجاد شد')
    }
    setCategoryDialogOpen(false)
  }

  const handleCategoryDelete = () => {
    if (!deletingCategoryId) return
    setCategories(prev => prev.filter(c => c.id !== deletingCategoryId))
    setDeleteCategoryDialogOpen(false)
    setDeletingCategoryId(null)
    toast.success('دسته‌بندی حذف شد')
  }

  const getCategoryDepth = (catId: string): number => {
    let depth = 0
    let current = categories.find(c => c.id === catId)
    while (current?.parentId) {
      depth++
      current = categories.find(c => c.id === current!.parentId)
    }
    return depth
  }

  // ── Tag Helpers ──
  const openTagCreate = () => {
    setEditingTag(null)
    setTagForm(emptyTag)
    setTagDialogOpen(true)
  }

  const openTagEdit = (tag: Tag) => {
    setEditingTag(tag)
    const { id, productCount, ...rest } = tag
    setTagForm(rest)
    setTagDialogOpen(true)
  }

  const handleTagSave = () => {
    if (!tagForm.name) return
    const slug = tagForm.slug || generateSlug(tagForm.name)
    if (editingTag) {
      setTags(prev => prev.map(t => t.id === editingTag.id ? { ...t, ...tagForm, slug } : t))
      toast.success('برچسب بروزرسانی شد')
    } else {
      const newTag: Tag = { ...tagForm, slug, id: Date.now().toString(), productCount: 0 }
      setTags(prev => [...prev, newTag])
      toast.success('برچسب جدید ایجاد شد')
    }
    setTagDialogOpen(false)
  }

  const toggleTagSelect = (id: string) => {
    setTagSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleTagBulkDelete = () => {
    if (tagSelected.size === 0) {
      toast.error('لطفاً حداقل یک برچسب انتخاب کنید')
      return
    }
    setTags(prev => prev.filter(t => !tagSelected.has(t.id)))
    toast.success(`${toPersianDigits(tagSelected.size)} برچسب حذف شد`)
    setTagSelected(new Set())
  }

  // ── Coupon Helpers ──
  const openCouponCreate = () => {
    setEditingCoupon(null)
    setCouponForm(emptyCoupon)
    setCouponDialogOpen(true)
  }

  const openCouponEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    const { id, ...rest } = coupon
    setCouponForm(rest)
    setCouponDialogOpen(true)
  }

  const handleCouponSave = () => {
    if (!couponForm.code) return
    if (editingCoupon) {
      setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? { ...c, ...couponForm } : c))
      toast.success('کوپن بروزرسانی شد')
    } else {
      const newCoupon: Coupon = { ...couponForm, id: Date.now().toString() }
      setCoupons(prev => [...prev, newCoupon])
      toast.success('کوپن جدید ایجاد شد')
    }
    setCouponDialogOpen(false)
  }

  const toggleCouponActive = (couponId: string) => {
    setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, active: !c.active } : c))
    toast.success('وضعیت کوپن تغییر کرد')
  }

  // ── Settings Helpers ──
  const updateSettings = (key: keyof StoreSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = () => {
    toast.success('تنظیمات فروشگاه ذخیره شد')
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">مدیریت فروشگاه</h1>
          <p className="text-sm text-muted-foreground mt-0.5">مدیریت کامل محصولات، سفارشات و تنظیمات فروشگاه</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Store className="h-3.5 w-3.5 text-pink-500" />
            ووکامرس فارسی
          </Badge>
        </div>
      </div>

      {/* ─── Quick Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'کل محصولات', value: toPersianDigits(products.length), icon: Package, gradient: 'from-pink-400 to-rose-500', shadow: 'shadow-pink-500/25', textColor: 'text-pink-600 dark:text-pink-400' },
          { label: 'سفارشات در انتظار', value: toPersianDigits(pendingOrders), icon: Clock, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/25', textColor: 'text-amber-600 dark:text-amber-400' },
          { label: 'درآمد ماه جاری', value: `${formatPrice(monthRevenue)} تومان`, icon: DollarSign, gradient: 'from-emerald-400 to-green-500', shadow: 'shadow-emerald-500/25', textColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'میانگین سفارش', value: `${formatPrice(avgOrder)} تومان`, icon: BarChart3, gradient: 'from-violet-400 to-purple-500', shadow: 'shadow-violet-500/25', textColor: 'text-violet-600 dark:text-violet-400' },
        ].map((stat, i) => (
          <Card key={stat.label} className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md ${stat.shadow} shrink-0`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-lg font-bold tabular-nums ${stat.textColor}`}>{stat.value}</p>
              </div>
              {/* Cross-Module Inventory Stock Badge */}
              {stat.label === 'کل محصولات' && (() => {
                const syncedProducts = useCrossModuleStore.getState().sharedProducts.filter(p => p.storeStatus && p.inventoryStatus)
                const stockMismatch = syncedProducts.filter(p => !p.stockSynced).length
                return stockMismatch > 0 ? (
                  <Badge variant="outline" className="text-[10px] gap-1 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-3 w-3" />
                    {toPersianDigits(stockMismatch)} عدم هماهنگی
                  </Badge>
                ) : null
              })()}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Cross-Module Sync Status ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        <CrossModuleSyncStatus />
      </div>

      {/* ─── Cross-Module: Stock Alerts ─── */}
      {(() => {
        const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= p.minStock)
        const outOfStockProducts = products.filter(p => p.stock === 0)
        if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) return null
        return (
          <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 glass-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">هشدار موجودی انبار</span>
                <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300 text-xs">
                  {toPersianDigits(lowStockProducts.length + outOfStockProducts.length)} محصول
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {[...outOfStockProducts.map(p => ({ ...p, alertLevel: 'out' as const })), ...lowStockProducts.map(p => ({ ...p, alertLevel: 'low' as const }))].map(p => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/60 border text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Warehouse className="h-3 w-3 text-muted-foreground" />
                        <span className={p.alertLevel === 'out' ? 'text-red-600 dark:text-red-400 font-bold' : 'text-amber-600 dark:text-amber-400'}>
                          {toPersianDigits(p.stock)} / {toPersianDigits(p.minStock)}
                        </span>
                        {(() => {
                          const inv = inventoryByProduct.get(p.id)
                          return inv ? (
                            <span className="text-muted-foreground mr-1">— {inv.warehouse}</span>
                          ) : null
                        })()}
                      </div>
                    </div>
                    <Badge variant={p.alertLevel === 'out' ? 'destructive' : 'outline'} className={`text-[10px] shrink-0 ${p.alertLevel === 'low' ? 'border-amber-300 text-amber-700 dark:text-amber-300' : ''}`}>
                      {p.alertLevel === 'out' ? 'ناموجود' : 'کمبود'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* ─── Cross-Module: Revenue Dashboard ─── */}
      <Card className="glass-card shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold">داشبورد درآمد</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <RevenueDashboardCards orders={orders} />
          </div>
        </CardContent>
      </Card>

      {/* ─── Main Tabs ─── */}
      <Tabs defaultValue="products" className="w-full" dir="rtl">
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md py-2 -mx-4 px-4 md:-mx-6 md:px-6 border-b">
          <TabsList className="w-full sm:w-auto flex flex-wrap h-auto gap-1 p-1">
            {[
              { value: 'products', label: 'محصولات', icon: Package, count: products.length },
              { value: 'orders', label: 'سفارشات', icon: ShoppingCart, count: orders.length },
              { value: 'categories', label: 'دسته‌بندی‌ها', icon: FolderOpen, count: categories.length },
              { value: 'tags', label: 'برچسب‌ها', icon: Tag, count: tags.length },
              { value: 'coupons', label: 'کوپن‌ها', icon: Gift, count: coupons.length },
              { value: 'settings', label: 'تنظیمات', icon: Settings, count: 0 },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] data-[state=active]:bg-white/20 data-[state=active]:text-white">
                    {toPersianDigits(tab.count)}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: PRODUCTS                                                     */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="products" className="space-y-4 mt-4">
          {/* Tab Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'کل', value: products.length, color: 'text-foreground' },
              { label: 'فعال', value: products.filter(p => p.status === 'active').length, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'غیرفعال', value: products.filter(p => p.status === 'inactive').length, color: 'text-gray-600 dark:text-gray-400' },
              { label: 'پیش‌نویس', value: products.filter(p => p.status === 'draft').length, color: 'text-amber-600 dark:text-amber-400' },
            ].map(s => (
              <Card key={s.label} className="glass-card shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold tabular-nums ${s.color}`}>{toPersianDigits(s.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters & Actions Bar */}
          <Card className="glass-card-pink shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Search */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو نام محصول یا SKU..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                {/* Category Filter */}
                <Select value={productCategoryFilter} onValueChange={setProductCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                    {categoryNames.map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Status Filter */}
                <Select value={productStatusFilter} onValueChange={setProductStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="active">فعال</SelectItem>
                    <SelectItem value="inactive">غیرفعال</SelectItem>
                    <SelectItem value="draft">پیش‌نویس</SelectItem>
                  </SelectContent>
                </Select>
                {/* Add Button */}
                <Button
                  className="gap-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                  onClick={openProductCreate}
                >
                  <Plus className="h-4 w-4" />
                  افزودن محصول
                </Button>
              </div>
              {/* Bulk Actions */}
              {productSelected.size > 0 && (
                <div className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <span className="text-sm text-pink-700 dark:text-pink-300 font-medium">
                    {toPersianDigits(productSelected.size)} محصول انتخاب شده
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-xs">
                        <Filter className="h-3.5 w-3.5" />
                        اقدام دسته‌جمعی
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>انتخاب bulk</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-600 dark:text-red-400">
                        <Trash2 className="h-4 w-4" /> حذف
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('active')}>
                        <CheckCircle2 className="h-4 w-4" /> تغییر وضعیت به فعال
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('inactive')}>
                        <XCircle className="h-4 w-4" /> غیرفعال
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('draft')}>
                        <Archive className="h-4 w-4" /> پیش‌نویس
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setProductSelected(new Set())}>
                    لغو انتخاب
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className="glass-card shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-10 p-3">
                        <Checkbox
                          checked={productSelected.size === filteredProducts.length && filteredProducts.length > 0}
                          onCheckedChange={toggleProductSelectAll}
                        />
                      </TableHead>
                      <TableHead className="p-3 text-xs font-semibold">تصویر</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">نام محصول</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">SKU</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">قیمت</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">موجودی</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">وضعیت</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">دسته‌بندی</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">تاریخ</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(product => {
                      const sc = productStatusConfig[product.status]
                      return (
                        <TableRow key={product.id} className="group" data-state={productSelected.has(product.id) ? 'selected' : undefined}>
                          <TableCell className="p-3">
                            <Checkbox
                              checked={productSelected.has(product.id)}
                              onCheckedChange={() => toggleProductSelect(product.id)}
                            />
                          </TableCell>
                          <TableCell className="p-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center justify-center text-xl">
                              {product.image}
                            </div>
                          </TableCell>
                          <TableCell className="p-3">
                            <div className="max-w-[200px]">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              {product.salePrice > 0 && (
                                <p className="text-xs text-red-500 line-through">{formatPrice(product.price)}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="p-3 text-xs text-muted-foreground font-mono" dir="ltr">{product.sku}</TableCell>
                          <TableCell className="p-3">
                            <span className={`font-bold text-sm tabular-nums ${product.salePrice > 0 ? 'text-red-500' : 'text-foreground'}`}>
                              {formatPrice(product.salePrice || product.price)}
                            </span>
                            <span className="text-[10px] text-muted-foreground mr-1">تومان</span>
                          </TableCell>
                          <TableCell className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-sm font-medium tabular-nums ${product.stock === 0 ? 'text-red-500' : product.stock <= product.minStock ? 'text-amber-500' : 'text-emerald-600'}`}>
                                {toPersianDigits(product.stock)}
                              </span>
                              {(() => {
                                const inventoryInfo = getProductByName(product.name)
                                return inventoryInfo && inventoryInfo.inventoryStatus ? (
                                  <Badge variant="outline" className={`text-[10px] gap-1 ${
                                    inventoryInfo.inventoryStatus === 'out-of-stock' ? 'border-red-300 text-red-600' :
                                    inventoryInfo.inventoryStatus === 'low-stock' ? 'border-amber-300 text-amber-600' :
                                    'border-emerald-300 text-emerald-600'
                                  }`}>
                                    <Warehouse className="h-3 w-3" />
                                    انبار: {toPersianDigits(inventoryInfo.inventoryStock)}
                                  </Badge>
                                ) : null
                              })()}
                            </div>
                          </TableCell>
                          <TableCell className="p-3">
                            <Badge variant="outline" className={`text-[10px] ${sc.color} ${sc.bg}`}>
                              {sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-3 text-xs text-muted-foreground">{product.category}</TableCell>
                          <TableCell className="p-3 text-xs text-muted-foreground">{product.createdAt}</TableCell>
                          <TableCell className="p-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => openProductEdit(product)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={() => { setDeletingProductId(product.id); setDeleteProductDialogOpen(true) }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {filteredProducts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Package className="h-12 w-12 mb-3 opacity-40" />
                    <p className="text-sm font-medium">محصولی یافت نشد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: ORDERS                                                      */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="orders" className="space-y-4 mt-4">
          {/* Tab Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'کل سفارشات', value: orders.length, color: 'text-foreground' },
              { label: 'در انتظار پرداخت', value: orders.filter(o => o.status === 'pending').length, color: 'text-amber-600' },
              { label: 'در حال پردازش', value: orders.filter(o => o.status === 'processing').length, color: 'text-violet-600' },
              { label: 'تکمیل شده', value: orders.filter(o => o.status === 'completed').length, color: 'text-emerald-600' },
            ].map(s => (
              <Card key={s.label} className="glass-card shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold tabular-nums ${s.color}`}>{toPersianDigits(s.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="glass-card-pink shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو شماره سفارش یا نام مشتری..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="وضعیت سفارش" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                    <SelectItem value="paid">پرداخت شده</SelectItem>
                    <SelectItem value="processing">در حال پردازش</SelectItem>
                    <SelectItem value="shipped">ارسال شده</SelectItem>
                    <SelectItem value="completed">تکمیل شده</SelectItem>
                    <SelectItem value="cancelled">لغو شده</SelectItem>
                    <SelectItem value="returned">مرجوع شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card className="glass-card shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="p-3 text-xs font-semibold">شماره سفارش</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">مشتری</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">تعداد اقلام</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">مبلغ کل</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">وضعیت سفارش</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">تاریخ</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map(order => {
                      const sc = orderStatusConfig[order.status]
                      return (
                        <TableRow key={order.id} className="group cursor-pointer" onClick={() => openOrderDetail(order)}>
                          <TableCell className="p-3 font-mono text-sm font-medium text-pink-600 dark:text-pink-400" dir="ltr">{order.orderNumber}</TableCell>
                          <TableCell className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <div>
                                <p className="font-medium text-sm">{order.customer}</p>
                                <p className="text-xs text-muted-foreground" dir="ltr">{order.customerPhone}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                {getContactByName(order.customer)?.sources.includes('crm') && (
                                  <ModuleBadge module="crm" />
                                )}
                                {getContactByName(order.customer)?.sources.includes('accounting') && (
                                  <ModuleBadge module="accounting" />
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-3 text-sm tabular-nums">
                            {toPersianDigits(order.items.reduce((s, i) => s + i.quantity, 0))} عدد
                          </TableCell>
                          <TableCell className="p-3 font-bold text-sm tabular-nums">{formatPrice(order.total)} <span className="text-[10px] font-normal text-muted-foreground">تومان</span></TableCell>
                          <TableCell className="p-3">
                            <Badge variant="outline" className={`text-[10px] ${sc.color} ${sc.bg}`}>
                              {sc.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-3 text-xs text-muted-foreground">{order.createdAt}</TableCell>
                          <TableCell className="p-3">
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {filteredOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
                    <p className="text-sm font-medium">سفارشی یافت نشد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: CATEGORIES                                                  */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="categories" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{toPersianDigits(categories.length)} دسته‌بندی</p>
            <Button
              className="gap-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
              size="sm"
              onClick={openCategoryCreate}
            >
              <Plus className="h-4 w-4" />
              افزودن دسته‌بندی
            </Button>
          </div>

          <Card className="glass-card shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="p-3 text-xs font-semibold">نام</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">Slug</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">تعداد محصولات</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">توضیحات</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(cat => {
                      const depth = getCategoryDepth(cat.id)
                      return (
                        <TableRow key={cat.id} className="group">
                          <TableCell className="p-3">
                            <div className="flex items-center gap-2" style={{ paddingRight: `${depth * 24}px` }}>
                              {depth > 0 && <span className="text-muted-foreground">└</span>}
                              <span className="text-lg">{cat.image}</span>
                              <span className="font-medium text-sm">{cat.name}</span>
                              {cat.parentId === null && <Badge variant="outline" className="text-[9px] text-pink-500 border-pink-300 dark:border-pink-700">والد</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="p-3 text-xs text-muted-foreground font-mono" dir="ltr">{cat.slug}</TableCell>
                          <TableCell className="p-3 text-sm tabular-nums">{toPersianDigits(cat.productCount)}</TableCell>
                          <TableCell className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">{cat.description}</TableCell>
                          <TableCell className="p-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openCategoryEdit(cat)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => { setDeletingCategoryId(cat.id); setDeleteCategoryDialogOpen(true) }}>
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
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: TAGS                                                        */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="tags" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{toPersianDigits(tags.length)} برچسب</p>
            <div className="flex items-center gap-2">
              {tagSelected.size > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">{toPersianDigits(tagSelected.size)} انتخاب شده</span>
                  <Button variant="outline" size="sm" className="gap-1 text-xs text-red-500" onClick={handleTagBulkDelete}>
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف دسته‌جمعی
                  </Button>
                </>
              )}
              <Button
                className="gap-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
                size="sm"
                onClick={openTagCreate}
              >
                <Plus className="h-4 w-4" />
                افزودن برچسب
              </Button>
            </div>
          </div>

          <Card className="glass-card shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 p-3">
                      <Checkbox
                        checked={tagSelected.size === tags.length && tags.length > 0}
                        onCheckedChange={() => {
                          if (tagSelected.size === tags.length) setTagSelected(new Set())
                          else setTagSelected(new Set(tags.map(t => t.id)))
                        }}
                      />
                    </TableHead>
                    <TableHead className="p-3 text-xs font-semibold">نام</TableHead>
                    <TableHead className="p-3 text-xs font-semibold">Slug</TableHead>
                    <TableHead className="p-3 text-xs font-semibold">تعداد محصولات</TableHead>
                    <TableHead className="p-3 text-xs font-semibold">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map(tag => (
                    <TableRow key={tag.id} className="group" data-state={tagSelected.has(tag.id) ? 'selected' : undefined}>
                      <TableCell className="p-3">
                        <Checkbox checked={tagSelected.has(tag.id)} onCheckedChange={() => toggleTagSelect(tag.id)} />
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-pink-500" />
                          <span className="font-medium text-sm">{tag.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-3 text-xs text-muted-foreground font-mono" dir="ltr">{tag.slug}</TableCell>
                      <TableCell className="p-3 text-sm tabular-nums">{toPersianDigits(tag.productCount)}</TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openTagEdit(tag)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: COUPONS                                                     */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="coupons" className="space-y-4 mt-4">
          {/* Tab Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'کل کوپن‌ها', value: coupons.length, color: 'text-foreground' },
              { label: 'فعال', value: coupons.filter(c => c.active).length, color: 'text-emerald-600' },
              { label: 'غیرفعال', value: coupons.filter(c => !c.active).length, color: 'text-gray-500' },
            ].map(s => (
              <Card key={s.label} className="glass-card shadow-sm">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-xl font-bold tabular-nums ${s.color}`}>{toPersianDigits(s.value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">مدیریت کدهای تخفیف</p>
            <Button
              className="gap-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
              size="sm"
              onClick={openCouponCreate}
            >
              <Plus className="h-4 w-4" />
              افزودن کوپن
            </Button>
          </div>

          <Card className="glass-card shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="p-3 text-xs font-semibold">کد تخفیف</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">نوع</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">مقدار</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">حداقل سفارش</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">استفاده</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">انقضا</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">وضعیت</TableHead>
                      <TableHead className="p-3 text-xs font-semibold">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map(coupon => (
                      <TableRow key={coupon.id} className="group">
                        <TableCell className="p-3">
                          <Badge variant="outline" className="font-mono text-xs font-bold border-dashed border-pink-300 text-pink-600 dark:text-pink-400 dark:border-pink-700" dir="ltr">
                            {coupon.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="flex items-center gap-1.5">
                            {coupon.type === 'percent' ? <Percent className="h-3.5 w-3.5 text-pink-500" /> : <DollarSign className="h-3.5 w-3.5 text-pink-500" />}
                            <span className="text-xs">{coupon.type === 'percent' ? 'درصدی' : 'مبلغی'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 font-bold text-sm tabular-nums">
                          {coupon.type === 'percent' ? `${toPersianDigits(coupon.value)}٪` : `${formatPrice(coupon.value)} تومان`}
                        </TableCell>
                        <TableCell className="p-3 text-sm tabular-nums">
                          {coupon.minOrder > 0 ? `${formatPrice(coupon.minOrder)} تومان` : '—'}
                        </TableCell>
                        <TableCell className="p-3 text-sm tabular-nums">
                          {toPersianDigits(coupon.usedCount)}{coupon.maxUsage > 0 ? `/${toPersianDigits(coupon.maxUsage)}` : ''}
                        </TableCell>
                        <TableCell className="p-3 text-xs text-muted-foreground">{coupon.expiryDate}</TableCell>
                        <TableCell className="p-3">
                          <Switch checked={coupon.active} onCheckedChange={() => toggleCouponActive(coupon.id)} />
                        </TableCell>
                        <TableCell className="p-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openCouponEdit(coupon)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* TAB 6: SETTINGS                                                    */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">پیکربندی و تنظیمات فروشگاه</p>
            <Button
              className="gap-2 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
              size="sm"
              onClick={handleSaveSettings}
            >
              <PackageCheck className="h-4 w-4" />
              ذخیره تنظیمات
            </Button>
          </div>

          {/* General */}
          <Collapsible defaultOpen>
            <Card className="glass-card shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md shadow-pink-500/20">
                        <Store className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">عمومی</CardTitle>
                        <p className="text-xs text-muted-foreground">اطلاعات پایه فروشگاه</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 space-y-4">
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">نام فروشگاه</Label>
                      <Input value={settings.storeName} onChange={e => updateSettings('storeName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">واحد پول</Label>
                      <Select value={settings.currency} onValueChange={v => updateSettings('currency', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="تومان">تومان</SelectItem>
                          <SelectItem value="ریال">ریال</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">آدرس فروشگاه</Label>
                    <Input value={settings.storeAddress} onChange={e => updateSettings('storeAddress', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">کشور</Label>
                      <Input value={settings.country} onChange={e => updateSettings('country', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">استان</Label>
                      <Input value={settings.province} onChange={e => updateSettings('province', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">شهر</Label>
                      <Input value={settings.city} onChange={e => updateSettings('city', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">کد پستی</Label>
                      <Input value={settings.postalCode} onChange={e => updateSettings('postalCode', e.target.value)} dir="ltr" />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Shipping */}
          <Collapsible defaultOpen>
            <Card className="glass-card shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">حمل و نقل</CardTitle>
                        <p className="text-xs text-muted-foreground">تنظیمات ارسال و حمل و نقل</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 space-y-4">
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs">روش ارسال</Label>
                    <Select value={settings.shippingMethod} onValueChange={v => updateSettings('shippingMethod', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="پست پیشتاز">پست پیشتاز</SelectItem>
                        <SelectItem value="پست سفارشی">پست سفارشی</SelectItem>
                        <SelectItem value="پیک">پیک</SelectItem>
                        <SelectItem value="باربری">باربری</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">هزینه ارسال (تومان)</Label>
                      <Input type="number" value={settings.shippingCost} onChange={e => updateSettings('shippingCost', Number(e.target.value))} dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">ارسال رایگان بالای مبلغ (تومان)</Label>
                      <Input type="number" value={settings.freeShippingMin} onChange={e => updateSettings('freeShippingMin', Number(e.target.value))} dir="ltr" />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Payment */}
          <Collapsible defaultOpen>
            <Card className="glass-card shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-md shadow-sky-500/20">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">پرداخت</CardTitle>
                        <p className="text-xs text-muted-foreground">درگاه‌های پرداخت</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 space-y-4">
                  <Separator />
                  <div className="space-y-4">
                    {[
                      { key: 'paymentZarinpal' as const, label: 'زرین‌پال', desc: 'درگاه پرداخت زرین‌پال' },
                      { key: 'paymentIdpay' as const, label: 'آیدی‌پی', desc: 'درگاه پرداخت آیدی‌پی' },
                      { key: 'paymentNextpay' as const, label: 'نکست‌پی', desc: 'درگاه پرداخت نکست‌پی' },
                      { key: 'paymentCod' as const, label: 'پرداخت در محل', desc: 'پرداخت هنگام تحویل کالا' },
                    ].map(gateway => (
                      <div key={gateway.key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{gateway.label}</p>
                          <p className="text-xs text-muted-foreground">{gateway.desc}</p>
                        </div>
                        <Switch checked={settings[gateway.key]} onCheckedChange={v => updateSettings(gateway.key, v)} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Tax */}
          <Collapsible defaultOpen>
            <Card className="glass-card shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
                        <Receipt className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">مالیات</CardTitle>
                        <p className="text-xs text-muted-foreground">تنظیمات مالیات بر ارزش افزوده</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 space-y-4">
                  <Separator />
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">فعال‌سازی مالیات</p>
                      <p className="text-xs text-muted-foreground">محاسبه خودکار مالیات بر ارزش افزوده</p>
                    </div>
                    <Switch checked={settings.taxEnabled} onCheckedChange={v => updateSettings('taxEnabled', v)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">نرخ مالیات (درصد)</Label>
                      <Input type="number" value={settings.taxRate} onChange={e => updateSettings('taxRate', Number(e.target.value))} dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">مناطق معاف</Label>
                      <Input value={settings.taxExemptRegions} onChange={e => updateSettings('taxExemptRegions', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Display */}
          <Collapsible defaultOpen>
            <Card className="glass-card shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-4 px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/20">
                        <MonitorCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">نمایشی</CardTitle>
                        <p className="text-xs text-muted-foreground">تنظیمات نمایش فروشگاه</p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-6 pb-6 space-y-4">
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs">تعداد محصول در هر صفحه</Label>
                    <Select value={String(settings.productsPerPage)} onValueChange={v => updateSettings('productsPerPage', Number(v))}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">۸</SelectItem>
                        <SelectItem value="12">۱۲</SelectItem>
                        <SelectItem value="16">۱۶</SelectItem>
                        <SelectItem value="24">۲۴</SelectItem>
                        <SelectItem value="48">۴۸</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">نمایش موجودی</p>
                        <p className="text-xs text-muted-foreground">نمایش تعداد موجودی محصول به مشتری</p>
                      </div>
                      <Switch checked={settings.showStock} onCheckedChange={v => updateSettings('showStock', v)} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">نمایش برچسب‌ها</p>
                        <p className="text-xs text-muted-foreground">نمایش برچسب‌های محصول در صفحه فروشگاه</p>
                      </div>
                      <Switch checked={settings.showTags} onCheckedChange={v => updateSettings('showTags', v)} />
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>
      </Tabs>

      {/* ════════════════════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                              */}
      {/* ════════════════════════════════════════════════════════════════════════ */}

      {/* ─── WooCommerce-Style Product Editor Sheet ─── */}
      <WooCommerceProductEditor
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        editingProduct={editingProduct}
        form={productForm}
        onFormChange={setProductForm}
        onSave={handleProductSave}
        categories={categoryNames}
        allTags={initialTags.map(t => t.name)}
      />

      {/* ─── Delete Product Confirmation ─── */}
      <AlertDialog open={deleteProductDialogOpen} onOpenChange={setDeleteProductDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف محصول</AlertDialogTitle>
            <AlertDialogDescription>آیا مطمئن هستید که می‌خواهید این محصول را حذف کنید؟ این عمل قابل بازگشت نیست.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleProductDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Order Detail Dialog ─── */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card shadow-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-pink-700 dark:text-pink-300">
              جزئیات سفارش {selectedOrder?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Status */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">وضعیت سفارش:</span>
                  <Badge variant="outline" className={`text-xs ${orderStatusConfig[selectedOrder.status]?.color} ${orderStatusConfig[selectedOrder.status]?.bg}`}>
                    {orderStatusConfig[selectedOrder.status]?.label}
                  </Badge>
                </div>
                <Select value={selectedOrder.status} onValueChange={v => handleOrderStatusChange(selectedOrder.id, v as Order['status'])}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(orderStatusConfig).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="glass-card shadow-sm">
                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">اطلاعات مشتری</p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{selectedOrder.customer}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{selectedOrder.customerPhone}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card shadow-sm">
                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">آدرس ارسال</p>
                    <p className="text-xs">{selectedOrder.shippingAddress}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Cross-Module Contact Reference */}
              <ContactCrossRef contactName={selectedOrder.customer} currentModule="store" />

              {/* Cross-Module: Invoice Links */}
              {(() => {
                const linkedInvoices = invoicesByOrder.get(selectedOrder.id)
                if (!linkedInvoices || linkedInvoices.length === 0) return null
                return (
                  <Card className="glass-card shadow-sm border-cyan-200 dark:border-cyan-800">
                    <CardContent className="p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <FileCheck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                        فاکتورهای مرتبط ({toPersianDigits(linkedInvoices.length)})
                      </p>
                      <div className="space-y-1.5">
                        {linkedInvoices.map(inv => {
                          const invStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
                            paid: { label: 'پرداخت شده', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200' },
                            unpaid: { label: 'پرداخت نشده', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200' },
                            overdue: { label: 'سررسید شده', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/30 border-red-200' },
                            cancelled: { label: 'لغو شده', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800/30 border-gray-200' },
                            draft: { label: 'پیش‌نویس', color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800/30 border-slate-200' },
                          }
                          const sc = invStatusConfig[inv.status] ?? invStatusConfig.draft
                          const invCust = customerById.get(inv.customerId)
                          return (
                            <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2">
                                <Receipt className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                                <div>
                                  <p className="text-xs font-medium font-mono" dir="ltr">{inv.invoiceNumber}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {invCust?.name ?? inv.customerId} · {invCust?.company ?? ''}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-[10px] ${sc.color} ${sc.bg}`}>
                                  {sc.label}
                                </Badge>
                                <span className="text-xs font-medium tabular-nums">{formatPrice(inv.total)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* Order Items */}
              <Card className="glass-card shadow-sm">
                <CardContent className="p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">اقلام سفارش</p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs p-2">محصول</TableHead>
                          <TableHead className="text-xs p-2 text-center">تعداد</TableHead>
                          <TableHead className="text-xs p-2 text-left">قیمت واحد</TableHead>
                          <TableHead className="text-xs p-2 text-left">جمع</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="p-2 text-sm">{item.name}</TableCell>
                            <TableCell className="p-2 text-sm text-center tabular-nums">{toPersianDigits(item.quantity)}</TableCell>
                            <TableCell className="p-2 text-sm text-left tabular-nums">{formatPrice(item.price)}</TableCell>
                            <TableCell className="p-2 text-sm text-left font-medium tabular-nums">{formatPrice(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Totals */}
              <Card className="glass-card shadow-sm">
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">جمع اقلام</span>
                    <span className="tabular-nums">{formatPrice(selectedOrder.subtotal)} تومان</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">هزینه ارسال</span>
                    <span className="tabular-nums">{selectedOrder.shippingCost > 0 ? `${formatPrice(selectedOrder.shippingCost)} تومان` : 'رایگان'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">مالیات</span>
                    <span className="tabular-nums">{formatPrice(selectedOrder.tax)} تومان</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>مبلغ نهایی</span>
                    <span className="text-pink-600 dark:text-pink-400 tabular-nums">{formatPrice(selectedOrder.total)} تومان</span>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedOrder.notes && (
                <Card className="glass-card shadow-sm">
                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">یادداشت‌ها</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Date */}
              <p className="text-xs text-muted-foreground text-center">
                تاریخ سفارش: {selectedOrder.createdAt}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDetailOpen(false)}>بستن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Category Full-Page Editor ─── */}
      <CategoryEditor
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        editingCategory={editingCategory}
        form={categoryForm}
        onFormChange={setCategoryForm}
        onSave={handleCategorySave}
        allCategories={categories.map(c => ({ id: c.id, name: c.name, parentId: c.parentId }))}
      />

      {/* ─── Delete Category Confirmation ─── */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دسته‌بندی</AlertDialogTitle>
            <AlertDialogDescription>آیا مطمئن هستید؟ دسته‌بندی‌های زیرمجموعه به دسته والد منتقل خواهند شد.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCategoryDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Tag Full-Page Editor ─── */}
      <TagEditor
        open={tagDialogOpen}
        onOpenChange={setTagDialogOpen}
        editingTag={editingTag}
        form={tagForm}
        onFormChange={setTagForm}
        onSave={handleTagSave}
      />

      {/* ─── Coupon Dialog ─── */}
      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto glass-card shadow-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-pink-700 dark:text-pink-300">
              {editingCoupon ? 'ویرایش کوپن تخفیف' : 'افزودن کوپن تخفیف جدید'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">کد تخفیف *</Label>
              <Input value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} dir="ltr" placeholder="WINTER20" className="font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">نوع تخفیف</Label>
                <Select value={couponForm.type} onValueChange={v => setCouponForm({ ...couponForm, type: v as 'percent' | 'fixed' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">درصدی (٪)</SelectItem>
                    <SelectItem value="fixed">مبلغی (تومان)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">مقدار</Label>
                <Input type="number" value={couponForm.value} onChange={e => setCouponForm({ ...couponForm, value: Number(e.target.value) })} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">حداقل سفارش (تومان)</Label>
                <Input type="number" value={couponForm.minOrder} onChange={e => setCouponForm({ ...couponForm, minOrder: Number(e.target.value) })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">حداکثر تخفیف (تومان)</Label>
                <Input type="number" value={couponForm.maxDiscount} onChange={e => setCouponForm({ ...couponForm, maxDiscount: Number(e.target.value) })} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">تعداد استفاده مجاز (۰ = نامحدود)</Label>
                <Input type="number" value={couponForm.maxUsage} onChange={e => setCouponForm({ ...couponForm, maxUsage: Number(e.target.value) })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">وضعیت</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={couponForm.active} onCheckedChange={v => setCouponForm({ ...couponForm, active: v })} />
                  <span className="text-sm">{couponForm.active ? 'فعال' : 'غیرفعال'}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">تاریخ شروع</Label>
                <Input value={couponForm.startDate} onChange={e => setCouponForm({ ...couponForm, startDate: e.target.value })} placeholder="۱۴۰۳/۰۹/۰۱" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">تاریخ انقضا</Label>
                <Input value={couponForm.expiryDate} onChange={e => setCouponForm({ ...couponForm, expiryDate: e.target.value })} placeholder="۱۴۰۳/۱۲/۳۰" dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">محصولات مجاز (خالی = همه)</Label>
              <Input value={couponForm.allowedProducts} onChange={e => setCouponForm({ ...couponForm, allowedProducts: e.target.value })} placeholder="نام محصولات با کاما" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">دسته‌بندی‌های مجاز</Label>
              <Select value={couponForm.allowedCategories || 'همه'} onValueChange={v => setCouponForm({ ...couponForm, allowedCategories: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="همه">همه دسته‌بندی‌ها</SelectItem>
                  {categoryNames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>انصراف</Button>
            <Button className="bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white shadow-sm" onClick={handleCouponSave} disabled={!couponForm.code}>
              {editingCoupon ? 'بروزرسانی' : 'ایجاد کوپن'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
