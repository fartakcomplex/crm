import { serve } from 'bun'

const WS_PORT = 3005
const PING_INTERVAL_MS = 30000

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NotificationMessage {
  type: 'notification' | 'ping' | 'system' | 'broadcast'
  data: {
    id?: string
    title?: string
    message?: string
    timestamp?: string
    category?: string
    [key: string]: unknown
  }
}

interface ConnectedClient {
  ws: { send: (data: string) => void; readyState: number }
  id: string
  connectedAt: Date
  subscriptions: string[]
}

// ─── State ─────────────────────────────────────────────────────────────────────

const clients = new Map<string, ConnectedClient>()
let totalConnections = 0
let totalMessagesSent = 0

// ─── Utility ───────────────────────────────────────────────────────────────────

function generateClientId(): string {
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function sendToClient(client: ConnectedClient, message: NotificationMessage): void {
  try {
    if (client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(message))
      totalMessagesSent++
    }
  } catch {
    // ignore send errors
  }
}

function broadcastToAll(message: NotificationMessage, excludeId?: string): void {
  for (const [id, client] of clients) {
    if (id !== excludeId) {
      sendToClient(client, message)
    }
  }
}

function broadcastToSubscribers(channel: string, message: NotificationMessage): void {
  for (const [, client] of clients) {
    if (client.subscriptions.includes(channel) || client.subscriptions.includes('*')) {
      sendToClient(client, message)
    }
  }
}

// ─── Periodic Ping ─────────────────────────────────────────────────────────────

setInterval(() => {
  const pingMsg: NotificationMessage = {
    type: 'ping',
    data: {
      id: `ping-${Date.now()}`,
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
    },
  }

  for (const [id, client] of clients) {
    sendToClient(client, pingMsg)
  }

  console.log(`[Ping] Sent heartbeat to ${clients.size} clients`)
}, PING_INTERVAL_MS)

// ─── Server (Bun native WebSocket + HTTP) ──────────────────────────────────────

