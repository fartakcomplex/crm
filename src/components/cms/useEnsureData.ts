'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_CONFIGS } from './useCMSData'

/**
 * Ensures specified queries are fetched on mount using fetchQuery().
 * Unlike prefetchQuery(), fetchQuery() guarantees the data is fetched
 * even when the original useQuery has enabled: false.
 *
 * Each page only loads the data it actually needs.
 */
export function useEnsureData(keys: string[]) {
  const qc = useQueryClient()

  useEffect(() => {
    keys.forEach(key => {
      const config = QUERY_CONFIGS[key]
      if (config) {
        qc.fetchQuery({
          queryKey: config.queryKey,
          queryFn: config.queryFn,
          staleTime: 60_000,
        }).catch((err: unknown) => {
          // Log fetch errors for debugging — the useQuery hook will handle retry
          console.warn(`[useEnsureData] Failed to prefetch "${key}":`, err)
        })
      }
    })
  }, [qc, keys.join(',')])
}
