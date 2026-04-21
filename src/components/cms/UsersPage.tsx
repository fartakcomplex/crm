'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { User } from './types'
import { getStatusColor, getRoleBadge, formatDate } from './types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Users, Plus, Pencil, Trash2, Search, Shield, UserCheck, UserX, Mail, Download, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { exportToCSV } from '@/lib/csv-export'
import { toast } from 'sonner'
import PaginationControls from './PaginationControls'
import EmptyState from './EmptyState'

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
  noUsersForRole: 'کاربری با این نقش یافت نشد',
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
  editor: 'ویراستار',
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
  editor: 'bg-cyan-500',
  author: 'bg-emerald-500',
  viewer: 'bg-gray-400',
}

const roleGradients: Record<string, string> = {
  admin: 'from-purple-400 to-purple-600',
  editor: 'from-cyan-400 to-cyan-600',
  author: 'from-emerald-400 to-emerald-600',
  viewer: 'from-gray-400 to-gray-500',
}

const roleChipGradients: Record<string, string> = {
  admin: 'from-purple-500 to-purple-600',
  editor: 'from-cyan-500 to-cyan-600',
  author: 'from-emerald-500 to-emerald-600',
  viewer: 'from-gray-400 to-gray-500',
  all: 'from-slate-500 to-slate-600',
}

const roleFilterKeys = ['all', 'admin', 'editor', 'author'] as const

const emptyUser: Partial<User> = {
  name: '', email: '', role: 'viewer', status: 'active', avatar: '',
}

export default function UsersPage() {
  useEnsureData(['users'])
  const { users, createUser, updateUser, deleteUser } = useCMS()
  const usersData = users.data ?? []

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<User>>(emptyUser)

  // ─── Role counts ────────────────────────────────────────────────────
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: usersData.length }
    for (const u of usersData) {
      counts[u.role] = (counts[u.role] ?? 0) + 1
    }
    return counts
  }, [usersData])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const filtered = usersData.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  }).sort((a, b) => {
    if (!sortColumn) return 0
    let valA: string = ''
    let valB: string = ''
    switch (sortColumn) {
      case 'name': valA = a.name; valB = b.name; break
      case 'email': valA = a.email; valB = b.email; break
      case 'role': valA = a.role; valB = b.role; break
      case 'date': valA = a.createdAt; valB = b.createdAt; break
      default: return 0
    }
    const cmp = valA.localeCompare(valB, 'fa')
    return sortDirection === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSearchChange = (v: string) => { setSearch(v); setCurrentPage(1) }
  const handleRoleFilterChange = (v: string) => { setRoleFilter(v); setCurrentPage(1) }
  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1) }

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
      toast.success('اطلاعات کاربر بروزرسانی شد')
    } else {
      createUser.mutate(form)
      toast.success('کاربر جدید اضافه شد')
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteUser.mutate(deletingId)
      toast.success('کاربر با موفقیت حذف شد')
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
            className="gap-2 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            onClick={() => {
              exportToCSV(
                filtered.map(u => ({
                  name: u.name,
                  email: u.email,
                  role: roleLabels[u.role] ?? u.role,
                  status: statusLabels[u.status] ?? u.status,
                  date: formatDate(u.createdAt),
                })),
                'users-list',
                [
                  { key: 'name', label: 'نام' },
                  { key: 'email', label: 'ایمیل' },
                  { key: 'role', label: 'نقش' },
                  { key: 'status', label: 'وضعیت' },
                  { key: 'date', label: 'تاریخ' },
                ],
              )
              toast.success('خروجی CSV با موفقیت دانلود شد!')
            }}
          >
            <Download className="h-4 w-4" />
            خروجی CSV
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md" onClick={openCreate}>
            <Plus className="h-4 w-4" />{labels.create}
          </Button>
        </div>
      </div>

      {/* Search + Role Filter Chips */}
      <Card className="glass-card shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={labels.search} value={search} onChange={e => handleSearchChange(e.target.value)} className="pr-10" />
          </div>

          {/* Role Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {roleFilterKeys.map(key => {
              const isActive = roleFilter === key
              const count = roleCounts[key] ?? 0
              const chipLabel = key === 'all' ? labels.all : (roleLabels[key] ?? key)
              const gradient = roleChipGradients[key] ?? roleChipGradients.all

              return (
                <button
                  key={key}
                  onClick={() => handleRoleFilterChange(key)}
                  className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]
                    ${isActive
                      ? `bg-gradient-to-r ${gradient} text-white shadow-md`
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent hover:border-border'
                    }
                  `}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                  {chipLabel}
                  <Badge
                    variant={isActive ? 'secondary' : 'outline'}
                    className={`
                      h-5 min-w-5 px-1 text-[10px] font-bold rounded-full
                      ${isActive
                        ? 'bg-white/25 text-white border-0'
                        : 'text-muted-foreground border-muted-foreground/20'
                      }
                    `}
                  >
                    {count}
                  </Badge>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass-card shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title={search || roleFilter !== 'all' ? labels.noResults : labels.noUsers}
              description={
                roleFilter !== 'all'
                  ? labels.noUsersForRole
                  : search
                    ? 'عبارت دیگری را جستجو کنید'
                    : 'برای شروع کاربر جدیدی اضافه کنید'
              }
              action={(!search && roleFilter === 'all') ? { label: labels.create, onClick: openCreate } : undefined}
            />
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
                    <TableHead>
                      <button onClick={() => handleSort('email')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {labels.email}
                        {sortColumn === 'email' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button onClick={() => handleSort('role')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {labels.role}
                        {sortColumn === 'role' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">{labels.status}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      <button onClick={() => handleSort('date')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        {labels.date}
                        {sortColumn === 'date' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    </TableHead>
                    <TableHead>{labels.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((user, idx) => {
                    const sc = getStatusColor(user.status)
                    const rb = getRoleBadge(user.role)
                    const dotColor = roleDotColors[user.role] ?? 'bg-gray-400'
                    const gradient = roleGradients[user.role] ?? 'from-gray-400 to-gray-500'
                    return (
                      <TableRow
                        key={user.id}
                        className="hover-lift transition-all duration-200 animate-in cursor-pointer"
                        style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
                        onClick={() => openEdit(user)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium">{user.name}</span>
                              <p className="text-xs text-muted-foreground">{user.email.split('@')[0]}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" dir="ltr">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 opacity-50" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rb.variant} className="gap-1.5 shadow-sm">
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                            {roleLabels[user.role] ?? user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={`${sc.bg} ${sc.text} border-0 shadow-sm`}>
                            {user.status === 'active' ? <UserCheck className="h-3 w-3 ml-1" /> : user.status === 'suspended' ? <UserX className="h-3 w-3 ml-1" /> : null}
                            {statusLabels[user.status] ?? user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:scale-110 active:scale-95 transition-transform duration-150" onClick={e => { e.stopPropagation(); openEdit(user) }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={e => { e.stopPropagation(); openDelete(user.id) }}>
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
            <DialogTitle className="text-emerald-700 dark:text-emerald-300">
              {editingUser ? labels.edit : labels.create}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? 'اطلاعات کاربر را ویرایش کنید' : 'اطلاعات کاربر جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${roleGradients[editingUser.role] ?? roleGradients.viewer} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                {editingUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold">{editingUser.name}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{editingUser.email}</p>
              </div>
            </div>
          )}
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
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSave} disabled={!form.name || !form.email}>
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
