'use client'

import { useState } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { Customer } from './types'
import { getStatusColor, formatDate } from './types'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { UserCircle, Plus, Pencil, Trash2, Search, DollarSign, Building2 } from 'lucide-react'

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
  lead: 'bg-blue-500',
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

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Customer>>(emptyCustomer)

  const filtered = customersData.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

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
    } else {
      createCustomer.mutate(form)
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteCustomer.mutate(deletingId)
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white" onClick={openCreate}>
          <Plus className="h-4 w-4" />{labels.create}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-amber-500 to-amber-700 border-0 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2.5">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm opacity-80">کل مشتریان</p>
              <p className="text-2xl font-bold">{customersData.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-700 border-0 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2.5">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm opacity-80">{labels.activeCustomers}</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 border-0 text-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-white/20 rounded-lg p-2.5">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm opacity-80">{labels.totalValue}</p>
              <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-amber-500/5 to-amber-600/5 border-amber-200/30 dark:border-amber-800/30">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
      <Card className="bg-gradient-to-br from-amber-500/5 to-amber-600/5 border-amber-200/30 dark:border-amber-800/30">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <UserCircle className="h-12 w-12 mb-3 opacity-30" />
              <p>{search ? labels.noResults : labels.noCustomers}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-amber-200/20 dark:border-amber-800/20">
                    <TableHead>{labels.name}</TableHead>
                    <TableHead>{labels.email}</TableHead>
                    <TableHead className="hidden md:table-cell">{labels.company}</TableHead>
                    <TableHead>{labels.status}</TableHead>
                    <TableHead className="hidden sm:table-cell">{labels.value}</TableHead>
                    <TableHead className="hidden lg:table-cell">{labels.date}</TableHead>
                    <TableHead>{labels.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(customer => {
                    const sc = getStatusColor(customer.status)
                    const dotColor = statusDotColors[customer.status] ?? 'bg-gray-400'
                    return (
                      <TableRow key={customer.id} className="border-amber-200/10 dark:border-amber-800/10 hover:bg-amber-500/5">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
                              {customer.name.charAt(0)}
                            </div>
                            <span className="font-medium">{customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" dir="ltr">{customer.email}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{customer.company || '—'}</TableCell>
                        <TableCell>
                          <Badge className={`${sc.bg} ${sc.text} border-0 gap-1`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                            {statusLabels[customer.status] ?? customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm font-medium">
                          ${customer.value.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {formatDate(customer.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(customer)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => openDelete(customer.id)}>
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
        <DialogContent className="max-w-md">
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white" onClick={handleSave} disabled={!form.name || !form.email}>
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{labels.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
