'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'

/**
 * Ensures specified queries are fetched on mount.
 * This is the per-page data fetching approach — each page
 * only loads the data it actually needs.
 */
export function useEnsureData(keys: string[]) {
  const qc = useQueryClient()
  useEffect(() => {
    keys.forEach(key => {
      qc.prefetchQuery({ queryKey: [key] })
    })
  }, [qc, keys.join(',')])
}

/**
 * Enables a query when called (e.g., on mount via useEffect)
 */
export function enableQuery(query: UseQueryResult<unknown>) {
  if (!query.data && !query.isLoading && !query.isFetching) {
    query.refetch()
  }
}
