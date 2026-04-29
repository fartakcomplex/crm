// =============================================================================
// Smart CMS — TypeScript Interfaces, Constants & Helpers
// =============================================================================

// ---------------------------------------------------------------------------
// Entity Interfaces (mirrors Prisma schema, JSON-serialisable)
// ---------------------------------------------------------------------------

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  authorId: string
  categoryId: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  author?: User
  category?: Category
  tags?: Tag[]
  comments?: Comment[]
  _count?: { comments: number }
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'author' | 'viewer'
  avatar: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: 'active' | 'inactive' | 'lead' | 'churned'
  value: number
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  title: string
  description: string
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled'
  progress: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  startDate: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member' | 'intern'
  department: string
  avatar: string
  status: 'active' | 'inactive' | 'on-leave'
  joinedAt: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  content: string
  author: string
  email: string
  status: 'pending' | 'approved' | 'rejected' | 'spam'
  postId: string
  createdAt: string
  updatedAt: string
  post?: Post
}

export interface MediaItem {
  id: string
  name: string
  filename: string
  url: string
  type: 'image' | 'video' | 'audio' | 'document' | 'other'
  size: number
  alt: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  color: string
  postCount: number
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  posts?: Post[]
  _count?: { posts: number }
}

export interface ActivityLog {
  id: string
  action: string
  details: string
  userId: string | null
  createdAt: string
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatar'>
}

export interface Setting {
  id: string
  key: string
  value: string
  group: 'general' | 'seo' | 'ai' | 'content' | 'security' | 'appearance' | 'notifications'
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigneeId: string | null
  dueDate: string | null
  tags: string
  createdAt: string
  updatedAt: string
}

export interface QuickNote {
  id: string
  content: string
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple'
  pinned: boolean
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  allDay: boolean
  color: string
  location: string
  type: 'event' | 'meeting' | 'deadline' | 'reminder'
  createdAt: string
  updatedAt: string
}

// Business Module Interfaces (cross-module integrated)

export interface Product {
  id: string
  name: string
  sku: string
  description: string
  price: number
  salePrice: number | null
  cost: number
  status: string
  featured: boolean
  images: string
  productCategoryId: string | null
  createdAt: string
  updatedAt: string
  productCategory?: ProductCategory
  inventory?: InventoryItem
  orderItems?: OrderItem[]
  invoiceItems?: InvoiceItem[]
}

export interface ProductCategory {
  id: string
  name: string
  slug: string
  description: string
  color: string
  createdAt: string
  updatedAt: string
  products?: Product[]
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  status: string
  subtotal: number
  discount: number
  tax: number
  shippingCost: number
  total: number
  shippingAddress: string
  notes: string
  couponId: string | null
  createdAt: string
  updatedAt: string
  customer?: Customer
  items?: OrderItem[]
  coupon?: Coupon
  invoices?: Invoice[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: number
  totalPrice: number
  createdAt: string
  order?: Order
  product?: Product
}

export interface Coupon {
  id: string
  code: string
  type: string
  value: number
  minPurchase: number
  maxUses: number
  usedCount: number
  active: boolean
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  id: string
  productId: string
  stock: number
  minStock: number
  warehouse: string
  location: string
  lastRestocked: string | null
  createdAt: string
  updatedAt: string
  product?: Product
  inboundRecords?: InboundRecord[]
  outboundRecords?: OutboundRecord[]
}

export interface InboundRecord {
  id: string
  inventoryItemId: string
  quantity: number
  reference: string
  supplier: string
  unitCost: number
  notes: string
  createdAt: string
  inventoryItem?: InventoryItem
}

export interface OutboundRecord {
  id: string
  inventoryItemId: string
  quantity: number
  orderId: string | null
  reference: string
  notes: string
  createdAt: string
  inventoryItem?: InventoryItem
  order?: Order
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerId: string
  orderId: string | null
  status: string
  subtotal: number
  tax: number
  discount: number
  total: number
  dueDate: string | null
  paidAt: string | null
  notes: string
  createdAt: string
  updatedAt: string
  customer?: Customer
  order?: Order
  items?: InvoiceItem[]
  transactions?: Transaction[]
}

export interface InvoiceItem {
  id: string
  invoiceId: string
  productId: string | null
  description: string
  quantity: number
  unitPrice: number
  total: number
  createdAt: string
  invoice?: Invoice
  product?: Product
}

export interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  category: string
  invoiceId: string | null
  bankAccountId: string | null
  reference: string
  createdAt: string
  invoice?: Invoice
  bankAccount?: BankAccount
}

