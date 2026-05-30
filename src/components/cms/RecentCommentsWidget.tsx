'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  MessageCircle, X, ChevronLeft, RefreshCw,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Types ──────────────────────────────────────────────────────────────

interface CommentItem {
  id: string
  content: string
  author: string
  email: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  postId: string
  createdAt: string
  updatedAt: string
  post?: { id: string; title: string; slug: string } | null
}

// ─── Helpers ────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 30) {
    return d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
  }
  if (days > 0) return `${days} روز پیش`
  if (hours > 0) return `${hours} ساعت پیش`
  if (minutes > 0) return `${minutes} دقیقه پیش`
  return 'لحظاتی پیش'
}

function getInitials(name: string): string {
  if (!name) return '؟'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0)
  return parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
}

function getAvatarColor(name: string): string {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-sky-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-fuchsia-500 to-purple-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return { label: 'تأیید شده', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0' }
    case 'pending':
      return { label: 'در انتظار', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-0' }
    case 'rejected':
      return { label: 'رد شده', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0' }
    case 'spam':
      return { label: 'هرزنامه', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-0' }
    default:
      return { label: status, className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-0' }
  }
}

// ─── Comment Skeleton ────────────────────────────────────────────────────

function CommentSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-3/4 rounded" />
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────

export default function RecentCommentsWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchComments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/comments?limit=5')
      if (!res.ok) throw new Error(`خطای سرور (${res.status})`)
      const data = await res.json()
      setComments(data.comments ?? [])
      setTotalCount(data.total ?? 0)

      // Fetch pending count
      const pendingRes = await fetch('/api/comments?status=pending&limit=1')
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json()
        setPendingCount(pendingData.total ?? 0)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, fetchComments])

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const handleViewAll = useCallback(() => {
    // Navigate to comments tab by dispatching custom event
    window.dispatchEvent(new CustomEvent('cms:navigate', { detail: { tab: 'comments' } }))
    setIsOpen(false)
  }, [])

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-3" style={{ direction: 'ltr' }}>
      {/* ─── Comments Panel ─── */}
      <div
        ref={panelRef}
        className={`
          w-[340px] max-h-[480px]
          rounded-2xl overflow-hidden
          flex flex-col
          shadow-2xl shadow-violet-500/10 dark:shadow-violet-500/5
          transition-all duration-300 ease-out
          origin-bottom-left
          ${isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-90 translate-y-4 pointer-events-none'
          }
          glass-card card-elevated
        `}
        style={{ direction: 'rtl' }}
      >
        {/* ─── Header ─── */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-violet-100/60 dark:border-violet-800/30 bg-gradient-to-l from-violet-50/80 to-white/80 dark:from-violet-900/20 dark:to-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">نظرات اخیر</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  {toPersianNum(totalCount)} نظر
                </span>
                {pendingCount > 0 && (
                  <Badge className="text-[10px] gap-0.5 border-0 px-1.5 py-0 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                    {toPersianNum(pendingCount)} در انتظار
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => fetchComments(true)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              title="بروزرسانی نظرات"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={togglePanel}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ─── Comments List ─── */}
        <div className="flex-1 overflow-y-auto max-h-[320px] bg-gray-50/30 dark:bg-gray-900/30">
          {loading ? (
            <div className="space-y-0.5 p-1 stagger-children">
              {Array.from({ length: 5 }).map((_, i) => (
                <CommentSkeleton key={i} />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageCircle className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">نظری یافت نشد</p>
              <p className="text-xs mt-1 opacity-60">هنوز نظری ارسال نشده است</p>
            </div>
          ) : (
            <div className="stagger-children">
              {comments.map((comment) => {
                const statusInfo = getStatusBadge(comment.status)
                const avatarGradient = getAvatarColor(comment.author)
                const initials = getInitials(comment.author)

                return (
                  <div
                    key={comment.id}
                    className="group flex items-start gap-3 p-3 hover:bg-violet-500/5 dark:hover:bg-violet-500/10 transition-colors cursor-pointer list-item-hover"
                    onClick={handleViewAll}
                  >
                    {/* Avatar */}
                    <div className={`shrink-0 h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{comment.author || 'ناشناس'}</span>
                        <Badge className={`text-[9px] px-1.5 py-0 ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-1.5">
                        {comment.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground/60">
                          {timeAgo(comment.createdAt)}
                        </span>
                        {comment.post && (
                          <span className="text-[10px] text-violet-500 dark:text-violet-400 truncate max-w-[140px] opacity-70 group-hover:opacity-100 transition-opacity">
                            {comment.post.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="shrink-0 px-4 py-2.5 border-t border-violet-100/40 dark:border-violet-800/20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <button
            onClick={handleViewAll}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-gradient-to-l from-orange-500 to-amber-600 text-white text-xs font-medium hover:from-orange-600 hover:to-amber-700 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>مشاهده همه نظرات</span>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Floating Toggle Button ─── */}
      <button
        onClick={togglePanel}
        className={`
          h-14 w-14 rounded-full
          flex items-center justify-center
          shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50
          transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          cursor-pointer
          relative
          ${isOpen
            ? 'bg-gradient-to-br from-gray-700 to-gray-800 dark:from-gray-600 dark:to-gray-700'
            : 'bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
          }
        `}
        title={isOpen ? 'بستن نظرات' : 'نظرات اخیر'}
      >
        {/* Pending indicator */}
        {pendingCount > 0 && !isOpen && (
          <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 badge-pop">
            {pendingCount > 9 ? '۹+' : toPersianNum(pendingCount)}
          </span>
        )}

        {/* Animated ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full border-2 border-orange-400/40 animate-ping opacity-30" />
        )}

        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  )
}

// ─── Inline Persian numeral helper (avoid circular deps) ────────────────

function toPersianNum(n: number): string {
  return n.toLocaleString('fa-IR')
}
