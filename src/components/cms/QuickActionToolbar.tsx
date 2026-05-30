'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Pencil,
  Trash2,
  Copy,
  Send,
  Bookmark,
  Share2,
  Tag,
  Percent,
  ShoppingBag,
  Eye,
  X,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ──────────────────────────────────────────────────────────────

type TabContext = 'content' | 'store' | 'other'

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  gradient: string
  glowClass: string
  onClick: () => void
}

// ─── Action Definitions per Tab ────────────────────────────────────────

function getActionsForTab(tab: TabContext): QuickAction[] {
  switch (tab) {
    case 'content':
      return [
        {
          id: 'edit',
          label: 'ویرایش',
          icon: <Pencil className="w-3.5 h-3.5" />,
          gradient: 'from-violet-500 to-purple-500',
          glowClass: 'hover:shadow-violet-500/25',
          onClick: () => toast.info('ویرایش محتوا'),
        },
        {
          id: 'delete',
          label: 'حذف',
          icon: <Trash2 className="w-3.5 h-3.5" />,
          gradient: 'from-rose-500 to-pink-500',
          glowClass: 'hover:shadow-rose-500/25',
          onClick: () => toast.info('حذف محتوا'),
        },
        {
          id: 'duplicate',
          label: 'تکرار',
          icon: <Copy className="w-3.5 h-3.5" />,
          gradient: 'from-cyan-500 to-sky-500',
          glowClass: 'hover:shadow-cyan-500/25',
          onClick: () => toast.info('تکرار محتوا'),
        },
        {
          id: 'publish',
          label: 'انتشار',
          icon: <Send className="w-3.5 h-3.5" />,
          gradient: 'from-emerald-500 to-teal-500',
          glowClass: 'hover:shadow-emerald-500/25',
          onClick: () => toast.info('انتشار محتوا'),
        },
      ]
    case 'store':
      return [
        {
          id: 'add-to-cart',
          label: 'افزودن به سبد',
          icon: <ShoppingBag className="w-3.5 h-3.5" />,
          gradient: 'from-emerald-500 to-green-500',
          glowClass: 'hover:shadow-emerald-500/25',
          onClick: () => toast.info('افزوده شد به سبد خرید'),
        },
        {
          id: 'discount',
          label: 'تخفیف',
          icon: <Percent className="w-3.5 h-3.5" />,
          gradient: 'from-amber-500 to-orange-500',
          glowClass: 'hover:shadow-amber-500/25',
          onClick: () => toast.info('اعمال تخفیف'),
        },
        {
          id: 'details',
          label: 'جزئیات',
          icon: <Eye className="w-3.5 h-3.5" />,
          gradient: 'from-cyan-500 to-sky-500',
          glowClass: 'hover:shadow-cyan-500/25',
          onClick: () => toast.info('مشاهده جزئیات'),
        },
      ]
    case 'other':
    default:
      return [
        {
          id: 'copy',
          label: 'کپی',
          icon: <Copy className="w-3.5 h-3.5" />,
          gradient: 'from-violet-500 to-purple-500',
          glowClass: 'hover:shadow-violet-500/25',
          onClick: () => toast.success('کپی شد'),
        },
        {
          id: 'share',
          label: 'اشتراک‌گذاری',
          icon: <Share2 className="w-3.5 h-3.5" />,
          gradient: 'from-cyan-500 to-sky-500',
          glowClass: 'hover:shadow-cyan-500/25',
          onClick: () => toast.info('لینک اشتراک‌گذاری کپی شد'),
        },
        {
          id: 'bookmark',
          label: 'بوکمارک',
          icon: <Bookmark className="w-3.5 h-3.5" />,
          gradient: 'from-amber-500 to-orange-500',
          glowClass: 'hover:shadow-amber-500/25',
          onClick: () => toast.success('ذخیره شد'),
        },
      ]
  }
}

// ─── Tab Label Map ──────────────────────────────────────────────────────

const tabLabels: Record<TabContext, string> = {
  content: 'محتوا',
  store: 'فروشگاه',
  other: 'عمومی',
}

const tabBadgeClass: Record<TabContext, string> = {
  content: 'badge-gradient-violet',
  store: 'badge-gradient-emerald',
  other: 'badge-gradient-amber',
}

// ─── Hook: QuickActionToolbar Controller ───────────────────────────────
// This exported hook lets parent components show/hide the toolbar.

type ShowParams = { tab?: TabContext }

const showCallbacks = new Set<(params?: ShowParams) => void>()
const hideCallbacks = new Set<() => void>()

export function useQuickActionToolbar() {
  const show = useCallback((params?: ShowParams) => {
    showCallbacks.forEach(cb => cb(params))
  }, [])

  const hide = useCallback(() => {
    hideCallbacks.forEach(cb => cb())
  }, [])

  return { show, hide }
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function QuickActionToolbar() {
  const [visible, setVisible] = useState(false)
  const [currentTab, setCurrentTab] = useState<TabContext>('other')
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleShow = useCallback((params?: ShowParams) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    setCurrentTab(params?.tab ?? 'other')
    setIsAnimatingOut(false)
    setVisible(true)
  }, [])

  const handleHide = useCallback(() => {
    setIsAnimatingOut(true)
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false)
      setIsAnimatingOut(false)
    }, 250)
  }, [])

  // Register show/hide callbacks
  useEffect(() => {
    showCallbacks.add(handleShow)
    hideCallbacks.add(handleHide)
    return () => {
      showCallbacks.delete(handleShow)
      hideCallbacks.delete(handleHide)
    }
  }, [handleShow, handleHide])

  // Auto-hide after 8 seconds of inactivity
  useEffect(() => {
    if (!visible) return
    const autoHide = setTimeout(() => {
      handleHide()
    }, 8000)
    return () => clearTimeout(autoHide)
  }, [visible, handleHide])

  // Keyboard: Escape to hide
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        handleHide()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible, handleHide])

  const actions = getActionsForTab(currentTab)

  if (!visible && !isAnimatingOut) return null

  return (
    <div
      ref={toolbarRef}
      className={`
        fixed bottom-20 left-1/2 -translate-x-1/2 z-40
        transition-all duration-250 ease-out
        ${visible && !isAnimatingOut
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
      dir="rtl"
    >
      <div
        className="
          inline-flex items-center gap-1 px-2 py-1.5 rounded-2xl
          glass-card card-elevated
          border border-border/50
          shadow-lg
        "
      >
        {/* Tab indicator */}
        <Badge className={`${tabBadgeClass[currentTab]} text-[10px] px-2 py-0.5 ml-1 border-0`}>
          {tabLabels[currentTab]}
        </Badge>

        <Separator orientation="vertical" className="h-6 mx-1 opacity-30" />

        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          {actions.map((action, index) => (
            <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => {
                    action.onClick()
                    handleHide()
                  }}
                  size="sm"
                  variant="ghost"
                  className={`
                    h-8 min-w-0 px-2.5 gap-1.5
                    rounded-xl text-[11px] font-medium
                    text-white
                    bg-gradient-to-l ${action.gradient}
                    shadow-sm ${action.glowClass}
                    hover:shadow-md hover:scale-105
                    active:scale-95
                    transition-all duration-200
                    cursor-pointer
                    stagger-children
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {action.icon}
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 opacity-30" />

        {/* Dismiss button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleHide}
              className="
                w-7 h-7 rounded-lg flex items-center justify-center
                text-muted-foreground/60
                hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5
                transition-colors cursor-pointer
              "
              aria-label="بستن"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <p>بستن (Esc)</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
