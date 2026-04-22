'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  FileText, Plus, Pencil, Trash2, Search, DollarSign,
  CheckCircle, Clock, XCircle, Receipt, TrendingUp, AlertTriangle,
  Building2, CreditCard, ArrowUpRight, ArrowDownLeft, Printer,
  Eye, Wallet, BarChart3, PieChart, ArrowUpDown, CircleDollarSign,
  Landmark, ChevronDown, CircleCheck, CircleX, ArrowRightLeft,
  Filter, BadgeCheck,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
}

interface Invoice {
  id: string
  number: string
  customer: string
  amount: number
  status: 'paid' | 'pending' | 'cancelled'
  date: string
  dueDate: string
  items: InvoiceItem[]
}

interface Transaction {
  id: string
  date: string
  description: string
  type: 'income' | 'expense'
  category: string
  amount: number
  account: string
}

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  cardNumber: string
  balance: number
  color: string
  iconBg: string
}

// ─── Labels ─────────────────────────────────────────────────────────────────

const labels = {
  title: 'حسابداری',
  subtitle: 'مدیریت فاکتورها، تراکنش‌ها و گزارش‌های مالی',
  create: 'صدور فاکتور',
  edit: 'ویرایش فاکتور',
  delete: 'حذف فاکتور',
  deleteConfirm: 'آیا مطمئن هستید؟',
  deleteDesc: 'این عمل قابل بازگشت نیست.',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو...',
  noResults: 'فاکتوری یافت نشد',
  noInvoices: 'هنوز فاکتوری صادر نشده است',
  invoiceNumber: 'شماره فاکتور',
  customer: 'مشتری',
  amount: 'مبلغ (تومان)',
  status: 'وضعیت',
  date: 'تاریخ صدور',
  dueDate: 'تاریخ سررسید',
  actions: 'عملیات',
  all: 'همه',
  addItem: 'افزودن ردیف',
  itemDescription: 'شرح',
  quantity: 'تعداد',
  unitPrice: 'قیمت واحد',
  toman: 'تومان',
  invoiceDetail: 'جزئیات فاکتور',
  print: 'چاپ / خروجی',
  batchAction: 'تغییر وضعیت انتخاب‌شده‌ها',
  close: 'بستن',
  totalAmount: 'جمع کل',
  tax: 'مالیات (۹٪)',
  discount: 'تخفیف',
  finalAmount: 'مبلغ نهایی',
  lineItems: 'ردیف‌های فاکتور',
}

const tabLabels = {
  invoices: 'فاکتورها',
  transactions: 'تراکنش‌ها',
  accounts: 'حساب‌ها',
  reports: 'گزارش‌ها',
}

const statusLabels: Record<string, string> = {
  paid: 'پرداخت شده',
  pending: 'در انتظار',
  cancelled: 'لغو شده',
}

const statusConfig: Record<string, { bg: string; text: string; icon: typeof CheckCircle; dot: string }> = {
  paid: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle, dot: 'bg-emerald-500' },
  pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: Clock, dot: 'bg-amber-500' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: XCircle, dot: 'bg-red-500' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, d => persianDigits[parseInt(d)])
}

function formatAmount(amount: number): string {
  return toPersianDigits(amount.toLocaleString())
}

// ─── Sample data ────────────────────────────────────────────────────────────

