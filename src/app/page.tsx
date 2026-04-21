'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CMSProvider, useCMS } from '@/components/cms/context'
import { CMS_TABS, getTabAccentClass, getTabGradient } from '@/components/cms/types'
import { useEnsureData } from '@/components/cms/useEnsureData'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard, FileText, ImageIcon, Users, UserCog, UserCircle, FolderKanban,
  Bot, BarChart3, Activity, MessageCircle, Bell, Globe, Settings,
  Menu, ChevronRight, ChevronLeft, Moon, Sun, Search, LogOut, User as UserIcon,
  Zap, Plus, X, Database, Clock, Wifi, Keyboard,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useIsMobile } from '@/hooks/use-mobile'
import { SearchDialog } from '@/components/cms/SearchDialog'
import ProfilePanel from '@/components/cms/ProfilePanel'
import { KeyboardShortcuts, KeyboardShortcutsTrigger } from '@/components/cms/KeyboardShortcuts'
import { formatRelativeTime } from '@/components/cms/types'

// ─── Dynamic imports to reduce bundle size ──────────────────────────────

const LoadingFallback = () => (
  <div className="p-6 space-y-4 page-enter">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 rounded-xl loading-shimmer" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Skeleton className="h-64 rounded-xl loading-shimmer" />
      <Skeleton className="h-64 rounded-xl loading-shimmer" />
    </div>
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

const DynamicLoginPage = dynamic(
  () => import('@/components/cms/LoginPage'),
  { ssr: false }
)

// ─── Icon Map ──────────────────────────────────────────────────────────

const iconComponents: Record<string, React.ComponentType<{className?: string}>> = {
  LayoutDashboard, FileText, Image: ImageIcon, Users, UserCog, UserCircle,
  FolderKanban, Bot, BarChart3, Activity, MessageCircle, Bell, Globe, Settings,
}

function TabIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconComponents[name]
  return Icon ? <Icon className={className} /> : <Settings className={className} />
}

// ─── Sidebar Nav (shared between desktop & mobile) ─────────────────────

