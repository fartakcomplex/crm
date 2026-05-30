'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { User, Settings, Activity, LogOut, ChevronDown, Shield, Clock } from 'lucide-react'
import { toast } from 'sonner'

// ─── Quick Links ──────────────────────────────────────────────────────

const quickLinks = [
  { id: 'profile', label: 'پروفایل من', icon: User, description: 'مشاهده و ویرایش پروفایل' },
  { id: 'settings', label: 'تنظیمات حساب', icon: Settings, description: 'مدیریت تنظیمات حساب کاربری' },
  { id: 'activities', label: 'فعالیت‌های من', icon: Activity, description: 'لاگ فعالیت‌های اخیر' },
  { id: 'logout', label: 'خروج', icon: LogOut, description: 'خروج از حساب کاربری', isDanger: true },
]

// ─── Main Component ────────────────────────────────────────────────────

export default function UserProfilePanel() {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleLinkClick = (id: string) => {
    setIsOpen(false)
    if (id === 'logout') {
      toast.success('با موفقیت خارج شدید')
    } else if (id === 'profile') {
      toast.info('بخش پروفایل به زودی باز می‌شود')
    } else if (id === 'settings') {
      toast.info('تنظیمات حساب باز شد')
    } else if (id === 'activities') {
      toast.info('فعالیت‌های اخیر بارگذاری شد')
    }
  }

  return (
    <div className="relative" dir="rtl">
      {/* ─── Trigger Button ─── */}
      <button
        ref={triggerRef}
        className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-violet-500/30 transition-all duration-200 cursor-pointer btn-icon-circle group"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="پنل کاربر"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <Avatar className="h-8 w-8 ring-2 ring-violet-500/20 ring-offset-1 ring-offset-background">
            <AvatarImage src="" alt="ادمین سیستم" />
            <AvatarFallback className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white text-xs font-bold">
              A
            </AvatarFallback>
          </Avatar>
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -left-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* ─── Slide-down Panel ─── */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute top-full left-0 mt-2 w-72 sm:w-80 z-50 animate-in slide-in-from-top-2 fade-in duration-200"
          style={{ animationFillMode: 'both' }}
        >
          <div className="glass-card card-elevated rounded-xl border border-border/60 shadow-xl shadow-violet-500/5 overflow-hidden">
            {/* ─── User Info Section ─── */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar className="h-12 w-12 ring-2 ring-violet-500/20 ring-offset-2 ring-offset-background">
                    <AvatarImage src="" alt="ادمین سیستم" />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white text-base font-bold">
                      A
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-foreground">ادمین سیستم</h3>
                    <Badge className="h-5 text-[10px] badge-gradient-violet border-0">
                      <Shield className="h-2.5 w-2.5 ml-1" />
                      مدیر ارشد
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate" dir="ltr">
                    admin@smartcms.ir
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground/60">
                      آخرین ورود: ۵ دقیقه پیش
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* ─── Quick Links ─── */}
            <div className="p-2">
              <div className="space-y-0.5 stagger-children">
                {quickLinks.map(link => {
                  const Icon = link.icon
                  return (
                    <button
                      key={link.id}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group/item hover-lift ${
                        link.isDanger
                          ? 'hover:bg-red-50 dark:hover:bg-red-900/10'
                          : 'hover:bg-accent/60'
                      }`}
                      onClick={() => handleLinkClick(link.id)}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover/item:scale-110 ${
                        link.isDanger
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 dark:from-violet-500/20 dark:to-fuchsia-500/20'
                      }`}>
                        <Icon className={`h-4 w-4 transition-colors duration-200 ${
                          link.isDanger
                            ? 'text-red-500'
                            : 'text-violet-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <span className={`text-sm font-medium block transition-colors duration-200 ${
                          link.isDanger
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-foreground'
                        }`}>
                          {link.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground block animated-underline">
                          {link.description}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ─── Footer ─── */}
            <div className="px-4 py-2.5 bg-muted/30 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground text-center">
                Smart CMS v2.0 — سیستم مدیریت محتوای هوشمند
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
