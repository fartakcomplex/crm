'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank,
  Plus, Search, ArrowUpRight, ArrowDownRight, Calendar,
  BarChart3, PieChart, Edit3, Trash2, Filter,
  Target, AlertTriangle, FileText, Download,
  Activity, Heart, ArrowLeftRight, Receipt,
  Building2, ShoppingCart, CreditCard, Landmark,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCMS } from '@/components/cms/context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { Transaction, BankAccount, BudgetItem as ApiBudgetItem, Invoice, Order } from '@/components/cms/types'
import { useRegisterFinanceData, ModuleStatsOverview, CrossModuleSyncStatus } from '@/components/CrossModulePanel'
import { useCrossModuleStore } from '@/lib/cross-module-store'

// ─── Labels ─────────────────────────────────────────────────────────────────

const labels = {
  title: 'مالی',
  subtitle: 'داشبورد مالی و مدیریت درآمد و هزینه‌ها',
  addTransaction: 'ثبت تراکنش',
  editTransaction: 'ویرایش تراکنش',
  deleteTransaction: 'حذف تراکنش',
  save: 'ذخیره',
  cancel: 'انصراف',
  delete: 'حذف',
  search: 'جستجو در تراکنش‌ها...',
  noResults: 'تراکنشی یافت نشد',
  date: 'تاریخ',
  description: 'شرح',
  type: 'نوع',
  amount: 'مبلغ (تومان)',
  category: 'دسته‌بندی',
  actions: 'عملیات',
  all: 'همه',
  income: 'درآمد',
  expense: 'هزینه',
  toman: 'تومان',
  monthlyIncome: 'درآمد کل',
  monthlyExpense: 'هزینه کل',
  netProfit: 'جریان نقدینگی خالص',
  profitMargin: 'حاشیه سود',
  monthlyTrend: 'روند ماهانه درآمد و هزینه',
  recentTransactions: 'تراکنش‌های اخیر',
  budgetOverview: 'خلاصه بودجه',
  dashboard: 'داشبورد',
  transactions: 'تراکنش‌ها',
  budget: 'بودجه',
  reports: 'گزارش‌ها',
  cashFlow: 'جریان نقدینگی (۷ روز اخیر)',
  quickActions: 'عملیات سریع',
  addIncome: 'ثبت درآمد',
  addExpense: 'ثبت هزینه',
  viewReport: 'مشاهده گزارش',
  savingsGoal: 'هدف پس‌انداز',
  totalTransactions: 'کل تراکنش‌ها',
  runningTotal: 'مانده:',
  budgetPlan: 'برنامه بودجه',
  totalBudget: 'مجموع بودجه',
  totalSpent: 'مجموع هزینه',
  remaining: 'باقیمانده',
  addBudget: 'افزودن بودجه',
  editBudget: 'ویرایش بودجه',
  budgetCategory: 'دسته‌بندی',
  budgetAmount: 'مبلغ بودجه',
  spent: 'هزینه شده',
  overBudget: 'بودجه اضافی!',
  underBudget: 'بودجه عادی',
  yearlyComparison: 'مقایسه سالانه درآمد و هزینه',
  topExpenseCategories: '۵ دسته‌بندی پرهزینه',
  monthlySavingsRate: 'نرخ پس‌انداز ماهانه',
  financialHealthScore: 'امتیاز سلامت مالی',
  exportSummary: 'خروجی خلاصه',
  excellent: 'عالی',
  good: 'خوب',
  fair: 'متوسط',
  poor: 'ضعیف',
  deleteConfirm: 'آیا از حذف این تراکنش اطمینان دارید؟',
  confirm: 'تأیید',
  loading: 'در حال بارگذاری...',
  noData: 'داده‌ای موجود نیست',
  invoiceLink: 'فاکتور مرتبط',
  bankAccount: 'حساب بانکی',
  orderRevenue: 'درآمد سفارشات',
  budgetUtilization: 'مصرف بودجه',
  linkedInvoice: 'فاکتور #',
  linkedBank: 'حساب: ',
  noInvoice: 'بدون فاکتور',
}

const categoryLabels: Record<string, string> = {
  sales: 'فروش',
  services: 'خدمات',
  salary: 'حقوق و دستمزد',
  rent: 'اجاره',
  marketing: 'بازاریابی',
  utilities: 'قبوض',
  software: 'نرم‌افزار',
  equipment: 'تجهیزات',
  other: 'سایر',
  tax: 'مالیات',
  insurance: 'بیمه',
  training: 'آموزش',
  transport: 'حمل و نقل',
  consulting: 'مشاوره',
  office: 'اداری',
  subscription: 'اشتراک',
  maintenance: 'نگهداری',
  food: 'خوراکی',
  entertainment: 'سرگرمی',
  healthcare: 'بهداشت',
  legal: 'حقوقی',
}

const budgetCategoryIcons: Record<string, string> = {
  salary: '💼',
  rent: '🏠',
  marketing: '📢',
  utilities: '⚡',
  software: '💻',
  equipment: '🖥️',
  transport: '🚗',
  training: '📚',
  office: '🏢',
  insurance: '🛡️',
  tax: '📋',
  other: '📌',
  food: '🍽️',
  entertainment: '🎮',
  healthcare: '🏥',
  legal: '⚖️',
  maintenance: '🔧',
  subscription: '📥',
  consulting: '🤝',
  sales: '💰',
  services: '⚙️',
}

const typeConfig: Record<string, { bg: string; text: string; icon: typeof TrendingUp; gradient: string }> = {
  income: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: TrendingUp, gradient: 'from-emerald-500 to-green-600' },
  expense: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: TrendingDown, gradient: 'from-red-500 to-rose-600' },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toPersianDigits(num: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(num).replace(/\d/g, d => persianDigits[parseInt(d)])
}

