'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Post, User, Customer, Project, TeamMember, Comment,
  MediaItem, Category, Tag, ActivityLog, Setting,
  WPSyncConfig, Stats, ChartData, Notification,
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
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body || res.statusText}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// useCMSData — central data-hook that every page can consume via context
// ---------------------------------------------------------------------------

export function useCMSData() {
  const qc = useQueryClient()

  // ────────────────────────────── Queries ──────────────────────────────

  const posts          = useQuery({ queryKey: ['posts'],          queryFn: () => fetchJSON<Post[]>(api.posts) })
  const users          = useQuery({ queryKey: ['users'],          queryFn: () => fetchJSON<User[]>(api.users) })
  const customers      = useQuery({ queryKey: ['customers'],      queryFn: () => fetchJSON<Customer[]>(api.customers) })
  const projects       = useQuery({ queryKey: ['projects'],       queryFn: () => fetchJSON<Project[]>(api.projects) })
  const team           = useQuery({ queryKey: ['team'],           queryFn: () => fetchJSON<TeamMember[]>(api.team) })
  const media          = useQuery({ queryKey: ['media'],          queryFn: () => fetchJSON<MediaItem[]>(api.media) })
  const comments       = useQuery({ queryKey: ['comments'],       queryFn: () => fetchJSON<Comment[]>(api.comments) })
  const categories     = useQuery({ queryKey: ['categories'],     queryFn: () => fetchJSON<Category[]>(api.categories) })
  const tags           = useQuery({ queryKey: ['tags'],           queryFn: () => fetchJSON<Tag[]>(api.tags) })
  const activities     = useQuery({ queryKey: ['activities'],     queryFn: () => fetchJSON<ActivityLog[]>(api.activities) })
  const settings       = useQuery({ queryKey: ['settings'],       queryFn: () => fetchJSON<Setting[]>(api.settings) })
  const stats          = useQuery({ queryKey: ['stats'],          queryFn: () => fetchJSON<Stats>(api.stats) })
  const charts         = useQuery({ queryKey: ['charts'],         queryFn: () => fetchJSON<ChartData>(api.charts) })
  const notifications  = useQuery({ queryKey: ['notifications'],  queryFn: () => fetchJSON<Notification[]>(api.notifications) })
  const wpConfig       = useQuery({ queryKey: ['wp-config'],      queryFn: () => fetchJSON<WPSyncConfig[]>(api.wordpress + '/config') })

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
    notifications, wpConfig,

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
    // WordPress
    saveWPConfig, syncWP,
    // Utility
    invalidateAll,
  }
}

// Re-export the hook type so context.tsx can reference it
export type CMSDataHook = ReturnType<typeof useCMSData>
