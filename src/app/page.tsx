'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CMSProvider } from '@/components/cms/context'
import { CMS_TABS, getTabAccentClass, type CMSPage } from '@/components/cms/types'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LayoutDashboard, FileText, ImageIcon, Users, UserCog, UserCircle, FolderKanban,
  Bot, BarChart3, Activity, MessageCircle, Bell, Globe, Settings,
  Menu, ChevronRight, ChevronLeft, Moon, Sun, Search,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { SearchDialog } from '@/components/cms/SearchDialog'

// ─── Dynamic imports to reduce bundle size ──────────────────────────────

const LoadingFallback = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
    </div>
    <Skeleton className="h-64 rounded-xl" />
  </div>
)

const pageComponents: Record<string, React.ComponentType> = {
  dashboard: dynamic(() => import('@/components/cms/DashboardPage'), { loading: LoadingFallback, ssr: false }),
  content: dynamic(() => import('@/components/cms/ContentPage'), { loading: LoadingFallback, ssr: false }),
  media: dynamic(() => import('@/components/cms/MediaPage'), { loading: LoadingFallback, ssr: false }),
  users: dynamic(() => import('@/components/cms/UsersPage'), { loading: LoadingFallback, ssr: false }),
  team: dynamic(() => import('@/components/cms/TeamPage'), { loading: LoadingFallback, ssr: false }),
  customers: dynamic(() => import('@/components/cms/CustomersPage'), { loading: LoadingFallback, ssr: false }),
  projects: dynamic(() => import('@/components/cms/ProjectsPage'), { loading: LoadingFallback, ssr: false }),
  'ai-assistant': dynamic(() => import('@/components/cms/AIAssistantPage'), { loading: LoadingFallback, ssr: false }),
  reports: dynamic(() => import('@/components/cms/ReportsPage'), { loading: LoadingFallback, ssr: false }),
  activities: dynamic(() => import('@/components/cms/ActivitiesPage'), { loading: LoadingFallback, ssr: false }),
  comments: dynamic(() => import('@/components/cms/CommentsPage'), { loading: LoadingFallback, ssr: false }),
  notifications: dynamic(() => import('@/components/cms/NotificationsPage'), { loading: LoadingFallback, ssr: false }),
  wordpress: dynamic(() => import('@/components/cms/WordPressPage'), { loading: LoadingFallback, ssr: false }),
  settings: dynamic(() => import('@/components/cms/SettingsPage'), { loading: LoadingFallback, ssr: false }),
}

// ─── Icon Map ──────────────────────────────────────────────────────────

const iconComponents: Record<string, React.ComponentType<{className?: string}>> = {
  LayoutDashboard, FileText, Image: ImageIcon, Users, UserCog, UserCircle,
  FolderKanban, Bot, BarChart3, Activity, MessageCircle, Bell, Globe, Settings,
}

function TabIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconComponents[name]
  return Icon ? <Icon className={className} /> : <Settings className={className} />
}

// ─── Main App ──────────────────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  // Ctrl+K / Cmd+K → open search dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSearchNavigate = useCallback((tabId: string) => {
    setActiveTab(tabId)
  }, [])
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } }
  }))

  const PageComponent = pageComponents[activeTab] ?? pageComponents.dashboard
  const activeTabData = CMS_TABS.find(t => t.id === activeTab)

  return (
    <QueryClientProvider client={queryClient}>
      <CMSProvider>
        <TooltipProvider delayDuration={0}>
          <div className="min-h-screen flex bg-background" dir="rtl">
            {/* ─── Sidebar ─── */}
            <aside
              className={`sticky top-0 h-screen border-l border-border bg-card/50 backdrop-blur-sm transition-all duration-300 flex flex-col z-30 ${
                sidebarOpen ? 'w-[220px]' : 'w-[60px]'
              }`}
            >
              {/* Logo */}
              <div className="h-14 flex items-center justify-between px-3 border-b border-border/50 shrink-0">
                {sidebarOpen && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-sm">Smart CMS</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </div>

              {/* Nav Items */}
              <ScrollArea className="flex-1 py-2">
                <nav className="space-y-0.5 px-2" dir="rtl">
                  {CMS_TABS.map(tab => (
                    <Tooltip key={tab.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`w-full gap-3 h-9 transition-all ${
                            activeTab === tab.id
                              ? `bg-gradient-to-r ${tab.gradient} text-white shadow-sm`
                              : `hover:bg-accent/50 ${getTabAccentClass(tab.id)}`
                          } ${sidebarOpen ? 'justify-start px-3' : 'justify-center px-0'}`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <span className="shrink-0">
                            <TabIcon name={tab.icon} className="h-5 w-5" />
                          </span>
                          {sidebarOpen && <span className="text-sm truncate">{tab.name}</span>}
                        </Button>
                      </TooltipTrigger>
                      {!sidebarOpen && (
                        <TooltipContent side="left" className="text-xs">
                          {tab.name}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  ))}
                </nav>
              </ScrollArea>

              {/* Theme Toggle */}
              <div className="border-t border-border/50 p-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full gap-2 ${sidebarOpen ? 'justify-start px-3' : 'justify-center px-0'}`}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {sidebarOpen && (
                    <span className="text-sm">{theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}</span>
                  )}
                </Button>
              </div>
            </aside>

            {/* ─── Main Content ─── */}
            <main className="flex-1 min-w-0">
              {/* Top Bar */}
              <header className="sticky top-0 z-20 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-8 w-8"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                  {activeTabData && (
                    <div className="flex items-center gap-2">
                      <span className={getTabAccentClass(activeTabData.id)}>
                        <TabIcon name={activeTabData.icon} className="h-5 w-5" />
                      </span>
                      <h2 className="font-semibold text-sm">{activeTabData.name}</h2>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex items-center gap-2 h-8 text-xs text-muted-foreground cursor-pointer"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>جستجو...</span>
                    <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                      ⌘K
                    </kbd>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden h-8 w-8"
                    onClick={() => setSearchOpen(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    A
                  </div>
                </div>
              </header>

              {/* Page Content */}
              <div className="p-4 md:p-6 max-w-7xl">
                <PageComponent />
              </div>
            </main>
          </div>
        </TooltipProvider>
        <SearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          onNavigate={handleSearchNavigate}
        />
      </CMSProvider>
    </QueryClientProvider>
  )
}
