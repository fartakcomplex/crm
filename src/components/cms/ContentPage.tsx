'use client'

import { useState } from 'react'
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  FileText, Plus, Pencil, Trash2, Search, Eye,
} from 'lucide-react'

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
}

const statusLabels: Record<string, string> = {
  published: labels.published,
  draft: labels.draft,
  archived: labels.archived,
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Post>>(emptyPost)

  const filtered = postsData.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

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
    setDialogOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      deletePost.mutate(deletingId)
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
        <Button className="gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md" onClick={openCreate}>
          <Plus className="h-4 w-4" />{labels.create}
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={labels.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
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
      <Card className="glass-card shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-16 w-16 mb-4 opacity-15" />
              <p className="text-base font-medium">{search ? labels.noResults : labels.noPosts}</p>
              <p className="text-sm mt-1 opacity-60">برای شروع یک مطلب جدید ایجاد کنید</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{labels.postTitle}</TableHead>
                    <TableHead>{labels.status}</TableHead>
                    <TableHead className="hidden md:table-cell">{labels.author}</TableHead>
                    <TableHead className="hidden lg:table-cell">{labels.category}</TableHead>
                    <TableHead className="hidden sm:table-cell">{labels.date}</TableHead>
                    <TableHead>{labels.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((post, idx) => {
                    const sc = getStatusColor(post.status)
                    return (
                      <TableRow
                        key={post.id}
                        className="hover-lift transition-all duration-200 animate-in cursor-pointer"
                        style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'both' }}
                        onClick={() => openEdit(post)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-200 dark:from-cyan-900/30 dark:to-cyan-800/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="font-medium max-w-[200px] truncate">{post.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${sc.bg} ${sc.text} border-0 shadow-sm`}>
                            {statusLabels[post.status] ?? post.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {getAuthorName(post).charAt(0)}
                            </div>
                            {getAuthorName(post)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {post.category?.name ?? '—'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                          {formatDate(post.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:scale-110 active:scale-95 transition-transform duration-150" onClick={e => { e.stopPropagation(); openEdit(post) }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10 hover:scale-110 active:scale-95 transition-all duration-150" onClick={e => { e.stopPropagation(); openDelete(post.id) }}>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-cyan-700 dark:text-cyan-300">
              {editingPost ? labels.edit : labels.create}
            </DialogTitle>
            <DialogDescription>
              {editingPost ? 'تغییرات مطلب مورد نظر را اعمال کنید' : 'اطلاعات مطلب جدید را وارد کنید'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{labels.postTitle}</Label>
              <Input value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })} className="transition-all duration-200 focus:shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label>{labels.slug}</Label>
              <Input value={form.slug ?? ''} onChange={e => setForm({ ...form, slug: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>{labels.excerpt}</Label>
              <Textarea value={form.excerpt ?? ''} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>{labels.content}</Label>
              <Textarea value={form.content ?? ''} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{labels.status}</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Post['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{labels.draft}</SelectItem>
                    <SelectItem value="published">{labels.published}</SelectItem>
                    <SelectItem value="archived">{labels.archived}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{labels.category}</Label>
                <Select value={form.categoryId ?? ''} onValueChange={v => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="انتخاب دسته‌بندی" /></SelectTrigger>
                  <SelectContent>
                    {categoriesData.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button className="bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-700 hover:to-cyan-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" onClick={handleSave} disabled={!form.title}>
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
