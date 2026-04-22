'use client'

import { useState } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { Customer } from './types'
import { getStatusColor, formatDate } from './types'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { UserCircle, Plus, Pencil, Trash2, Search, DollarSign, Building2, TrendingUp, Users, Download, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { exportToCSV } from '@/lib/csv-export'
import { toast } from 'sonner'
import PaginationControls from './PaginationControls'

const labels = {
  title: 'مدیریت مشتریان',
  subtitle: 'مدیریت ارتباط با مشتریان و اطلاعات تماس',
  create: 'افزودن مشتری',
  edit: 'ویرایش مشتری',
  delete: 'حذف مشتری',
  deleteConfirm: 'آیا مطمئن هستید؟',
  deleteDesc: 'این عمل قابل بازگشت نیست.',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو در مشتریان...',
  noResults: 'مشتری‌ای یافت نشد',
  noCustomers: 'هنوز مشتری‌ای ثبت نشده است',
  name: 'نام',
  email: 'ایمیل',
  phone: 'تلفن',
  company: 'شرکت',
  status: 'وضعیت',
  value: 'ارزش',
  date: 'تاریخ',
  actions: 'عملیات',
  totalValue: 'ارزش کل مشتریان',
  all: 'همه',
  activeCustomers: 'مشتریان فعال',
}

const statusLabels: Record<string, string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  lead: 'مشتری بالقوه',
  churned: 'از دست رفته',
}

const statusDotColors: Record<string, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  lead: 'bg-amber-500',
  churned: 'bg-red-500',
}

const emptyCustomer: Partial<Customer> = {
  name: '', email: '', phone: '', company: '', status: 'lead', value: 0,
}

