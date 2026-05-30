'use client'

import { useState, useCallback } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { Post } from './types'
import { getStatusColor, formatDate } from './types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FileText, Plus, Pencil, Trash2, Search, Eye, Calendar, User, FolderOpen, AlignRight, Hash, X,
  Download, ArrowUpDown, ChevronUp, ChevronDown, CheckSquare, Trash, Columns3,
} from 'lucide-react'
import { exportToCSV } from '@/lib/csv-export'
import { toast } from 'sonner'
import PaginationControls from './PaginationControls'
import RichTextEditor from './RichTextEditor'
import WordPressPostEditor from './WordPressPostEditor'
import EmptyState from './EmptyState'
import QuickViewPanel from './QuickViewPanel'

const labels = {
  title: 'مدیریت محتوا',
  subtitle: 'ایجاد، ویرایش و مدیریت مطالب',
  create: 'ایجاد مطلب',
  edit: 'ویرایش مطلب',
  delete: 'حذف مطلب',
  deleteConfirm: 'آیا مطمئن هستید که می‌خواهید این مطلب را حذف کنید؟',
  deleteDesc: 'این عمل قابل بازگشت نیست.',
  save: 'ذخیره',
  cancel: 'انصراف',
  search: 'جستجو در مطالب...',
  noResults: 'مطلبی یافت نشد',
  noPosts: 'هنوز مطلبی ایجاد نشده است',
  postTitle: 'عنوان',
  slug: 'نامک (Slug)',
  content: 'محتوا',
  excerpt: 'چکیده',
  status: 'وضعیت',
  category: 'دسته‌بندی',
  tags: 'برچسب‌ها',
  author: 'نویسنده',
  date: 'تاریخ',
  actions: 'عملیات',
  published: 'منتشر شده',
  draft: 'پیش‌نویس',
  archived: 'بایگانی',
  all: 'همه',
  tagsPlaceholder: 'برچسب‌ها را با کاما جدا کنید',
  preview: 'پیش‌نویس مطلب',
  wordCount: 'تعداد کلمات',
  close: 'بستن',
  columnsVisibility: 'ستون‌ها',
  selectedItems: 'مورد انتخاب شده',
  bulkDelete: 'حذف انتخابی',
  bulkPublish: 'انتشار',
  bulkChangeStatus: 'تغییر وضعیت',
  bulkDeleteConfirm: 'آیا مطمئن هستید؟',
  bulkDeleteDesc: 'تمام مطالب انتخاب‌شده حذف خواهند شد. این عمل قابل بازگشت نیست.',
  changeStatusTo: 'تغییر وضعیت به',
  review: 'بررسی',
}

const statusLabels: Record<string, string> = {
  published: labels.published,
  draft: labels.draft,
  archived: labels.archived,
  review: labels.review,
}

type ColumnKey = 'title' | 'status' | 'author' | 'category' | 'date' | 'actions'

const columnLabels: Record<ColumnKey, string> = {
  title: labels.postTitle,
  status: labels.status,
  author: labels.author,
  category: labels.category,
  date: labels.date,
  actions: labels.actions,
}

const defaultVisibleColumns: Record<ColumnKey, boolean> = {
  title: true,
  status: true,
  author: true,
  category: true,
  date: true,
  actions: true,
}

const STORAGE_KEY = 'cms-content-columns'

function loadColumnVisibility(): Record<ColumnKey, boolean> {
  if (typeof window === 'undefined') return { ...defaultVisibleColumns }
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...defaultVisibleColumns, ...parsed }
    }
  } catch { /* ignore */ }
  return { ...defaultVisibleColumns }
}

const emptyPost: Partial<Post> = {
  title: '', slug: '', content: '', excerpt: '',
  status: 'draft', categoryId: '', tags: [],
}