function formatAmount(amount: number): string {
  return toPersianDigits(amount.toLocaleString())
}

function shortenAmount(amount: number): string {
  if (amount >= 1_000_000_000) return toPersianDigits((amount / 1_000_000_000).toFixed(1)) + 'B'
  if (amount >= 1_000_000) return toPersianDigits(Math.round(amount / 1_000_000)) + 'M'
  return formatAmount(amount)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Gauge Component ────────────────────────────────────────────────────────

function HealthGauge({ score, label }: { score: number; label: string }) {
  const circumference = 2 * Math.PI * 60
  const strokeDashoffset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  const statusLabel = score >= 80 ? labels.excellent : score >= 60 ? labels.good : score >= 40 ? labels.fair : labels.poor

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="160" height="100" viewBox="0 0 160 100">
        <path
          d="M 20 90 A 60 60 0 0 1 140 90"
          fill="none"
          stroke="currentColor"
          className="text-muted/40"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 20 90 A 60 60 0 0 1 140 90"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
        <text x="80" y="75" textAnchor="middle" className="fill-foreground" fontSize="28" fontWeight="bold">
          {toPersianDigits(score)}
        </text>
        <text x="80" y="92" textAnchor="middle" className="fill-muted-foreground" fontSize="10">
          از ۱۰۰
        </text>
      </svg>
      <Badge className="text-xs" style={{ backgroundColor: color, color: '#fff', border: 'none' }}>
        {statusLabel}
      </Badge>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function FinancePage() {
  // ── Shared CMS Data Layer ──
  const {
    transactions: txQuery,
    bankAccounts: bankQuery,
    budgets: budgetQuery,
    invoices: invoiceQuery,
    orders: orderQuery,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createBudgetItem,
    updateBudgetItem,
  } = useCMS()

  useEnsureData(['transactions', 'bank-accounts', 'budgets', 'invoices', 'orders'])

  const transactions = txQuery.data ?? []
  const bankAccounts = bankQuery.data ?? []
  const budgetItems = budgetQuery.data ?? []
  const invoices = invoiceQuery.data ?? []
  const orders = orderQuery.data ?? []

  const isLoading = txQuery.isLoading || budgetQuery.isLoading
  const isCreating = createTransaction.isPending || updateTransaction.isPending || createBudgetItem.isPending
  const isDeleting = deleteTransaction.isPending

  // ── Local UI State ──
  const [activeTab, setActiveTab] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    date: '',
    description: '',
    type: 'income' as string,
    amount: 0,
    category: 'sales',
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)
  const [budgetForm, setBudgetForm] = useState({
    category: 'other',
    budgetAmount: 0,
    icon: '📌',
  })

  // ── Cross-Module Data Registration ──
  const crossModuleTransactions = useMemo(() => {
    return transactions.map(t => ({
      id: t.id,
      date: formatDate(t.createdAt),
      description: t.description,
      type: t.type,
      amount: t.amount,
      category: t.category,
    }))
  }, [transactions])

  useRegisterFinanceData(crossModuleTransactions)
  const { sharedTransactions } = useCrossModuleStore()

  // ── Cross-Module Integration: Derived Data ──

  // Invoice-Transaction links: map of transactionId -> invoice info
  const invoiceByTxId = useMemo(() => {
    const map: Record<string, Invoice> = {}
    invoices.forEach(inv => {
      inv.transactions?.forEach(tx => {
        map[tx.id] = inv
      })
    })
    return map
  }, [invoices])

  // Order revenue from completed orders
  const orderRevenue = useMemo(() => {
    return orders
      .filter(o => o.status === 'completed' || o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0)
  }, [orders])

  const completedOrderCount = useMemo(() => {
    return orders.filter(o => o.status === 'completed' || o.status === 'delivered').length
  }, [orders])

  // Bank account balances
  const totalBankBalance = useMemo(() => {
    return bankAccounts.reduce((sum, a) => sum + (a.balance || 0), 0)
  }, [bankAccounts])

  // ── Financial Dashboard Calculations (from real transactions) ──

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  const totalExpense = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  const netCashFlow = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? Math.round((netCashFlow / totalIncome) * 100) : 0

  // Transaction filtering
  const filtered = useMemo(() => transactions.filter(t => {
    const txDate = formatDate(t.createdAt)
    const txDesc = t.description
    const txCat = t.category
    const matchSearch = txDesc.includes(search) || (categoryLabels[txCat] || '').includes(search) || txDate.includes(search)
    const matchType = typeFilter === 'all' || t.type === typeFilter
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
    return matchSearch && matchType && matchCategory
  }), [transactions, search, typeFilter, categoryFilter])

  // Running total
  const runningTotals = useMemo(() => {
    return filtered.reduce<number[]>((acc, t) => {
      const prev = acc.length > 0 ? acc[acc.length - 1] : 0
      return [...acc, prev + (t.type === 'income' ? t.amount : -t.amount)]
    }, [])
  }, [filtered])

  // Monthly income/expense from transactions (grouped by month)
  const monthlyData = useMemo(() => {
    const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    const map: Record<string, { income: number; expense: number }> = {}

    transactions.forEach(t => {
      const d = new Date(t.createdAt)
      const monthIdx = d.getMonth()
      const key = monthIdx.toString()
      if (!map[key]) map[key] = { income: 0, expense: 0 }
      if (t.type === 'income') map[key].income += t.amount / 1_000_000
      else map[key].expense += t.amount / 1_000_000
    })

    // If no real data, show placeholder months
    if (Object.keys(map).length === 0) {
      return monthNames.map(name => ({ month: name, income: 0, expense: 0 }))
    }

    return monthNames.map((name, idx) => ({
      month: name,
      income: Math.round(map[idx.toString()]?.income || 0),
      expense: Math.round(map[idx.toString()]?.expense || 0),
    }))
  }, [transactions])

  const maxMonthly = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1)

  // Cash flow from recent transactions (last 7 days)
  const cashFlowData = useMemo(() => {
    const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
    const now = new Date()
    const days: Record<string, number> = {}

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days[key] = 0
    }

    transactions.forEach(t => {
      const txDate = new Date(t.createdAt).toISOString().split('T')[0]
      if (txDate in days) {
        days[txDate] += t.type === 'income' ? t.amount : -t.amount
      }
    })

    return Object.entries(days).map(([date, amount]) => ({
      day: dayNames[new Date(date).getDay()],
      amount,
    }))
  }, [transactions])

  const maxCashFlow = Math.max(...cashFlowData.map(d => Math.abs(d.amount)), 1)

  // Budget calculations (from API budgets + actual spending from transactions)
  const budgetWithActual = useMemo(() => {
    return budgetItems.map(b => {
      const actualSpent = transactions
        .filter(t => t.type === 'expense' && t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0)
      return {
        ...b,
        actualSpent,
        budgetAmount: b.allocated,
        spentAmount: b.spent > 0 ? b.spent : actualSpent,
        icon: budgetCategoryIcons[b.category] || '📌',
      }
    })
  }, [budgetItems, transactions])

  const totalBudget = budgetWithActual.reduce((s, b) => s + b.budgetAmount, 0)
  const totalSpent = budgetWithActual.reduce((s, b) => s + b.spentAmount, 0)
  const totalRemaining = totalBudget - totalSpent
  const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  // Reports data
  const topExpenseCategories = useMemo(() => {
    const catMap: Record<string, number> = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount
    })
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [transactions])
  const maxTopExpense = topExpenseCategories.length > 0 ? topExpenseCategories[0][1] : 0

  // Income categories breakdown
  const incomeCategories = useMemo(() => {
    const catMap: Record<string, number> = {}
    transactions.filter(t => t.type === 'income').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount
    })
    return Object.entries(catMap).sort((a, b) => b[1] - a[1])
  }, [transactions])

  // Expense categories breakdown
  const expenseCategories = useMemo(() => {
    const catMap: Record<string, number> = {}
    transactions.filter(t => t.type === 'expense').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount
    })
    return Object.entries(catMap).sort((a, b) => b[1] - a[1])
  }, [transactions])

  // Savings rate per month
  const savingsRates = monthlyData.map(m => ({
    month: m.month,
    rate: m.income > 0 ? Math.round(((m.income - m.expense) / m.income) * 100) : 0,
  }))

  // Financial health score (weighted)
  const healthScore = useMemo(() => {
    const avgSavingsRate = savingsRates.length > 0 ? savingsRates.reduce((s, r) => s + r.rate, 0) / savingsRates.length : 0
    const budgetAdherence = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 50
    const overBudgetCount = budgetWithActual.filter(b => b.spentAmount > b.budgetAmount).length
    const budgetPenalty = overBudgetCount * 8
    const score = Math.round((avgSavingsRate * 0.5) + (budgetAdherence <= 100 ? 25 : Math.max(0, 25 - (budgetAdherence - 100) * 2)) + (overBudgetCount === 0 ? 25 : Math.max(0, 25 - budgetPenalty)))
    return Math.max(0, Math.min(100, score))
  }, [savingsRates, totalBudget, totalSpent, budgetWithActual])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const openCreate = (presetType?: string) => {
    setEditingId(null)
    setForm({
      date: '',
      description: '',
      type: presetType || 'income',
      amount: 0,
      category: presetType === 'expense' ? 'rent' : 'sales',
    })
    setDialogOpen(true)
  }

  const openEdit = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setForm({
      date: transaction.createdAt ? formatDate(transaction.createdAt) : '',
      description: transaction.description,
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.description || form.amount <= 0) return
    const data = {
      description: form.description,
      amount: form.amount,
      type: form.type,
      category: form.category,
    }
    if (editingId) {
      updateTransaction.mutate({ id: editingId, ...data }, {
        onSuccess: () => {
          toast.success('تراکنش با موفقیت ویرایش شد')
          setDialogOpen(false)
        },
        onError: () => {
          toast.error('خطا در ویرایش تراکنش')
        },
      })
    } else {
      createTransaction.mutate(data, {
        onSuccess: () => {
          toast.success('تراکنش جدید ثبت شد')
          setDialogOpen(false)
        },
        onError: () => {
          toast.error('خطا در ثبت تراکنش')
        },
      })
    }
  }

  const handleDelete = () => {
    if (!deletingId) return
    deleteTransaction.mutate(deletingId, {
      onSuccess: () => {
        toast.success('تراکنش حذف شد')
        setDeleteDialogOpen(false)
        setDeletingId(null)
      },
      onError: () => {
        toast.error('خطا در حذف تراکنش')
      },
    })
  }

  const openBudgetCreate = () => {
    setEditingBudgetId(null)
    setBudgetForm({ category: 'other', budgetAmount: 0, icon: '📌' })
    setBudgetDialogOpen(true)
  }

  const openBudgetEdit = (item: ApiBudgetItem & { icon?: string }) => {
    setEditingBudgetId(item.id)
    setBudgetForm({ category: item.category, budgetAmount: item.allocated, icon: item.icon || '📌' })
    setBudgetDialogOpen(true)
  }

  const handleBudgetSave = () => {
    if (budgetForm.budgetAmount <= 0) return
    const payload = {
      name: categoryLabels[budgetForm.category] || budgetForm.category,
      category: budgetForm.category,
      allocated: budgetForm.budgetAmount,
      spent: 0,
      period: 'monthly',
    }

    if (editingBudgetId) {
      updateBudgetItem.mutate({ id: editingBudgetId, ...payload }, {
        onSuccess: () => {
          toast.success('بودجه با موفقیت ویرایش شد')
          setBudgetDialogOpen(false)
        },
        onError: () => toast.error('خطا در ویرایش بودجه'),
      })
    } else {
      createBudgetItem.mutate(payload, {
        onSuccess: () => {
          toast.success('بودجه جدید اضافه شد')
          setBudgetDialogOpen(false)
        },
        onError: () => toast.error('خطا در افزودن بودجه'),
      })
    }
  }

  const handleExportSummary = () => {
    const summary = [
      `خلاصه مالی`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `مجموع درآمد: ${formatAmount(totalIncome)} تومان`,
      `مجموع هزینه: ${formatAmount(totalExpense)} تومان`,
      `جریان نقدینگی: ${formatAmount(netCashFlow)} تومان`,
      `حاشیه سود: ${toPersianDigits(profitMargin)}٪`,
      `امتیاز سلامت مالی: ${toPersianDigits(healthScore)} از ۱۰۰`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `موجودی بانکی: ${formatAmount(totalBankBalance)} تومان`,
      `درآمد سفارشات: ${formatAmount(orderRevenue)} تومان (${toPersianDigits(completedOrderCount)} سفارش)`,
      `بودجه کل: ${formatAmount(totalBudget)} تومان`,
      `هزینه شده: ${formatAmount(totalSpent)} تومان`,
      `مصرف بودجه: ${toPersianDigits(budgetUtilization)}٪`,
    ].join('\n')
    const blob = new Blob(['\uFEFF' + summary], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'financial-summary.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('خلاصه مالی دانلود شد')
  }

  // ─── Available categories for filter ─────────────────────────────────────

  const usedCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category))
    return Array.from(cats)
  }, [transactions])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{labels.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
          <div className="mt-2">
            <CrossModuleSyncStatus />
          </div>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={() => openCreate()}
          disabled={isCreating}
        >
          <Plus className="h-4 w-4" />{labels.addTransaction}
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 rounded-xl h-auto flex-wrap gap-1">
          {[
            { value: 'dashboard', label: labels.dashboard, icon: BarChart3 },
            { value: 'transactions', label: labels.transactions, icon: Receipt },
            { value: 'budget', label: labels.budget, icon: Wallet },
            { value: 'reports', label: labels.reports, icon: FileText },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg px-4 py-2 text-sm gap-2 transition-all duration-200"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: DASHBOARD
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{labels.loading}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{labels.monthlyIncome}</p>
                      <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{shortenAmount(totalIncome)} <span className="text-xs font-normal">{labels.toman}</span></p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
                      <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{labels.monthlyExpense}</p>
                      <p className="text-xl font-bold tabular-nums text-red-600 dark:text-red-400">{shortenAmount(totalExpense)} <span className="text-xs font-normal">{labels.toman}</span></p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
                      <PiggyBank className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{labels.netProfit}</p>
                      <p className={`text-xl font-bold tabular-nums ${netCashFlow >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-600 dark:text-red-400'}`}>{netCashFlow >= 0 ? '+' : ''}{shortenAmount(netCashFlow)} <span className="text-xs font-normal">{labels.toman}</span></p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{labels.profitMargin}</p>
                      <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{toPersianDigits(profitMargin)}٪</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cross-Module Integration Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Bank Account Balances */}
                <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-sky-500" />
                      <CardTitle className="text-sm font-bold text-sky-700 dark:text-sky-300">{labels.bankAccount}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400 mb-2">{shortenAmount(totalBankBalance)} <span className="text-xs font-normal">{labels.toman}</span></p>
                    <div className="space-y-1.5">
                      {bankAccounts.slice(0, 3).map(account => (
                        <div key={account.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3" />
                            {account.name}
                          </span>
                          <span className="font-medium tabular-nums">{shortenAmount(account.balance)}</span>
                        </div>
                      ))}
                      {bankAccounts.length === 0 && (
                        <p className="text-xs text-muted-foreground">{labels.noData}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Revenue */}
                <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-emerald-500" />
                      <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{labels.orderRevenue}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mb-2">{shortenAmount(orderRevenue)} <span className="text-xs font-normal">{labels.toman}</span></p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{toPersianDigits(completedOrderCount)} سفارش تکمیل‌شده</span>
                    </div>
                    {orders.length > 0 && (
                      <div className="mt-2 h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-700" style={{ width: `${orders.length > 0 ? Math.round((completedOrderCount / orders.length) * 100) : 0}%` }} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Budget Utilization */}
                <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-amber-500" />
                      <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-300">{labels.budgetUtilization}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className={`text-2xl font-bold tabular-nums ${budgetUtilization > 100 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{toPersianDigits(budgetUtilization)}٪</p>
                    <div className="mt-2 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${budgetUtilization > 100 ? 'bg-gradient-to-r from-red-500 to-rose-500' : budgetUtilization > 80 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-green-500'}`}
                        style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {shortenAmount(totalSpent)} از {shortenAmount(totalBudget)} {labels.toman}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow Mini Chart + Quick Actions + Savings Goal */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Cash Flow */}
                <Card className="glass-card-violet shadow-sm animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-violet-500" />
                      <CardTitle className="text-sm font-bold text-violet-700 dark:text-violet-300">{labels.cashFlow}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="flex items-end justify-between gap-2 h-24">
                      {cashFlowData.map((d, idx) => {
                        const height = maxCashFlow > 0 ? (Math.abs(d.amount) / maxCashFlow) * 100 : 0
                        const isPositive = d.amount >= 0
                        return (
                          <div key={d.day} className="flex flex-col items-center gap-1 flex-1 animate-in" style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}>
                            <span className="text-[10px] tabular-nums text-muted-foreground">
                              {shortenAmount(Math.abs(d.amount))}
                            </span>
                            <div className="w-full flex justify-center">
                              <div className="w-2 rounded-full relative">
                                <div
                                  className={`w-full rounded-full transition-all duration-700 ${isPositive ? 'bg-gradient-to-t from-emerald-500 to-emerald-300' : 'bg-gradient-to-t from-red-500 to-red-300'}`}
                                  style={{ height: `${Math.max(8, height * 0.8)}px` }}
                                />
                                <div
                                  className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-500'} shadow-sm`}
                                />
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{d.day}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-violet-500" />
                      <CardTitle className="text-sm font-bold text-violet-700 dark:text-violet-300">{labels.quickActions}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 flex flex-col gap-2">
                    <Button
                      className="gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white w-full justify-start hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      onClick={() => openCreate('income')}
                    >
                      <ArrowUpRight className="h-4 w-4" />{labels.addIncome}
                    </Button>
                    <Button
                      className="gap-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white w-full justify-start hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      onClick={() => openCreate('expense')}
                    >
                      <ArrowDownRight className="h-4 w-4" />{labels.addExpense}
                    </Button>
                    <Button
                      className="gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white w-full justify-start hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                      onClick={() => setActiveTab('reports')}
                    >
                      <BarChart3 className="h-4 w-4" />{labels.viewReport}
                    </Button>
                  </CardContent>
                </Card>

                {/* Savings Goal */}
                <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                  <CardHeader className="pb-2 pt-4 px-5">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-violet-500" />
                      <CardTitle className="text-sm font-bold text-violet-700 dark:text-violet-300">{labels.savingsGoal}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <div className="text-center mb-3">
                      <p className="text-3xl font-bold gradient-text">{toPersianDigits(totalIncome > 0 ? Math.round((netCashFlow / totalIncome) * 100) : 0)}٪</p>
                      <p className="text-xs text-muted-foreground mt-1">پس‌انداز: {shortenAmount(netCashFlow)} از {shortenAmount(totalIncome)}</p>
                    </div>
                    <div className="h-3 bg-muted/60 rounded-full overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000" style={{ width: `${totalIncome > 0 ? Math.min(100, Math.round((netCashFlow / totalIncome) * 100)) : 0}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{netCashFlow >= 0 ? shortenAmount(netCashFlow) : '-' + shortenAmount(Math.abs(netCashFlow))} {labels.toman}</span>
                      <Badge className="bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-0 text-[10px]">نسبت پس‌انداز</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trend Chart */}
              <Card className="glass-card-violet shadow-sm animate-in" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-violet-500" />
                      <h3 className="font-bold text-violet-700 dark:text-violet-300">{labels.monthlyTrend}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-sm bg-gradient-to-r from-emerald-400 to-green-500" />
                        <span className="text-muted-foreground">{labels.income}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-sm bg-gradient-to-r from-red-400 to-rose-500" />
                        <span className="text-muted-foreground">{labels.expense}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {monthlyData.map((data, idx) => {
                      const incomeWidth = (data.income / maxMonthly) * 100
                      const expenseWidth = (data.expense / maxMonthly) * 100
                      const profit = data.income - data.expense
                      return (
                        <div key={data.month} className="group animate-in" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium w-20">{data.month}</span>
                            <div className="flex items-center gap-2 text-[10px] tabular-nums">
                              <span className="text-emerald-600 dark:text-emerald-400">{toPersianDigits(data.income)}M</span>
                              <span className="text-red-600 dark:text-red-400">{toPersianDigits(data.expense)}M</span>
                              <span className={`font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {profit >= 0 ? '+' : ''}{toPersianDigits(profit)}M
                              </span>
                            </div>
                          </div>
                          <div className="h-3 bg-muted/50 rounded-full overflow-hidden mb-1">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-1000 ease-out" style={{ width: `${incomeWidth}%` }} />
                          </div>
                          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-1000 ease-out" style={{ width: `${expenseWidth}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Cross-Module Overview */}
              <ModuleStatsOverview />

              {/* Income vs Expense Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">درآمدها</h3>
                      <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-[10px]">
                        {formatAmount(totalIncome)} {labels.toman}
                      </Badge>
                    </div>
                    <div className="space-y-2.5">
                      {incomeCategories.map(([cat, catTotal]) => {
                        const pct = totalIncome > 0 ? Math.round((catTotal / totalIncome) * 100) : 0
                        if (catTotal === 0) return null
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>{categoryLabels[cat] || cat}</span>
                              <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{toPersianDigits(pct)}٪</span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                      {incomeCategories.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">{labels.noData}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                      <h3 className="text-sm font-bold text-red-700 dark:text-red-300">هزینه‌ها</h3>
                      <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-[10px]">
                        {formatAmount(totalExpense)} {labels.toman}
                      </Badge>
                    </div>
                    <div className="space-y-2.5">
                      {expenseCategories.map(([cat, catTotal]) => {
                        const pct = totalExpense > 0 ? Math.round((catTotal / totalExpense) * 100) : 0
                        if (catTotal === 0) return null
                        return (
                          <div key={cat} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>{categoryLabels[cat] || cat}</span>
                              <span className="tabular-nums font-medium text-red-600 dark:text-red-400">{toPersianDigits(pct)}٪</span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )
                      })}
                      {expenseCategories.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">{labels.noData}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: TRANSACTIONS
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="transactions" className="space-y-4">
          {/* Search + Filters */}
          <Card className="glass-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={typeFilter} onValueChange={v => setTypeFilter(v as typeof typeFilter)}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder={labels.type} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{labels.all}</SelectItem>
                      <SelectItem value="income">{labels.income}</SelectItem>
                      <SelectItem value="expense">{labels.expense}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[130px]">
                      <Filter className="h-4 w-4 ml-1 text-muted-foreground" />
                      <SelectValue placeholder={labels.category} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{labels.all}</SelectItem>
                      {usedCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{categoryLabels[cat] || cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Count */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              {toPersianDigits(filtered.length)} تراکنش
            </p>
            <p className="text-sm font-bold tabular-nums text-violet-600 dark:text-violet-400">
              {labels.runningTotal} {formatAmount(runningTotals[runningTotals.length - 1] || 0)} {labels.toman}
            </p>
          </div>

          {/* Transactions Table */}
          <Card className="glass-card shadow-sm">
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-right p-3 font-medium text-muted-foreground text-xs">{labels.date}</th>
                      <th className="text-right p-3 font-medium text-muted-foreground text-xs">{labels.description}</th>
                      <th className="text-right p-3 font-medium text-muted-foreground text-xs">{labels.type}</th>
                      <th className="text-right p-3 font-medium text-muted-foreground text-xs">{labels.category}</th>
                      <th className="text-right p-3 font-medium text-muted-foreground text-xs">{labels.amount}</th>
                      <th className="text-right p-3 font-medium text-muted-foreground text-xs">{labels.runningTotal}</th>
                      <th className="text-center p-3 font-medium text-muted-foreground text-xs">{labels.invoiceLink}</th>
                      <th className="text-center p-3 font-medium text-muted-foreground text-xs">{labels.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((transaction, idx) => {
                      const tc = typeConfig[transaction.type] || typeConfig.expense
                      const linkedInvoice = transaction.invoiceId ? invoiceByTxId[transaction.id] : null
                      return (
                        <tr
                          key={transaction.id}
                          className="border-b border-border/30 hover:bg-muted/30 transition-colors animate-in"
                          style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                        >
                          <td className="p-3 text-xs tabular-nums whitespace-nowrap">{formatDate(transaction.createdAt)}</td>
                          <td className="p-3 font-medium truncate max-w-[200px]">
                            <div className="flex items-center gap-1.5">
                              {transaction.description}
                              {sharedTransactions.some(t => t.source === 'accounting' && t.description === transaction.description) && (
                                <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-[9px] h-4 px-1 shrink-0 gap-0.5" title="تراکنش مرتبط در حسابداری">
                                  <Receipt className="h-2.5 w-2.5" />
                                  حسابداری
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={`${tc.bg} ${tc.text} border-0 text-[10px] gap-1`}>
                              <tc.icon className="h-3 w-3" />
                              {transaction.type === 'income' ? labels.income : labels.expense}
                            </Badge>
                          </td>
                          <td className="p-3 text-xs">{categoryLabels[transaction.category] || transaction.category}</td>
                          <td className={`p-3 font-bold tabular-nums whitespace-nowrap ${tc.text}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                          </td>
                          <td className={`p-3 text-xs tabular-nums whitespace-nowrap ${runningTotals[idx] >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatAmount(runningTotals[idx])}
                          </td>
                          <td className="p-3 text-center">
                            {transaction.invoiceId && linkedInvoice ? (
                              <Badge variant="outline" className="text-[9px] h-5 px-1.5 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 gap-0.5">
                                <Receipt className="h-2.5 w-2.5" />
                                {linkedInvoice.invoiceNumber}
                              </Badge>
                            ) : transaction.bankAccountId ? (
                              <Badge variant="outline" className="text-[9px] h-5 px-1.5 border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400 gap-0.5">
                                <CreditCard className="h-2.5 w-2.5" />
                                {labels.bankAccount}
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-violet-100 dark:hover:bg-violet-900/30" onClick={() => openEdit(transaction)}>
                                <Edit3 className="h-3.5 w-3.5 text-violet-500" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/30" onClick={() => { setDeletingId(transaction.id); setDeleteDialogOpen(true) }} disabled={isDeleting}>
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-2 p-3">
                {filtered.map((transaction, idx) => {
                  const tc = typeConfig[transaction.type] || typeConfig.expense
                  const TypeIcon = tc.icon
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all duration-200 animate-in"
                      style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                    >
                      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${tc.gradient} flex items-center justify-center shadow-sm shrink-0`}>
                        <TypeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {transaction.description}
                          {sharedTransactions.some(t => t.source === 'accounting' && t.description === transaction.description) && (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-[8px] h-3.5 px-1 mr-1 shrink-0 gap-0.5" title="تراکنش مرتبط در حسابداری">
                              <Receipt className="h-2 w-2" />
                              حسابداری
                            </Badge>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-2.5 w-2.5" />{formatDate(transaction.createdAt)}
                          </span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-current/20 text-muted-foreground">
                            {categoryLabels[transaction.category] || transaction.category}
                          </Badge>
                          {transaction.invoiceId && (
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 gap-0.5">
                              <Receipt className="h-2 w-2" />
                              {labels.linkedInvoice}{transaction.invoiceId.slice(-4)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <p className={`font-bold tabular-nums text-sm ${tc.text}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{labels.toman}</p>
                      </div>
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(transaction)}>
                          <Edit3 className="h-3 w-3 text-violet-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setDeletingId(transaction.id); setDeleteDialogOpen(true) }} disabled={isDeleting}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Empty State */}
              {filtered.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Wallet className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">{labels.noResults}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: BUDGET
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="budget" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="glass-card shadow-sm animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.totalBudget}</p>
                  <p className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">{shortenAmount(totalBudget)} <span className="text-xs font-normal">{labels.toman}</span></p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card shadow-sm animate-in card-elevated" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-md shadow-red-500/25 shrink-0">
                  <ArrowDownRight className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.totalSpent}</p>
                  <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">{shortenAmount(totalSpent)} <span className="text-xs font-normal">{labels.toman}</span></p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card shadow-sm animate-in card-elevated" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${totalRemaining >= 0 ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-500/25' : 'bg-gradient-to-br from-red-400 to-rose-500 shadow-red-500/25'}`}>
                  {totalRemaining >= 0 ? <PiggyBank className="h-6 w-6 text-white" /> : <AlertTriangle className="h-6 w-6 text-white" />}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{labels.remaining}</p>
                  <p className={`text-lg font-bold tabular-nums ${totalRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {totalRemaining >= 0 ? '' : '-'}{shortenAmount(Math.abs(totalRemaining))} <span className="text-xs font-normal">{labels.toman}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Budget Items */}
          <Card className="glass-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-500" />
                <CardTitle className="text-sm font-bold text-violet-700 dark:text-violet-300">{labels.budgetPlan}</CardTitle>
              </div>
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                onClick={openBudgetCreate}
              >
                <Plus className="h-3.5 w-3.5" />{labels.addBudget}
              </Button>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-4 pr-2">
                  {budgetWithActual.map((item, idx) => {
                    const pct = item.budgetAmount > 0 ? Math.round((item.spentAmount / item.budgetAmount) * 100) : 0
                    const isOverBudget = item.spentAmount > item.budgetAmount
                    const remaining = item.budgetAmount - item.spentAmount
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all duration-300 animate-in hover-lift ${
                          isOverBudget
                            ? 'border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/10'
                            : 'border-border/50 bg-muted/20'
                        }`}
                        style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-bold text-sm">{item.name || categoryLabels[item.category] || item.category}</span>
                            {isOverBudget && (
                              <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-[10px] gap-1 animate-pulse">
                                <AlertTriangle className="h-3 w-3" />
                                {labels.overBudget}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-violet-100 dark:hover:bg-violet-900/30" onClick={() => openBudgetEdit(item)}>
                              <Edit3 className="h-3.5 w-3.5 text-violet-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              {labels.spent}: <span className="font-medium text-foreground">{formatAmount(item.spentAmount)}</span> از <span className="font-medium text-foreground">{formatAmount(item.budgetAmount)}</span> {labels.toman}
                            </span>
                            <span className={`font-bold tabular-nums ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                              {toPersianDigits(pct)}٪
                            </span>
                          </div>
                          <div className="h-2.5 bg-muted/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isOverBudget
                                  ? 'bg-gradient-to-r from-red-500 to-rose-500'
                                  : pct > 80
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                    : 'bg-gradient-to-r from-violet-500 to-purple-500'
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`tabular-nums ${isOverBudget ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted-foreground'}`}>
                            {isOverBudget
                              ? `مبلغ اضافی: ${formatAmount(Math.abs(remaining))} ${labels.toman}`
                              : `باقیمانده: ${formatAmount(remaining)} ${labels.toman}`
                            }
                          </span>
                          <span className="text-muted-foreground">
                            {shortenAmount(item.spentAmount)} / {shortenAmount(item.budgetAmount)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {budgetWithActual.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Target className="h-8 w-8 mb-2 opacity-30" />
                      <p className="text-sm">{labels.noData}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: REPORTS
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="reports" className="space-y-4">
          {/* Yearly Income vs Expense */}
          <Card className="glass-card-violet shadow-sm animate-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-violet-500" />
                  <h3 className="font-bold text-violet-700 dark:text-violet-300">{labels.yearlyComparison}</h3>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-gradient-to-r from-emerald-400 to-green-500" />
                    <span className="text-muted-foreground">{labels.income}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-gradient-to-r from-red-400 to-rose-500" />
                    <span className="text-muted-foreground">{labels.expense}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-end gap-2 h-40">
                {monthlyData.map((data, idx) => {
                  const incomeH = (data.income / maxMonthly) * 100
                  const expenseH = (data.expense / maxMonthly) * 100
                  return (
                    <div key={data.month} className="flex-1 flex flex-col items-center gap-0.5 animate-in" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}>
                      <div className="flex items-end gap-0.5 w-full h-32">
                        <div className="flex-1 flex flex-col justify-end h-full">
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-emerald-300 transition-all duration-1000 ease-out min-h-[4px]"
                            style={{ height: `${incomeH}%` }}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-end h-full">
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-red-500 to-red-300 transition-all duration-1000 ease-out min-h-[4px]"
                            style={{ height: `${expenseH}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[9px] text-muted-foreground text-center leading-tight mt-1">{data.month}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top 5 Expense Categories */}
            <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="h-5 w-5 text-red-500" />
                  <h3 className="font-bold text-red-700 dark:text-red-300 text-sm">{labels.topExpenseCategories}</h3>
                </div>
                <div className="space-y-3">
                  {topExpenseCategories.map(([cat, amount], idx) => {
                    const width = maxTopExpense > 0 ? (amount / maxTopExpense) * 100 : 0
                    const colors = ['from-red-500 to-rose-500', 'from-orange-500 to-amber-500', 'from-violet-500 to-purple-500', 'from-cyan-500 to-blue-500', 'from-emerald-500 to-teal-500']
                    return (
                      <div key={cat} className="space-y-1 animate-in" style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-bold text-white bg-gradient-to-r ${colors[idx]}`}>
                              {toPersianDigits(idx + 1)}
                            </span>
                            <span className="font-medium">{categoryLabels[cat] || cat}</span>
                          </div>
                          <span className="tabular-nums font-bold text-red-600 dark:text-red-400">{shortenAmount(amount)}</span>
                        </div>
                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${colors[idx]} transition-all duration-700`} style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  {topExpenseCategories.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">{labels.noData}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Savings Rate + Health Score */}
            <div className="space-y-4">
              {/* Monthly Savings Rate */}
              <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <PiggyBank className="h-4 w-4 text-violet-500" />
                    <h3 className="font-bold text-violet-700 dark:text-violet-300 text-sm">{labels.monthlySavingsRate}</h3>
                  </div>
                  <div className="space-y-2.5">
                    {savingsRates.map((s, idx) => (
                      <div key={s.month} className="flex items-center gap-3 animate-in" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}>
                        <span className="text-xs w-16 text-muted-foreground shrink-0">{s.month}</span>
                        <div className="flex-1 h-2.5 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              s.rate >= 30 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                              s.rate >= 15 ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                              'bg-gradient-to-r from-red-400 to-rose-500'
                            }`}
                            style={{ width: `${Math.max(s.rate, 2)}%` }}
                          />
                        </div>
                        <span className={`text-xs tabular-nums font-bold w-12 text-left shrink-0 ${
                          s.rate >= 30 ? 'text-emerald-600 dark:text-emerald-400' :
                          s.rate >= 15 ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {toPersianDigits(s.rate)}٪
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Health Score */}
              <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart className="h-4 w-4 text-violet-500" />
                    <h3 className="font-bold text-violet-700 dark:text-violet-300 text-sm">{labels.financialHealthScore}</h3>
                  </div>
                  <div className="flex justify-center py-2">
                    <HealthGauge score={healthScore} label="بر اساس بودجه و پس‌انداز" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Export Summary */}
          <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
                  <Download className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-sm">{labels.exportSummary}</p>
                  <p className="text-xs text-muted-foreground">دانلود خلاصه عملکرد مالی شامل درآمد، هزینه و بودجه</p>
                </div>
              </div>
              <Button
                className="gap-2 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
                onClick={handleExportSummary}
              >
                <Download className="h-4 w-4" />
                {labels.exportSummary}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Add/Edit Transaction Dialog ───────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-violet-700 dark:text-violet-300">
              {editingId ? labels.editTransaction : labels.addTransaction}
            </DialogTitle>
            <DialogDescription>
              {editingId ? 'اطلاعات تراکنش را ویرایش کنید' : 'اطلاعات تراکنش جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{labels.description}</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.amount}</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                  dir="ltr"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>{labels.date}</Label>
                <Input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} placeholder="۱۴۰۲/۱۱/۲۵" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.type}</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v, category: v === 'income' ? 'sales' : 'rent' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">{labels.income}</SelectItem>
                    <SelectItem value="expense">{labels.expense}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.category}</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {form.type === 'income' ? (
                      <>
                        <SelectItem value="sales">{categoryLabels.sales}</SelectItem>
                        <SelectItem value="services">{categoryLabels.services}</SelectItem>
                        <SelectItem value="consulting">{categoryLabels.consulting}</SelectItem>
                        <SelectItem value="other">{categoryLabels.other}</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="salary">{categoryLabels.salary}</SelectItem>
                        <SelectItem value="rent">{categoryLabels.rent}</SelectItem>
                        <SelectItem value="marketing">{categoryLabels.marketing}</SelectItem>
                        <SelectItem value="utilities">{categoryLabels.utilities}</SelectItem>
                        <SelectItem value="software">{categoryLabels.software}</SelectItem>
                        <SelectItem value="equipment">{categoryLabels.equipment}</SelectItem>
                        <SelectItem value="tax">{categoryLabels.tax}</SelectItem>
                        <SelectItem value="insurance">{categoryLabels.insurance}</SelectItem>
                        <SelectItem value="transport">{categoryLabels.transport}</SelectItem>
                        <SelectItem value="training">{categoryLabels.training}</SelectItem>
                        <SelectItem value="office">{categoryLabels.office}</SelectItem>
                        <SelectItem value="subscription">{categoryLabels.subscription}</SelectItem>
                        <SelectItem value="maintenance">{categoryLabels.maintenance}</SelectItem>
                        <SelectItem value="legal">{categoryLabels.legal}</SelectItem>
                        <SelectItem value="healthcare">{categoryLabels.healthcare}</SelectItem>
                        <SelectItem value="other">{categoryLabels.other}</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSave} disabled={!form.description || form.amount <= 0 || isCreating}>
              {isCreating ? '...' : labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Transaction Confirmation Dialog ───────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-red-700 dark:text-red-300">{labels.deleteTransaction}</DialogTitle>
            <DialogDescription>{labels.deleteConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeletingId(null) }} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? '...' : labels.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add/Edit Budget Dialog ────────────────────────────────────────── */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent className="max-w-md glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-violet-700 dark:text-violet-300">
              {editingBudgetId ? labels.editBudget : labels.addBudget}
            </DialogTitle>
            <DialogDescription>
              {editingBudgetId ? 'مبلغ بودجه دسته‌بندی را ویرایش کنید' : 'دسته‌بندی و مبلغ بودجه جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{labels.budgetCategory}</Label>
              <Select value={budgetForm.category} onValueChange={v => setBudgetForm({ ...budgetForm, category: v, icon: budgetCategoryIcons[v] || '📌' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{labels.budgetAmount}</Label>
              <Input
                type="number"
                value={budgetForm.budgetAmount}
                onChange={e => setBudgetForm({ ...budgetForm, budgetAmount: Number(e.target.value) })}
                dir="ltr"
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBudgetDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleBudgetSave} disabled={budgetForm.budgetAmount <= 0 || isCreating}>
              {isCreating ? '...' : labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
