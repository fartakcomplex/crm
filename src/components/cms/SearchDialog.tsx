'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCMS } from '@/components/cms/context'
import {
  Search, FileText, Users, FolderKanban, UserCircle,
  Image as ImageIcon, MessageCircle, Bot, BarChart3, Settings, Globe,
  Loader2,
} from 'lucide-react'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (tabId: string) => void
}

const iconMap: Record<string, React.ReactNode> = {
  post: <FileText className="h-4 w-4" />,
  user: <Users className="h-4 w-4" />,
  customer: <UserCircle className="h-4 w-4" />,
  project: <FolderKanban className="h-4 w-4" />,
  media: <ImageIcon className="h-4 w-4" />,
  comment: <MessageCircle className="h-4 w-4" />,
  team: <Users className="h-4 w-4" />,
}

const typeLabels: Record<string, string> = {
  post: 'مقاله',
  user: 'کاربر',
  customer: 'مشتری',
  project: 'پروژه',
  media: 'رسانه',
  comment: 'نظر',
  team: 'تیم',
}

const typeTabs: Record<string, string> = {
  post: 'content',
  user: 'users',
  customer: 'customers',
  project: 'projects',
  media: 'media',
  comment: 'comments',
  team: 'team',
}

interface SearchResult {
  id: string
  type: string
  title: string
  subtitle: string
}

export function SearchDialog({ open, onOpenChange, onNavigate }: SearchDialogProps) {
  const { posts, users, customers, projects, media, comments, team } = useCMS()
  const [query, setQuery] = useState('')

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const items: SearchResult[] = []

    const addItems = (data: Array<Record<string, unknown>>, type: string, titleKey: string, subtitleKey: string) => {
      data.forEach(item => {
        const title = String(item[titleKey] || '')
        if (title.toLowerCase().includes(q)) {
          items.push({
            id: String(item.id),
            type,
            title,
            subtitle: String(item[subtitleKey] || ''),
          })
        }
      })
    }

    if (posts.data) addItems(posts.data as unknown as Array<Record<string, unknown>>, 'post', 'title', 'status')
    if (users.data) addItems(users.data as unknown as Array<Record<string, unknown>>, 'user', 'name', 'email')
    if (customers.data) addItems(customers.data as unknown as Array<Record<string, unknown>>, 'customer', 'name', 'company')
    if (projects.data) addItems(projects.data as unknown as Array<Record<string, unknown>>, 'project', 'title', 'status')
    if (media.data) addItems(media.data as unknown as Array<Record<string, unknown>>, 'media', 'name', 'type')
    if (comments.data) addItems(comments.data as unknown as Array<Record<string, unknown>>, 'comment', 'author', 'content')
    if (team.data) addItems(team.data as unknown as Array<Record<string, unknown>>, 'team', 'name', 'department')

    return items.slice(0, 20)
  }, [query, posts.data, users.data, customers.data, projects.data, media.data, comments.data, team.data])

  const isLoading = posts.isLoading || users.isLoading || customers.isLoading || projects.isLoading

  const handleSelect = useCallback((result: SearchResult) => {
    const tabId = typeTabs[result.type]
    if (tabId) onNavigate(tabId)
    onOpenChange(false)
    setQuery('')
  }, [onNavigate, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen)
      if (!newOpen) setQuery('')
  }}>
      <DialogContent className="glass-card sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>جستجو</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
          <Input
            placeholder="جستجو در مقالات، کاربران، پروژه‌ها..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 h-12 text-sm"
            autoFocus
          />
          <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="mr-2 text-sm text-muted-foreground">در حال بارگذاری...</span>
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">نتیجه‌ای یافت نشد</p>
            </div>
          ) : !query.trim() ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p className="text-sm">عبارت مورد نظر را تایپ کنید...</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map(result => (
                <button
                  key={`${result.type}-${result.id}`}
                  className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-right hover:bg-accent/50 transition-colors"
                  onClick={() => handleSelect(result)}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    {iconMap[result.type] || <Search className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{typeLabels[result.type]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1">↑↓</kbd> حرکت</span>
          <span className="flex items-center gap-1"><kbd className="rounded border bg-muted px-1">↵</kbd> انتخاب</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
