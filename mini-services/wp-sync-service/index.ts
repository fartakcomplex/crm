import { serve } from 'bun'

const PORT = 3005
const SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes default
const WS_PORT = 3006

// ─── SQLite Database Path ──────────────────────────────────────────────────────

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || '/home/z/my-project/db/dev.db'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface WPSyncConfig {
  id: string
  siteUrl: string
  apiKey: string
  username: string
  syncFreq: string
  lastSync: string | null
  active: number // SQLite boolean
}

interface WPSyncedPost {
  id: string
  wpPostId: number
  localPostId: string
  syncStatus: string
  wpConfigId: string
}

// ─── State ─────────────────────────────────────────────────────────────────────

interface SyncLog {
  time: string
  configId: string
  siteUrl: string
  status: 'success' | 'error'
  postsFetched: number
  created: number
  updated: number
  errors: number
  message: string
}

let syncLogs: SyncLog[] = []
let lastSyncTime: string | null = null
let isSyncing = false
let wsClients: Set<{ send: (data: string) => void }> = new Set()

// ─── Database Helper ───────────────────────────────────────────────────────────

// Using Bun's built-in SQLite for simpler access
import { Database } from 'bun:sqlite'

let db: Database

function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: false, create: true })
  }
  return db
}

function query<T>(sql: string, params: unknown[] = []): T[] {
  const database = getDb()
  const stmt = database.prepare(sql)
  if (params.length > 0) {
    return stmt.all(...params) as T[]
  }
  return stmt.all() as T[]
}

function run(sql: string, params: unknown[] = []): void {
  const database = getDb()
  const stmt = database.prepare(sql)
  if (params.length > 0) {
    stmt.run(...params)
  } else {
    stmt.run()
  }
}

// ─── WordPress API Fetcher ─────────────────────────────────────────────────────

interface WPPost {
  id: number
  title: { rendered: string; raw: string }
  content: { rendered: string; raw: string }
  excerpt: { rendered: string; raw: string }
  slug: string
  status: string
  date: string
  modified: string
  type: string
  author: { id: number; login: string; name: string; email: string }
  categories: Array<{ id: number; name: string; slug: string }>
  tags: Array<{ id: number; name: string; slug: string }>
  featured_media: unknown
}

async function fetchWPPosts(config: WPSyncConfig, modifiedAfter?: string): Promise<{ posts: WPPost[]; total: number }> {
  const siteUrl = config.siteUrl.replace(/\/+$/, '')
  const apiEndpoint = `${siteUrl}/wp-json/smart-cms/v1/posts`
  const allPosts: WPPost[] = []
  let currentPage = 1
  let totalPages = 1
  let totalPosts = 0

  while (currentPage <= totalPages) {
    const params = new URLSearchParams({
      api_key: config.apiKey,
      page: String(currentPage),
      per_page: '50',
      status: 'any',
      orderby: 'modified',
      order: 'desc',
    })

    if (modifiedAfter) {
      params.set('modified_after', modifiedAfter)
    }

    try {
      const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Smart-CMS-Sync-Service/2.0',
        },
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        console.error(`[Sync] WP API error for ${siteUrl}: HTTP ${response.status}`)
        break
      }

      const data = await response.json() as { posts: WPPost[]; total: number; pages: number }
      allPosts.push(...(data.posts || []))
      totalPosts = data.total || 0
      totalPages = data.pages || 1
      currentPage++
    } catch (err) {
      console.error(`[Sync] Failed to fetch page ${currentPage}:`, err)
      break
    }
  }

  return { posts: allPosts, total: totalPosts }
}

// ─── Sync Logic ────────────────────────────────────────────────────────────────