export default function ContentPage() {
  useEnsureData(['posts', 'categories', 'tags', 'users'])
  const { posts, categories, users, createPost, updatePost, deletePost } = useCMS()
  const postsData = posts.data ?? []
  const categoriesData = categories.data ?? []
  const usersData = users.data ?? []

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatusValue, setBulkStatusValue] = useState<string>('published')
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => loadColumnVisibility())

  const handleSearchChange = (v: string) => { setSearch(v); setCurrentPage(1) }
  const handleStatusFilterChange = (v: string) => { setStatusFilter(v); setCurrentPage(1) }
  const handlePageSizeChange = (v: string) => { setPageSize(Number(v)); setCurrentPage(1) }
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [quickViewItem, setQuickViewItem] = useState<{ title: string; description: string; status: string; date: string; meta?: Record<string, string> } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Post>>(emptyPost)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const filtered = postsData.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  }).sort((a, b) => {
    if (!sortColumn) return 0
    let valA: string = ''
    let valB: string = ''
    switch (sortColumn) {
      case 'title': valA = a.title; valB = b.title; break
      case 'status': valA = a.status; valB = b.status; break
      case 'author': valA = getAuthorName(a); valB = getAuthorName(b); break
      case 'date': valA = a.createdAt; valB = b.createdAt; break
      default: return 0
    }
    const cmp = valA.localeCompare(valB, 'fa')
    return sortDirection === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // ─── Column Visibility ──────────────────────────────────────────────
  const toggleColumn = useCallback((col: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = { ...prev, [col]: !prev[col] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // ─── Bulk Selection Logic ─────────────────────────────────────────────
  const allOnPageSelected = paginatedItems.length > 0 && paginatedItems.every(p => selectedIds.has(p.id))
  const someOnPageSelected = paginatedItems.some(p => selectedIds.has(p.id)) && !allOnPageSelected

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        paginatedItems.forEach(p => next.delete(p.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        paginatedItems.forEach(p => next.add(p.id))
        return next
      })
    }
  }

  const handleBulkPublish = () => {
    selectedIds.forEach(id => {
      updatePost.mutate({ id, status: 'published' })
    })
    toast.success(`${selectedIds.size} مطلب به وضعیت منتشر شده تغییر یافت`)
    setSelectedIds(new Set())
  }

  const handleBulkStatusChange = () => {
    selectedIds.forEach(id => {
      updatePost.mutate({ id, status: bulkStatusValue as Post['status'] })
    })
    toast.success(`${selectedIds.size} مطلب به وضعیت "${statusLabels[bulkStatusValue] ?? bulkStatusValue}" تغییر یافت`)
    setSelectedIds(new Set())
    setBulkStatusOpen(false)
  }

  const handleBulkDelete = () => {
    selectedIds.forEach(id => {
      deletePost.mutate(id)
    })
    toast.success(`${selectedIds.size} مطلب با موفقیت حذف شد`)
    setSelectedIds(new Set())
    setBulkDeleteOpen(false)
  }

  const openCreate = () => {
    setEditingPost(null)
    setForm(emptyPost)
    setDialogOpen(true)
  }

  const openEdit = (post: Post) => {
    setEditingPost(post)
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      categoryId: post.categoryId ?? '',
    })
    setDialogOpen(true)
  }

  const openQuickView = (post: Post) => {
    setQuickViewItem({
      title: post.title,
      description: post.excerpt || post.content.slice(0, 200),
      status: post.status,
      date: post.createdAt,
      meta: {
        slug: post.slug,
        نویسنده: getAuthorName(post),
        دسته‌بندی: post.category?.name ?? '—',
      },
    })
  }

  const openDelete = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const handleSave = () => {
    if (!form.title) return
    if (editingPost) {
      updatePost.mutate({ id: editingPost.id, ...form })
    } else {
      createPost.mutate(form)
    }
    toast.success('مطلب با موفقیت ذخیره شد')
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      deletePost.mutate(deletingId)
      toast.success('مطلب با موفقیت حذف شد')
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  const getAuthorName = (post: Post) => {
    if (post.author) return post.author.name
    const u = usersData.find(u => u.id === post.authorId)
    return u?.name ?? '—'
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
            className="gap-2 border-cyan-300 dark:border-cyan-700 hover:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            onClick={() => {
              exportToCSV(
                filtered.map(p => ({
                  title: p.title,
                  slug: p.slug,
                  status: statusLabels[p.status] ?? p.status,
                  author: getAuthorName(p),
                  category: p.category?.name ?? '—',
                  date: formatDate(p.createdAt),
                })),
                'content-posts',
                [
                  { key: 'title', label: 'عنوان' },
                  { key: 'slug', label: 'نامک' },
                  { key: 'status', label: 'وضعیت' },
                  { key: 'author', label: 'نویسنده' },
                  { key: 'category', label: 'دسته‌بندی' },
                  { key: 'date', label: 'تاریخ' },
                ],
              )
              toast.success('خروجی CSV با موفقیت دانلود شد!')
            }}
          >
            <Download className="h-4 w-4" />
            خروجی CSV
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md shine-effect" onClick={openCreate}>
            <Plus className="h-4 w-4" />{labels.create}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card card-elevated shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={labels.search}
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.all}</SelectItem>
              <SelectItem value="published">{labels.published}</SelectItem>
              <SelectItem value="draft">{labels.draft}</SelectItem>
              <SelectItem value="archived">{labels.archived}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card className="glass-card card-elevated card-gradient-border shadow-sm overflow-hidden">
        {/* Table header area with columns visibility toggle */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-end px-4 pt-3 pb-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground text-xs h-8">
                  <Columns3 className="h-3.5 w-3.5" />
                  {labels.columnsVisibility}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 glass-card shadow-lg">
                <DropdownMenuLabel className="text-xs font-semibold">{labels.columnsVisibility}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(columnLabels) as ColumnKey[]).map(col => (
                  <DropdownMenuCheckboxItem
                    key={col}
                    checked={visibleColumns[col]}
                    onCheckedChange={() => toggleColumn(col)}
                    className="text-sm"
                  >
                    {columnLabels[col]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title={search ? labels.noResults : labels.noPosts}
              description={search ? 'عبارت دیگری را جستجو کنید' : 'برای شروع یک مطلب جدید ایجاد کنید'}
              action={!search ? { label: labels.create, onClick: openCreate } : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allOnPageSelected ? true : someOnPageSelected ? 'indeterminate' : false}
                        onCheckedChange={toggleSelectAll}
                        aria-label="انتخاب همه"
                      />
                    </TableHead>
                    {visibleColumns.title && (
                      <TableHead>
                        <button onClick={() => handleSort('title')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          {labels.postTitle}
                          {sortColumn === 'title' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                        </button>
                      </TableHead>
                    )}
                    {visibleColumns.status && (
                      <TableHead>
                        <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          {labels.status}
                          {sortColumn === 'status' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                        </button>
                      </TableHead>
                    )}
                    {visibleColumns.author && (
                      <TableHead className="hidden md:table-cell">
                        <button onClick={() => handleSort('author')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          {labels.author}
                          {sortColumn === 'author' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                        </button>
                      </TableHead>
                    )}
                    {visibleColumns.category && (
                      <TableHead className="hidden lg:table-cell">{labels.category}</TableHead>
                    )}
                    {visibleColumns.date && (
                      <TableHead className="hidden sm:table-cell">
                        <button onClick={() => handleSort('date')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                          {labels.date}
                          {sortColumn === 'date' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
                        </button>
                      </TableHead>
                    )}
                    {visibleColumns.actions && (
                      <TableHead>{labels.actions}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((post, idx) => {
                    const sc = getStatusColor(post.status)
                    const isSelected = selectedIds.has(post.id)
                    return (
                      <TableRow
                        key={post.id}
                        className={`hover-lift transition-all duration-200 animate-in cursor-pointer list-item-hover ${isSelected ? 'bg-violet-50 dark:bg-violet-950/30' : ''}`}
                        style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                        onClick={() => setPreviewPost(post)}
                      >
                        <TableCell className="w-10" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectRow(post.id)}
                            aria-label={`انتخاب ${post.title}`}
                          />
                        </TableCell>
                        {visibleColumns.title && (
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="font-medium max-w-[200px] truncate animated-underline">{post.title}</div>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.status && (
                          <TableCell>
                            <Badge className={`${sc.bg} ${sc.text} border-0 shadow-sm ${post.status === 'published' ? 'badge-gradient' : post.status === 'draft' ? 'badge-gradient' : ''}`}>
                              {statusLabels[post.status] ?? post.status}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.author && (
                          <TableCell className="hidden md:table-cell text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {getAuthorName(post).charAt(0)}
                              </div>
                              {getAuthorName(post)}
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.category && (
                          <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                            {post.category?.name ?? '—'}
                          </TableCell>
                        )}
                        {visibleColumns.date && (
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {formatDate(post.createdAt)}
                          </TableCell>
                        )}
                        {visibleColumns.actions && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={e => { e.stopPropagation(); setPreviewPost(post) }} title={labels.preview}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={e => { e.stopPropagation(); openQuickView(post) }} title="مشاهده سریع">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 hover:scale-110 active:scale-95 transition-transform duration-150" onClick={e => { e.stopPropagation(); openEdit(post) }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={e => { e.stopPropagation(); openDelete(post.id) }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
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

      {/* ─── Bulk Action Bar ─── */}
      {selectedIds.size > 0 && (
        <div className="glass-card sticky bottom-0 z-10 border-t border-border/60 rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span>{selectedIds.size} {labels.selectedItems}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {/* Publish button - green gradient */}
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
              onClick={handleBulkPublish}
            >
              {labels.bulkPublish}
            </Button>
            {/* Change status button - violet gradient */}
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
              onClick={() => {
                setBulkStatusValue('draft')
                setBulkStatusOpen(true)
              }}
            >
              {labels.bulkChangeStatus}
            </Button>
            {/* Delete button - red gradient */}
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash className="h-3.5 w-3.5" />
              {labels.bulkDelete}
            </Button>
          </div>
        </div>
      )}

      {/* ─── Bulk Delete Confirmation Dialog ─── */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="glass-card shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.bulkDeleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>
              {labels.bulkDeleteDesc} ({selectedIds.size} {labels.selectedItems})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Trash className="h-4 w-4 ml-1" />
              {labels.bulkDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Bulk Status Change Dialog ─── */}
      <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <DialogContent className="max-w-sm glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-violet-700 dark:text-violet-300">
              {labels.bulkChangeStatus}
            </DialogTitle>
            <DialogDescription>
              وضعیت {selectedIds.size} مطلب انتخاب‌شده را تغییر دهید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>{labels.changeStatusTo}</Label>
            <Select value={bulkStatusValue} onValueChange={setBulkStatusValue}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">{labels.published}</SelectItem>
                <SelectItem value="draft">{labels.draft}</SelectItem>
                <SelectItem value="archived">{labels.archived}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              {labels.cancel}
            </Button>
            <Button
              className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
              onClick={handleBulkStatusChange}
            >
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* WordPress-Style Post Editor Sheet */}
      <WordPressPostEditor
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingPost={editingPost}
        form={form}
        onFormChange={setForm}
        onSave={handleSave}
        categories={categoriesData.map(c => ({ id: c.id, name: c.name }))}
        allTags={['وردپرس', 'سئو', 'طراحی', 'توسعه وب', 'جاوااسکریپت', 'ری‌اکت', 'نکست', 'تیلویند']}
      />

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

      {/* Post Preview Sheet */}
      <Sheet open={!!previewPost} onOpenChange={open => { if (!open) setPreviewPost(null) }}>
        <SheetContent side="left" className="sm:max-w-lg glass-card overflow-y-auto">
          {previewPost && (
            <>
              <SheetHeader className="pb-2">
                <SheetTitle className="text-lg text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {labels.preview}
                </SheetTitle>
                <SheetDescription className="sr-only">{previewPost.title}</SheetDescription>
              </SheetHeader>

              <div className="flex-1 px-4 pb-4 space-y-5">
                {/* Post Title */}
                <div className="pt-2">
                  <h1 className="text-xl font-bold leading-relaxed gradient-text">
                    {previewPost.title}
                  </h1>
                  {previewPost.slug && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono" dir="ltr">
                      /{previewPost.slug}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Metadata Bar */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-cyan-500" />
                    <span>{getAuthorName(previewPost)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                    <span>{formatDate(previewPost.createdAt)}</span>
                  </div>
                  {previewPost.category && (
                    <div className="flex items-center gap-1.5">
                      <FolderOpen className="h-3.5 w-3.5 text-cyan-500" />
                      <span>{previewPost.category.name}</span>
                    </div>
                  )}
                  <Badge className={`${getStatusColor(previewPost.status).bg} ${getStatusColor(previewPost.status).text} border-0 text-xs`}>
                    {statusLabels[previewPost.status] ?? previewPost.status}
                  </Badge>
                </div>

                {/* Word Count */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5 w-fit">
                  <AlignRight className="h-3.5 w-3.5 text-cyan-500" />
                  <span>{labels.wordCount}:</span>
                  <span className="font-semibold text-foreground">
                    {previewPost.content ? previewPost.content.trim().split(/\s+/).filter(Boolean).length : 0}
                  </span>
                </div>

                {/* Excerpt */}
                {previewPost.excerpt && (
                  <div className="relative rounded-lg border-r-4 border-cyan-500 bg-gradient-to-l from-cyan-50 to-transparent dark:from-cyan-950/20 dark:to-transparent px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                      <AlignRight className="h-3.5 w-3.5" />
                      {labels.excerpt}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {previewPost.excerpt}
                    </p>
                  </div>
                )}

                {/* Content */}
                {previewPost.content && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                      <Hash className="h-3.5 w-3.5" />
                      {labels.content}
                    </div>
                    <div className="rounded-lg bg-muted/30 border p-4 max-h-72 overflow-y-auto">
                      <div className="text-sm leading-7 whitespace-pre-wrap text-foreground/90">
                        {previewPost.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <SheetFooter className="border-t bg-muted/20 flex-row gap-2">
                <Button
                  className="flex-1 gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
                  onClick={() => { openEdit(previewPost); setPreviewPost(null) }}
                >
                  <Pencil className="h-4 w-4" />
                  {labels.edit}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  onClick={() => setPreviewPost(null)}
                >
                  <X className="h-4 w-4" />
                  {labels.close}
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
