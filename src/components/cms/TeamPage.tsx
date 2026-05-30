'use client'

import { useState } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { TeamMember } from './types'
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { UserCog, Plus, Pencil, Trash2, Search, Mail, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import PaginationControls from './PaginationControls'

const labels = {
  title: 'مدیریت تیم',
  subtitle: 'اعضای تیم و ساختار سازمانی',
  create: 'افزودن عضو',
  edit: 'ویرایش عضو',
  delete: 'حذف عضو',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو در اعضا...',
  noResults: 'عضوی یافت نشد',
  noMembers: 'هنوز عضوی ثبت نشده است',
  name: 'نام و نام خانوادگی',
  email: 'ایمیل',
  role: 'نقش',
  department: 'بخش',
  status: 'وضعیت',
  joinDate: 'تاریخ پیوستن',
  all: 'همه',
  allDepts: 'همه بخش‌ها',
}

const roleLabels: Record<string, string> = {
  admin: 'مدیر',
  manager: 'مدیر بخش',
  member: 'عضو',
  intern: 'کارآموز',
}

const statusLabels: Record<string, string> = {
  active: 'فعال',
  inactive: 'غیرفعال',
  'on-leave': 'در مرخصی',
}

const deptLabels: Record<string, string> = {
  engineering: 'مهندسی',
  design: 'طراحی',
  marketing: 'بازاریابی',
  sales: 'فروش',
  hr: 'منابع انسانی',
  support: 'پشتیبانی',
  finance: 'مالی',
  product: 'محصول',
}

const deptColors: Record<string, string> = {
  engineering: 'from-cyan-400 to-cyan-600',
  design: 'from-pink-400 to-pink-600',
  marketing: 'from-orange-400 to-orange-600',
  sales: 'from-emerald-400 to-emerald-600',
  hr: 'from-purple-400 to-purple-600',
  support: 'from-teal-400 to-teal-600',
  finance: 'from-amber-400 to-amber-600',
  product: 'from-rose-400 to-rose-600',
}

const deptBadgeColors: Record<string, string> = {
  engineering: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
  marketing: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  sales: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  hr: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  support: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800',
  finance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  product: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800',
}

const emptyMember: Partial<TeamMember> = {
  name: '', email: '', role: 'member', department: '', status: 'active',
}

export default function TeamPage() {
  useEnsureData(['team'])
  const { team, createTeamMember, updateTeamMember, deleteTeamMember } = useCMS()
  const teamData = team.data ?? []

  const departments = [...new Set(teamData.map(m => m.department).filter(Boolean))]

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [form, setForm] = useState<Partial<TeamMember>>(emptyMember)

  const filtered = teamData.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'all' || m.department === deptFilter
    return matchSearch && matchDept
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSearchChange = (v: string) => { setSearch(v); setCurrentPage(1) }
  const handleDeptFilterChange = (v: string) => { setDeptFilter(v); setCurrentPage(1) }
  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1) }

  const openCreate = () => {
    setEditingMember(null)
    setForm(emptyMember)
    setDialogOpen(true)
  }

  const openEdit = (member: TeamMember) => {
    setEditingMember(member)
    setForm({ name: member.name, email: member.email, role: member.role, department: member.department, status: member.status })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.name || !form.email) return
    if (editingMember) {
      updateTeamMember.mutate({ id: editingMember.id, ...form })
      toast.success('اطلاعات عضو تیم بروزرسانی شد')
    } else {
      createTeamMember.mutate(form)
      toast.success('عضو جدید به تیم اضافه شد')
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteTeamMember.mutate(id)
    toast.success('عضو تیم با موفقیت حذف شد')
  }

  return (
    <div className="space-y-6 p-4 md:p-6 page-enter reveal-on-scroll">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <Button className="btn-gradient-primary gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md" onClick={openCreate}>
          <Plus className="h-4 w-4" />{labels.create}
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card card-elevated shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={labels.search} value={search} onChange={e => handleSearchChange(e.target.value)} className="pr-10" />
          </div>
          <Select value={deptFilter} onValueChange={handleDeptFilterChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.allDepts}</SelectItem>
              {departments.map(d => (
                <SelectItem key={d} value={d}>{deptLabels[d] ?? d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Team Grid */}
      {filtered.length === 0 ? (
        <Card className="glass-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-900/20 dark:to-violet-800/20 flex items-center justify-center mb-4">
              <UserCog className="h-10 w-10 text-violet-300" />
            </div>
            <p className="text-base font-medium">{search ? labels.noResults : labels.noMembers}</p>
            <p className="text-sm mt-1 opacity-60">عضو جدیدی به تیم اضافه کنید</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
          {paginatedItems.map((member, idx) => {
            const sc = getStatusColor(member.status)
            const gradient = deptColors[member.department] ?? 'from-gray-400 to-gray-500'
            const badgeColor = deptBadgeColors[member.department] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300 border-gray-200 dark:border-gray-700'
            return (
              <Card
                key={member.id}
                className="overflow-hidden group hover-lift card-elevated shadow-sm hover:shadow-lg transition-all duration-300 animate-in border-0"
                style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
              >
                {/* Avatar header */}
                <div className={`h-24 bg-gradient-to-r ${gradient} flex items-center justify-center relative`}>
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-all duration-300" />
                  <div className="h-16 w-16 rounded-2xl bg-white shadow-lg flex items-center justify-center text-xl font-bold transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3" style={{ color: 'var(--foreground)' }}>
                    {member.name.charAt(0)}
                  </div>
                  <Badge className={`${sc.bg} ${sc.text} border-0 absolute top-2.5 left-2.5 text-[10px] shadow-sm`}>
                    {statusLabels[member.status] ?? member.status}
                  </Badge>
                </div>
                {/* Info */}
                <CardContent className="p-4 space-y-3">
                  <div className="text-center">
                    <p className="font-semibold text-base">{member.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-1.5">
                      <Mail className="h-3 w-3" />
                      <span dir="ltr">{member.email}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="shadow-sm">{roleLabels[member.role] ?? member.role}</Badge>
                    {member.department && (
                      <Badge variant="outline" className={`gap-1 ${badgeColor}`}>
                        <Building2 className="h-3 w-3" />
                        {deptLabels[member.department] ?? member.department}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    {labels.joinDate}: {formatDate(member.joinedAt)}
                  </p>
                  <div className="flex gap-2 justify-center pt-1">
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200" onClick={() => openEdit(member)}>
                      <Pencil className="h-3 w-3" />{labels.edit}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200" onClick={() => handleDelete(member.id)}>
                      <Trash2 className="h-3 w-3" />{labels.delete}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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
            <DialogTitle className="text-violet-700 dark:text-violet-300">
              {editingMember ? labels.edit : labels.create}
            </DialogTitle>
            <DialogDescription>
              {editingMember ? 'اطلاعات عضو را ویرایش کنید' : 'اطلاعات عضو جدید را وارد کنید'}
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
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as TeamMember['role'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                    <SelectItem value="manager">{roleLabels.manager}</SelectItem>
                    <SelectItem value="member">{roleLabels.member}</SelectItem>
                    <SelectItem value="intern">{roleLabels.intern}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.status}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as TeamMember['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{statusLabels.active}</SelectItem>
                    <SelectItem value="inactive">{statusLabels.inactive}</SelectItem>
                    <SelectItem value="on-leave">{statusLabels['on-leave']}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.department}</Label>
              <Select value={form.department ?? ''} onValueChange={v => setForm({ ...form, department: v })}>
                <SelectTrigger><SelectValue placeholder="انتخاب بخش" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(deptLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="btn-ghost-subtle hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="btn-gradient-primary bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSave} disabled={!form.name || !form.email}>
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
