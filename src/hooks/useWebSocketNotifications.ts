'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface NotificationEvent {
  type: 'notification' | 'ping' | 'system' | 'broadcast'
  data: {
    id?: string
    title?: string
    message?: string
    timestamp?: string
    category?: string
    clientId?: string
    connectedClients?: number
    subscriptions?: string[]
    [key: string]: unknown
  }
}

export interface UseWebSocketNotificationsReturn {
  /** Whether the WebSocket is currently connected */
  isConnected: boolean
  /** The last received notification event */
  lastEvent: NotificationEvent | null
  /** All received events (limited to last 50) */
  events: NotificationEvent[]
  /** Manually connect / reconnect */
  connect: () => void
  /** Manually disconnect */
  disconnect: () => void
  /** Clear event history */
  clearEvents: () => void
  /** Subscribe to a specific channel */
  subscribe: (channel: string) => void
  /** Unsubscribe from a specific channel */
  unsubscribe: (channel: string) => void
  /** Broadcast a message to all connected clients */
  broadcast: (data: Record<string, unknown>) => void
}

const RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_ATTEMPTS = 10
const MAX_EVENTS = 50

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useWebSocketNotifications(): UseWebSocketNotificationsReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<NotificationEvent | null>(null)
  const [events, setEvents] = useState<NotificationEvent[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const mountedRef = useRef(true)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectRef = useRef<() => void>(() => {})

  const clearEvents = useCallback(() => {
    setEvents([])
    setLastEvent(null)
  }, [])

  const handleMessage = useCallback((event: NotificationEvent) => {
    if (!mountedRef.current) return

    setLastEvent(event)

    // Only store non-ping events to avoid cluttering history
    if (event.type !== 'ping') {
      setEvents((prev) => {
        const next = [event, ...prev]
        return next.slice(0, MAX_EVENTS)
      })
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    reconnectCountRef.current = MAX_RECONNECT_ATTEMPTS // prevent auto-reconnect

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const connect = useCallback(() => {
    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    try {
      // Connect via gateway with XTransformPort
      const wsUrl = window.location.protocol === 'https:'
        ? `wss://${window.location.host}/?XTransformPort=3005`
        : `ws://${window.location.host}/?XTransformPort=3005`

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (!mountedRef.current) return
        setIsConnected(true)
        reconnectCountRef.current = 0
        console.log('[WS Notifications] Connected')
      }

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data as string) as NotificationEvent
          handleMessage(data)
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setIsConnected(false)
        console.log('[WS Notifications] Disconnected')

        // Auto-reconnect using ref to avoid circular dependency
        if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY_MS * Math.pow(1.5, reconnectCountRef.current)
          reconnectCountRef.current++
          console.log(`[WS Notifications] Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectCountRef.current})`)
          reconnectTimerRef.current = setTimeout(() => {
            if (mountedRef.current) connectRef.current()
          }, Math.min(delay, 30000))
        }
      }

      ws.onerror = () => {
        // Error is handled by onclose
      }
    } catch {
      // Connection failed
    }
  }, [handleMessage])

  // Store connect in ref for use in onclose handler (via effect to avoid render-time ref access)
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const subscribe = useCallback((channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', channel }))
    }
  }, [])

  const unsubscribe = useCallback((channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', channel }))
    }
  }, [])

  const broadcast = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'broadcast', data }))
    }
  }, [])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    mountedRef.current = true

    // Delay initial connection to avoid SSR issues
    const timer = setTimeout(() => {
      connect()
    }, 1000)

    return () => {
      mountedRef.current = false
      clearTimeout(timer)

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return {
    isConnected,
    lastEvent,
    events,
    connect,
    disconnect,
    clearEvents,
    subscribe,
    unsubscribe,
    broadcast,
  }
}

export default useWebSocketNotifications