async function syncConfig(config: WPSyncConfig): Promise<SyncLog> {
  const startTime = Date.now()
  const log: SyncLog = {
    time: new Date().toISOString(),
    configId: config.id,
    siteUrl: config.siteUrl,
    status: 'success',
    postsFetched: 0,
    created: 0,
    updated: 0,
    errors: 0,
    message: '',
  }

  try {
    // Determine modified_after
    const modifiedAfter = config.lastSync || undefined

    // Fetch from WordPress
    const { posts, total } = await fetchWPPosts(config, modifiedAfter)
    log.postsFetched = posts.length

    // Get default author
    const users = query<Array<{ id: string }>>('SELECT id FROM User LIMIT 1')
    if (users.length === 0) {
      throw new Error('No user found in database')
    }
    const authorId = users[0].id

    // Process each post
    for (const wpPost of posts) {
      try {
        const result = processWPPost(wpPost, config.id, authorId)
        if (result === 'created') log.created++
        else if (result === 'updated') log.updated++
      } catch (err) {
        log.errors++
        console.error(`[Sync] Error processing post ${wpPost.id}:`, err)
      }
    }

    // Update lastSync
    run('UPDATE WPSyncConfig SET lastSync = ? WHERE id = ?', [new Date().toISOString(), config.id])

    const elapsed = Date.now() - startTime
    log.message = `همگام‌سازی کامل: ${posts.length} پست واکشی شد (${log.created} جدید، ${log.updated} بروزرسانی) در ${elapsed}ms`
    console.log(`[Sync] ✅ ${log.siteUrl}: ${log.message}`)

  } catch (err) {
    log.status = 'error'
    log.message = err instanceof Error ? err.message : String(err)
    console.error(`[Sync] ❌ ${log.siteUrl}: ${log.message}`)
  }

  return log
}

function processWPPost(wpPost: WPPost, configId: string, authorId: string): 'created' | 'updated' | 'skipped' {
  const wpPostId = wpPost.id
  const title = wpPost.title?.raw || wpPost.title?.rendered || 'بدون عنوان'
  const content = wpPost.content?.raw || wpPost.content?.rendered || ''
  const excerpt = wpPost.excerpt?.raw || wpPost.excerpt?.rendered || ''
  const wpStatus = wpPost.status || 'draft'
  const slug = wpPost.slug || title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)/g, '')
  const uniqueSlug = `${slug}-wp-${wpPostId}`
  const localStatus = wpStatus === 'publish' ? 'published' : 'draft'

  // Check if already synced
  const existing = query<WPSyncedPost>('SELECT * FROM WPSyncedPost WHERE wpPostId = ?', [wpPostId])

  if (existing.length > 0) {
    // Update
    run(
      'UPDATE Post SET title = ?, content = ?, excerpt = ?, status = ?, updatedAt = ? WHERE id = ?',
      [title, content, excerpt, localStatus, new Date().toISOString(), existing[0].localPostId]
    )
    run('UPDATE WPSyncedPost SET syncStatus = ?, syncedAt = ? WHERE id = ?', [localStatus, new Date().toISOString(), existing[0].id])
    return 'updated'
  }

  // Create new
  const newId = `sync-${Date.now()}-${wpPostId}`
  run(
    'INSERT INTO Post (id, title, slug, content, excerpt, status, featured, authorId, publishedAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)',
    [
      newId,
      title,
      uniqueSlug,
      content,
      excerpt,
      localStatus,
      authorId,
      wpStatus === 'publish' ? (wpPost.date || new Date().toISOString()) : null,
      new Date().toISOString(),
      new Date().toISOString(),
    ]
  )

  // Create sync record
  const syncId = `wpsync-${Date.now()}-${wpPostId}`
  run(
    'INSERT INTO WPSyncedPost (id, wpPostId, localPostId, syncStatus, wpConfigId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [syncId, wpPostId, newId, localStatus, configId, new Date().toISOString(), new Date().toISOString()]
  )

  // Sync categories
  if (wpPost.categories && wpPost.categories.length > 0) {
    const cat = wpPost.categories[0]
    const existingCat = query<Array<{ id: string }>>('SELECT id FROM Category WHERE name = ?', [cat.name])
    if (existingCat.length > 0) {
      run('UPDATE Post SET categoryId = ? WHERE id = ?', [existingCat[0].id, newId])
    } else {
      const catId = `cat-${Date.now()}-${cat.id}`
      run(
        'INSERT INTO Category (id, name, slug, color, postCount, createdAt, updatedAt) VALUES (?, ?, ?, "#06b6d4", 1, ?, ?)',
        [catId, cat.name, cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'), new Date().toISOString(), new Date().toISOString()]
      )
      run('UPDATE Post SET categoryId = ? WHERE id = ?', [catId, newId])
    }
  }

  return 'created'
}

