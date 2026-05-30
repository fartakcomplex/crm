'use client'

import { useState } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { Project } from './types'
import { getStatusColor, getPriorityColor, formatDate } from './types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
import { FolderKanban, Plus, Pencil, Trash2, Search, Calendar, Flag, Target, Activity, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

const labels = {
  title: 'مدیریت پروژه‌ها',
  subtitle: 'پیگیری پروژه‌ها و مدیریت پیشرفت',
  create: 'پروژه جدید',
  edit: 'ویرایش پروژه',
  delete: 'حذف پروژه',
  deleteConfirm: 'آیا مطمئن هستید؟',
  deleteDesc: 'این عمل قابل بازگشت نیست.',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو در پروژه‌ها...',
  noResults: 'پروژه‌ای یافت نشد',
  noProjects: 'هنوز پروژه‌ای ایجاد نشده است',
  projectName: 'نام پروژه',
  description: 'توضیحات',
  status: 'وضعیت',
  priority: 'اولویت',
  startDate: 'تاریخ شروع',
  dueDate: 'تاریخ پایان',
  progress: 'پیشرفت',
  actions: 'عملیات',
  all: 'همه',
}

const statusLabels: Record<string, string> = {
  planning: 'برنامه‌ریزی',
  active: 'فعال',
  'on-hold': 'متوقف',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
}

const priorityLabels: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'بالا',
  critical: 'بحرانی',
}

const statusGradients: Record<string, string> = {
  planning: 'from-cyan-400 to-cyan-600',
  active: 'from-emerald-400 to-emerald-600',
  'on-hold': 'from-orange-400 to-orange-600',
  completed: 'from-green-400 to-green-600',
  cancelled: 'from-red-400 to-red-600',
}

const priorityGradients: Record<string, string> = {
  low: 'from-gray-100 to-gray-200 dark:from-gray-800/30 dark:to-gray-700/30',
  medium: 'from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30',
  high: 'from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30',
  critical: 'from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30',
}

const emptyProject: Partial<Project> = {
  title: '', description: '', status: 'planning', priority: 'medium',
  progress: 0, startDate: '', dueDate: '',
}