export default function CustomersPage() {
  useEnsureData(['customers'])
  const { customers, createCustomer, updateCustomer, deleteCustomer } = useCMS()
  const customersData = customers.data ?? []

  const totalValue = customersData.reduce((sum, c) => sum + (c.value ?? 0), 0)
  const activeCount = customersData.filter(c => c.status === 'active').length
  const leadCount = customersData.filter(c => c.status === 'lead').length

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Customer>>(emptyCustomer)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const filtered = customersData.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  }).sort((a, b) => {
    if (!sortColumn) return 0
    if (sortColumn === 'value') {
      const diff = (a.value ?? 0) - (b.value ?? 0)
      return sortDirection === 'asc' ? diff : -diff
    }
    let valA: string = ''
    let valB: string = ''
    switch (sortColumn) {
      case 'name': valA = a.name; valB = b.name; break
      case 'status': valA = a.status; valB = b.status; break
      case 'date': valA = a.createdAt; valB = b.createdAt; break
      default: return 0
    }
    const cmp = valA.localeCompare(valB, 'fa')
    return sortDirection === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSearchChange = (v: string) => { setSearch(v); setCurrentPage(1) }
  const handleStatusFilterChange = (v: string) => { setStatusFilter(v); setCurrentPage(1) }
  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1) }

  const openCreate = () => {
    setEditingCustomer(null)
    setForm(emptyCustomer)
    setDialogOpen(true)
  }

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setForm({
      name: customer.name, email: customer.email, phone: customer.phone,
      company: customer.company, status: customer.status, value: customer.value,
    })
    setDialogOpen(true)
  }

  const openDelete = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const handleSave = () => {
    if (!form.name || !form.email) return
    if (editingCustomer) {
      updateCustomer.mutate({ id: editingCustomer.id, ...form })
      toast.success('اطلاعات مشتری بروزرسانی شد')
    } else {
      createCustomer.mutate(form)
      toast.success('مشتری جدید اضافه شد')
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteCustomer.mutate(deletingId)
      toast.success('مشتری با موفقیت حذف شد')
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 border-amber-300 dark:border-amber-700 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            onClick={() => {
              exportToCSV(
                filtered.map(c => ({
                  name: c.name,
                  email: c.email,
                  phone: c.phone,
                  company: c.company,
                  status: statusLabels[c.status] ?? c.status,
                  value: c.value ?? 0,
                  date: formatDate(c.createdAt),
                })),
                'customers-list',
                [
                  { key: 'name', label: 'نام' },
                  { key: 'email', label: 'ایمیل' },
                  { key: 'phone', label: 'تلفن' },
                  { key: 'company', label: 'شرکت' },
                  { key: 'status', label: 'وضعیت' },
                  { key: 'value', label: 'ارزش ($)' },
                  { key: 'date', label: 'تاریخ' },
                ],
              )
              toast.success('خروجی CSV با موفقیت دانلود شد!')
            }}
          >
            <Download className="h-4 w-4" />
            خروجی CSV
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md" onClick={openCreate}>
            <Plus className="h-4 w-4" />{labels.create}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-amber-500 to-amber-700 border-0 text-white stat-card hover-lift shadow-sm animate-in card-enter" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm opacity-80">کل مشتریان</p>
              <p className="text-2xl font-bold tabular-nums">{customersData.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 border-0 text-white stat-card hover-lift shadow-sm animate-in card-enter" style={{ animationDelay: '50ms', animationFillMode: 'both' }}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm opacity-80">{labels.activeCustomers}</p>
              <p className="text-2xl font-bold tabular-nums">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-600 to-emerald-800 border-0 text-white stat-card hover-lift shadow-sm animate-in card-enter" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm opacity-80">{labels.totalValue}</p>
              <p className="text-2xl font-bold tabular-nums">${totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card-amber shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={labels.search} value={search} onChange={e => handleSearchChange(e.target.value)} className="pr-10" />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.all}</SelectItem>
              <SelectItem value="active">{statusLabels.active}</SelectItem>
              <SelectItem value="inactive">{statusLabels.inactive}</SelectItem>
              <SelectItem value="lead">{statusLabels.lead}</SelectItem>
              <SelectItem value="churned">{statusLabels.churned}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="glass-card-amber shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/20 dark:to-amber-800/20 flex items-center justify-center mb-4">
                <UserCircle className="h-10 w-10 text-amber-300" />
              </div>
              <p className="text-base font-medium">{search ? labels.noResults : labels.noCustomers}</p>
              <p className="text-sm mt-1 opacity-60">برای شروع مشتری جدیدی اضافه کنید</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {labels.name}
                        {sortColumn === 'name' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    </TableHead>
                    <TableHead>{labels.email}</TableHead>
                    <TableHead className="hidden md:table-cell">{labels.company}</TableHead>
                    <TableHead>
                      <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {labels.status}
                        {sortColumn === 'status' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      <button onClick={() => handleSort('value')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {labels.value}
                        {sortColumn === 'value' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      <button onClick={() => handleSort('date')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {labels.date}
                        {sortColumn === 'date' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    </TableHead>
                    <TableHead>{labels.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((customer, idx) => {
                    const sc = getStatusColor(customer.status)
                    const dotColor = statusDotColors[customer.status] ?? 'bg-gray-400'
                    return (
                      <TableRow
                        key={customer.id}
                        className="hover-lift transition-all duration-200 animate-in cursor-pointer"
                        style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                        onClick={() => openEdit(customer)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                              {customer.name.charAt(0)}
                            </div>
                            <span className="font-medium">{customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" dir="ltr">{customer.email}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {customer.company && (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              {customer.company}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${sc.bg} ${sc.text} border-0 gap-1.5 shadow-sm`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                            {statusLabels[customer.status] ?? customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          ${customer.value.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {formatDate(customer.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:scale-110 active:scale-95 transition-transform duration-150" onClick={e => { e.stopPropagation(); openEdit(customer) }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={e => { e.stopPropagation(); openDelete(customer.id) }}>
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

      {filtered.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-amber-700 dark:text-amber-300">
              {editingCustomer ? labels.edit : labels.create}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'اطلاعات مشتری را ویرایش کنید' : 'اطلاعات مشتری جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{labels.name}</Label>
              <Input value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.email}</Label>
                <Input value={form.email ?? ''} onChange={e => setForm({ ...form, email: e.target.value })} dir="ltr" type="email" />
              </div>
              <div className="space-y-2">
                <Label>{labels.phone}</Label>
                <Input value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.company}</Label>
              <Input value={form.company ?? ''} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.status}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Customer['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{statusLabels.active}</SelectItem>
                    <SelectItem value="inactive">{statusLabels.inactive}</SelectItem>
                    <SelectItem value="lead">{statusLabels.lead}</SelectItem>
                    <SelectItem value="churned">{statusLabels.churned}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.value}</Label>
                <Input
                  type="number"
                  value={form.value ?? 0}
                  onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                  dir="ltr"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSave} disabled={!form.name || !form.email}>
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="glass-card shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{labels.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
