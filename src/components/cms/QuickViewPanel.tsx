'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Pencil, ExternalLink, X, Calendar } from 'lucide-react'
import { getStatusColor, formatDateTime } from './types'

interface QuickViewItem {
  title: string
  description: string
  status: string
  date: string
  meta?: Record<string, string>
}

interface QuickViewPanelProps {
  isOpen: boolean
  onClose: () => void
  item: QuickViewItem | null
}

function getStatusBadgeClass(status: string): string {
  const colors: Record<string, string> = {
    published: 'badge-gradient-emerald',
    draft: 'badge-gradient-amber',
    archived: 'badge-gradient-violet',
    active: 'badge-gradient-emerald',
    inactive: 'badge-gradient-violet',
    pending: 'badge-gradient-amber',
    approved: 'badge-gradient-emerald',
    rejected: 'badge-gradient-rose',
    planning: 'badge-gradient-violet',
    'on-hold': 'badge-gradient-amber',
    completed: 'badge-gradient-emerald',
    cancelled: 'badge-gradient-rose',
  }
  return colors[status] ?? 'badge-gradient-violet'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    published: 'منتشر شده',
    draft: 'پیش‌نویس',
    archived: 'بایگانی',
    active: 'فعال',
    inactive: 'غیرفعال',
    pending: 'در انتظار',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    planning: 'برنامه‌ریزی',
    'on-hold': 'متوقف',
    completed: 'تکمیل شده',
    cancelled: 'لغو شده',
  }
  return labels[status] ?? status
}

export default function QuickViewPanel({ isOpen, onClose, item }: QuickViewPanelProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="left" className="sm:max-w-md glass-card overflow-y-auto animate-in">
        {item && (
          <>
            <SheetHeader className="pb-3">
              <SheetTitle className="text-lg gradient-text flex items-center gap-2">
                مشاهده سریع
              </SheetTitle>
              <SheetDescription className="sr-only">{item.title}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 px-4 pb-4 space-y-5">
              {/* Title */}
              <div className="pt-1">
                <h2 className="text-xl font-bold leading-relaxed gradient-text">
                  {item.title}
                </h2>
              </div>

              {/* Status & Date row */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`${getStatusBadgeClass(item.status)} text-white border-0 text-xs px-2.5 py-0.5`}>
                  {getStatusLabel(item.status)}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDateTime(item.date)}</span>
                </div>
              </div>

              <Separator />

              {/* Description */}
              {item.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    توضیحات
                  </p>
                  <div className="rounded-lg bg-muted/30 border p-4 max-h-48 overflow-y-auto">
                    <p className="text-sm leading-7 whitespace-pre-wrap text-foreground/90">
                      {item.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Meta key-value pairs */}
              {item.meta && Object.keys(item.meta).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    اطلاعات تکمیلی
                  </p>
                  <div className="space-y-2">
                    {Object.entries(item.meta).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-xs font-medium text-muted-foreground">{key}</span>
                        <span className="text-sm font-medium text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <SheetFooter className="border-t bg-muted/20 flex-row gap-2">
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                <Pencil className="h-4 w-4" />
                ویرایش
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <ExternalLink className="h-4 w-4" />
                مشاهده کامل
              </Button>
              <Button
                variant="ghost"
                className="gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-muted-foreground"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
                بستن
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