export default function ProjectsPage() {
  useEnsureData(['projects'])
  const { projects, createProject, updateProject, deleteProject } = useCMS()
  const projectsData = projects.data ?? []

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Project>>(emptyProject)

  const filtered = projectsData.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const openCreate = () => {
    setEditingProject(null)
    setForm(emptyProject)
    setDialogOpen(true)
  }

  const openEdit = (project: Project) => {
    setEditingProject(project)
    setForm({
      title: project.title, description: project.description,
      status: project.status, priority: project.priority,
      progress: project.progress, startDate: project.startDate ?? '',
      dueDate: project.dueDate ?? '',
    })
    setDialogOpen(true)
  }

  const openDelete = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const handleSave = () => {
    if (!form.title) return
    if (editingProject) {
      updateProject.mutate({ id: editingProject.id, ...form })
      toast.success('اطلاعات پروژه بروزرسانی شد')
    } else {
      createProject.mutate(form)
      toast.success('پروژه جدید ایجاد شد')
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteProject.mutate(deletingId)
      toast.success('پروژه با موفقیت حذف شد')
      setDeleteOpen(false)
      setDeletingId(null)
    }
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
        <Button className="btn-gradient-primary gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md" onClick={openCreate}>
          <Plus className="h-4 w-4" />{labels.create}
        </Button>
      </div>

      {/* Stats Overview */}
      {projectsData.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* کل پروژه‌ها */}
            <Card className="glass-card card-metric hover-lift shine-effect shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/25 shrink-0">
                  <FolderKanban className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">کل پروژه‌ها</p>
                  <p className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">{projectsData.length}</p>
                </div>
                <svg className="h-10 w-10 shrink-0 opacity-40" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="url(#statGradViolet)" strokeWidth="3" strokeDasharray={`${(projectsData.length / Math.max(projectsData.length, 1)) * 94.2} 94.2`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                  <defs><linearGradient id="statGradViolet" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#a78bfa" /></linearGradient></defs>
                </svg>
              </CardContent>
            </Card>

            {/* فعال */}
            <Card className="glass-card card-metric hover-lift shine-effect shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">فعال</p>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{projectsData.filter(p => p.status === 'active').length}</p>
                </div>
                <svg className="h-10 w-10 shrink-0 opacity-40" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="url(#statGradEmerald)" strokeWidth="3" strokeDasharray={`${(projectsData.filter(p => p.status === 'active').length / Math.max(projectsData.length, 1)) * 94.2} 94.2`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                  <defs><linearGradient id="statGradEmerald" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" /></linearGradient></defs>
                </svg>
              </CardContent>
            </Card>

            {/* تکمیل شده */}
            <Card className="glass-card card-metric hover-lift shine-effect shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/25 shrink-0">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">تکمیل شده</p>
                  <p className="text-2xl font-bold tabular-nums text-cyan-600 dark:text-cyan-400">{projectsData.filter(p => p.status === 'completed').length}</p>
                </div>
                <svg className="h-10 w-10 shrink-0 opacity-40" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="url(#statGradCyan)" strokeWidth="3" strokeDasharray={`${(projectsData.filter(p => p.status === 'completed').length / Math.max(projectsData.length, 1)) * 94.2} 94.2`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                  <defs><linearGradient id="statGradCyan" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#06b6d4" /><stop offset="100%" stopColor="#22d3ee" /></linearGradient></defs>
                </svg>
              </CardContent>
            </Card>

            {/* در انتظار */}
            <Card className="glass-card card-metric hover-lift shine-effect shadow-sm hover:shadow-lg transition-all duration-300 animate-in card-elevated" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">در انتظار</p>
                  <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{projectsData.filter(p => p.status === 'on-hold').length}</p>
                </div>
                <svg className="h-10 w-10 shrink-0 opacity-40" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="url(#statGradAmber)" strokeWidth="3" strokeDasharray={`${(projectsData.filter(p => p.status === 'on-hold').length / Math.max(projectsData.length, 1)) * 94.2} 94.2`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                  <defs><linearGradient id="statGradAmber" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#fbbf24" /></linearGradient></defs>
                </svg>
              </CardContent>
            </Card>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />
        </>
      )}

      {/* Filters */}
      <Card className="glass-card-cyan card-elevated shadow-sm">
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
              <SelectItem value="planning">{statusLabels.planning}</SelectItem>
              <SelectItem value="active">{statusLabels.active}</SelectItem>
              <SelectItem value="on-hold">{statusLabels['on-hold']}</SelectItem>
              <SelectItem value="completed">{statusLabels.completed}</SelectItem>
              <SelectItem value="cancelled">{statusLabels.cancelled}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Project Cards Grid */}
      {filtered.length === 0 ? (
        <Card className="glass-card-cyan shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900/20 dark:to-sky-800/20 flex items-center justify-center mb-4">
              <FolderKanban className="h-10 w-10 text-sky-300" />
            </div>
            <p className="text-base font-medium">{search ? labels.noResults : labels.noProjects}</p>
            <p className="text-sm mt-1 opacity-60">پروژه جدیدی ایجاد کنید</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {filtered.map((project, idx) => {
            const sc = getStatusColor(project.status)
            const pc = getPriorityColor(project.priority)
            const gradient = statusGradients[project.status] ?? 'from-gray-400 to-gray-500'
            const prioGrad = priorityGradients[project.priority] ?? priorityGradients.medium
            return (
              <Card
                key={project.id}
                className="overflow-hidden group hover-lift shine-effect shadow-sm hover:shadow-lg transition-all duration-300 animate-in border-0"
                style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'both' }}
              >
                {/* Header bar */}
                <div className={`h-1.5 bg-gradient-to-r ${gradient} transition-all duration-500`} />
                <CardContent className="p-5 space-y-3.5">
                  {/* Title + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate text-base">{project.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={`${sc.bg} ${sc.text} border-0 text-[10px] shadow-sm`}>
                      {statusLabels[project.status] ?? project.status}
                    </Badge>
                    <Badge className={`border text-[10px] shadow-sm bg-gradient-to-r ${prioGrad}`} style={{ borderWidth: 0 }}>
                      <span className={`h-1.5 w-1.5 rounded-full ${pc.dot}`} />
                      {priorityLabels[project.priority] ?? project.priority}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{labels.progress}</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400 tabular-nums">{project.progress}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {project.startDate && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.startDate)}
                      </span>
                    )}
                    {project.dueDate && (
                      <span className="flex items-center gap-1.5">
                        <Target className="h-3 w-3" />
                        {formatDate(project.dueDate)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-8 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200" onClick={() => openEdit(project)}>
                      <Pencil className="h-3 w-3" />{labels.edit}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200" onClick={() => openDelete(project.id)}>
                      <Trash2 className="h-3 w-3" />
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-sky-700 dark:text-sky-300">
              {editingProject ? labels.edit : labels.create}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? 'اطلاعات پروژه را ویرایش کنید' : 'اطلاعات پروژه جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{labels.projectName}</Label>
              <Input value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{labels.description}</Label>
              <Textarea value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.status}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Project['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">{statusLabels.planning}</SelectItem>
                    <SelectItem value="active">{statusLabels.active}</SelectItem>
                    <SelectItem value="on-hold">{statusLabels['on-hold']}</SelectItem>
                    <SelectItem value="completed">{statusLabels.completed}</SelectItem>
                    <SelectItem value="cancelled">{statusLabels.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.priority}</Label>
                <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v as Project['priority'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{priorityLabels.low}</SelectItem>
                    <SelectItem value="medium">{priorityLabels.medium}</SelectItem>
                    <SelectItem value="high">{priorityLabels.high}</SelectItem>
                    <SelectItem value="critical">{priorityLabels.critical}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.startDate}</Label>
                <Input type="date" value={form.startDate ?? ''} onChange={e => setForm({ ...form, startDate: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{labels.dueDate}</Label>
                <Input type="date" value={form.dueDate ?? ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.progress}: {form.progress ?? 0}%</Label>
              <Input type="range" min={0} max={100} value={form.progress ?? 0} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} className="cursor-pointer" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="btn-ghost-subtle hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="btn-gradient-primary bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSave} disabled={!form.title}>
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