function SidebarNav({
  activeTab,
  onTabChange,
  collapsed,
  theme,
  onThemeToggle,
  onNavigateToNotifications,
  unreadCount,
  onOpenShortcuts,
}: {
  activeTab: string
  onTabChange: (id: string) => void
  collapsed: boolean
  theme: string | undefined
  onThemeToggle: () => void
  onNavigateToNotifications: () => void
  unreadCount: number
  onOpenShortcuts: () => void
}) {
  return (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-border/50 shrink-0">
        {collapsed ? null : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow">
              <Bot className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">Smart CMS</span>
              <span className="block text-[10px] text-muted-foreground -mt-0.5">مدیریت هوشمند</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-0.5 px-2" dir="rtl">
          {CMS_TABS.map((tab, i) => {
            const isActive = activeTab === tab.id
            const showBadge = tab.id === 'notifications' && unreadCount > 0
            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    className={`w-full flex items-center gap-3 rounded-lg h-9 transition-all duration-200 cursor-pointer ${
                      isActive
                        ? `bg-gradient-to-l ${tab.gradient} text-white shadow-md`
                        : `hover:bg-accent/60 ${getTabAccentClass(tab.id)} hover:translate-x-[-2px]`
                    } ${collapsed ? 'justify-center px-0' : 'justify-start px-3'}`}
                    onClick={() => onTabChange(tab.id)}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span className="shrink-0">
                      <TabIcon name={tab.icon} className="h-[18px] w-[18px]" />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="text-sm truncate flex-1">{tab.name}</span>
                        {showBadge && (
                          <Badge className="h-5 min-w-[20px] px-1.5 text-[10px] bg-red-500 text-white border-0 animate-pulse">
                            {unreadCount}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="left" className="text-xs">
                    {tab.name}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t border-border/50 p-2 space-y-1 shrink-0">
        {/* Quick Create FAB hint */}
        {!collapsed && (
          <div className="px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 border border-violet-200/20 dark:border-violet-800/20 mb-1">
            <p className="text-[11px] text-muted-foreground">
              <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">⌘K</kbd>
              {' '}جستجوی سریع
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={`w-full gap-2.5 transition-all duration-200 hover:bg-accent/60 ${
            collapsed ? 'justify-center px-0' : 'justify-start px-3'
          }`}
          onClick={onThemeToggle}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-400" />
          )}
          {!collapsed && (
            <span className="text-sm">
              {theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
            </span>
          )}
        </Button>
        {!collapsed && (
          <KeyboardShortcutsTrigger onClick={onOpenShortcuts} />
        )}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="w-full flex items-center justify-center rounded-lg h-9 transition-all duration-200 cursor-pointer hover:bg-accent/60"
                onClick={onOpenShortcuts}
                aria-label="راهنمای کلیدهای میانبر"
              >
                <Keyboard className="h-[18px] w-[18px] text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              کلیدهای میانبر
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  )
}

// ─── Notification Bell Component ───────────────────────────────────────

function NotificationBell({ onClick, unreadCount }: { onClick: () => void; unreadCount: number }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 hover:bg-accent/60 transition-colors"
      onClick={onClick}
    >
      <Bell className="h-[18px] w-[18px]" />
      {unreadCount > 0 && (
        <>
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background badge-pop">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 rounded-full bg-red-500/50 animate-ping" />
        </>
      )}
    </Button>
  )
}

// ─── Bottom Status Bar ─────────────────────────────────────────────

function BottomStatusBar() {
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        new Intl.DateTimeFormat('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now)
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="sticky bottom-0 z-10 h-7 w-full border-t border-border/60 bg-card/60 backdrop-blur-xl flex items-center justify-between px-4 text-[11px] text-muted-foreground shrink-0">
      <div className="flex items-center gap-1.5">
        <span className="font-medium text-foreground/60">Smart CMS</span>
        <span className="text-foreground/30">v1.0</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <Database className="h-3 w-3" />
        <span>متصل</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Wifi className="h-3 w-3" />
          <Clock className="h-3 w-3" />
          <span dir="ltr" className="font-mono tabular-nums">{currentTime}</span>
        </div>
        <span className="text-emerald-600 dark:text-emerald-400">●</span>
        <span>وضعیت: فعال</span>
      </div>
    </div>
  )
}

// ─── Floating Action Button ────────────────────────────────────────────

function FloatingActionButton({ onNavigate }: { onNavigate: (tabId: string) => void }) {
  const [open, setOpen] = useState(false)
  const quickActions = [
    { id: 'content', icon: <Plus className="h-4 w-4" />, label: 'ایجاد مطلب', gradient: 'from-cyan-500 to-cyan-600' },
    { id: 'ai-assistant', icon: <Zap className="h-4 w-4" />, label: 'دستیار AI', gradient: 'from-violet-500 to-violet-600' },
    { id: 'media', icon: <ImageIcon className="h-4 w-4" />, label: 'بارگذاری رسانه', gradient: 'from-rose-500 to-rose-600' },
  ]

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col-reverse items-center gap-3">
      {open && quickActions.map((action, i) => (
        <button
          key={action.id}
          className="flex items-center gap-2 rounded-xl bg-card border border-border shadow-lg px-3 py-2 text-sm hover:bg-accent transition-all duration-200 hover:scale-105 animate-in slide-in-from-bottom-2"
          style={{ animationDelay: `${i * 60}ms` }}
          onClick={() => {
            onNavigate(action.id)
            setOpen(false)
          }}
        >
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${action.gradient} text-white`}>
            {action.icon}
          </span>
          <span className="whitespace-nowrap">{action.label}</span>
        </button>
      ))}
      <Button
        size="icon"
        className={`h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-110 active:scale-95 transition-all duration-200 ${
          open ? 'rotate-45' : ''
        }`}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </Button>
    </div>
  )
}

// ─── Notification Dropdown ─────────────────────────────────────────────

function NotificationDropdown({ children }: { children: React.ReactNode }) {
  const { notifications } = useCMS()
  useEnsureData(['notifications'])
  const notifs = notifications.data ?? []
  const unread = notifs.filter(n => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 glass-card">
        <div className="px-3 py-2.5 border-b border-border/50 flex items-center justify-between">
          <span className="font-semibold text-sm">اعلان‌ها</span>
          {unread > 0 && (
            <Badge className="h-5 text-[10px] bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-0">
              {unread} خوانده‌نشده
            </Badge>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>اعلانی وجود ندارد</p>
            </div>
          ) : (
            notifs.slice(0, 8).map(n => (
              <DropdownMenuItem
                key={n.id}
                className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer ${!n.read ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                  n.type === 'info' ? 'bg-blue-500' :
                  n.type === 'success' ? 'bg-green-500' :
                  n.type === 'warning' ? 'bg-amber-500' :
                  'bg-red-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                  {formatRelativeTime(n.createdAt)}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── User Profile Dropdown ─────────────────────────────────────────────

function UserProfileDropdown({ onLogout, onOpenProfile }: { onLogout: () => void; onOpenProfile: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-violet-500/30 transition-all duration-200 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
            A
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-card">
        <div className="px-3 py-2.5 border-b border-border/50">
          <p className="font-semibold text-sm">مدیر سیستم</p>
          <p className="text-xs text-muted-foreground">admin@smartcms.ir</p>
        </div>
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={onOpenProfile}>
          <UserIcon className="h-4 w-4" />
          <span className="text-sm">پروفایل</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer">
          <Settings className="h-4 w-4" />
          <span className="text-sm">تنظیمات</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">خروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()

  // Ensure notification data for badge count
  useEnsureData(['notifications'])
  const { notifications } = useCMS()
  const unreadCount = useMemo(
    () => (notifications.data ?? []).filter(n => !n.read).length,
    [notifications.data]
  )

  // Ctrl+K / Cmd+K → open search dialog
  // ? → open keyboard shortcuts help
  // ⌘1-4 → navigate to tabs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
        return
      }

      // ? → open shortcuts help (only without modifiers)
      if (e.key === '?' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setShortcutsOpen(prev => !prev)
        return
      }

      // ⌘1 → Dashboard, ⌘2 → Content, ⌘3 → Media, ⌘4 → Users
      const tabMap: Record<string, string> = {
        '1': 'dashboard',
        '2': 'content',
        '3': 'media',
        '4': 'users',
      }
      if ((e.metaKey || e.ctrlKey) && tabMap[e.key]) {
        e.preventDefault()
        setActiveTab(tabMap[e.key])
        setMobileSheetOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSearchNavigate = useCallback((tabId: string) => {
    setActiveTab(tabId)
    setMobileSheetOpen(false)
  }, [])

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId)
    setMobileSheetOpen(false)
  }, [])

  const handleNavigateNotifications = useCallback(() => {
    setActiveTab('notifications')
    setMobileSheetOpen(false)
  }, [])

  const handleLogin = useCallback(() => {
    setIsLoggedIn(true)
    setActiveTab('dashboard')
  }, [])

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false)
    setMobileSheetOpen(false)
  }, [])

  const PageComponent = pageComponents[activeTab] ?? pageComponents.dashboard
  const activeTabData = CMS_TABS.find(t => t.id === activeTab)

  // Full-screen login when not authenticated
  if (!isLoggedIn) {
    return <DynamicLoginPage onLogin={handleLogin} />
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-background" dir="rtl">

        {/* ─── Desktop Sidebar ─── */}
        {!isMobile && (
          <aside
            className={`sticky top-0 h-screen border-l border-border/60 bg-card/40 backdrop-blur-xl transition-all duration-300 flex flex-col z-30 ${
              sidebarOpen ? 'w-[240px]' : 'w-[60px]'
            }`}
          >
            <SidebarNav
              activeTab={activeTab}
              onTabChange={handleTabChange}
              collapsed={!sidebarOpen}
              theme={theme}
              onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              onNavigateToNotifications={handleNavigateNotifications}
              unreadCount={unreadCount}
              onOpenShortcuts={() => setShortcutsOpen(true)}
            />
            {/* Collapse toggle */}
            <button
              className="absolute -left-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen
                ? <ChevronRight className="h-3 w-3" />
                : <ChevronLeft className="h-3 w-3" />
              }
            </button>
          </aside>
        )}

        {/* ─── Mobile Sheet Sidebar ─── */}
        {isMobile && (
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetContent side="right" className="w-[280px] p-0 bg-card/95 backdrop-blur-xl" dir="rtl">
              <SidebarNav
                activeTab={activeTab}
                onTabChange={handleTabChange}
                collapsed={false}
                theme={theme}
                onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                onNavigateToNotifications={handleNavigateNotifications}
                unreadCount={unreadCount}
                onOpenShortcuts={() => setShortcutsOpen(true)}
              />
            </SheetContent>
          </Sheet>
        )}

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Top Bar */}
          <header className="sticky top-0 z-20 h-14 border-b border-border/60 bg-background/70 backdrop-blur-xl flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 hover:bg-accent/60">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0 bg-card/95 backdrop-blur-xl" dir="rtl">
                  <SidebarNav
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    collapsed={false}
                    theme={theme}
                    onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    onNavigateToNotifications={handleNavigateNotifications}
                    unreadCount={unreadCount}
                    onOpenShortcuts={() => setShortcutsOpen(true)}
                  />
                </SheetContent>
              </Sheet>

              {/* Breadcrumb */}
              {activeTabData && (
                <div className="flex items-center gap-2">
                  <div className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${activeTabData.gradient} text-white shadow-sm`}>
                    <TabIcon name={activeTabData.icon} className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="font-semibold text-sm leading-tight">{activeTabData.name}</h2>
                    <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                      {activeTab === 'dashboard' ? 'نمای کلی سیستم' : `بخش ${activeTabData.name}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Search */}
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex items-center gap-2 h-8 text-xs text-muted-foreground cursor-pointer hover:bg-accent/60 transition-colors border-border/60"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-3.5 w-3.5" />
                <span>جستجو...</span>
                <kbd className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-muted/80 px-1 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden h-9 w-9"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>

              {/* Notification Bell */}
              <NotificationDropdown>
                <NotificationBell
                  onClick={handleNavigateNotifications}
                  unreadCount={unreadCount}
                />
              </NotificationDropdown>

              {/* User Profile */}
              <UserProfileDropdown onLogout={handleLogout} onOpenProfile={() => setProfileOpen(true)} />
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 p-4 md:p-6">
            <div className="max-w-[1400px] mx-auto">
              <PageComponent />
            </div>
          </div>

          {/* Bottom Status Bar */}
          <BottomStatusBar />
        </main>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onNavigate={handleTabChange} />

      {/* Search Dialog */}
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNavigate={handleSearchNavigate}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcuts
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />

      {/* Profile Panel */}
      <ProfilePanel
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onNavigate={handleTabChange}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        sidebarCollapsed={!sidebarOpen}
      />
    </TooltipProvider>
  )
}

// ─── Root Component with Providers ─────────────────────────────────────

export default function Home() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <CMSProvider>
        <AppContent />
      </CMSProvider>
    </QueryClientProvider>
  )
}
