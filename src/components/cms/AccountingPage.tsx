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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  FileText, Plus, Pencil, Trash2, Search, DollarSign,
  CheckCircle, Clock, XCircle, Receipt, TrendingUp, AlertTriangle,
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

// ─── Labels ─────────────────────────────────────────────────────────────────

const labels = {
  title: 'حسابداری',
  subtitle: 'مدیریت فاکتورها و صورتحساب‌ها',
  create: 'صدور فاکتور',
  edit: 'ویرایش فاکتور',
  delete: 'حذف فاکتور',
  deleteConfirm: 'آیا مطمئن هستید؟',
  deleteDesc: 'این عمل قابل بازگشت نیست.',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو در فاکتورها...',
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

const emptyForm = {
  number: '', customer: '', amount: 0, status: 'pending' as Invoice['status'],
  date: '', dueDate: '', items: [{ description: '', quantity: 1, unitPrice: 0 }],
}

export default function AccountingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

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
              <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">{formatAmount(monthlyRevenue)} {labels.toman}</p>
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

      {/* Filters */}
      <Card className="glass-card-emerald shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
            </div>
          </div>
          {/* Status tabs */}
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
                    return (
                      <TableRow
                        key={invoice.id}
                        className="hover-lift transition-all duration-200 animate-in"
                        style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                      >
                        <TableCell className="font-mono text-sm font-medium">{invoice.number}</TableCell>
                        <TableCell className="font-medium">{invoice.customer}</TableCell>
                        <TableCell className="font-bold tabular-nums">{formatAmount(invoice.amount)} <span className="text-xs text-muted-foreground font-normal">{labels.toman}</span></TableCell>
                        <TableCell>
                          <Badge className={`${sc.bg} ${sc.text} border-0 gap-1.5 shadow-sm`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusLabels[invoice.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{invoice.date}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{invoice.dueDate}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:scale-110 active:scale-95 transition-transform duration-150" onClick={() => openEdit(invoice)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={() => openDelete(invoice.id)}>
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

      {/* Create/Edit Dialog */}
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
                <Label>ردیف‌های فاکتور</Label>
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

      {/* Delete Confirmation */}
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
    </div>
  )
}
