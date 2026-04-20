'use client'

import React, { createContext, useContext, type ReactNode } from 'react'
import { useCMSData, type CMSDataHook } from './useCMSData'

// ---------------------------------------------------------------------------
// Context shape — mirrors the full return value of useCMSData()
// ---------------------------------------------------------------------------

type CMSContextValue = CMSDataHook

const CMSContext = createContext<CMSContextValue | null>(null)

// ---------------------------------------------------------------------------
// CMSProvider — wraps children with TanStack Query data hooks
// ---------------------------------------------------------------------------

export function CMSProvider({ children }: { children: ReactNode }) {
  const data = useCMSData()

  return (
    <CMSContext.Provider value={data}>
      {children}
    </CMSContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// useCMS — convenience hook that must be used inside <CMSProvider>
// ---------------------------------------------------------------------------

export function useCMS(): CMSContextValue {
  const ctx = useContext(CMSContext)
  if (!ctx) {
    throw new Error('useCMS must be used within a <CMSProvider>. Wrap your app or layout with <CMSProvider>.')
  }
  return ctx
}
