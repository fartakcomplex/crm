'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { Task } from './types'
import { getStatusColor, getPriorityColor, formatDate } from './types'
import EmptyState from './EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  CheckSquare, Plus, Clock, AlertTriangle, Flag, Tag,
  Trash2, Edit, GripVertical, Search, ListTodo, Loader2,
  CircleCheckBig, Eye, ArrowUpDown,
} from 'lucide-react'
import { toast } from 'sonner'

// =============================================================================
// Constants & Labels
// =============================================================================

const labels = {
  title: 'مدیریت وظایف',
  subtitle: 'بورد کانبان برای پیگیری وظایف و مدیریت پروژه‌ها',
  create: 'وظیفه جدید',
  edit: 'ویرایش وظیفه',
  delete: 'حذف وظیفه',
  deleteConfirm: 'آیا مطمئن هستید؟',
  deleteDesc: 'این عمل قابل بازگشت نیست و وظیفه برای همیشه حذف خواهد شد.',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو در وظایف...',
  taskTitle: 'عنوان وظیفه',
  description: 'توضیحات',
  status: 'وضعیت',
  priority: 'اولویت',
  dueDate: 'تاریخ سررسید',
  tags: 'برچسب‌ها',
  all: 'همه',
  noTasks: 'هنوز وظیفه‌ای ایجاد نشده است',
  noFiltered: 'وظیفه‌ای با این فیلتر یافت نشد',
  overdue: 'سررسید گذشته',
  createdSuccess: 'وظیفه جدید با موفقیت ایجاد شد',
  updatedSuccess: 'اطلاعات وظیفه بروزرسانی شد',
  deletedSuccess: 'وظیفه با موفقیت حذف شد',
  statusChanged: 'وضعیت وظیفه تغییر کرد',
}

const statusLabels: Record<string, string> = {
  todo: 'انجام نشده',
  'in-progress': 'در حال انجام',
  review: 'بررسی',
  done: 'تکمیل شده',
  cancelled: 'لغو شده',
}

const priorityLabels: Record<string, string> = {
  low: 'کم',
  medium: 'متوسط',
  high: 'بالا',
  critical: 'بحرانی',
}

// Column definitions for the Kanban board
const KANBAN_COLUMNS: { id: Task['status']; label: string; icon: React.ReactNode; gradient: string; headerBg: string }[] = [
  {
    id: 'todo',
    label: 'انجام نشده',
    icon: <ListTodo className="h-4 w-4" />,
    gradient: 'from-slate-500 to-slate-600',
    headerBg: 'from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/40',
  },
  {
    id: 'in-progress',
    label: 'در حال انجام',
    icon: <Loader2 className="h-4 w-4" />,
    gradient: 'from-blue-500 to-blue-600',
    headerBg: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30',
  },
  {
    id: 'review',
    label: 'بررسی',
    icon: <Eye className="h-4 w-4" />,
    gradient: 'from-amber-500 to-amber-600',
    headerBg: 'from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30',
  },
  {
    id: 'done',
    label: 'تکمیل شده',
    icon: <CircleCheckBig className="h-4 w-4" />,
    gradient: 'from-green-500 to-green-600',
    headerBg: 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30',
  },
]

// Status color mapping for badges
const statusColors: Record<string, string> = {
  todo: 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300',
  'in-progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  review: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

const emptyTask: Partial<Task> = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  tags: '',
}

// =============================================================================
// Main Component
// =============================================================================

