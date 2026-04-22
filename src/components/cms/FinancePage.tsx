'use client'

import { useState, useMemo } from 'react'
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
  TrendingUp, TrendingDown, DollarSign, Wallet, PiggyBank,
  Plus, Search, ArrowUpRight, ArrowDownRight, Calendar,
  BarChart3, PieChart,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Transaction {
  id: string
  date: string
  description: string
  type: 'income' | 'expense'
  amount: number
  category: string
}

interface MonthlyData {
  month: string
  income: number
  expense: number
}

// ─── Labels ─────────────────────────────────────────────────────────────────

const labels = {
  title: 'مالی',
  subtitle: 'داشبورد مالی و مدیریت درآمد و هزینه‌ها',
  addTransaction: 'ثبت تراکنش',
  save: 'ذخیره',
  cancel: 'انصراف',
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
  monthlyIncome: 'درآمد ماهانه',
  monthlyExpense: 'هزینه ماهانه',
  netProfit: 'سود خالص',
  profitMargin: 'حاشیه سود',
  monthlyTrend: 'روند ماهانه',
  recentTransactions: 'تراکنش‌های اخیر',
  budgetOverview: 'خلاصه بودجه',
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

// ─── Sample data ────────────────────────────────────────────────────────────

const initialTransactions: Transaction[] = [
  { id: '1', date: '۱۴۰۲/۱۱/۱۵', description: 'فروش پروژه وب‌سایت', type: 'income', amount: 45_000_000, category: 'sales' },
  { id: '2', date: '۱۴۰۲/۱۱/۱۴', description: 'پرداخت حقوق آبان ماه', type: 'expense', amount: 25_000_000, category: 'salary' },
  { id: '3', date: '۱۴۰۲/۱۱/۱۲', description: 'درآمد مشاوره فنی', type: 'income', amount: 8_500_000, category: 'services' },
  { id: '4', date: '۱۴۰۲/۱۱/۱۰', description: 'اجاره دفتر آذر ماه', type: 'expense', amount: 12_000_000, category: 'rent' },
  { id: '5', date: '۱۴۰۲/۱۱/۰۸', description: 'هزینه تبلیغات گوگل ادز', type: 'expense', amount: 3_500_000, category: 'marketing' },
  { id: '6', date: '۱۴۰۲/۱۱/۰۵', description: 'فروش اپلیکیشن موبایل', type: 'income', amount: 120_000_000, category: 'sales' },
  { id: '7', date: '۱۴۰۲/۱۱/۰۳', description: 'خرید لپ‌تاپ جدید', type: 'expense', amount: 65_000_000, category: 'equipment' },
  { id: '8', date: '۱۴۰۲/۱۱/۰۱', description: 'حق اشتراک هاستینگ', type: 'expense', amount: 850_000, category: 'utilities' },
  { id: '9', date: '۱۴۰۲/۱۰/۲۸', description: 'درآمد پشتیبانی ماهانه', type: 'income', amount: 15_000_000, category: 'services' },
  { id: '10', date: '۱۴۰۲/۱۰/۲۵', description: 'خرید لایسنس نرم‌افزار', type: 'expense', amount: 4_200_000, category: 'software' },
  { id: '11', date: '۱۴۰۲/۱۰/۲۲', description: 'فروش قالب وب‌سایت', type: 'income', amount: 5_000_000, category: 'sales' },
  { id: '12', date: '۱۴۰۲/۱۰/۲۰', description: 'هزینه سفر کاری اصفهان', type: 'expense', amount: 2_800_000, category: 'other' },
  { id: '13', date: '۱۴۰۲/۱۰/۱۸', description: 'درآمد طراحی UI/UX', type: 'income', amount: 22_000_000, category: 'services' },
  { id: '14', date: '۱۴۰۲/۱۰/۱۵', description: 'پرداخت اینترنت و تلفن', type: 'expense', amount: 1_200_000, category: 'utilities' },
  { id: '15', date: '۱۴۰۲/۱۰/۱۲', description: 'فروش دوره آموزشی آنلاین', type: 'income', amount: 35_000_000, category: 'sales' },
]

const monthlyData: MonthlyData[] = [
  { month: 'فروردین', income: 45, expense: 30 },
  { month: 'اردیبهشت', income: 52, expense: 35 },
  { month: 'خرداد', income: 38, expense: 28 },
  { month: 'تیر', income: 60, expense: 40 },
  { month: 'مرداد', income: 55, expense: 32 },
  { month: 'شهریور', income: 48, expense: 38 },
  { month: 'مهر', income: 65, expense: 42 },
  { month: 'آبان', income: 58, expense: 36 },
  { month: 'آذر', income: 60, expense: 38 },
]

const emptyForm = {
  date: '', description: '', type: 'income' as Transaction['type'],
  amount: 0, category: 'sales',
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const monthlyIncome = 60_000_000
  const monthlyExpense = 38_000_000
  const netProfit = monthlyIncome - monthlyExpense
  const profitMargin = Math.round((netProfit / monthlyIncome) * 100)

  const filtered = useMemo(() => transactions.filter(t => {
    const matchSearch = t.description.includes(search) || categoryLabels[t.category]?.includes(search)
    const matchType = typeFilter === 'all' || t.type === typeFilter
    return matchSearch && matchType
  }), [transactions, search, typeFilter])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const maxMonthly = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)))

  const openCreate = () => {
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.description || form.amount <= 0) return
    const newTransaction: Transaction = { ...form, id: Date.now().toString() }
    setTransactions(prev => [newTransaction, ...prev])
    toast.success('تراکنش جدید ثبت شد')
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
          className="gap-2 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={openCreate}
        >
          <Plus className="h-4 w-4" />{labels.addTransaction}
        </Button>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card hover-lift shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{labels.monthlyIncome}</p>
              <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{shortenAmount(monthlyIncome)} <span className="text-xs font-normal">{labels.toman}</span></p>
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
              <p className="text-xl font-bold tabular-nums text-red-600 dark:text-red-400">{shortenAmount(monthlyExpense)} <span className="text-xs font-normal">{labels.toman}</span></p>
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
              <p className="text-xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{shortenAmount(netProfit)} <span className="text-xs font-normal">{labels.toman}</span></p>
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

      {/* Monthly Trend Chart */}
      <Card className="glass-card-violet shadow-sm">
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
                  {/* Income bar */}
                  <div className="h-3 bg-muted/50 rounded-full overflow-hidden mb-1">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-1000 ease-out"
                      style={{ width: `${incomeWidth}%` }}
                    />
                  </div>
                  {/* Expense bar */}
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-1000 ease-out"
                      style={{ width: `${expenseWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Income vs Expense visual comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income breakdown */}
        <Card className="glass-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">درآمدها</h3>
              <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-[10px]">
                {formatAmount(totalIncome)} {labels.toman}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {['sales', 'services'].map(cat => {
                const catTotal = transactions.filter(t => t.type === 'income' && t.category === cat).reduce((s, t) => s + t.amount, 0)
                const pct = totalIncome > 0 ? Math.round((catTotal / totalIncome) * 100) : 0
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{categoryLabels[cat]}</span>
                      <span className="tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{toPersianDigits(pct)}٪</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Expense breakdown */}
        <Card className="glass-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-bold text-red-700 dark:text-red-300">هزینه‌ها</h3>
              <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-[10px]">
                {formatAmount(totalExpense)} {labels.toman}
              </Badge>
            </div>
            <div className="space-y-2.5">
              {['salary', 'rent', 'marketing', 'equipment', 'software', 'utilities'].map(cat => {
                const catTotal = transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0)
                const pct = totalExpense > 0 ? Math.round((catTotal / totalExpense) * 100) : 0
                if (catTotal === 0) return null
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{categoryLabels[cat]}</span>
                      <span className="tabular-nums font-medium text-red-600 dark:text-red-400">{toPersianDigits(pct)}٪</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="glass-card-violet shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-violet-500" />
            <h3 className="font-bold text-violet-700 dark:text-violet-300">{labels.recentTransactions}</h3>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
            </div>
            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map(t => {
                const isActive = typeFilter === t
                const label = t === 'all' ? 'همه' : t === 'income' ? 'درآمد' : 'هزینه'
                const grad = t === 'all'
                  ? 'from-gray-500 to-gray-600'
                  : typeConfig[t].gradient
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`
                      px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap
                      ${isActive
                        ? `bg-gradient-to-r ${grad} text-white shadow-md hover:scale-[1.03] active:scale-[0.97]`
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Transaction list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Wallet className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">{search ? labels.noResults : 'تراکنشی یافت نشد'}</p>
              </div>
            ) : (
              filtered.map((transaction, idx) => {
                const tc = typeConfig[transaction.type]
                const TypeIcon = tc.icon
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-all duration-200 animate-in group cursor-pointer hover-lift"
                    style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                  >
                    {/* Icon */}
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${tc.gradient} flex items-center justify-center shadow-sm shrink-0`}>
                      <TypeIcon className="h-5 w-5 text-white" />
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {transaction.date}
                        </span>
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-current/20 text-muted-foreground">
                          {categoryLabels[transaction.category]}
                        </Badge>
                      </div>
                    </div>
                    {/* Amount */}
                    <div className="text-left shrink-0">
                      <p className={`font-bold tabular-nums text-sm ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{labels.toman}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-violet-700 dark:text-violet-300">
              {labels.addTransaction}
            </DialogTitle>
            <DialogDescription>
              اطلاعات تراکنش جدید را وارد کنید
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
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as Transaction['type'], category: v === 'income' ? 'sales' : 'rent' })}>
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
                      </>
                    ) : (
                      <>
                        <SelectItem value="salary">{categoryLabels.salary}</SelectItem>
                        <SelectItem value="rent">{categoryLabels.rent}</SelectItem>
                        <SelectItem value="marketing">{categoryLabels.marketing}</SelectItem>
                        <SelectItem value="utilities">{categoryLabels.utilities}</SelectItem>
                        <SelectItem value="software">{categoryLabels.software}</SelectItem>
                        <SelectItem value="equipment">{categoryLabels.equipment}</SelectItem>
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
            <Button className="bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSave} disabled={!form.description || form.amount <= 0}>
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
