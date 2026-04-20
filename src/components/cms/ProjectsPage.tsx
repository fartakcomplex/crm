'use client'

import { useState } from 'react'
import { useCMS } from './context'
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
import { FolderKanban, Plus, Pencil, Trash2, Search, Calendar, Flag, Target } from 'lucide-react'

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
  planning: 'from-blue-400 to-blue-600',
  active: 'from-green-400 to-green-600',
  'on-hold': 'from-orange-400 to-orange-600',
  completed: 'from-emerald-400 to-emerald-600',
  cancelled: 'from-red-400 to-red-600',
}

const emptyProject: Partial<Project> = {
  title: '', description: '', status: 'planning', priority: 'medium',
  progress: 0, startDate: '', dueDate: '',
}

export default function ProjectsPage() {
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
    } else {
      createProject.mutate(form)
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteProject.mutate(deletingId)
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text text-transparent">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white" onClick={openCreate}>
          <Plus className="h-4 w-4" />{labels.create}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-sky-500/5 to-sky-600/5 border-sky-200/30 dark:border-sky-800/30">
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
        <Card className="bg-gradient-to-br from-sky-500/5 to-sky-600/5 border-sky-200/30 dark:border-sky-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mb-3 opacity-30" />
            <p>{search ? labels.noResults : labels.noProjects}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(project => {
            const sc = getStatusColor(project.status)
            const pc = getPriorityColor(project.priority)
            const gradient = statusGradients[project.status] ?? 'from-gray-400 to-gray-500'
            return (
              <Card
                key={project.id}
                className="bg-gradient-to-br from-sky-500/5 to-sky-600/5 border-sky-200/30 dark:border-sky-800/30 overflow-hidden group hover:shadow-lg transition-all"
              >
                {/* Header bar */}
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                <CardContent className="p-4 space-y-3">
                  {/* Title + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{project.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    </div>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={`${sc.bg} ${sc.text} border-0 text-[10px]`}>
                      {statusLabels[project.status] ?? project.status}
                    </Badge>
                    <Badge className={`${pc.bg} ${pc.text} border-0 gap-1 text-[10px]`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${pc.dot}`} />
                      {priorityLabels[project.priority] ?? project.priority}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{labels.progress}</span>
                      <span className="font-medium text-sky-600 dark:text-sky-400">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-sky-500 [&>div]:to-sky-400" />
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {project.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.startDate)}
                      </span>
                    )}
                    {project.dueDate && (
                      <span className="flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        {formatDate(project.dueDate)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1 gap-1 h-8" onClick={() => openEdit(project)}>
                      <Pencil className="h-3 w-3" />{labels.edit}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => openDelete(project.id)}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                <Input
                  type="date"
                  value={form.startDate ?? ''}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{labels.dueDate}</Label>
                <Input
                  type="date"
                  value={form.dueDate ?? ''}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{labels.progress}: {form.progress ?? 0}%</Label>
              <Input
                type="range"
                min={0}
                max={100}
                value={form.progress ?? 0}
                onChange={e => setForm({ ...form, progress: Number(e.target.value) })}
                className="cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white" onClick={handleSave} disabled={!form.title}>
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
