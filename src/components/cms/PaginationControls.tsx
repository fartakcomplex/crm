'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: '۵' },
  { value: 10, label: '۱۰' },
  { value: 20, label: '۲۰' },
  { value: 50, label: '۵۰' },
]

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Build page numbers to show (max 5 with ellipsis)
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | 'ellipsis')[] = []

    if (currentPage <= 3) {
      // Near start: 1 2 3 4 5 ... last
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push('ellipsis')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 2) {
      // Near end: 1 ... n-4 n-3 n-2 n-1 n
      pages.push(1)
      pages.push('ellipsis')
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
    } else {
      // Middle: 1 ... n-1 n n+1 ... last
      pages.push(1)
      pages.push('ellipsis')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
      pages.push('ellipsis')
      pages.push(totalPages)
    }

    return pages
  }

  if (totalItems <= 0) return null

  return (
    <div className="glass-card shadow-sm mt-4 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Item count + page size selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          نمایش <span className="font-semibold text-foreground tabular-nums">{startItem}</span>
          {' '}تا <span className="font-semibold text-foreground tabular-nums">{endItem}</span>
          {' '}از <span className="font-semibold text-foreground tabular-nums">{totalItems}</span>
        </span>
        <div className="hidden sm:block w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">تعداد در صفحه:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Page navigation buttons */}
      <nav className="flex items-center gap-1" aria-label="صفحه‌بندی">
        {/* Previous button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="صفحه قبلی"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex items-center justify-center h-8 w-8 text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            )
          }
          const isActive = page === currentPage
          return (
            <Button
              key={page}
              variant={isActive ? 'default' : 'outline'}
              size="icon"
              className={`h-8 w-8 text-xs tabular-nums transition-all duration-200 ${
                isActive
                  ? 'shadow-sm hover:shadow-md hover:scale-105'
                  : 'hover:scale-105'
              }`}
              onClick={() => onPageChange(page)}
              aria-label={`صفحه ${page}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {toPersianNum(page)}
            </Button>
          )
        })}

        {/* Next button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="صفحه بعدی"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  )
}

/** Convert latin digits to Persian/Farsi digits */
function toPersianNum(n: number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => persianDigits[Number(d)])
}
