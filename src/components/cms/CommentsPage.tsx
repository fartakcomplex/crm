'use client'

import { useState, useMemo } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  MessageCircle, Check, X, Reply, Search, MessageSquare, Mail, FileText, Download, ArrowUpDown,
} from 'lucide-react'
import { exportToCSV } from '@/lib/csv-export'
import { toast } from 'sonner'
import PaginationControls from './PaginationControls'
import { formatRelativeTime, getStatusColor } from './types'
import EmptyState from './EmptyState'

// ─── Persian Labels ───────────────────────────────────────────────────────────

const labels = {
  title: 'نظرات',
  subtitle: 'مدیریت و تأیید نظرات کاربران',
  approve: 'تأیید',
  reject: 'رد',
  reply: 'پاسخ',
  search: 'جستجو در نظرات...',
  filterStatus: 'فیلتر وضعیت',
  all: 'همه',
  noComments: 'نظری یافت نشد',
  replyPlaceholder: 'پاسخ خود را بنویسید...',
  sendReply: 'ارسال پاسخ',
  post: 'مطلب',
  author: 'نویسنده',
  email: 'ایمیل',
  content: 'محتوا',
  status: 'وضعیت',
  date: 'تاریخ',
  replySent: 'پاسخ ارسال شد!',
  actions: 'عملیات',
}

const statusLabelMap: Record<string, string> = {
  pending: 'در انتظار',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  spam: 'هرزنامه',
}