export default function TasksPage() {
  useEnsureData(['tasks'])
  const { tasks, createTask, updateTask, deleteTask } = useCMS()
  const tasksData = (tasks.data ?? []) as Task[]

  // ──────────────────────────── State ────────────────────────────
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Task>>(emptyTask)
  const [dragOverColumn, setDragOverColumn] = useState<Task['status'] | null>(null)

  // ──────────────────────────── Computed ────────────────────────────

  const filteredTasks = useMemo(() => {
    return tasksData.filter(t => {
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.tags.toLowerCase().includes(search.toLowerCase())
      const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
      return matchSearch && matchPriority
    })
  }, [tasksData, search, priorityFilter])

  const tasksByStatus = useMemo(() => {
    const groups: Record<string, Task[]> = {
      todo: [],
      'in-progress': [],
      review: [],
      done: [],
    }
    for (const task of filteredTasks) {
      if (groups[task.status]) {
        groups[task.status].push(task)
      } else {
        groups['todo'].push(task)
      }
    }
    return groups
  }, [filteredTasks])

  // ──────────────────────────── Stats ────────────────────────────

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const totalTasks = tasksData.length
    const inProgress = tasksData.filter(t => t.status === 'in-progress').length
    const completedToday = tasksData.filter(t => {
      if (t.status !== 'done' || !t.updatedAt) return false
      return t.updatedAt.split('T')[0] === todayStr
    }).length
    const overdue = tasksData.filter(t => {
      if (t.status === 'done' || t.status === 'cancelled' || !t.dueDate) return false
      return new Date(t.dueDate) < today
    }).length

    return { totalTasks, inProgress, completedToday, overdue }
  }, [tasksData])

  // ──────────────────────────── Handlers ────────────────────────────

  const openCreate = (status?: Task['status']) => {
    setEditingTask(null)
    setForm({ ...emptyTask, status: status ?? 'todo' })
    setDialogOpen(true)
  }

  const openEdit = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingTask(task)
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ?? '',
      tags: task.tags,
    })
    setDialogOpen(true)
  }

  const openDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const handleSave = () => {
    if (!form.title?.trim()) return
    const payload = {
      ...form,
      dueDate: form.dueDate || null,
    }
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, ...payload })
      toast.success(labels.updatedSuccess)
    } else {
      createTask.mutate(payload)
      toast.success(labels.createdSuccess)
    }
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteTask.mutate(deletingId)
      toast.success(labels.deletedSuccess)
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    updateTask.mutate({ id: taskId, status: newStatus })
    toast.success(labels.statusChanged)
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault()
    setDragOverColumn(null)
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) {
      handleStatusChange(taskId, status)
    }
  }

  const isOverdue = (task: Task) => {
    if (task.status === 'done' || task.status === 'cancelled' || !task.dueDate) return false
    return new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
  }

  // ──────────────────────────── Render ────────────────────────────

  return (
    <div className="space-y-5 p-4 md:p-6 page-enter" dir="rtl">
      {/* ═══════════════ Header ═══════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold gradient-text">{labels.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{labels.subtitle}</p>
        </div>
        <Button
          className="gap-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={() => openCreate()}
        >
          <Plus className="h-4 w-4" />
          {labels.create}
        </Button>
      </div>

      {/* ═══════════════ Stats Cards ═══════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Tasks */}
        <Card className="card-elevated shadow-sm animate-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 flex items-center justify-center shrink-0">
              <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">کل وظایف</p>
              <p className="text-xl font-bold tabular-nums text-green-700 dark:text-green-300">{stats.totalTasks}</p>
            </div>
          </CardContent>
        </Card>

        {/* In Progress */}
        <Card className="card-elevated shadow-sm animate-in" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/40 dark:to-sky-900/40 flex items-center justify-center shrink-0">
              <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">در حال انجام</p>
              <p className="text-xl font-bold tabular-nums text-blue-700 dark:text-blue-300">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>

        {/* Completed Today */}
        <Card className="card-elevated shadow-sm animate-in" style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center shrink-0">
              <CircleCheckBig className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تکمیل امروز</p>
              <p className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">{stats.completedToday}</p>
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className="card-elevated shadow-sm animate-in" style={{ animationDelay: '240ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">سررسید گذشته</p>
              <p className={`text-xl font-bold tabular-nums ${stats.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════ Filter Bar ═══════════════ */}
      <Card className="glass-card shadow-sm animate-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={labels.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {[
                { value: 'all', label: labels.all },
                { value: 'low', label: 'کم' },
                { value: 'medium', label: 'متوسط' },
                { value: 'high', label: 'بالا' },
                { value: 'critical', label: 'بحرانی' },
              ].map(item => {
                const isActive = priorityFilter === item.value
                const dotColor = item.value === 'all' ? '' :
                  item.value === 'low' ? 'bg-gray-400' :
                  item.value === 'medium' ? 'bg-yellow-500' :
                  item.value === 'high' ? 'bg-orange-500' : 'bg-red-500'

                return (
                  <button
                    key={item.value}
                    onClick={() => setPriorityFilter(item.value)}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                      flex items-center gap-1.5
                      ${isActive
                        ? 'bg-primary text-primary-foreground shadow-sm hover:scale-[1.03] active:scale-[0.97]'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    {dotColor && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════ Kanban Board ═══════════════ */}
      {filteredTasks.length === 0 && !search && priorityFilter === 'all' ? (
        <EmptyState
          icon={<CheckSquare className="h-12 w-12" />}
          title={labels.noTasks}
          description="اولین وظیفه خود را ایجاد کنید و آن را به بورد اضافه کنید"
          action={{ label: labels.create, onClick: () => openCreate() }}
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title={labels.noFiltered}
          description="فیلترهای جستجو یا اولویت را تغییر دهید"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-in" style={{ animationDelay: '350ms', animationFillMode: 'both' }}>
          {KANBAN_COLUMNS.map((column) => {
            const columnTasks = tasksByStatus[column.id] ?? []
            const isDragTarget = dragOverColumn === column.id

            return (
              <div
                key={column.id}
                className="flex flex-col"
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className={`
                  rounded-t-xl p-3 flex items-center justify-between gap-2
                  bg-gradient-to-b ${column.headerBg}
                  border border-b-0 ${isDragTarget ? 'border-primary/50 ring-2 ring-primary/20' : 'border-border/50'}
                  transition-all duration-200
                `}>
                  <div className="flex items-center gap-2">
                    <span className={`h-7 w-7 rounded-lg bg-gradient-to-br ${column.gradient} flex items-center justify-center text-white`}>
                      {column.icon}
                    </span>
                    <span className="font-semibold text-sm">{column.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold tabular-nums">
                    {columnTasks.length}
                  </Badge>
                </div>

                {/* Column Body */}
                <div className={`
                  rounded-b-xl border ${isDragTarget ? 'border-primary/50 border-t-0 ring-2 ring-primary/20 ring-offset-0' : 'border-border/50 border-t-0'}
                  bg-muted/20 dark:bg-muted/10
                  min-h-[200px] max-h-[calc(100vh-380px)] overflow-y-auto p-2 space-y-2
                  transition-all duration-200
                  custom-scrollbar
                  ${isDragTarget ? 'bg-primary/5 dark:bg-primary/10' : ''}
                `}>
                  {columnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/50">
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center mb-2">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <p className="text-xs">وظیفه‌ای نیست</p>
                    </div>
                  ) : (
                    columnTasks.map((task, idx) => {
                      const pc = getPriorityColor(task.priority)
                      const overdue = isOverdue(task)
                      const taskTags = task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : []

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`
                            group relative rounded-xl p-3.5 cursor-grab active:cursor-grabbing
                            bg-card border border-border/50
                            hover-lift hover:shadow-md
                            transition-all duration-200
                            animate-in
                          `}
                          style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                          onClick={() => openEdit(task)}
                        >
                          {/* Priority indicator bar */}
                          <div className={`
                            absolute top-0 right-0 left-0 h-0.5 rounded-t-xl
                            ${task.priority === 'low' ? 'bg-gray-300 dark:bg-gray-600' : ''}
                            ${task.priority === 'medium' ? 'bg-yellow-400 dark:bg-yellow-500' : ''}
                            ${task.priority === 'high' ? 'bg-orange-400 dark:bg-orange-500' : ''}
                            ${task.priority === 'critical' ? 'bg-red-500 dark:bg-red-600' : ''}
                          `} />

                          {/* Drag handle + action buttons */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1 text-muted-foreground/40 cursor-grab">
                              <GripVertical className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Move to next status
                                  const currentIndex = KANBAN_COLUMNS.findIndex(c => c.id === task.status)
                                  if (currentIndex < KANBAN_COLUMNS.length - 1) {
                                    handleStatusChange(task.id, KANBAN_COLUMNS[currentIndex + 1].id)
                                  }
                                }}
                                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-green-600 hover:bg-green-500/10 transition-colors"
                                title="انتقال به مرحله بعد"
                              >
                                <ArrowUpDown className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => openEdit(task, e)}
                                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                                title={labels.edit}
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => openDelete(task.id, e)}
                                className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors"
                                title={labels.delete}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className={`text-sm font-semibold mb-1 leading-relaxed ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </h4>

                          {/* Description Preview */}
                          {task.description && (
                            <p className="text-xs text-muted-foreground/70 line-clamp-2 mb-2.5 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Priority + Overdue Badge */}
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <Badge className={`${pc.bg} ${pc.text} border-0 text-[10px] shadow-sm gap-1`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${pc.dot}`} />
                              {priorityLabels[task.priority]}
                            </Badge>
                            {overdue && (
                              <Badge className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-0 text-[10px] shadow-sm gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {labels.overdue}
                              </Badge>
                            )}
                          </div>

                          {/* Tags */}
                          {taskTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {taskTags.slice(0, 3).map((tag, tagIdx) => (
                                <span
                                  key={tagIdx}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                                >
                                  <Tag className="h-2.5 w-2.5" />
                                  {tag}
                                </span>
                              ))}
                              {taskTags.length > 3 && (
                                <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                                  +{taskTags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Due Date */}
                          {task.dueDate && (
                            <div className={`flex items-center gap-1.5 text-[11px] ${overdue ? 'text-red-500 dark:text-red-400' : 'text-muted-foreground'}`}>
                              <Clock className="h-3 w-3" />
                              <span dir="ltr">{formatDate(task.dueDate)}</span>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}

                  {/* Add task button at bottom */}
                  <button
                    onClick={() => openCreate(column.id)}
                    className="w-full py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-dashed border-border/50 hover:border-primary/30 transition-all duration-200 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3 w-3" />
                    افزودن وظیفه
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══════════════ Create/Edit Dialog ═══════════════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
              {editingTask
                ? <><Edit className="h-5 w-5" />{labels.edit}</>
                : <><Plus className="h-5 w-5" />{labels.create}</>
              }
            </DialogTitle>
            <DialogDescription>
              {editingTask
                ? 'اطلاعات وظیفه را ویرایش کنید'
                : 'اطلاعات وظیفه جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.taskTitle} <span className="text-red-500">*</span></Label>
              <Input
                value={form.title ?? ''}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="عنوان وظیفه را وارد کنید"
                className="text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.description}</Label>
              <Textarea
                value={form.description ?? ''}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="توضیحات وظیفه..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {/* Status + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">{labels.status}</Label>
                <Select
                  value={form.status}
                  onValueChange={v => setForm({ ...form, status: v as Task['status'] })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {KANBAN_COLUMNS.map(col => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="cancelled">
                      <span className="text-red-500">{statusLabels.cancelled}</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">{labels.priority}</Label>
                <Select
                  value={form.priority}
                  onValueChange={v => setForm({ ...form, priority: v as Task['priority'] })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        {priorityLabels.low}
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-yellow-500" />
                        {priorityLabels.medium}
                      </span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                        {priorityLabels.high}
                      </span>
                    </SelectItem>
                    <SelectItem value="critical">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        {priorityLabels.critical}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.dueDate}</Label>
              <Input
                type="date"
                value={form.dueDate ?? ''}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                dir="ltr"
                className="text-sm"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{labels.tags}</Label>
              <Input
                value={form.tags ?? ''}
                onChange={e => setForm({ ...form, tags: e.target.value })}
                placeholder="برچسب‌ها را با کاما جدا کنید (مثلاً: طراحی, فرانت‌اند)"
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                برچسب‌ها را با ویرگول (،) جدا کنید
              </p>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {labels.cancel}
            </Button>
            <Button
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm disabled:opacity-50"
              onClick={handleSave}
              disabled={!form.title?.trim()}
            >
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ Delete Confirmation ═══════════════ */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="glass-card shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              {labels.deleteConfirm}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {labels.deleteDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              {labels.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