const initialInvoices: Invoice[] = [
  { id: '1', number: 'INV-۱۴۰۲-۰۰۱', customer: 'شرکت فناوری نوین', amount: 45_000_000, status: 'paid', date: '۱۴۰۲/۱۰/۱۵', dueDate: '۱۴۰۲/۱۱/۱۵', items: [{ description: 'طراحی وب‌سایت', quantity: 1, unitPrice: 45_000_000 }] },
  { id: '2', number: 'INV-۱۴۰۲-۰۰۲', customer: 'گروه بازرگانی آریا', amount: 120_000_000, status: 'pending', date: '۱۴۰۲/۱۰/۲۰', dueDate: '۱۴۰۲/۱۱/۲۰', items: [{ description: 'توسعه اپلیکیشن موبایل', quantity: 1, unitPrice: 120_000_000 }] },
  { id: '3', number: 'INV-۱۴۰۲-۰۰۳', customer: 'صنایع پارس', amount: 18_500_000, status: 'paid', date: '۱۴۰۲/۱۰/۰۵', dueDate: '۱۴۰۲/۱۱/۰۵', items: [{ description: 'هاستینگ سالانه', quantity: 1, unitPrice: 5_000_000 }, { description: 'پشتیبانی ماهانه', quantity: 12, unitPrice: 1_125_000 }] },
  { id: '4', number: 'INV-۱۴۰۲-۰۰۴', customer: 'شرکت دانش‌بنیان پارسه', amount: 32_000_000, status: 'cancelled', date: '۱۴۰۲/۰۹/۲۸', dueDate: '۱۴۰۲/۱۰/۲۸', items: [{ description: 'مشاوره فنی', quantity: 1, unitPrice: 32_000_000 }] },
  { id: '5', number: 'INV-۱۴۰۲-۰۰۵', customer: 'فروشگاه آنلاین دیجیکالا', amount: 230_000_000, status: 'pending', date: '۱۴۰۲/۱۰/۲۵', dueDate: '۱۴۰۲/۱۱/۲۵', items: [{ description: 'ساخت پنل مدیریت', quantity: 1, unitPrice: 230_000_000 }] },
  { id: '6', number: 'INV-۱۴۰۲-۰۰۶', customer: 'موسسه آموزشی راهبرد', amount: 15_000_000, status: 'paid', date: '۱۴۰۲/۱۰/۱۰', dueDate: '۱۴۰۲/۱۱/۱۰', items: [{ description: 'طراحی لوگو', quantity: 1, unitPrice: 8_000_000 }, { description: 'طراحی کارت ویزیت', quantity: 1, unitPrice: 7_000_000 }] },
  { id: '7', number: 'INV-۱۴۰۲-۰۰۷', customer: 'هلدینگ سرمایه‌گذاری برتر', amount: 350_000_000, status: 'paid', date: '۱۴۰۲/۰۹/۱۵', dueDate: '۱۴۰۲/۱۰/۱۵', items: [{ description: 'طراحی و توسعه سیستم ERP', quantity: 1, unitPrice: 350_000_000 }] },
  { id: '8', number: 'INV-۱۴۰۲-۰۰۸', customer: 'استارتاپ هوش مصنوعی', amount: 67_000_000, status: 'pending', date: '۱۴۰۲/۱۰/۲۸', dueDate: '۱۴۰۲/۱۱/۲۸', items: [{ description: 'پیاده‌سازی مدل ML', quantity: 1, unitPrice: 67_000_000 }] },
  { id: '9', number: 'INV-۱۴۰۲-۰۰۹', customer: 'شرکت عمرانی سازه', amount: 25_000_000, status: 'cancelled', date: '۱۴۰۲/۰۹/۲۰', dueDate: '۱۴۰۲/۱۰/۲۰', items: [{ description: 'طراحی سایت شرکتی', quantity: 1, unitPrice: 25_000_000 }] },
  { id: '10', number: 'INV-۱۴۰۲-۰۱۰', customer: 'شرکت داروسازی شهید قندی', amount: 92_000_000, status: 'paid', date: '۱۴۰۲/۱۰/۰۱', dueDate: '۱۴۰۲/۱۱/۰۱', items: [{ description: 'سامانه مدیریت دارو', quantity: 1, unitPrice: 92_000_000 }] },
]

const initialTransactions: Transaction[] = [
  { id: '1', date: '۱۴۰۲/۱۱/۰۱', description: 'پروژه طراحی سایت آریا', type: 'income', category: 'خدمات فناوری', amount: 120_000_000, account: 'بانک ملت' },
  { id: '2', date: '۱۴۰۲/۱۱/۰۲', description: 'اجاره دفتر - آبان‌ماه', type: 'expense', category: 'اجاره', amount: 35_000_000, account: 'بانک ملت' },
  { id: '3', date: '۱۴۰۲/۱۱/۰۳', description: 'فروش لایسنس نرم‌افزار', type: 'income', category: 'فروش محصول', amount: 8_500_000, account: 'بانک صادرات' },
  { id: '4', date: '۱۴۰۲/۱۱/۰۵', description: 'حقوق کارمندان', type: 'expense', category: 'حقوق و دستمزد', amount: 180_000_000, account: 'بانک ملت' },
  { id: '5', date: '۱۴۰۲/۱۱/۰۷', description: 'مشاوره پروژه ERP', type: 'income', category: 'مشاوره', amount: 45_000_000, account: 'بانک پاسارگاد' },
  { id: '6', date: '۱۴۰۲/۱۱/۰۸', description: 'خرید سرور اختصاصی', type: 'expense', category: 'تجهیزات', amount: 62_000_000, account: 'بانک سامان' },
  { id: '7', date: '۱۴۰۲/۱۱/۱۰', description: 'پیش‌پرداخت پروژه اپلیکیشن', type: 'income', category: 'خدمات فناوری', amount: 60_000_000, account: 'بانک صادرات' },
  { id: '8', date: '۱۴۰۲/۱۱/۱۱', description: 'هزینه اینترنت و مخابرات', type: 'expense', category: 'ارتباطات', amount: 3_200_000, account: 'بانک ملت' },
  { id: '9', date: '۱۴۰۲/۱۱/۱۲', description: 'طراحی UI/UX پروژه داروسازی', type: 'income', category: 'خدمات فناوری', amount: 92_000_000, account: 'بانک پاسارگاد' },
  { id: '10', date: '۱۴۰۲/۱۱/۱۴', description: 'بیمه کارمندان', type: 'expense', category: 'بیمه', amount: 28_000_000, account: 'بانک ملت' },
  { id: '11', date: '۱۴۰۲/۱۱/۱۵', description: 'درآمد تبلیغات سایت', type: 'income', category: 'تبلیغات', amount: 12_000_000, account: 'بانک سامان' },
  { id: '12', date: '۱۴۰۲/۱۱/۱۶', description: 'خرید لپ‌تاپ توسعه‌دهنده', type: 'expense', category: 'تجهیزات', amount: 55_000_000, account: 'بانک صادرات' },
  { id: '13', date: '۱۴۰۲/۱۱/۱۸', description: 'آموزش آنلاین تیم', type: 'expense', category: 'آموزش', amount: 4_500_000, account: 'بانک پاسارگاد' },
  { id: '14', date: '۱۴۰۲/۱۱/۲۰', description: 'پروژه پنل مدیریت فروشگاه', type: 'income', category: 'خدمات فناوری', amount: 230_000_000, account: 'بانک ملت' },
  { id: '15', date: '۱۴۰۲/۱۱/۲۲', description: 'هزینه میزبانی و دامنه', type: 'expense', category: 'ارتباطات', amount: 6_800_000, account: 'بانک سامان' },
]