const statusGradients: Record<string, string> = {
  pending: 'from-amber-400 to-amber-500',
  approved: 'from-green-400 to-green-500',
  rejected: 'from-red-400 to-red-500',
  spam: 'from-gray-400 to-gray-500',
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CommentsPage() {
  useEnsureData(['comments', 'posts'])
  const { comments, updateComment } = useCMS()
  const commentsData = comments.data ?? []

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const filtered = useMemo(() => {
    return commentsData.filter(c => {
      const matchSearch = c.content.toLowerCase().includes(search.toLowerCase()) ||
        c.author.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
      return matchSearch && matchStatus
    }).sort((a, b) => {
      if (!sortColumn) return 0
      let valA: string = ''
      let valB: string = ''
      switch (sortColumn) {
        case 'author': valA = a.author; valB = b.author; break
        case 'status': valA = a.status; valB = b.status; break
        case 'date': valA = a.createdAt; valB = b.createdAt; break
        default: return 0
      }
      const cmp = valA.localeCompare(valB, 'fa')
      return sortDirection === 'desc' ? cmp : -cmp
    })
  }, [commentsData, search, statusFilter, sortColumn, sortDirection])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSearchChange = (v: string) => { setSearch(v); setCurrentPage(1) }
  const handleStatusFilterChange = (v: string) => { setStatusFilter(v); setCurrentPage(1) }
  const handlePageSizeChange = (size: number) => { setPageSize(size); setCurrentPage(1) }

  const pendingCount = commentsData.filter(c => c.status === 'pending').length
  const approvedCount = commentsData.filter(c => c.status === 'approved').length
  const rejectedCount = commentsData.filter(c => c.status === 'rejected').length

  const handleApprove = (id: string) => {
    updateComment.mutate({ id, status: 'approved' })
    toast.success('نظر با موفقیت تأیید شد')
  }
  const handleReject = (id: string) => {
    updateComment.mutate({ id, status: 'rejected' })
    toast.success('نظر با موفقیت رد شد')
  }
  const handleReply = (id: string) => {
    if (!replyText.trim()) return
    updateComment.mutate({ id, content: `[پاسخ]: ${replyText}` })
    toast.success('پاسخ با موفقیت ارسال شد')
    setReplyingTo(null)
    setReplyText('')
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
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            className="gap-2 border-orange-300 dark:border-orange-700 hover:bg-orange-500/10 text-orange-700 dark:text-orange-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            onClick={() => {
              exportToCSV(
                filtered.map(c => ({
                  author: c.author,
                  email: c.email,
                  post: c.post?.title ?? '—',
                  content: c.content,
                  status: statusLabelMap[c.status] ?? c.status,
                  date: formatRelativeTime(c.createdAt),
                })),
                'comments-list',
                [
                  { key: 'author', label: 'نویسنده' },
                  { key: 'email', label: 'ایمیل' },
                  { key: 'post', label: 'مطلب' },
                  { key: 'content', label: 'محتوا' },
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
          {pendingCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0 shadow-sm">
              {pendingCount} در انتظار
            </Badge>
          )}
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0 shadow-sm">
            {approvedCount} تأیید شده
          </Badge>
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0 shadow-sm">
            {rejectedCount} رد شده
          </Badge>
        </div>
      </div>

      {/* Filters + Sort */}
      <Card className="glass-card shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={labels.search} value={search} onChange={e => handleSearchChange(e.target.value)} className="pr-10" />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.all}</SelectItem>
                <SelectItem value="pending">{statusLabelMap.pending}</SelectItem>
                <SelectItem value="approved">{statusLabelMap.approved}</SelectItem>
                <SelectItem value="rejected">{statusLabelMap.rejected}</SelectItem>
                <SelectItem value="spam">{statusLabelMap.spam}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-muted-foreground text-xs">مرتب‌سازی:</span>
            {(['author', 'status', 'date'] as const).map(col => {
              const isActive = sortColumn === col
              const labelMap = { author: 'نویسنده', status: 'وضعیت', date: 'تاریخ' }
              return (
                <button
                  key={col}
                  onClick={() => handleSort(col)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${isActive ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  {labelMap[col]}
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      {filtered.length === 0 ? (
        <Card className="glass-card shadow-sm">
          <CardContent>
            <EmptyState
              icon={<MessageCircle className="h-12 w-12" />}
              title={labels.noComments}
              description={
                search || statusFilter !== 'all'
                  ? 'فیلتر دیگری را امتحان کنید'
                  : 'هنوز نظری ثبت نشده است'
              }
            />
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="max-h-[600px]">
          <div className="space-y-3 pr-1">
            {paginatedItems.map((comment, idx) => {
              const sc = getStatusColor(comment.status)
              const isReplying = replyingTo === comment.id
              const gradient = statusGradients[comment.status] ?? statusGradients.pending
              return (
                <Card
                  key={comment.id}
                  className="hover-lift shadow-sm hover:shadow-md transition-all duration-300 animate-in overflow-hidden border-0"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                >
                  {/* Colored left accent */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradient}`} />
                  <CardContent className="p-5 space-y-3">
                    {/* Top row: author + status + time */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                          {comment.author.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{comment.author}</p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span dir="ltr">{comment.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${sc.bg} ${sc.text} border-0 shadow-sm`}>
                          {statusLabelMap[comment.status] ?? comment.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-md">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                    </div>

                    {/* Post info */}
                    {comment.post && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/50 px-2.5 py-1.5 rounded-lg w-fit">
                        <FileText className="h-3 w-3" />
                        <span>{comment.post.title}</span>
                      </div>
                    )}

                    {/* Comment content */}
                    <div className="p-3.5 rounded-xl bg-background/50 text-sm leading-relaxed border border-orange-100/50 dark:border-orange-800/20">
                      {comment.content}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {comment.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="gap-1.5 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-500/10 text-xs hover:scale-[1.03] active:scale-[0.97] transition-all duration-200" onClick={() => handleApprove(comment.id)}>
                            <Check className="h-3.5 w-3.5" />
                            {labels.approve}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs hover:scale-[1.03] active:scale-[0.97] transition-all duration-200" onClick={() => handleReject(comment.id)}>
                            <X className="h-3.5 w-3.5" />
                            {labels.reject}
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" className="gap-1.5 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 text-xs hover:scale-[1.03] active:scale-[0.97] transition-all duration-200" onClick={() => setReplyingTo(isReplying ? null : comment.id)}>
                        <Reply className="h-3.5 w-3.5" />
                        {labels.reply}
                      </Button>
                    </div>

                    {/* Reply input */}
                    {isReplying && (
                      <div className="flex gap-2 pt-1 animate-in">
                        <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder={labels.replyPlaceholder} className="text-sm" />
                        <Button size="sm" onClick={() => handleReply(comment.id)} disabled={!replyText.trim()} className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs shrink-0 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 shadow-sm">
                          <MessageSquare className="h-3.5 w-3.5 ml-1" />
                          {labels.sendReply}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
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
    </div>
  )
}