// ─── Auto Sync Scheduler ───────────────────────────────────────────────────────

async function runAutoSync(): Promise<void> {
  if (isSyncing) {
    console.log('[Sync] ⏳ Sync already in progress, skipping...')
    return
  }

  isSyncing = true

  try {
    const configs = query<WPSyncConfig>('SELECT * FROM WPSyncConfig WHERE active = 1')

    if (configs.length === 0) {
      console.log('[Sync] No active WordPress configs found')
      isSyncing = false
      return
    }

    console.log(`[Sync] 🔄 Starting auto-sync for ${configs.length} config(s)...`)

    for (const config of configs) {
      // Check sync frequency
      if (config.syncFreq === 'manual') continue

      let shouldSync = false
      const now = Date.now()

      if (!config.lastSync) {
        shouldSync = true
      } else {
        const lastSyncDate = new Date(config.lastSync).getTime()
        const elapsed = now - lastSyncDate

        switch (config.syncFreq) {
          case 'every_5min':
            shouldSync = elapsed >= 5 * 60 * 1000
            break
          case 'every_15min':
            shouldSync = elapsed >= 15 * 60 * 1000
            break
          case 'hourly':
            shouldSync = elapsed >= 60 * 60 * 1000
            break
          case 'daily':
            shouldSync = elapsed >= 24 * 60 * 60 * 1000
            break
          case 'weekly':
            shouldSync = elapsed >= 7 * 24 * 60 * 60 * 1000
            break
          default:
            shouldSync = elapsed >= SYNC_INTERVAL_MS
        }
      }

      if (shouldSync) {
        console.log(`[Sync] 📡 Syncing: ${config.siteUrl}`)
        const log = await syncConfig(config)

        // Store log
        syncLogs.unshift(log)
        if (syncLogs.length > 100) syncLogs = syncLogs.slice(0, 100)

        lastSyncTime = new Date().toISOString()

        // Notify WebSocket clients
        broadcastToClients({
          type: 'sync_completed',
          data: log,
        })
      }
    }
  } catch (err) {
    console.error('[Sync] Auto-sync error:', err)
  } finally {
    isSyncing = false
  }
}

// ─── WebSocket Notification ────────────────────────────────────────────────────

function broadcastToClients(message: unknown): void {
  const data = JSON.stringify(message)
  for (const client of wsClients) {
    try {
      client.send(data)
    } catch {
      wsClients.delete(client)
    }
  }
}

// ─── HTTP Server ───────────────────────────────────────────────────────────────