const server = serve({
  port: WS_PORT,
  fetch(req, server) {
    const url = new URL(req.url)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // ─── Health Check ────────────────────────────────────────────────────
    if (url.pathname === '/health' && req.method === 'GET') {
      return Response.json({
        status: 'ok',
        service: 'notification-service',
        version: '1.0.0',
        uptime: process.uptime(),
        connectedClients: clients.size,
        totalConnections,
        totalMessagesSent,
      })
    }

    // ─── Broadcast via HTTP POST ─────────────────────────────────────────
    if (url.pathname === '/broadcast' && req.method === 'POST') {
      return (async () => {
        try {
          const body = (await req.json()) as {
            title?: string
            message?: string
            category?: string
            channel?: string
            type?: string
            data?: Record<string, unknown>
          }

          const notifType = body.type || 'notification'
          const channel = body.channel || '*'
          const notif: NotificationMessage = {
            type: notifType as NotificationMessage['type'],
            data: {
              id: `notif-${Date.now()}`,
              title: body.title || 'اعلان جدید',
              message: body.message || '',
              category: body.category || 'general',
              timestamp: new Date().toISOString(),
              ...body.data,
            },
          }

          if (channel === '*') {
            broadcastToAll(notif)
          } else {
            broadcastToSubscribers(channel, notif)
          }

          return Response.json({
            success: true,
            sentTo: clients.size,
            notification: notif,
          })
        } catch {
          return Response.json(
            { success: false, error: 'Invalid JSON body' },
            { status: 400 },
          )
        }
      })()
    }

    // ─── Stats ──────────────────────────────────────────────────────────
    if (url.pathname === '/stats' && req.method === 'GET') {
      return Response.json({
        connectedClients: clients.size,
        totalConnections,
        totalMessagesSent,
        uptime: process.uptime(),
        clients: Array.from(clients.values()).map((c) => ({
          id: c.id,
          connectedAt: c.connectedAt,
          subscriptions: c.subscriptions,
        })),
      })
    }

    // ─── WebSocket Upgrade ───────────────────────────────────────────────
    if (url.pathname === '/') {
      if (server.upgrade(req)) {
        return
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })
  },

  websocket: {
    open(ws) {
      const clientId = generateClientId()
      totalConnections++

      const client: ConnectedClient = {
        ws: ws as unknown as ConnectedClient['ws'],
        id: clientId,
        connectedAt: new Date(),
        subscriptions: ['*'],
      }

      clients.set(clientId, client)
      console.log(`[WS] Client connected: ${clientId} (Total: ${clients.size})`)

      // Send welcome
      sendToClient(client, {
        type: 'system',
        data: {
          id: `sys-${Date.now()}`,
          message: 'به سیستم اعلان‌های زنده خوش آمدید',
          timestamp: new Date().toISOString(),
          clientId,
          connectedClients: clients.size,
        },
      })

      // Notify others
      broadcastToAll(
        {
          type: 'system',
          data: {
            id: `presence-${Date.now()}`,
            message: 'کاربر جدید متصل شد',
            timestamp: new Date().toISOString(),
            connectedClients: clients.size,
          },
        },
        clientId,
      )
    },

    message(ws, message) {
      const clientId = Array.from(clients.entries()).find(
        ([, c]) => c.ws === ws,
      )?.[0]

      if (!clientId) return

      const client = clients.get(clientId)!
      try {
        const msg = JSON.parse(message as string) as {
          type?: string
          action?: string
          channel?: string
          data?: Record<string, unknown>
        }

        switch (msg.type || msg.action) {
          case 'subscribe': {
            const channel = msg.channel || '*'
            if (!client.subscriptions.includes(channel)) {
              client.subscriptions.push(channel)
            }
            sendToClient(client, {
              type: 'system',
              data: {
                id: `sub-${Date.now()}`,
                message: `اشتراک در کانال: ${channel}`,
                timestamp: new Date().toISOString(),
                subscriptions: client.subscriptions,
              },
            })
            break
          }

          case 'unsubscribe': {
            const channel = msg.channel || '*'
            client.subscriptions = client.subscriptions.filter((c) => c !== channel)
            sendToClient(client, {
              type: 'system',
              data: {
                id: `unsub-${Date.now()}`,
                message: `لغو اشتراک از کانال: ${channel}`,
                timestamp: new Date().toISOString(),
                subscriptions: client.subscriptions,
              },
            })
            break
          }

          case 'broadcast': {
            broadcastToAll(
              {
                type: 'broadcast',
                data: {
                  id: `client-bcast-${Date.now()}`,
                  from: clientId,
                  timestamp: new Date().toISOString(),
                  ...msg.data,
                },
              },
              clientId,
            )
            break
          }

          default:
            sendToClient(client, {
              type: 'system',
              data: {
                id: `echo-${Date.now()}`,
                message: `پیام دریافت شد`,
                timestamp: new Date().toISOString(),
              },
            })
        }
      } catch {
        // Ignore malformed messages
      }
    },

    close(ws) {
      const entry = Array.from(clients.entries()).find(
        ([, c]) => c.ws === ws,
      )
      if (entry) {
        const [clientId] = entry
        clients.delete(clientId)
        console.log(`[WS] Client disconnected: ${clientId} (Total: ${clients.size})`)
        broadcastToAll({
          type: 'system',
          data: {
            id: `leave-${Date.now()}`,
            message: 'کاربر قطع ارتباط کرد',
            timestamp: new Date().toISOString(),
            connectedClients: clients.size,
          },
        })
      }
    },
  },
})

console.log(`🔔 Notification Service running on port ${WS_PORT}`)
console.log(`📡 WebSocket: ws://localhost:${WS_PORT}/`)
console.log(`❤️  Health: http://localhost:${WS_PORT}/health`)
console.log(`📢 Broadcast: POST http://localhost:${WS_PORT}/broadcast`)
