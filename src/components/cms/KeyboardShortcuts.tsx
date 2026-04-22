'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard, FileText, Image as ImageIcon, Users, Search, Keyboard,
} from 'lucide-react'

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const shortcutGroups = [
  {
    title: 'ناوبری سریع',
    description: 'دسترسی سریع به بخش‌های اصلی',
    gradient: 'from-violet-500 to-purple-600',
    bgGlow: 'from-violet-500/10 to-purple-500/10',
    shortcuts: [
      { keys: ['⌘K', 'Ctrl+K'], label: 'جستجوی سریع', icon: <Search className="h-4 w-4" /> },
      { keys: ['⌘1'], label: 'داشبورد', icon: <LayoutDashboard className="h-4 w-4" /> },
      { keys: ['⌘2'], label: 'محتوا', icon: <FileText className="h-4 w-4" /> },
      { keys: ['⌘3'], label: 'رسانه', icon: <ImageIcon className="h-4 w-4" /> },
      { keys: ['⌘4'], label: 'کاربران', icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    title: 'راهنما',
    description: 'دسترسی به راهنمای کلیدهای میانبر',
    gradient: 'from-rose-500 to-pink-600',
    bgGlow: 'from-rose-500/10 to-pink-500/10',
    shortcuts: [
      { keys: ['?'], label: 'راهنمای کلیدهای میانبر', icon: <Keyboard className="h-4 w-4" /> },
    ],
  },
]

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg glass-card shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-6 py-5 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-lg font-bold flex items-center gap-2.5 text-white">
              <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Keyboard className="h-4.5 w-4.5 text-white" />
              </div>
              کلیدهای میانبر
            </DialogTitle>
            <DialogDescription className="text-white/80 text-xs mt-1">
              برای افزایش سرعت کار از کلیدهای میانبر استفاده کنید
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Shortcuts content */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              {/* Group header */}
              <div className="flex items-center gap-2">
                <div className={`h-1 w-4 rounded-full bg-gradient-to-r ${group.gradient}`} />
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <span className="text-xs text-muted-foreground">{group.description}</span>
              </div>

              {/* Group shortcuts */}
              <div className="grid gap-1.5">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 hover:from-muted/80 hover:to-muted/60 border border-border/40 hover:border-border/70 transition-all duration-150 group/item"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-muted-foreground group-hover/item:text-foreground transition-colors`}>
                        {shortcut.icon}
                      </div>
                      <span className="text-sm font-medium">{shortcut.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((key, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-border/60 bg-background/80 px-2 text-[11px] font-mono font-medium text-muted-foreground shadow-sm">
                            {key}
                          </kbd>
                          {i < shortcut.keys.length - 1 && (
                            <span className="text-[10px] text-muted-foreground/50">/</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 border-t border-border/40 bg-muted/20">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border/60 bg-background/60 px-1.5 text-[10px] font-mono">Esc</kbd>
            <span>برای بستن</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function KeyboardShortcutsTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="w-full flex items-center gap-2.5 rounded-lg h-9 transition-all duration-200 cursor-pointer hover:bg-accent/60 px-3 text-muted-foreground hover:text-foreground"
      onClick={onClick}
      aria-label="راهنمای کلیدهای میانبر"
    >
      <Keyboard className="h-[18px] w-[18px]" />
      <span className="text-sm flex-1 text-right">کلیدهای میانبر</span>
      <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border/60 bg-muted/80 px-1 font-mono text-[10px] font-medium text-muted-foreground">
        ?
      </kbd>
    </button>
  )
}
