'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Read a value from localStorage safely, avoiding hydration mismatch.
 * Uses useSyncExternalStore with a server snapshot to ensure SSR and CSR agree.
 */
export function useLocalStorageValue<T>(key: string, defaultValue: T): T {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback)
    return () => window.removeEventListener('storage', callback)
  }, [])

  const getSnapshot = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : defaultValue
    } catch {
      return defaultValue
    }
  }, [key, defaultValue])

  const getServerSnapshot = useCallback((): T => defaultValue, [defaultValue])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
