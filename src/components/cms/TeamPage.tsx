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
  engineering: 'from-blue-400 to-blue-600',
  design: 'from-pink-400 to-pink-600',
  marketing: 'from-orange-400 to-orange-600',
  sales: 'from-green-400 to-green-600',
  hr: 'from-purple-400 to-purple-600',
  support: 'from-teal-400 to-teal-600',
  finance: 'from-amber-400 to-amber-600',
  product: 'from-indigo-400 to-indigo-600',
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [form, setForm] = useState<Partial<TeamMember>>(emptyMember)

  const filtered = teamData.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'all' || m.department === deptFilter
    return matchSearch && matchDept
  })

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
    } else {
      createTeamMember.mutate(form)
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteTeamMember.mutate(id)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white" onClick={openCreate}>
          <Plus className="h-4 w-4" />{labels.create}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-indigo-500/5 to-indigo-600/5 border-indigo-200/30 dark:border-indigo-800/30">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
          </div>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
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
        <Card className="bg-gradient-to-br from-indigo-500/5 to-indigo-600/5 border-indigo-200/30 dark:border-indigo-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <UserCog className="h-12 w-12 mb-3 opacity-30" />
            <p>{search ? labels.noResults : labels.noMembers}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(member => {
            const sc = getStatusColor(member.status)
            const gradient = deptColors[member.department] ?? 'from-gray-400 to-gray-500'
            return (
              <Card
                key={member.id}
                className="bg-gradient-to-br from-indigo-500/5 to-indigo-600/5 border-indigo-200/30 dark:border-indigo-800/30 overflow-hidden group hover:shadow-lg transition-all"
              >
                {/* Avatar header */}
                <div className={`h-20 bg-gradient-to-r ${gradient} flex items-center justify-center relative`}>
                  <div className="h-16 w-16 rounded-full bg-white shadow-lg flex items-center justify-center text-xl font-bold text-indigo-600">
                    {member.name.charAt(0)}
                  </div>
                  <Badge className={`${sc.bg} ${sc.text} border-0 absolute top-2 left-2 text-[10px]`}>
                    {statusLabels[member.status] ?? member.status}
                  </Badge>
                </div>
                {/* Info */}
                <CardContent className="p-4 space-y-3">
                  <div className="text-center">
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      <span dir="ltr">{member.email}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary">{roleLabels[member.role] ?? member.role}</Badge>
                    {member.department && (
                      <Badge variant="outline" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {deptLabels[member.department] ?? member.department}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {labels.joinDate}: {formatDate(member.joinedAt)}
                  </p>
                  <div className="flex gap-2 justify-center pt-1">
                    <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => openEdit(member)}>
                      <Pencil className="h-3 w-3" />{labels.edit}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => handleDelete(member.id)}>
                      <Trash2 className="h-3 w-3" />{labels.delete}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-indigo-700 dark:text-indigo-300">
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white" onClick={handleSave} disabled={!form.name || !form.email}>
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
