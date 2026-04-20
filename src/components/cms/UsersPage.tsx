'use client'

import { useState } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { User } from './types'
import { getStatusColor, getRoleBadge, formatDate } from './types'
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
import { Users, Plus, Pencil, Trash2, Search, Shield, UserCheck, UserX } from 'lucide-react'

const labels = {
  title: 'مدیریت کاربران',
  subtitle: 'ایجاد، ویرایش و مدیریت کاربران سیستم',
  create: 'افزودن کاربر',
  edit: 'ویرایش کاربر',
  delete: 'حذف کاربر',
  deleteConfirm: 'آیا مطمئن هستید که می‌خواهید این کاربر را حذف کنید؟',
  deleteDesc: 'این عمل قابل بازگشت نیست.',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو در کاربران...',
  noResults: 'کاربری یافت نشد',
  noUsers: 'هنوز کاربری ثبت نشده است',
  name: 'نام',
  email: 'ایمیل',
  role: 'نقش',
  status: 'وضعیت',
  date: 'تاریخ',
  actions: 'عملیات',
  all: 'همه',
}

const roleLabels: Record<string, string> = {
  admin: 'مدیر کل',
  editor: 'ویرایشگر',
  author: 'نویسنده',
  viewer: 'بازدیدکننده',
}

const statusLabels: Record<string, string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  suspended: 'معلق',
}

const roleDotColors: Record<string, string> = {
  admin: 'bg-purple-500',
  editor: 'bg-blue-500',
  author: 'bg-green-500',
  viewer: 'bg-gray-400',
}

const emptyUser: Partial<User> = {
  name: '', email: '', role: 'viewer', status: 'active', avatar: '',
}

export default function UsersPage() {
  useEnsureData(['users'])
  const { users, createUser, updateUser, deleteUser } = useCMS()
  const usersData = users.data ?? []

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<User>>(emptyUser)

  const filtered = usersData.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const openCreate = () => {
    setEditingUser(null)
    setForm(emptyUser)
    setDialogOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setForm({ name: user.name, email: user.email, role: user.role, status: user.status })
    setDialogOpen(true)
  }

  const openDelete = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const handleSave = () => {
    if (!form.name || !form.email) return
    if (editingUser) {
      updateUser.mutate({ id: editingUser.id, ...form })
    } else {
      createUser.mutate(form)
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteUser.mutate(deletingId)
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white" onClick={openCreate}>
          <Plus className="h-4 w-4" />{labels.create}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 border-emerald-200/30 dark:border-emerald-800/30">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.all}</SelectItem>
              <SelectItem value="admin">{roleLabels.admin}</SelectItem>
              <SelectItem value="editor">{roleLabels.editor}</SelectItem>
              <SelectItem value="author">{roleLabels.author}</SelectItem>
              <SelectItem value="viewer">{roleLabels.viewer}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 border-emerald-200/30 dark:border-emerald-800/30">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p>{search ? labels.noResults : labels.noUsers}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-emerald-200/20 dark:border-emerald-800/20">
                    <TableHead>{labels.name}</TableHead>
                    <TableHead>{labels.email}</TableHead>
                    <TableHead>{labels.role}</TableHead>
                    <TableHead className="hidden sm:table-cell">{labels.status}</TableHead>
                    <TableHead className="hidden md:table-cell">{labels.date}</TableHead>
                    <TableHead>{labels.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(user => {
                    const sc = getStatusColor(user.status)
                    const rb = getRoleBadge(user.role)
                    const dotColor = roleDotColors[user.role] ?? 'bg-gray-400'
                    return (
                      <TableRow key={user.id} className="border-emerald-200/10 dark:border-emerald-800/10 hover:bg-emerald-500/5">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" dir="ltr">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={rb.variant} className="gap-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                            {roleLabels[user.role] ?? user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={`${sc.bg} ${sc.text} border-0`}>
                            {user.status === 'active' ? <UserCheck className="h-3 w-3 ml-1" /> : user.status === 'suspended' ? <UserX className="h-3 w-3 ml-1" /> : null}
                            {statusLabels[user.status] ?? user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(user)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => openDelete(user.id)}>
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
            <DialogTitle className="text-emerald-700 dark:text-emerald-300">
              {editingUser ? labels.edit : labels.create}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'اطلاعات کاربر را ویرایش کنید' : 'اطلاعات کاربر جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{labels.name}</Label>
              <Input value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{labels.email}</Label>
              <Input value={form.email ?? ''} onChange={e => setForm({ ...form, email: e.target.value })} dir="ltr" type="email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.role}</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as User['role'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                    <SelectItem value="editor">{roleLabels.editor}</SelectItem>
                    <SelectItem value="author">{roleLabels.author}</SelectItem>
                    <SelectItem value="viewer">{roleLabels.viewer}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.status}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as User['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{statusLabels.active}</SelectItem>
                    <SelectItem value="inactive">{statusLabels.inactive}</SelectItem>
                    <SelectItem value="suspended">{statusLabels.suspended}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white" onClick={handleSave} disabled={!form.name || !form.email}>
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
