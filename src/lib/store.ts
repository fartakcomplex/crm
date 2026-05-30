import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// UI State Shape
// ---------------------------------------------------------------------------

interface CMSUIState {
  /** Currently active tab id — must match one of CMS_TABS[].id */
  activeTab: string
  /** Whether the sidebar is expanded (> true) or collapsed (> false) */
  sidebarOpen: boolean
  /** Theme preference — drives next-themes */
  theme: 'light' | 'dark'
  /** Mobile search overlay open */
  searchOpen: boolean
}

interface CMSUIActions {
  setActiveTab: (tab: string) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setSearchOpen: (open: boolean) => void
}

type CMSStore = CMSUIState & CMSUIActions

// ---------------------------------------------------------------------------
// Zustand Store — persisted to localStorage so sidebar/theme survive reload
// ---------------------------------------------------------------------------

export const useCMSStore = create<CMSStore>()(
  persist(
    (set) => ({
      // ── Default state ──
      activeTab: 'dashboard',
      sidebarOpen: true,
      theme: 'light',
      searchOpen: false,

      // ── Actions ──
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setSearchOpen: (open) => set({ searchOpen: open }),
    }),
    {
      name: 'cms-ui-store',
      // Only persist these keys to localStorage
      partialize: (state) => ({
        activeTab: state.activeTab,
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    },
  ),
)
