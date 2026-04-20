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
  document: 'from-blue-400 to-blue-600',
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
      setDeleteOpen(false)
      setDeletingId(null)
    }
  }

  const openDetail = (item: MediaItem) => {
    setSelectedItem(item)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">
            {labels.title}
          </h1>
          <p className="text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" />{labels.upload}
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-rose-500/5 to-rose-600/5 border-rose-200/30 dark:border-rose-800/30">
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
        <Card className="bg-gradient-to-br from-rose-500/5 to-rose-600/5 border-rose-200/30 dark:border-rose-800/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
            <p>{search ? labels.noResults : labels.noMedia}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(item => (
            <Card
              key={item.id}
              className="bg-gradient-to-br from-rose-500/5 to-rose-600/5 border-rose-200/30 dark:border-rose-800/30 overflow-hidden group cursor-pointer hover:shadow-lg transition-all"
              onClick={() => openDetail(item)}
            >
              {/* Thumbnail */}
              <div className={`aspect-square flex items-center justify-center bg-gradient-to-br ${typeColors[item.type] ?? typeColors.other} text-white relative`}>
                {typeIcons[item.type] ?? typeIcons.other}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20" onClick={e => { e.stopPropagation(); openDetail(item) }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-red-500/40" onClick={e => { e.stopPropagation(); openDelete(item.id) }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Info */}
              <div className="p-2">
                <p className="text-xs font-medium truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-[10px]">{typeLabels[item.type] ?? item.type}</Badge>
                  <span className="text-[10px] text-muted-foreground">{formatFileSize(item.size)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-700 dark:text-rose-300">{labels.uploadNew}</DialogTitle>
            <DialogDescription>یک فایل را برای بارگذاری انتخاب کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-rose-200 dark:border-rose-800 rounded-lg p-8 text-center cursor-pointer hover:bg-rose-500/5 transition-colors"
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
                  <Upload className="h-10 w-10 mx-auto mb-2 text-rose-300" />
                  <p className="text-sm text-muted-foreground">برای انتخاب فایل کلیک کنید</p>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); setSelectedFile(null) }}>{labels.cancel}</Button>
            <Button
              className="bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white"
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-rose-700 dark:text-rose-300">{labels.fileDetails}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              {/* Preview */}
              <div className={`aspect-video flex items-center justify-center bg-gradient-to-br ${typeColors[selectedItem.type] ?? typeColors.other} text-white rounded-lg`}>
                <div className="transform scale-150">{typeIcons[selectedItem.type] ?? typeIcons.other}</div>
              </div>
              <div className="space-y-2">
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
                  <span className="text-sm font-medium">{formatFileSize(selectedItem.size)}</span>
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
              className="gap-2"
              onClick={() => { setDetailOpen(false); if (selectedItem) openDelete(selectedItem.id) }}
            >
              <Trash2 className="h-4 w-4" />{labels.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{labels.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {labels.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
