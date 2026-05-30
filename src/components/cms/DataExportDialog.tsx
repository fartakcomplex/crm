'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Database,
  Download,
  Upload,
  FileUp,
  X,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Data Types ────────────────────────────────────────────────────────

const exportDataTypes = [
  { id: 'content', label: 'محتوا و مطالب', icon: FileText, count: 12, gradient: 'from-cyan-500 to-cyan-600' },
  { id: 'users', label: 'کاربران', icon: Users, count: 4, gradient: 'from-violet-500 to-purple-600' },
  { id: 'products', label: 'محصولات', icon: Package, count: 10, gradient: 'from-amber-500 to-orange-500' },
  { id: 'orders', label: 'سفارشات', icon: ShoppingCart, count: 4, gradient: 'from-emerald-500 to-teal-600' },
  { id: 'transactions', label: 'تراکنش‌های مالی', icon: DollarSign, count: 5, gradient: 'from-rose-500 to-pink-600' },
  { id: 'all', label: 'تمام داده‌ها', icon: Database, count: 35, gradient: 'from-fuchsia-500 to-purple-600' },
]

type ExportFormat = 'json' | 'csv' | 'xml'

const exportFormats: { key: ExportFormat; label: string; description: string }[] = [
  { key: 'json', label: 'JSON', description: 'فرمت استاندارد جاوااسکریپت' },
  { key: 'csv', label: 'CSV', description: 'قابل استفاده در اکسل' },
  { key: 'xml', label: 'XML', description: 'فرمت داده‌های ساختاریافته' },
]

// ─── Props ─────────────────────────────────────────────────────────────

interface DataExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Main Component ────────────────────────────────────────────────────

export default function DataExportDialog({ open, onOpenChange }: DataExportDialogProps) {
  const [selectedDataType, setSelectedDataType] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleExport = useCallback(async () => {
    if (!selectedDataType) {
      toast.error('لطفاً نوع داده را انتخاب کنید')
      return
    }
    setIsExporting(true)
    // Simulate export delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsExporting(false)
    const typeName = exportDataTypes.find(d => d.id === selectedDataType)?.label ?? ''
    toast.success(`فایل خروجی ${typeName} با موفقیت ایجاد شد`)
  }, [selectedDataType])

  const handleImport = useCallback(async () => {
    if (!importFile) {
      toast.error('لطفاً یک فایل انتخاب کنید')
      return
    }
    setIsImporting(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsImporting(false)
    toast.success('داده‌ها با موفقیت وارد شدند')
    setImportFile(null)
  }, [importFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setImportFile(file)
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
    }
  }, [])

  const removeFile = useCallback(() => {
    setImportFile(null)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] glass-card card-elevated" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-lg font-bold text-gradient-violet flex items-center gap-2">
            <Database className="h-5 w-5 text-violet-500" />
            خروجی و وارد کردن داده‌ها
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            مدیریت پشتیبان‌گیری و بازیابی داده‌های سیستم
          </DialogDescription>
        </DialogHeader>

        {/* ─── Tabs ─── */}
        <Tabs defaultValue="export" className="mt-2">
          <TabsList className="w-full h-10 bg-muted/50 p-1">
            <TabsTrigger
              value="export"
              className="flex-1 gap-1.5 text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-violet-500/20 transition-all duration-200"
            >
              <Download className="h-3.5 w-3.5" />
              خروجی داده
            </TabsTrigger>
            <TabsTrigger
              value="import"
              className="flex-1 gap-1.5 text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-violet-500/20 transition-all duration-200"
            >
              <Upload className="h-3.5 w-3.5" />
              وارد کردن
            </TabsTrigger>
          </TabsList>

          {/* ═══ Export Tab ═══ */}
          <TabsContent value="export" className="mt-4 space-y-4">
            {/* Data Type Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {exportDataTypes.map((dataType, idx) => {
                const Icon = dataType.icon
                const isSelected = selectedDataType === dataType.id
                return (
                  <button
                    key={dataType.id}
                    className={`relative flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-300 cursor-pointer hover-lift text-center ${
                      isSelected
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 shadow-lg shadow-violet-500/15'
                        : 'border-border/60 bg-card hover:border-violet-300 dark:hover:border-violet-700'
                    }`}
                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                    onClick={() => setSelectedDataType(dataType.id)}
                  >
                    {/* Icon with gradient bg */}
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${dataType.gradient} flex items-center justify-center text-white shadow-md transition-transform duration-200 ${
                      isSelected ? 'scale-110' : 'group-hover:scale-105'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {/* Label */}
                    <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-foreground'}`}>
                      {dataType.label}
                    </span>
                    {/* Count badge */}
                    <Badge
                      variant="secondary"
                      className={`text-[9px] h-4 px-1.5 border-0 ${
                        isSelected
                          ? 'bg-violet-200 dark:bg-violet-800/50 text-violet-700 dark:text-violet-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {dataType.count}
                    </Badge>
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center animate-in zoom-in duration-200">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Format Selector */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                فرمت خروجی
              </p>
              <div className="flex items-center gap-2">
                {exportFormats.map(format => (
                  <button
                    key={format.key}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer border ${
                      selectedFormat === format.key
                        ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent shadow-md shadow-violet-500/20'
                        : 'bg-card border-border/60 text-muted-foreground hover:bg-accent/60 hover:border-violet-300 dark:hover:border-violet-700'
                    }`}
                    onClick={() => setSelectedFormat(format.key)}
                  >
                    <span className="font-bold">{format.label}</span>
                    <span className="block text-[9px] mt-0.5 opacity-70">
                      {format.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <Button
              className="w-full gap-2 btn-primary-gradient text-white h-10 text-sm font-medium shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200"
              onClick={handleExport}
              disabled={isExporting || !selectedDataType}
            >
              {isExporting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  در حال ایجاد خروجی...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  ایجاد فایل خروجی
                </>
              )}
            </Button>
          </TabsContent>

          {/* ═══ Import Tab ═══ */}
          <TabsContent value="import" className="mt-4 space-y-4">
            {/* Drag and Drop Area */}
            <div
              className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
                isDragging
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20 scale-[1.01]'
                  : importFile
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/10'
                    : 'border-border hover:border-violet-400 hover:bg-accent/20'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.getElementById('import-file-input')
                input?.click()
              }}
            >
              <input
                id="import-file-input"
                type="file"
                className="hidden"
                accept=".json,.csv,.xml"
                onChange={handleFileSelect}
              />

              {importFile ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">{importFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(importFile.size / 1024).toFixed(1)} کیلوبایت
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile()
                    }}
                  >
                    <X className="h-3 w-3" />
                    حذف فایل
                  </Button>
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                    isDragging ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-muted/80'
                  }`}>
                    <FileUp className={`h-6 w-6 transition-colors duration-300 ${
                      isDragging ? 'text-violet-500' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? 'فایل را اینجا رها کنید' : 'فایل را اینجا بکشید یا کلیک کنید'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      فرمت‌های پشتیبانی: JSON, CSV, XML
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Supported Formats Info */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <FileText className="h-3 w-3 shrink-0" />
              <span>حداکثر حجم فایل: ۵۰ مگابایت — فرمت‌های پشتیبانی: JSON, CSV, XML</span>
            </div>

            {/* Import Button */}
            <Button
              className="w-full gap-2 btn-primary-gradient text-white h-10 text-sm font-medium shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-200"
              onClick={handleImport}
              disabled={isImporting || !importFile}
            >
              {isImporting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  در حال وارد کردن داده‌ها...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  وارد کردن داده‌ها
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