const server = serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url)

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // ─── Health Check ──────────────────────────────────────────────────────
    if (url.pathname === '/health') {
      return Response.json({
        status: 'ok',
        service: 'wp-sync-service',
        version: '2.0.0',
        uptime: process.uptime(),
        lastSync: lastSyncTime,
        isSyncing,
        activeConfigs: query<WPSyncConfig>('SELECT id, siteUrl, syncFreq, lastSync FROM WPSyncConfig WHERE active = 1').length,
      })
    }

    // ─── Manual Trigger Sync ───────────────────────────────────────────────
    if (url.pathname === '/sync' && req.method === 'POST') {
      return (async () => {
        if (isSyncing) {
          return Response.json({ error: 'Sync already in progress' }, { status: 409 })
        }

        const configs = query<WPSyncConfig>('SELECT * FROM WPSyncConfig WHERE active = 1')
        if (configs.length === 0) {
          return Response.json({ error: 'No active WordPress configs' }, { status: 400 })
        }

        const results: SyncLog[] = []
        for (const config of configs) {
          const log = await syncConfig(config)
          results.push(log)
          syncLogs.unshift(log)
        }

        if (syncLogs.length > 100) syncLogs = syncLogs.slice(0, 100)
        lastSyncTime = new Date().toISOString()

        // Notify clients
        broadcastToClients({
          type: 'sync_completed',
          data: results,
        })

        return Response.json({ success: true, results })
      })()
    }

    // ─── Sync Single Config ────────────────────────────────────────────────
    if (url.pathname === '/sync/config' && req.method === 'POST') {
      return (async () => {
        const body = await req.json() as { configId?: string; fullSync?: boolean }
        if (!body.configId) {
          return Response.json({ error: 'configId is required' }, { status: 400 })
        }

        const configs = query<WPSyncConfig>('SELECT * FROM WPSyncConfig WHERE id = ? AND active = 1', [body.configId])
        if (configs.length === 0) {
          return Response.json({ error: 'Config not found or not active' }, { status: 404 })
        }

        if (body.fullSync) {
          // Reset lastSync for full sync
          run('UPDATE WPSyncConfig SET lastSync = NULL WHERE id = ?', [body.configId])
          configs[0].lastSync = null
        }

        const log = await syncConfig(configs[0])
        syncLogs.unshift(log)
        if (syncLogs.length > 100) syncLogs = syncLogs.slice(0, 100)

        broadcastToClients({ type: 'sync_completed', data: log })

        return Response.json({ success: true, log })
      })()
    }

    // ─── Get Sync Logs ─────────────────────────────────────────────────────
    if (url.pathname === '/logs') {
      return Response.json({ logs: syncLogs, total: syncLogs.length })
    }

    // ─── Get Status ────────────────────────────────────────────────────────
    if (url.pathname === '/status') {
      const configs = query<WPSyncConfig>('SELECT id, siteUrl, syncFreq, lastSync, active FROM WPSyncConfig')
      return Response.json({
        isSyncing,
        lastSyncTime,
        configs,
        logsCount: syncLogs.length,
        intervalMs: SYNC_INTERVAL_MS,
      })
    }

    // ─── WebSocket Upgrade ─────────────────────────────────────────────────
    if (url.pathname === '/ws') {
      if (server.upgrade(req)) {
        return
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })
  },

  websocket: {
    open(ws) {
      wsClients.add(ws)
      console.log('[WS] Client connected. Total:', wsClients.size)

      // Send current status on connect
      ws.send(JSON.stringify({
        type: 'connected',
        data: {
          isSyncing,
          lastSyncTime,
          logsCount: syncLogs.length,
        },
      }))
    },

    message(ws, message) {
      try {
        const data = JSON.parse(message as string)

        if (data.type === 'request_status') {
          ws.send(JSON.stringify({
            type: 'status_update',
            data: {
              isSyncing,
              lastSyncTime,
              recentLogs: syncLogs.slice(0, 5),
            },
          }))
        }
      } catch {
        // Ignore invalid messages
      }
    },

    close(ws) {
      wsClients.delete(ws)
      console.log('[WS] Client disconnected. Total:', wsClients.size)
    },
  },
})

console.log(`🚀 WP Sync Service running on port ${PORT}`)
console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws`)
console.log(`⏰ Auto-sync interval: ${SYNC_INTERVAL_MS / 1000}s`)
console.log(`📄 Health check: http://localhost:${PORT}/health`)

// Start auto-sync scheduler
setInterval(runAutoSync, SYNC_INTERVAL_MS)

// Run first sync after 30 seconds
setTimeout(runAutoSync, 30000)
