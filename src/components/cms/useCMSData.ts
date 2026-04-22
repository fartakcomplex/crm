'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Post, User, Customer, Project, TeamMember, Comment,
  MediaItem, Category, Tag, ActivityLog, Setting,
  WPSyncConfig, Stats, ChartData, Notification,
  Task, QuickNote, CalendarEvent,
  Product, ProductCategory, Order, OrderItem, Coupon,
  InventoryItem, InboundRecord, OutboundRecord,
  Invoice, InvoiceItem, Transaction, BankAccount,
  CrmActivity, BudgetItem,
} from './types'

// ---------------------------------------------------------------------------
// API Base — all requests use relative paths (Caddy gateway handles routing)
// ---------------------------------------------------------------------------

const api = {
  posts:          '/api/posts',
  users:          '/api/users',
  customers:      '/api/customers',
  projects:       '/api/projects',
  team:           '/api/team',
  media:          '/api/media',
  comments:       '/api/comments',
  categories:     '/api/categories',
  tags:           '/api/tags',
  activities:     '/api/activities',
  settings:       '/api/settings',
  stats:          '/api/stats',
  charts:         '/api/charts',
  notifications:  '/api/notifications',
  wordpress:      '/api/wordpress',
  tasks:          '/api/tasks',
  notes:          '/api/notes',
  events:         '/api/events',
  products:          '/api/products',
  'product-categories': '/api/product-categories',
  orders:            '/api/orders',
  invoices:          '/api/invoices',
  inventory:         '/api/inventory',
  transactions:      '/api/transactions',
  'bank-accounts':   '/api/bank-accounts',
  'crm-activities':  '/api/crm-activities',
  coupons:           '/api/coupons',
  budgets:           '/api/budgets',
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

// Known API response wrappers: { entityName: [...], total, page, limit }
const WRAPPED_KEYS = ['posts', 'users', 'customers', 'projects', 'members', 'media', 'comments', 'categories', 'tags', 'activities', 'settings', 'notifications', 'tasks', 'notes', 'events', 'products', 'orders', 'invoices', 'inventory', 'transactions', 'bank-accounts', 'crm-activities', 'coupons', 'budgets', 'product-categories']

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body || res.statusText}`)
  }
  const data = await res.json()
  // Auto-unwrap: if response is { entityName: [...] }, return the array
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const key of WRAPPED_KEYS) {
      if (Array.isArray(data[key])) {
        return data[key] as T
      }
    }
  }
  return data as T
}

// ---------------------------------------------------------------------------
// Query config registry — maps queryKey to its queryFn.
// Used by useEnsureData for reliable imperative fetching.
// ---------------------------------------------------------------------------

export const QUERY_CONFIGS: Record<string, { queryKey: string[]; queryFn: () => Promise<unknown> }> = {
  posts:          { queryKey: ['posts'],          queryFn: () => fetchJSON<Post[]>(api.posts) },
  users:          { queryKey: ['users'],          queryFn: () => fetchJSON<User[]>(api.users) },
  customers:      { queryKey: ['customers'],      queryFn: () => fetchJSON<Customer[]>(api.customers) },
  projects:       { queryKey: ['projects'],       queryFn: () => fetchJSON<Project[]>(api.projects) },
  team:           { queryKey: ['team'],           queryFn: () => fetchJSON<TeamMember[]>(api.team) },
  media:          { queryKey: ['media'],          queryFn: () => fetchJSON<MediaItem[]>(api.media) },
  comments:       { queryKey: ['comments'],       queryFn: () => fetchJSON<Comment[]>(api.comments) },
  categories:     { queryKey: ['categories'],     queryFn: () => fetchJSON<Category[]>(api.categories) },
  tags:           { queryKey: ['tags'],           queryFn: () => fetchJSON<Tag[]>(api.tags) },
  activities:     { queryKey: ['activities'],     queryFn: () => fetchJSON<ActivityLog[]>(api.activities) },
  settings:       { queryKey: ['settings'],       queryFn: () => fetchJSON<Setting[]>(api.settings) },
  stats:          { queryKey: ['stats'],          queryFn: () => fetchJSON<Record<string, unknown>>(api.stats).then(d => d as unknown as Stats) },
  charts:         { queryKey: ['charts'],         queryFn: () => fetchJSON<ChartData>(api.charts) },
  notifications:  { queryKey: ['notifications'],  queryFn: () => fetchJSON<Notification[]>(api.notifications) },
  'wp-config':    { queryKey: ['wp-config'],      queryFn: () => fetchJSON<WPSyncConfig[]>(api.wordpress + '/config') },
  tasks:          { queryKey: ['tasks'],          queryFn: () => fetchJSON<Task[]>(api.tasks) },
  notes:          { queryKey: ['notes'],          queryFn: () => fetchJSON<QuickNote[]>(api.notes) },
  events:         { queryKey: ['events'],         queryFn: () => fetchJSON<CalendarEvent[]>(api.events) },
  products:          { queryKey: ['products'],          queryFn: () => fetchJSON<Product[]>(api.products) },
  'product-categories': { queryKey: ['product-categories'], queryFn: () => fetchJSON<ProductCategory[]>(api['product-categories']) },
  orders:            { queryKey: ['orders'],            queryFn: () => fetchJSON<Order[]>(api.orders) },
  invoices:          { queryKey: ['invoices'],          queryFn: () => fetchJSON<Invoice[]>(api.invoices) },
  inventory:         { queryKey: ['inventory'],         queryFn: () => fetchJSON<InventoryItem[]>(api.inventory) },
  transactions:      { queryKey: ['transactions'],      queryFn: () => fetchJSON<Transaction[]>(api.transactions) },
  'bank-accounts':   { queryKey: ['bank-accounts'],    queryFn: () => fetchJSON<BankAccount[]>(api['bank-accounts']) },
  'crm-activities':  { queryKey: ['crm-activities'],    queryFn: () => fetchJSON<CrmActivity[]>(api['crm-activities']) },
  coupons:           { queryKey: ['coupons'],           queryFn: () => fetchJSON<Coupon[]>(api.coupons) },
  budgets:           { queryKey: ['budgets'],           queryFn: () => fetchJSON<BudgetItem[]>(api.budgets) },
}

// ---------------------------------------------------------------------------
// useCMSData — all queries are DISABLED by default (enabled: false).
// Each page calls useEnsureData() which uses fetchQuery() with explicit
// queryFn from QUERY_CONFIGS. This prevents 15 simultaneous API calls
// on mount that caused OOM crashes, while ensuring reliable data fetching.
// ---------------------------------------------------------------------------

export function useCMSData() {
  const qc = useQueryClient()

  // ────────────────────────────── Queries (lazy) ────────────────────────

  const posts          = useQuery({ queryKey: ['posts'],          queryFn: () => fetchJSON<Post[]>(api.posts),          enabled: false })
  const users          = useQuery({ queryKey: ['users'],          queryFn: () => fetchJSON<User[]>(api.users),          enabled: false })
  const customers      = useQuery({ queryKey: ['customers'],      queryFn: () => fetchJSON<Customer[]>(api.customers),  enabled: false })
  const projects       = useQuery({ queryKey: ['projects'],       queryFn: () => fetchJSON<Project[]>(api.projects),   enabled: false })
  const team           = useQuery({ queryKey: ['team'],           queryFn: () => fetchJSON<TeamMember[]>(api.team),    enabled: false })
  const media          = useQuery({ queryKey: ['media'],          queryFn: () => fetchJSON<MediaItem[]>(api.media),     enabled: false })
  const comments       = useQuery({ queryKey: ['comments'],       queryFn: () => fetchJSON<Comment[]>(api.comments),   enabled: false })
  const categories     = useQuery({ queryKey: ['categories'],     queryFn: () => fetchJSON<Category[]>(api.categories), enabled: false })
  const tags           = useQuery({ queryKey: ['tags'],           queryFn: () => fetchJSON<Tag[]>(api.tags),           enabled: false })
  const activities     = useQuery({ queryKey: ['activities'],     queryFn: () => fetchJSON<ActivityLog[]>(api.activities), enabled: false })
  const settings       = useQuery({ queryKey: ['settings'],       queryFn: () => fetchJSON<Setting[]>(api.settings),   enabled: false })
  const stats          = useQuery({ queryKey: ['stats'],          queryFn: () => fetchJSON<Stats>(api.stats),          enabled: false })
  const charts         = useQuery({ queryKey: ['charts'],         queryFn: () => fetchJSON<ChartData>(api.charts),     enabled: false })
  const notifications  = useQuery({ queryKey: ['notifications'],  queryFn: () => fetchJSON<Notification[]>(api.notifications), enabled: false })
  const wpConfig       = useQuery({ queryKey: ['wp-config'],      queryFn: () => fetchJSON<WPSyncConfig[]>(api.wordpress + '/config'), enabled: false })
  const tasks          = useQuery({ queryKey: ['tasks'],          queryFn: () => fetchJSON<Task[]>(api.tasks),          enabled: false })
  const notes          = useQuery({ queryKey: ['notes'],          queryFn: () => fetchJSON<QuickNote[]>(api.notes),          enabled: false })
  const events         = useQuery({ queryKey: ['events'],         queryFn: () => fetchJSON<CalendarEvent[]>(api.events),         enabled: false })
  const products          = useQuery({ queryKey: ['products'],          queryFn: () => fetchJSON<Product[]>(api.products),          enabled: false })
  const productCategories = useQuery({ queryKey: ['product-categories'], queryFn: () => fetchJSON<ProductCategory[]>(api['product-categories']), enabled: false })
  const orders            = useQuery({ queryKey: ['orders'],            queryFn: () => fetchJSON<Order[]>(api.orders),            enabled: false })
  const invoices          = useQuery({ queryKey: ['invoices'],          queryFn: () => fetchJSON<Invoice[]>(api.invoices),          enabled: false })
  const inventory         = useQuery({ queryKey: ['inventory'],         queryFn: () => fetchJSON<InventoryItem[]>(api.inventory),         enabled: false })
  const transactions      = useQuery({ queryKey: ['transactions'],      queryFn: () => fetchJSON<Transaction[]>(api.transactions),      enabled: false })
  const bankAccounts      = useQuery({ queryKey: ['bank-accounts'],    queryFn: () => fetchJSON<BankAccount[]>(api['bank-accounts']),    enabled: false })
  const crmActivities     = useQuery({ queryKey: ['crm-activities'],    queryFn: () => fetchJSON<CrmActivity[]>(api['crm-activities']),    enabled: false })
  const coupons           = useQuery({ queryKey: ['coupons'],           queryFn: () => fetchJSON<Coupon[]>(api.coupons),           enabled: false })
  const budgets           = useQuery({ queryKey: ['budgets'],           queryFn: () => fetchJSON<BudgetItem[]>(api.budgets),           enabled: false })

  // ──────────────────────────── Post Mutations ─────────────────────────

  const createPost = useMutation({
    mutationFn: (data: Partial<Post>) => fetchJSON<Post>(api.posts, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })

  const updatePost = useMutation({
    mutationFn: ({ id, ...data }: Partial<Post> & { id: string }) =>
      fetchJSON<Post>(`${api.posts}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })

  const deletePost = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.posts}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['posts'] }),
  })

  // ──────────────────────────── User Mutations ─────────────────────────

  const createUser = useMutation({
    mutationFn: (data: Partial<User>) => fetchJSON<User>(api.users, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const updateUser = useMutation({
    mutationFn: ({ id, ...data }: Partial<User> & { id: string }) =>
      fetchJSON<User>(`${api.users}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.users}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  // ──────────────────────────── Customer Mutations ─────────────────────

  const createCustomer = useMutation({
    mutationFn: (data: Partial<Customer>) => fetchJSON<Customer>(api.customers, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  const updateCustomer = useMutation({
    mutationFn: ({ id, ...data }: Partial<Customer> & { id: string }) =>
      fetchJSON<Customer>(`${api.customers}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.customers}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })

  // ──────────────────────────── Project Mutations ──────────────────────

  const createProject = useMutation({
    mutationFn: (data: Partial<Project>) => fetchJSON<Project>(api.projects, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const updateProject = useMutation({
    mutationFn: ({ id, ...data }: Partial<Project> & { id: string }) =>
      fetchJSON<Project>(`${api.projects}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const deleteProject = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.projects}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  // ──────────────────────────── Team Mutations ─────────────────────────

  const createTeamMember = useMutation({
    mutationFn: (data: Partial<TeamMember>) => fetchJSON<TeamMember>(api.team, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  const updateTeamMember = useMutation({
    mutationFn: ({ id, ...data }: Partial<TeamMember> & { id: string }) =>
      fetchJSON<TeamMember>(`${api.team}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  const deleteTeamMember = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.team}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  })

  // ──────────────────────────── Comment Mutations ──────────────────────

  const createComment = useMutation({
    mutationFn: (data: Partial<Comment>) => fetchJSON<Comment>(api.comments, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments'] }); qc.invalidateQueries({ queryKey: ['posts'] }) },
  })

  const updateComment = useMutation({
    mutationFn: ({ id, ...data }: Partial<Comment> & { id: string }) =>
      fetchJSON<Comment>(`${api.comments}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  })

  const deleteComment = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.comments}/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments'] }); qc.invalidateQueries({ queryKey: ['posts'] }) },
  })

  // ──────────────────────────── Media Mutations ────────────────────────

  const uploadMedia = useMutation({
    mutationFn: (formData: FormData) =>
      fetch(api.media, { method: 'POST', body: formData }).then(r => { if (!r.ok) throw new Error('Upload failed'); return r.json() as Promise<MediaItem> }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  })

  const deleteMedia = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.media}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  })

  // ──────────────────────────── Category Mutations ─────────────────────

  const createCategory = useMutation({
    mutationFn: (data: Partial<Category>) => fetchJSON<Category>(api.categories, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })

  const updateCategory = useMutation({
    mutationFn: ({ id, ...data }: Partial<Category> & { id: string }) =>
      fetchJSON<Category>(`${api.categories}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })

  const deleteCategory = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.categories}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })

  // ──────────────────────────── Tag Mutations ──────────────────────────

  const createTag = useMutation({
    mutationFn: (data: Partial<Tag>) => fetchJSON<Tag>(api.tags, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })

  const updateTag = useMutation({
    mutationFn: ({ id, ...data }: Partial<Tag> & { id: string }) =>
      fetchJSON<Tag>(`${api.tags}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })

  const deleteTag = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.tags}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tags'] }),
  })

  // ──────────────────────────── Settings Mutations ─────────────────────

  const updateSetting = useMutation({
    mutationFn: (data: { key: string; value: string; group?: string }) =>
      fetchJSON<Setting>(api.settings, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  const bulkUpdateSettings = useMutation({
    mutationFn: (items: { key: string; value: string; group?: string }[]) =>
      fetchJSON<Setting[]>(api.settings, { method: 'PUT', body: JSON.stringify({ settings: items }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })

  // ──────────────────────────── Notification Mutations ─────────────────

  const markNotificationRead = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.notifications}/${id}`, { method: 'PUT', body: JSON.stringify({ read: true }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllNotificationsRead = useMutation({
    mutationFn: () => fetchJSON<void>(api.notifications, { method: 'PUT', body: JSON.stringify({ readAll: true }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  // ──────────────────────────── WordPress Mutations ────────────────────

  // ──────────────────────────── Task Mutations ──────────────────────

  const createTask = useMutation({
    mutationFn: (data: Partial<Task>) => fetchJSON<Task>(api.tasks, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }: Partial<Task> & { id: string }) =>
      fetchJSON<Task>(`${api.tasks}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.tasks}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // ──────────────────────────── QuickNote Mutations ───────────────────

  const createNote = useMutation({
    mutationFn: (data: Partial<QuickNote>) => fetchJSON<QuickNote>(api.notes, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })

  const updateNote = useMutation({
    mutationFn: ({ id, ...data }: Partial<QuickNote> & { id: string }) =>
      fetchJSON<QuickNote>(`${api.notes}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })

  const deleteNote = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.notes}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  })

  // ──────────────────────────── Event Mutations ────────────────────────

  const createEvent = useMutation({
    mutationFn: (data: Partial<CalendarEvent>) => fetchJSON<CalendarEvent>(api.events, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })

  const updateEvent = useMutation({
    mutationFn: ({ id, ...data }: Partial<CalendarEvent> & { id: string }) =>
      fetchJSON<CalendarEvent>(`${api.events}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })

  const deleteEvent = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.events}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  })

  // ──────────────────────────── Product Mutations ──────────────────────

  const createProduct = useMutation({
    mutationFn: (data: Partial<Product>) => fetchJSON<Product>(api.products, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const updateProduct = useMutation({
    mutationFn: ({ id, ...data }: Partial<Product> & { id: string }) =>
      fetchJSON<Product>(`${api.products}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  const deleteProduct = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.products}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })

  // ──────────────────────────── Order Mutations ────────────────────────

  const createOrder = useMutation({
    mutationFn: (data: Partial<Order>) => fetchJSON<Order>(api.orders, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })

  const updateOrder = useMutation({
    mutationFn: ({ id, ...data }: Partial<Order> & { id: string }) =>
      fetchJSON<Order>(`${api.orders}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })

  const deleteOrder = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.orders}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  })

  // ──────────────────────────── Invoice Mutations ──────────────────────

  const createInvoice = useMutation({
    mutationFn: (data: Partial<Invoice>) => fetchJSON<Invoice>(api.invoices, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const updateInvoice = useMutation({
    mutationFn: ({ id, ...data }: Partial<Invoice> & { id: string }) =>
      fetchJSON<Invoice>(`${api.invoices}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const deleteInvoice = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.invoices}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  })

  // ──────────────────────────── Inventory Mutations ────────────────────

  const createInventoryItem = useMutation({
    mutationFn: (data: Partial<InventoryItem>) => fetchJSON<InventoryItem>(api.inventory, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })

  const updateInventoryItem = useMutation({
    mutationFn: ({ id, ...data }: Partial<InventoryItem> & { id: string }) =>
      fetchJSON<InventoryItem>(`${api.inventory}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })

  const deleteInventoryItem = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.inventory}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  })

  // ──────────────────────────── Transaction Mutations ──────────────────

  const createTransaction = useMutation({
    mutationFn: (data: Partial<Transaction>) => fetchJSON<Transaction>(api.transactions, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.transactions}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  })

  // ──────────────────────────── CrmActivity Mutations ──────────────────

  const createCrmActivity = useMutation({
    mutationFn: (data: Partial<CrmActivity>) => fetchJSON<CrmActivity>(api['crm-activities'], { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-activities'] }),
  })

  const updateCrmActivity = useMutation({
    mutationFn: ({ id, ...data }: Partial<CrmActivity> & { id: string }) =>
      fetchJSON<CrmActivity>(`${api['crm-activities']}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-activities'] }),
  })

  const deleteCrmActivity = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api['crm-activities']}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm-activities'] }),
  })

  // ──────────────────────────── Coupon Mutations ───────────────────────

  const createCoupon = useMutation({
    mutationFn: (data: Partial<Coupon>) => fetchJSON<Coupon>(api.coupons, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })

  const updateCoupon = useMutation({
    mutationFn: ({ id, ...data }: Partial<Coupon> & { id: string }) =>
      fetchJSON<Coupon>(`${api.coupons}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })

  const deleteCoupon = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.coupons}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })

  // ──────────────────────────── Budget Mutations ────────────────────────

  const createBudgetItem = useMutation({
    mutationFn: (data: Partial<BudgetItem>) => fetchJSON<BudgetItem>(api.budgets, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })

  const updateBudgetItem = useMutation({
    mutationFn: ({ id, ...data }: Partial<BudgetItem> & { id: string }) =>
      fetchJSON<BudgetItem>(`${api.budgets}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })

  const deleteBudgetItem = useMutation({
    mutationFn: (id: string) => fetchJSON<void>(`${api.budgets}/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  })

  // ──────────────────────────── WordPress Mutations ────────────────────

  const saveWPConfig = useMutation({
    mutationFn: (data: Partial<WPSyncConfig>) =>
      fetchJSON<WPSyncConfig>(api.wordpress + '/config', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wp-config'] }),
  })

  const syncWP = useMutation({
    mutationFn: (configId: string) => fetchJSON<{ synced: number }>(api.wordpress + '/sync', { method: 'POST', body: JSON.stringify({ configId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wp-config'] }); qc.invalidateQueries({ queryKey: ['posts'] }) },
  })

  // ──────────────────────────── Invalidate All ─────────────────────────

  const invalidateAll = () => qc.invalidateQueries()

  // ──────────────────────────── Return Bundle ──────────────────────────

  return {
    // Queries
    posts, users, customers, projects, team, media, comments,
    categories, tags, activities, settings, stats, charts,
    notifications, wpConfig, tasks, notes, events,
    products, productCategories, orders, invoices,
    inventory, transactions, bankAccounts, crmActivities,
    coupons, budgets,

    // Posts
    createPost, updatePost, deletePost,
    // Users
    createUser, updateUser, deleteUser,
    // Customers
    createCustomer, updateCustomer, deleteCustomer,
    // Projects
    createProject, updateProject, deleteProject,
    // Team
    createTeamMember, updateTeamMember, deleteTeamMember,
    // Comments
    createComment, updateComment, deleteComment,
    // Media
    uploadMedia, deleteMedia,
    // Categories
    createCategory, updateCategory, deleteCategory,
    // Tags
    createTag, updateTag, deleteTag,
    // Settings
    updateSetting, bulkUpdateSettings,
    // Notifications
    markNotificationRead, markAllNotificationsRead,
    // Tasks
    createTask, updateTask, deleteTask,
    // Notes
    createNote, updateNote, deleteNote,
    // Events
    events, createEvent, updateEvent, deleteEvent,
    // Products
    createProduct, updateProduct, deleteProduct,
    // Orders
    createOrder, updateOrder, deleteOrder,
    // Invoices
    createInvoice, updateInvoice, deleteInvoice,
    // Inventory
    createInventoryItem, updateInventoryItem, deleteInventoryItem,
    // Transactions
    createTransaction, deleteTransaction,
    // CRM Activities
    createCrmActivity, updateCrmActivity, deleteCrmActivity,
    // Coupons
    createCoupon, updateCoupon, deleteCoupon,
    // Budgets
    createBudgetItem, updateBudgetItem, deleteBudgetItem,
    // WordPress
    saveWPConfig, syncWP,
    // Utility
    invalidateAll,
  }
}

// Re-export the hook type so context.tsx can reference it
export type CMSDataHook = ReturnType<typeof useCMSData>