export interface BankAccount {
  id: string
  name: string
  accountNumber: string
  balance: number
  currency: string
  type: string
  createdAt: string
  updatedAt: string
  transactions?: Transaction[]
}

export interface CrmActivity {
  id: string
  customerId: string
  type: string
  title: string
  description: string
  outcome: string
  scheduledAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  customer?: Customer
}

export interface BudgetItem {
  id: string
  name: string
  category: string
  allocated: number
  spent: number
  period: string
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export interface WPSyncConfig {
  id: string
  siteUrl: string
  apiKey: string
  username: string
  syncFreq: 'manual' | 'hourly' | 'daily' | 'weekly'
  lastSync: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Dashboard & Chart Types
// ---------------------------------------------------------------------------

export interface Stats {
  totalPosts: number
  totalUsers: number
  totalCustomers: number
  totalProjects: number
  totalViews: number
  totalComments: number
  publishedPosts: number
  draftPosts: number
  revenue: number
  activeProjects: number
  completedProjects: number
  teamMembers: number
  mediaCount: number
  totalProducts: number
  totalOrders: number
  totalInvoices: number
  totalInventoryValue: number
  pendingOrders: number
  unpaidInvoices: number
  lowStockProducts: number
}

export interface ChartData {
  monthlyViews: { month: string; views: number }[]
  categoryDistribution: { name: string; value: number; color: string }[]
  weeklyActivity: { day: string; posts: number; comments: number }[]
  contentStatus: { status: string; count: number }[]
  popularPosts: { title: string; views: number; id: string }[]
}

// ---------------------------------------------------------------------------
// AI Assistant Types
// ---------------------------------------------------------------------------

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface AITab {
  id: string
  name: string
  icon: string
  description: string
}

// ---------------------------------------------------------------------------
// Notification Types
// ---------------------------------------------------------------------------

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
}

// ---------------------------------------------------------------------------
// 14 Tab Definitions
// ---------------------------------------------------------------------------

export interface CMSTab {
  id: string
  name: string
  icon: string
  gradient: string
  badge?: string
  category?: string
}

export const CMS_TABS: CMSTab[] = [
  // Main
  { id: 'dashboard',    name: 'داشبورد',         icon: 'LayoutDashboard', gradient: 'from-slate-500 to-slate-700', category: 'main' },
  // Content Management
  { id: 'content',      name: 'محتوا',           icon: 'FileText',        gradient: 'from-cyan-500 to-cyan-700', category: 'content' },
  { id: 'media',        name: 'رسانه',           icon: 'Image',          gradient: 'from-rose-500 to-rose-700', category: 'content' },
  { id: 'comments',     name: 'نظرات',           icon: 'MessageCircle',  gradient: 'from-orange-500 to-orange-700', category: 'content' },
  // People
  { id: 'users',        name: 'کاربران',          icon: 'Users',          gradient: 'from-emerald-500 to-emerald-700', category: 'people' },
  { id: 'team',         name: 'تیم',             icon: 'UserCog',        gradient: 'from-indigo-500 to-indigo-700', category: 'people' },
  { id: 'customers',    name: 'مشتریان',          icon: 'UserCircle',     gradient: 'from-amber-500 to-amber-700', category: 'people' },
  // Workspace
  { id: 'projects',     name: 'پروژه‌ها',         icon: 'FolderKanban',   gradient: 'from-sky-500 to-sky-700', category: 'workspace' },
  { id: 'tasks',        name: 'وظایف',           icon: 'CheckSquare',    gradient: 'from-green-500 to-green-700', category: 'workspace' },
  { id: 'calendar',     name: 'تقویم',           icon: 'CalendarDays',   gradient: 'from-indigo-500 to-indigo-700', category: 'workspace' },
  // Intelligence
  { id: 'ai-assistant', name: 'دستیار هوشمند',   icon: 'Bot',            gradient: 'from-violet-500 to-violet-700', category: 'tools' },
  { id: 'ai-studio',    name: 'استودیوی AI',      icon: 'Sparkles',       gradient: 'from-fuchsia-500 to-pink-600', category: 'tools' },
  { id: 'reports',      name: 'گزارش‌ها',         icon: 'BarChart3',      gradient: 'from-fuchsia-500 to-fuchsia-700', category: 'tools' },
  // System
  { id: 'activities',   name: 'فعالیت‌ها',        icon: 'Activity',       gradient: 'from-lime-500 to-lime-700', category: 'system' },
  { id: 'notifications',name: 'اعلان‌ها',         icon: 'Bell',           gradient: 'from-purple-500 to-purple-700', category: 'system' },
  { id: 'wordpress',    name: 'وردپرس',          icon: 'Globe',          gradient: 'from-blue-500 to-blue-700', category: 'system' },
  { id: 'settings',     name: 'تنظیمات',          icon: 'Settings',       gradient: 'from-teal-500 to-teal-700', category: 'system' },
  // Business
  { id: 'store',        name: 'فروشگاه',          icon: 'ShoppingBag',    gradient: 'from-rose-500 to-rose-700', category: 'business' },
  { id: 'crm',          name: 'مدیریت مشتریان',   icon: 'Handshake',      gradient: 'from-cyan-500 to-cyan-700', category: 'business' },
  // Finance
  { id: 'accounting',   name: 'حسابداری',         icon: 'Receipt',        gradient: 'from-emerald-500 to-emerald-700', category: 'finance' },
  { id: 'inventory',    name: 'انبار',            icon: 'Warehouse',      gradient: 'from-sky-500 to-sky-700', category: 'finance' },
  { id: 'finance',      name: 'مالی',             icon: 'Wallet',         gradient: 'from-violet-500 to-violet-700', category: 'finance' },
]

export const SIDEBAR_CATEGORIES: Record<string, string> = {
  main: 'عام',
  content: 'مدیریت محتوا',
  people: 'افراد',
  workspace: 'فضای کار',
  tools: 'ابزارهای هوشمند',
  system: 'سیستم',
  business: 'کسب‌وکار',
  finance: 'مالی و حسابداری',
}

// ---------------------------------------------------------------------------
// SEO Assistant Tab Definitions
// ---------------------------------------------------------------------------

export const AI_SEO_TABS: AITab[] = [
  { id: 'guide',       name: 'SEO Guide',          icon: 'BookOpen',     description: 'Comprehensive SEO guide' },
  { id: 'what-is',     name: 'What is SEO?',       icon: 'HelpCircle',   description: 'SEO fundamentals explained' },
  { id: 'tips',        name: 'SEO Tips',            icon: 'Lightbulb',    description: 'Practical optimization tips' },
  { id: 'backlinks',   name: 'Backlinks',           icon: 'Link',         description: 'Backlink strategy & analysis' },
  { id: 'schema',      name: 'Schema Markup',       icon: 'Code',         description: 'Structured data implementation' },
  { id: 'optimization',name: 'Optimization',        icon: 'TrendingUp',   description: 'Performance optimization' },
  { id: 'content-gen', name: 'Content Generation',  icon: 'FileEdit',     description: 'AI-powered content creation' },
  { id: 'keywords',    name: 'Keywords',            icon: 'Search',       description: 'Keyword research & analysis' },
  { id: 'competitor',  name: 'Competitor Analysis', icon: 'Swords',       description: 'Competitive intelligence' },
  { id: 'advanced',    name: 'Advanced SEO',        icon: 'Rocket',       description: 'Advanced techniques' },
  { id: 'page-seo',    name: 'Page SEO',            icon: 'FileCheck',    description: 'On-page SEO checker' },
]

// ---------------------------------------------------------------------------
// Helper Functions — Status Colors
// ---------------------------------------------------------------------------

type ColorVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export function getStatusColor(status: string): { bg: string; text: string; badge: ColorVariant } {
  const map: Record<string, { bg: string; text: string; badge: ColorVariant }> = {
    // Post statuses
    draft:     { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', badge: 'secondary' },
    published: { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-700 dark:text-green-300',   badge: 'default' },
    archived:  { bg: 'bg-gray-100 dark:bg-gray-800/30',    text: 'text-gray-500 dark:text-gray-400',     badge: 'outline' },
    // Common statuses
    active:    { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-700 dark:text-green-300',   badge: 'default' },
    inactive:  { bg: 'bg-gray-100 dark:bg-gray-800/30',    text: 'text-gray-500 dark:text-gray-400',     badge: 'outline' },
    pending:   { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', badge: 'secondary' },
    approved:  { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-700 dark:text-green-300',   badge: 'default' },
    rejected:  { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300',       badge: 'destructive' },
    spam:      { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300',       badge: 'destructive' },
    suspended: { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300',       badge: 'destructive' },
    'on-leave':{ bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', badge: 'secondary' },
    lead:      { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300',     badge: 'secondary' },
    churned:   { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300',       badge: 'destructive' },
    planning:  { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-300',     badge: 'secondary' },
    'on-hold': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', badge: 'secondary' },
    completed: { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-700 dark:text-green-300',   badge: 'default' },
    cancelled: { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-300',       badge: 'destructive' },
  }
  return map[status] ?? { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-500 dark:text-gray-400', badge: 'outline' }
}

// ---------------------------------------------------------------------------
// Helper Functions — Role Badges
// ---------------------------------------------------------------------------

export function getRoleBadge(role: string): { label: string; variant: ColorVariant } {
  const map: Record<string, { label: string; variant: ColorVariant }> = {
    admin:    { label: 'Admin',    variant: 'default' },
    editor:   { label: 'Editor',   variant: 'secondary' },
    author:   { label: 'Author',   variant: 'secondary' },
    viewer:   { label: 'Viewer',   variant: 'outline' },
    manager:  { label: 'Manager',  variant: 'default' },
    member:   { label: 'Member',   variant: 'secondary' },
    intern:   { label: 'Intern',   variant: 'outline' },
  }
  return map[role] ?? { label: role, variant: 'outline' }
}

// ---------------------------------------------------------------------------
// Helper Functions — Priority Colors
// ---------------------------------------------------------------------------

export function getPriorityColor(priority: string): { bg: string; text: string; dot: string } {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    low:      { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
    medium:   { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
    high:     { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
    critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  }
  return map[priority] ?? { bg: 'bg-gray-100 dark:bg-gray-800/30', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' }
}

// ---------------------------------------------------------------------------
// Helper Functions — File Size Formatter
// ---------------------------------------------------------------------------

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

// ---------------------------------------------------------------------------
// Helper Functions — Date Formatter
// ---------------------------------------------------------------------------

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 30) return formatDate(dateStr)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

// ---------------------------------------------------------------------------
// Helper Functions — Notification Type Colors
// ---------------------------------------------------------------------------

export function getNotificationColor(type: string): { bg: string; icon: string } {
  const map: Record<string, { bg: string; icon: string }> = {
    info:    { bg: 'bg-blue-100 dark:bg-blue-900/30',    icon: 'ℹ️' },
    success: { bg: 'bg-green-100 dark:bg-green-900/30',  icon: '✅' },
    warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30',icon: '⚠️' },
    error:   { bg: 'bg-red-100 dark:bg-red-900/30',      icon: '❌' },
  }
  return map[type] ?? map.info
}

// ---------------------------------------------------------------------------
// Helper Functions — Tab Gradient Utilities
// ---------------------------------------------------------------------------

export function getTabGradient(tabId: string): string {
  const tab = CMS_TABS.find(t => t.id === tabId)
  return tab?.gradient ?? 'from-slate-500 to-slate-700'
}

export function getTabAccentClass(tabId: string): string {
  const accentMap: Record<string, string> = {
    dashboard:     'text-slate-600 dark:text-slate-300',
    content:       'text-cyan-600 dark:text-cyan-300',
    media:         'text-rose-600 dark:text-rose-300',
    users:         'text-emerald-600 dark:text-emerald-300',
    team:          'text-indigo-600 dark:text-indigo-300',
    customers:     'text-amber-600 dark:text-amber-300',
    projects:      'text-sky-600 dark:text-sky-300',
    'ai-assistant':'text-violet-600 dark:text-violet-300',
    'ai-studio':   'text-fuchsia-600 dark:text-fuchsia-300',
    reports:       'text-fuchsia-600 dark:text-fuchsia-300',
    activities:    'text-lime-600 dark:text-lime-300',
    comments:      'text-orange-600 dark:text-orange-300',
    notifications: 'text-purple-600 dark:text-purple-300',
    wordpress:     'text-blue-600 dark:text-blue-300',
    settings:      'text-teal-600 dark:text-teal-300',
    tasks:         'text-green-600 dark:text-green-300',
    calendar:      'text-indigo-600 dark:text-indigo-300',
    store:         'text-rose-600 dark:text-rose-300',
    crm:           'text-cyan-600 dark:text-cyan-300',
    accounting:    'text-emerald-600 dark:text-emerald-300',
    inventory:     'text-sky-600 dark:text-sky-300',
    finance:       'text-violet-600 dark:text-violet-300',
  }
  return accentMap[tabId] ?? 'text-slate-600 dark:text-slate-300'
}