const initialAccounts: BankAccount[] = [
  { id: '1', bankName: 'بانک ملت', accountNumber: '۶۱۰۴-****-****-۷۸۹۲', cardNumber: '۶۱۰۴-۳۳**-****-۷۸۹۲', balance: 485_000_000, color: 'from-emerald-500 to-green-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { id: '2', bankName: 'بانک صادرات', accountNumber: '۶۰۳۷-****-****-۳۴۵۶', cardNumber: '۶۰۳۷-۹۹**-****-۳۴۵۶', balance: 215_000_000, color: 'from-sky-500 to-blue-600', iconBg: 'bg-sky-100 dark:bg-sky-900/30' },
  { id: '3', bankName: 'بانک پاسارگاد', accountNumber: '۵۰۲۲-****-****-۱۲۳۴', cardNumber: '۵۰۲۲-۲۹**-****-۱۲۳۴', balance: 358_000_000, color: 'from-violet-500 to-purple-600', iconBg: 'bg-violet-100 dark:bg-violet-900/30' },
  { id: '4', bankName: 'بانک سامان', accountNumber: '۶۲۱۹-****-****-۵۶۷۸', cardNumber: '۶۲۱۹-۸۶**-****-۵۶۷۸', balance: 127_000_000, color: 'from-amber-500 to-orange-600', iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
]

const monthlyReportData = [
  { month: 'فروردین', income: 280_000_000, expense: 190_000_000 },
  { month: 'اردیبهشت', income: 350_000_000, expense: 220_000_000 },
  { month: 'خرداد', income: 420_000_000, expense: 310_000_000 },
  { month: 'تیر', income: 310_000_000, expense: 280_000_000 },
  { month: 'مرداد', income: 520_000_000, expense: 350_000_000 },
  { month: 'شهریور', income: 480_000_000, expense: 290_000_000 },
  { month: 'مهر', income: 390_000_000, expense: 340_000_000 },
  { month: 'آبان', income: 610_000_000, expense: 380_000_000 },
]

const categoryExpenses = [
  { category: 'حقوق و دستمزد', amount: 180_000_000, color: 'bg-emerald-500' },
  { category: 'تجهیزات', amount: 117_000_000, color: 'bg-sky-500' },
  { category: 'اجاره', amount: 35_000_000, color: 'bg-amber-500' },
  { category: 'بیمه', amount: 28_000_000, color: 'bg-violet-500' },
  { category: 'ارتباطات', amount: 10_000_000, color: 'bg-orange-500' },
  { category: 'آموزش', amount: 4_500_000, color: 'bg-rose-500' },
]

const emptyForm = {
  number: '', customer: '', amount: 0, status: 'pending' as Invoice['status'],
  date: '', dueDate: '', items: [{ description: '', quantity: 1, unitPrice: 0 }],
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function AccountingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [transactions] = useState<Transaction[]>(initialTransactions)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  // Invoice detail Sheet
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null)

  // Batch selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchStatus, setBatchStatus] = useState<Invoice['status']>('paid')

  // Transactions filter
  const [txnSearch, setTxnSearch] = useState('')
  const [txnTypeFilter, setTxnTypeFilter] = useState<'all' | 'income' | 'expense'>('all')

  const paidCount = invoices.filter(i => i.status === 'paid').length
  const monthlyRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const overdueCount = invoices.filter(i => i.status === 'pending').length

  const filtered = invoices.filter(i => {
    const matchSearch = i.number.includes(search) || i.customer.includes(search)
    const matchStatus = statusFilter === 'all' || i.status === statusFilter
    return matchSearch && matchStatus
  })

  const statuses = ['all', 'paid', 'pending', 'cancelled']

  const totalAmount = (items: InvoiceItem[]) => items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)

  const taxAmount = (items: InvoiceItem[]) => Math.round(totalAmount(items) * 0.09)
  const finalAmount = (items: InvoiceItem[]) => totalAmount(items) + taxAmount(items)

  // Running balance for transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      const matchSearch = t.description.includes(txnSearch) || t.category.includes(txnSearch) || t.account.includes(txnSearch)
      const matchType = txnTypeFilter === 'all' || t.type === txnTypeFilter
      return matchSearch && matchType
    })
    return filtered
  }, [transactions, txnSearch, txnTypeFilter])

  const transactionsWithBalance = useMemo(() => {
    let running = 0
    return filteredTransactions.map(t => {
      running += t.type === 'income' ? t.amount : -t.amount
      return { ...t, balance: running }
    })
  }, [filteredTransactions])

  const totalBalance = initialAccounts.reduce((s, a) => s + a.balance, 0)

  const totalExpense = categoryExpenses.reduce((s, c) => s + c.amount, 0)
  const maxIncome = Math.max(...monthlyReportData.map(m => m.income))

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingInvoice(null)
    setForm({
      ...emptyForm,
      number: `INV-۱۴۰۲-${toPersianDigits(String(invoices.length + 1).padStart(3, '0'))}`,
    })
    setDialogOpen(true)
  }

  const openEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setForm({
      number: invoice.number, customer: invoice.customer, amount: invoice.amount,
      status: invoice.status, date: invoice.date, dueDate: invoice.dueDate,
      items: [...invoice.items],
    })
    setDialogOpen(true)
  }

  const openDelete = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const openDetail = (invoice: Invoice) => {
    setDetailInvoice(invoice)
    setDetailOpen(true)
  }

  const handleSave = () => {
    if (!form.customer || form.items.length === 0) return
    const calcAmount = totalAmount(form.items)
    if (editingInvoice) {
      setInvoices(prev => prev.map(i => i.id === editingInvoice.id ? { ...i, ...form, amount: calcAmount } : i))
      toast.success('فاکتور بروزرسانی شد')
    } else {
      const newInvoice: Invoice = { ...form, id: Date.now().toString(), amount: calcAmount }
      setInvoices(prev => [...prev, newInvoice])
      toast.success('فاکتور جدید صادر شد')
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      setInvoices(prev => prev.filter(i => i.id !== deletingId))
      toast.success('فاکتور حذف شد')
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)))
    }
  }

  const handleBatchStatus = () => {
    if (selectedIds.size === 0) return
    setInvoices(prev => prev.map(i => selectedIds.has(i.id) ? { ...i, status: batchStatus } : i))
    toast.success(`${toPersianDigits(selectedIds.size)} فاکتور به "${statusLabels[batchStatus]}" تغییر یافت`)
    setSelectedIds(new Set())
    setBatchOpen(false)
  }

  const handlePrintInvoice = () => {
    toast.success('فاکتور برای چاپ آماده شد')
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{labels.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />{labels.create}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">کل فاکتورها</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{toPersianDigits(invoices.length)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/25 shrink-0">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">پرداخت شده</p>
              <p className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">{toPersianDigits(paidCount)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">درآمد ماه جاری</p>
              <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">{formatAmount(monthlyRevenue)} <span className="text-xs font-normal">{labels.toman}</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">فاکتورهای معوق</p>
              <p className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">{toPersianDigits(overdueCount)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="glass-card shadow-sm p-1 h-auto">
          <TabsTrigger value="invoices" className="gap-1.5 px-4 py-2 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-md transition-all duration-200">
            <Receipt className="h-4 w-4" />
            {tabLabels.invoices}
            <Badge variant="secondary" className="bg-white/20 text-white text-[10px] px-1.5 h-4 data-[state=active]:bg-white/20">{toPersianDigits(invoices.length)}</Badge>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5 px-4 py-2 text-sm rounded-md transition-all duration-200">
            <ArrowRightLeft className="h-4 w-4" />
            {tabLabels.transactions}
            <Badge variant="secondary" className="text-[10px] px-1.5 h-4">{toPersianDigits(initialTransactions.length)}</Badge>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="gap-1.5 px-4 py-2 text-sm rounded-md transition-all duration-200">
            <Wallet className="h-4 w-4" />
            {tabLabels.accounts}
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5 px-4 py-2 text-sm rounded-md transition-all duration-200">
            <BarChart3 className="h-4 w-4" />
            {tabLabels.reports}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════ INVOICES TAB ═══════════════ */}
        <TabsContent value="invoices" className="space-y-4 animate-in" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
          {/* Filters + Batch Action */}
          <Card className="glass-card-emerald shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
                </div>
                {selectedIds.size > 0 && (
                  <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30" onClick={() => setBatchOpen(true)}>
                    <BadgeCheck className="h-4 w-4" />
                    {labels.batchAction} ({toPersianDigits(selectedIds.size)})
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {statuses.map(s => {
                  const isActive = statusFilter === s
                  const label = s === 'all' ? 'همه' : statusLabels[s]
                  const count = s === 'all' ? invoices.length : invoices.filter(i => i.status === s).length
                  const colorMap: Record<string, string> = {
                    all: 'from-gray-500 to-gray-600',
                    paid: 'from-emerald-500 to-green-600',
                    pending: 'from-amber-500 to-yellow-600',
                    cancelled: 'from-red-500 to-rose-600',
                  }
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`
                        px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                        ${isActive
                          ? `bg-gradient-to-r ${colorMap[s]} text-white shadow-md hover:scale-[1.03] active:scale-[0.97]`
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

          {/* Table */}
          <Card className="glass-card-emerald shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/20 dark:to-green-800/20 flex items-center justify-center mb-4">
                    <FileText className="h-10 w-10 text-emerald-300" />
                  </div>
                  <p className="text-base font-medium">{search ? labels.noResults : labels.noInvoices}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedIds.size === filtered.length && filtered.length > 0}
                            onCheckedChange={toggleSelectAll}
                            aria-label="انتخاب همه"
                          />
                        </TableHead>
                        <TableHead>{labels.invoiceNumber}</TableHead>
                        <TableHead>{labels.customer}</TableHead>
                        <TableHead>{labels.amount}</TableHead>
                        <TableHead>{labels.status}</TableHead>
                        <TableHead className="hidden sm:table-cell">{labels.date}</TableHead>
                        <TableHead className="hidden md:table-cell">{labels.dueDate}</TableHead>
                        <TableHead>{labels.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((invoice, idx) => {
                        const sc = statusConfig[invoice.status]
                        const StatusIcon = sc.icon
                        const isSelected = selectedIds.has(invoice.id)
                        return (
                          <TableRow
                            key={invoice.id}
                            className={`hover-lift transition-all duration-200 animate-in cursor-pointer ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                            style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                            onClick={() => openDetail(invoice)}
                          >
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(invoice.id)}
                                aria-label={`انتخاب ${invoice.number}`}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm font-medium">{invoice.number}</TableCell>
                            <TableCell className="font-medium">{invoice.customer}</TableCell>
                            <TableCell className="font-bold tabular-nums">{formatAmount(invoice.amount)} <span className="text-xs text-muted-foreground font-normal">{labels.toman}</span></TableCell>
                            <TableCell>
                              <Badge className={`${sc.bg} ${sc.text} border-0 gap-1.5 shadow-sm ${invoice.status === 'paid' ? 'animate-in' : ''}`} style={invoice.status === 'paid' ? { animationDuration: '500ms', animationFillMode: 'both' } : undefined}>
                                <StatusIcon className="h-3 w-3" />
                                {statusLabels[invoice.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{invoice.date}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{invoice.dueDate}</TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:scale-110 active:scale-95 transition-transform duration-150" onClick={() => openEdit(invoice)} title="ویرایش">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={() => openDelete(invoice.id)} title="حذف">
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ TRANSACTIONS TAB ═══════════════ */}
        <TabsContent value="transactions" className="space-y-4 animate-in" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card hover-lift card-elevated animate-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20 shrink-0">
                  <ArrowDownLeft className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">کل درآمدها</p>
                  <p className="text-base font-bold tabular-nums text-green-600 dark:text-green-400">
                    {formatAmount(initialTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift card-elevated animate-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md shadow-red-500/20 shrink-0">
                  <ArrowUpRight className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">کل هزینه‌ها</p>
                  <p className="text-base font-bold tabular-nums text-red-600 dark:text-red-400">
                    {formatAmount(initialTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift card-elevated animate-in" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">موجودی خالص</p>
                  <p className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatAmount(initialTransactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift card-elevated animate-in" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <ArrowRightLeft className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">تعداد تراکنش‌ها</p>
                  <p className="text-base font-bold tabular-nums text-amber-600 dark:text-amber-400">{toPersianDigits(initialTransactions.length)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Filters */}
          <Card className="glass-card-emerald shadow-sm">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="جستجو در تراکنش‌ها..." value={txnSearch} onChange={e => setTxnSearch(e.target.value)} className="pr-10" />
              </div>
              <div className="flex gap-2">
                {(['all', 'income', 'expense'] as const).map(t => {
                  const isActive = txnTypeFilter === t
                  const labelMap = { all: 'همه', income: 'درآمدها', expense: 'هزینه‌ها' }
                  const colorMap = { all: 'from-gray-500 to-gray-600', income: 'from-green-500 to-emerald-600', expense: 'from-red-500 to-rose-600' }
                  return (
                    <button
                      key={t}
                      onClick={() => setTxnTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${isActive ? `bg-gradient-to-r ${colorMap[t]} text-white shadow-md` : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
                    >
                      {labelMap[t]}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card className="glass-card-emerald shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>تاریخ</TableHead>
                      <TableHead>شرح</TableHead>
                      <TableHead>نوع</TableHead>
                      <TableHead>دسته‌بندی</TableHead>
                      <TableHead>مبلغ</TableHead>
                      <TableHead className="hidden sm:table-cell">حساب</TableHead>
                      <TableHead className="hidden md:table-cell text-left">موجودی</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsWithBalance.map((txn, idx) => (
                      <TableRow key={txn.id} className="hover-lift transition-all duration-200 animate-in" style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}>
                        <TableCell className="text-sm text-muted-foreground font-mono">{txn.date}</TableCell>
                        <TableCell className="font-medium text-sm">{txn.description}</TableCell>
                        <TableCell>
                          <Badge className={`border-0 gap-1 shadow-sm ${txn.type === 'income' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                            {txn.type === 'income' ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                            {txn.type === 'income' ? 'درآمد' : 'هزینه'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm px-2 py-0.5 rounded-md bg-muted/60">{txn.category}</span>
                        </TableCell>
                        <TableCell className="font-bold tabular-nums">
                          <span className={txn.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {txn.type === 'income' ? '+' : '-'}{formatAmount(txn.amount)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-normal mr-1">{labels.toman}</span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{txn.account}</TableCell>
                        <TableCell className="hidden md:table-cell font-medium tabular-nums text-left">
                          <span className={txn.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            {formatAmount(Math.abs(txn.balance))}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ ACCOUNTS TAB ═══════════════ */}
        <TabsContent value="accounts" className="space-y-4 animate-in" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
          {/* Total Balance */}
          <Card className="glass-card-emerald shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                  <CircleDollarSign className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">موجودی کل حساب‌ها</p>
                  <p className="text-3xl font-bold tabular-nums gradient-text">{formatAmount(totalBalance)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{labels.toman} — {toPersianDigits(initialAccounts.length)} حساب بانکی</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {initialAccounts.map((acc, idx) => (
              <Card
                key={acc.id}
                className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated overflow-hidden group"
                style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Bank Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-xl ${acc.iconBg} flex items-center justify-center shrink-0`}>
                        <Landmark className={`h-5 w-5 ${acc.color.includes('emerald') ? 'text-emerald-600 dark:text-emerald-400' : acc.color.includes('sky') ? 'text-sky-600 dark:text-sky-400' : acc.color.includes('violet') ? 'text-violet-600 dark:text-violet-400' : 'text-amber-600 dark:text-amber-400'}`} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{acc.bankName}</p>
                        <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">{acc.cardNumber}</p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-[10px] text-muted-foreground mb-1">شماره حساب</p>
                    <p className="font-mono text-xs text-center tracking-wider" dir="ltr">{acc.accountNumber}</p>
                  </div>

                  {/* Balance */}
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">موجودی</p>
                    <p className="text-xl font-bold tabular-nums">{formatAmount(acc.balance)}</p>
                    <p className="text-[10px] text-muted-foreground">{labels.toman}</p>
                  </div>

                  {/* Decorative bar */}
                  <div className={`h-1 rounded-full bg-gradient-to-r ${acc.color} opacity-60`} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══════════════ REPORTS TAB ═══════════════ */}
        <TabsContent value="reports" className="space-y-4 animate-in" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
          {/* Monthly Income vs Expense Bar Chart */}
          <Card className="glass-card-emerald shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base">درآمد و هزینه ماهانه</h3>
              </div>
              <div className="space-y-3">
                {monthlyReportData.map((m, idx) => {
                  const incomePercent = (m.income / maxIncome) * 100
                  const expensePercent = (m.expense / maxIncome) * 100
                  return (
                    <div key={idx} className="animate-in" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium text-muted-foreground w-16">{m.month}</span>
                        <div className="flex items-center gap-4 text-xs tabular-nums">
                          <span className="text-green-600 dark:text-green-400">درآمد: {formatAmount(m.income)}</span>
                          <span className="text-red-600 dark:text-red-400">هزینه: {formatAmount(m.expense)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 h-6">
                        <div className="relative flex-1 bg-muted/40 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 right-0 bg-gradient-to-l from-green-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${incomePercent}%` }}
                          />
                        </div>
                        <div className="relative flex-1 bg-muted/40 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 right-0 bg-gradient-to-l from-red-500 to-rose-400 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${expensePercent}%`, animationDelay: `${idx * 60 + 200}ms` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center gap-6 pt-3 border-t border-border/50 mt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
                    <span className="text-muted-foreground">درآمد</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-rose-400" />
                    <span className="text-muted-foreground">هزینه</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Expense Breakdown + Top 5 Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie Chart (CSS-based) */}
            <Card className="glass-card-emerald shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-5">
                  <PieChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-base">ترکیب هزینه‌ها بر اساس دسته‌بندی</h3>
                </div>

                {/* CSS Donut Chart */}
                <div className="flex items-center justify-center mb-5">
                  <div className="relative h-44 w-44">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(
                          #10b981 0% ${(180_000_000 / totalExpense) * 360}deg,
                          #0ea5e9 ${(180_000_000 / totalExpense) * 360}deg ${((180_000_000 + 117_000_000) / totalExpense) * 360}deg,
                          #f59e0b ${((180_000_000 + 117_000_000) / totalExpense) * 360}deg ${((180_000_000 + 117_000_000 + 35_000_000) / totalExpense) * 360}deg,
                          #8b5cf6 ${((180_000_000 + 117_000_000 + 35_000_000) / totalExpense) * 360}deg ${((180_000_000 + 117_000_000 + 35_000_000 + 28_000_000) / totalExpense) * 360}deg,
                          #f97316 ${((180_000_000 + 117_000_000 + 35_000_000 + 28_000_000) / totalExpense) * 360}deg ${((180_000_000 + 117_000_000 + 35_000_000 + 28_000_000 + 10_000_000) / totalExpense) * 360}deg,
                          #f43f5e ${((180_000_000 + 117_000_000 + 35_000_000 + 28_000_000 + 10_000_000) / totalExpense) * 360}deg 360deg
                        )`,
                      }}
                    />
                    <div className="absolute inset-[28px] rounded-full bg-background flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">کل هزینه</p>
                        <p className="text-xs font-bold tabular-nums">{formatAmount(totalExpense)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-2">
                  {categoryExpenses.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm animate-in" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                        <span>{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-muted-foreground">{formatAmount(cat.amount)}</span>
                        <span className="text-[10px] text-muted-foreground">{toPersianDigits(Math.round((cat.amount / totalExpense) * 100))}٪</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top 5 Expenses */}
            <Card className="glass-card-emerald shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  <h3 className="font-bold text-base">بزرگ‌ترین هزینه‌ها</h3>
                </div>
                <div className="space-y-3">
                  {[...categoryExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="animate-in" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${idx === 0 ? 'from-red-500 to-rose-600' : idx === 1 ? 'from-orange-500 to-amber-600' : idx === 2 ? 'from-yellow-500 to-amber-500' : 'from-gray-400 to-gray-500'} flex items-center justify-center shadow-md shrink-0`}>
                          <span className="text-white text-xs font-bold">{toPersianDigits(idx + 1)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{cat.category}</p>
                          <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1.5">
                            <div
                              className={`h-1.5 rounded-full ${cat.color} transition-all duration-500`}
                              style={{ width: `${(cat.amount / categoryExpenses[0].amount) * 100}%` }}
                            />
                          </div>
                        </div>
                        <p className="font-bold tabular-nums text-sm text-red-600 dark:text-red-400 whitespace-nowrap">
                          {formatAmount(cat.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════════ INVOICE DETAIL SHEET ═══════════════ */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="left" className="w-full sm:max-w-lg glass-card shadow-xl">
          {detailInvoice && (
            <>
              <SheetHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <SheetTitle className="text-emerald-700 dark:text-emerald-300">{labels.invoiceDetail}</SheetTitle>
                </div>
                <SheetDescription>مشاهده و مدیریت جزئیات فاکتور</SheetDescription>
              </SheetHeader>

              <ScrollArea className="flex-1 px-4">
                <div className="space-y-5 py-4">
                  {/* Invoice Meta */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{labels.invoiceNumber}</p>
                      <p className="font-mono text-sm font-bold">{detailInvoice.number}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{labels.customer}</p>
                      <p className="text-sm font-bold">{detailInvoice.customer}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{labels.date}</p>
                      <p className="text-sm">{detailInvoice.date}</p>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">{labels.dueDate}</p>
                      <p className="text-sm">{detailInvoice.dueDate}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">{labels.status}:</p>
                    <Badge className={`${statusConfig[detailInvoice.status].bg} ${statusConfig[detailInvoice.status].text} border-0 gap-1.5 shadow-sm ${detailInvoice.status === 'paid' ? 'scale-105' : ''} transition-transform duration-300`}>
                      {(() => { const StatusIcon = statusConfig[detailInvoice.status].icon; return <StatusIcon className="h-3 w-3" /> })()}
                      {statusLabels[detailInvoice.status]}
                    </Badge>
                  </div>

                  {/* Line Items */}
                  <div>
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-emerald-600" />
                      {labels.lineItems}
                    </h4>
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-xs">{labels.itemDescription}</TableHead>
                            <TableHead className="text-xs text-center">{labels.quantity}</TableHead>
                            <TableHead className="text-xs text-left">{labels.unitPrice}</TableHead>
                            <TableHead className="text-xs text-left">{labels.totalAmount}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailInvoice.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm font-medium">{item.description}</TableCell>
                              <TableCell className="text-sm text-center tabular-nums">{toPersianDigits(item.quantity)}</TableCell>
                              <TableCell className="text-sm tabular-nums text-left">{formatAmount(item.unitPrice)}</TableCell>
                              <TableCell className="text-sm tabular-nums font-bold text-left">{formatAmount(item.quantity * item.unitPrice)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-xl p-4 border border-emerald-200/30 dark:border-emerald-800/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{labels.totalAmount}</span>
                      <span className="tabular-nums font-medium">{formatAmount(totalAmount(detailInvoice.items))} {labels.toman}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{labels.tax}</span>
                      <span className="tabular-nums text-amber-600 dark:text-amber-400">{formatAmount(taxAmount(detailInvoice.items))} {labels.toman}</span>
                    </div>
                    <div className="border-t border-emerald-200/40 dark:border-emerald-800/40 pt-2 flex justify-between">
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">{labels.finalAmount}</span>
                      <span className="font-bold text-lg tabular-nums text-emerald-700 dark:text-emerald-300">{formatAmount(finalAmount(detailInvoice.items))} {labels.toman}</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer Actions */}
              <div className="flex gap-2 p-4 border-t border-border/50">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  onClick={handlePrintInvoice}
                >
                  <Printer className="h-4 w-4" />
                  {labels.print}
                </Button>
                <Button
                  className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
                  onClick={() => { setDetailOpen(false); openEdit(detailInvoice) }}
                >
                  <Pencil className="h-4 w-4" />
                  {labels.edit}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══════════════ CREATE/EDIT DIALOG ═══════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-700 dark:text-emerald-300">
              {editingInvoice ? labels.edit : labels.create}
            </DialogTitle>
            <DialogDescription>
              {editingInvoice ? 'اطلاعات فاکتور را ویرایش کنید' : 'اطلاعات فاکتور جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.invoiceNumber}</Label>
                <Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{labels.customer}</Label>
                <Input value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.date}</Label>
                <Input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="۱۴۰۲/۱۰/۲۵" />
              </div>
              <div className="space-y-2">
                <Label>{labels.status}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Invoice['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">{statusLabels.paid}</SelectItem>
                    <SelectItem value="pending">{statusLabels.pending}</SelectItem>
                    <SelectItem value="cancelled">{statusLabels.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{labels.lineItems}</Label>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0 }] })}>
                  <Plus className="h-3 w-3" />{labels.addItem}
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      {idx === 0 && <p className="text-[10px] text-muted-foreground mb-1">{labels.itemDescription}</p>}
                      <Input value={item.description} onChange={e => {
                        const newItems = [...form.items]
                        newItems[idx] = { ...newItems[idx], description: e.target.value }
                        setForm({ ...form, items: newItems })
                      }} className="h-9 text-sm" />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <p className="text-[10px] text-muted-foreground mb-1">{labels.quantity}</p>}
                      <Input type="number" value={item.quantity} onChange={e => {
                        const newItems = [...form.items]
                        newItems[idx] = { ...newItems[idx], quantity: Number(e.target.value) }
                        setForm({ ...form, items: newItems })
                      }} className="h-9 text-sm" dir="ltr" />
                    </div>
                    <div className="col-span-3">
                      {idx === 0 && <p className="text-[10px] text-muted-foreground mb-1">{labels.unitPrice}</p>}
                      <Input type="number" value={item.unitPrice} onChange={e => {
                        const newItems = [...form.items]
                        newItems[idx] = { ...newItems[idx], unitPrice: Number(e.target.value) }
                        setForm({ ...form, items: newItems })
                      }} className="h-9 text-sm" dir="ltr" />
                    </div>
                    <div className="col-span-2">
                      {idx === 0 && <p className="text-[10px] text-muted-foreground mb-1 invisible">حذف</p>}
                      <Button size="icon" variant="ghost" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-500/10" onClick={() => {
                        setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-sm font-medium">جمع کل:</span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatAmount(totalAmount(form.items))} {labels.toman}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSave} disabled={!form.customer || form.items.length === 0}>
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ DELETE CONFIRMATION ═══════════════ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="glass-card shadow-xl max-w-sm">
          <DialogHeader>
            <DialogTitle>{labels.deleteConfirm}</DialogTitle>
            <DialogDescription>{labels.deleteDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{labels.cancel}</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>{labels.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ BATCH STATUS DIALOG ═══════════════ */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="glass-card shadow-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-emerald-600" />
              {labels.batchAction}
            </DialogTitle>
            <DialogDescription>
              وضعیت {toPersianDigits(selectedIds.size)} فاکتور انتخاب‌شده را تغییر دهید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>وضعیت جدید</Label>
              <Select value={batchStatus} onValueChange={v => setBatchStatus(v as Invoice['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">{statusLabels.paid}</SelectItem>
                  <SelectItem value="pending">{statusLabels.pending}</SelectItem>
                  <SelectItem value="cancelled">{statusLabels.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchOpen(false)}>{labels.cancel}</Button>
            <Button
              className="bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white shadow-sm"
              onClick={handleBatchStatus}
            >
              اعمال تغییر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
