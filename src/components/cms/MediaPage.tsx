'use client'

import { useState } from 'react'
import { useCMS } from './context'
import { useEnsureData } from '@/components/cms/useEnsureData'
import type { MediaItem } from './types'
import { formatFileSize, formatDate } from './types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Upload, Trash2, Image as ImageIcon, Video, FileText, Music, File, Search, Eye, X } from 'lucide-react'
import { toast } from 'sonner'

const labels = {
  title: 'مدیریت رسانه',
  subtitle: 'بارگذاری و مدیریت فایل‌های رسانه‌ای',
  upload: 'بارگذاری فایل',
  uploadNew: 'بارگذاری جدید',
  delete: 'حذف فایل',
  deleteConfirm: 'آیا مطمئن هستید؟',
  deleteDesc: 'این فایل برای همیشه حذف خواهد شد.',
  save: 'آپلود',
  cancel: 'انصراف',
  search: 'جستجو در فایل‌ها...',
  noResults: 'فایلی یافت نشد',
  noMedia: 'هنوز فایلی بارگذاری نشده است',
  fileName: 'نام فایل',
  fileType: 'نوع فایل',
  fileSize: 'حجم فایل',
  fileDate: 'تاریخ',
  all: 'همه',
  fileDetails: 'اطلاعات فایل',
}

const typeLabels: Record<string, string> = {
  image: 'تصویر',
  video: 'ویدئو',
  audio: 'صوتی',
  document: 'سند',
  other: 'سایر',
}

const typeIcons: Record<string, React.ReactNode> = {
  image: <ImageIcon className="h-8 w-8" />,
  video: <Video className="h-8 w-8" />,
  audio: <Music className="h-8 w-8" />,
  document: <FileText className="h-8 w-8" />,
  other: <File className="h-8 w-8" />,
}

const typeColors: Record<string, string> = {
  image: 'from-rose-400 to-pink-500',
  video: 'from-purple-400 to-purple-600',
  audio: 'from-amber-400 to-orange-500',
  document: 'from-cyan-400 to-cyan-600',
  other: 'from-gray-400 to-gray-500',
}

export default function MediaPage() {
  useEnsureData(['media'])
  const { media, uploadMedia, deleteMedia } = useCMS()
  const mediaData = media.data ?? []

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)

  const filtered = mediaData.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || m.type === typeFilter
    return matchSearch && matchType
  })

  const handleUpload = async () => {
    if (!selectedFile) return
    const formData = new FormData()
    formData.append('file', selectedFile)
    uploadMedia.mutate(formData, {
      onSuccess: () => {
        toast.success('فایل با موفقیت بارگذاری شد')
        setUploadOpen(false)
        setSelectedFile(null)
      },
    })
  }

  const openDelete = (id: string) => {
    setDeletingId(id)
    setDeleteOpen(true)
  }

  const handleDelete = () => {
    if (deletingId) {
      deleteMedia.mutate(deletingId)
      toast.success('فایل با موفقیت حذف شد')
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  const openDetail = (item: MediaItem) => {
    setSelectedItem(item)
    setDetailOpen(true)
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
        <Button className="gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" />{labels.upload}
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={labels.search} value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{labels.all}</SelectItem>
              <SelectItem value="image">تصویر</SelectItem>
              <SelectItem value="video">ویدئو</SelectItem>
              <SelectItem value="audio">صوتی</SelectItem>
              <SelectItem value="document">سند</SelectItem>
              <SelectItem value="other">سایر</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Media Grid */}
      {filtered.length === 0 ? (
        <Card className="glass-card shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/20 dark:to-rose-800/20 flex items-center justify-center mb-4">
              <ImageIcon className="h-10 w-10 text-rose-300" />
            </div>
            <p className="text-base font-medium">{search ? labels.noResults : labels.noMedia}</p>
            <p className="text-sm mt-1 opacity-60">برای شروع فایلی بارگذاری کنید</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((item, idx) => (
            <Card
              key={item.id}
              className="overflow-hidden group cursor-pointer hover-lift shine-effect shadow-sm hover:shadow-lg transition-all duration-300 animate-in border-0"
              style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'both' }}
              onClick={() => openDetail(item)}
            >
              {/* Thumbnail */}
              <div className={`aspect-square flex items-center justify-center bg-gradient-to-br ${typeColors[item.type] ?? typeColors.other} text-white relative`}>
                {typeIcons[item.type] ?? typeIcons.other}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-white hover:bg-white/20 hover:scale-110 transition-all duration-200" onClick={e => { e.stopPropagation(); openDetail(item) }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-white hover:bg-red-500/40 hover:scale-110 transition-all duration-200" onClick={e => { e.stopPropagation(); openDelete(item.id) }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Info */}
              <div className="p-2.5">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <Badge variant="outline" className="text-[10px] font-medium">{typeLabels[item.type] ?? item.type}</Badge>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{formatFileSize(item.size)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-rose-700 dark:text-rose-300">{labels.uploadNew}</DialogTitle>
            <DialogDescription>یک فایل را برای بارگذاری انتخاب کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-rose-200 dark:border-rose-800 rounded-xl p-10 text-center cursor-pointer hover:bg-rose-500/5 transition-all duration-200 hover:border-rose-300 dark:hover:border-rose-700 hover:scale-[1.01]"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <File className="h-5 w-5 text-rose-500" />
                  <span className="text-sm">{selectedFile.name}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={e => { e.stopPropagation(); setSelectedFile(null) }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/20 dark:to-rose-800/20 flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-7 w-7 text-rose-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">برای انتخاب فایل کلیک کنید</p>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); setSelectedFile(null) }} className="hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">{labels.cancel}</Button>
            <Button
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm"
              onClick={handleUpload}
              disabled={!selectedFile}
            >
              {labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-sm glass-card shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-rose-700 dark:text-rose-300">{labels.fileDetails}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {/* Preview */}
              <div className={`aspect-video flex items-center justify-center bg-gradient-to-br ${typeColors[selectedItem.type] ?? typeColors.other} text-white rounded-xl shadow-inner`}>
                <div className="transform scale-150">{typeIcons[selectedItem.type] ?? typeIcons.other}</div>
              </div>
              <div className="space-y-3 p-3 rounded-lg bg-background/50">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{labels.fileName}</span>
                  <span className="text-sm font-medium">{selectedItem.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{labels.fileType}</span>
                  <Badge variant="outline">{typeLabels[selectedItem.type] ?? selectedItem.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{labels.fileSize}</span>
                  <span className="text-sm font-medium tabular-nums">{formatFileSize(selectedItem.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{labels.fileDate}</span>
                  <span className="text-sm font-medium">{formatDate(selectedItem.createdAt)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>{labels.cancel}</Button>
            <Button
              variant="destructive"
              className="gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              onClick={() => { setDetailOpen(false); if (selectedItem) openDelete(selectedItem.id) }}
            >
              <Trash2 className="h-4 w-4" />{labels.delete}
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
