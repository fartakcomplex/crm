// ─── Global Rate Limit & Concurrency Manager ───────────────────────────────
// The z-ai-web-dev-sdk only allows ONE function call at a time globally.
// Any concurrent call results in "PreconditionFailed: function is pending state".
// This module provides a global mutex + rate limiting for all SDK calls.

const state = {
  last429: 0,
  lastPreconditionFailed: 0,
  consecutive429: 0,
  cooldownUntil: 0,

  // ─── Global SDK Mutex ────────────────────────────────────────────────────
  // Only ONE SDK call (research, image gen, video gen, video poll) at a time.
  // Any attempt to call while busy → reject immediately.
  sdkCallInProgress: false,
  sdkCallQueue: Array<{
    fn: () => Promise<unknown>
    resolve: (value: unknown) => void
    reject: (err: unknown) => void
    label: string
  }> = [],
  sdkCallId: 0,
}

/** Check if an error is a rate limit or precondition error */
export function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.includes('429') ||
    msg.includes('Too many requests') ||
    msg.includes('rate') ||
    msg.includes('PreconditionFailed') ||
    msg.includes('pending state') ||
    msg.includes('function is pending')
}

/** Call this when a 429 or PreconditionFailed is received */
export function markRateLimited() {
  const now = Date.now()
  state.last429 = now
  state.lastPreconditionFailed = now
  state.consecutive429++
  // Cap at 120s cooldown to prevent snowball effect
  const cooldown = Math.min(30000 * state.consecutive429, 120000)
  state.cooldownUntil = now + cooldown
  console.log(`[rate-limit] Rate limited #${state.consecutive429}, cooldown=${cooldown / 1000}s`)
}

/** Call this when a request succeeds */
export function markSuccess() {
  state.consecutive429 = 0
  state.cooldownUntil = 0
}

/** Reset if last error was >90s ago */
export function resetRateLimit() {
  if (Date.now() - state.last429 > 90000) {
    state.consecutive429 = 0
    state.cooldownUntil = 0
  }
}

/** How long until we can try again */
export function getWaitTime(): number {
  const now = Date.now()
  if (now < state.cooldownUntil) {
    return state.cooldownUntil - now
  }
  return 0
}

/** Wait until cooldown expires */
export async function waitForCooldown(context = 'API'): Promise<boolean> {
  const wait = getWaitTime()
  if (wait > 0) {
    console.log(`[rate-limit] ${context}: waiting ${Math.round(wait / 1000)}s`)
    await new Promise(r => setTimeout(r, wait))
    return true
  }
  return false
}

export function isRateLimited(): boolean {
  return Date.now() < state.cooldownUntil
}

export function getCooldownSeconds(): number {
  return Math.max(0, Math.round((state.cooldownUntil - Date.now()) / 1000))
}

/** Check if SDK is currently processing a call */
export function isSDKBusy(): boolean {
  return state.sdkCallInProgress
}

/** Get queue depth */
export function getQueueDepth(): number {
  return state.sdkCallQueue.length
}

/**
 * Execute an SDK call with global mutex serialization.
 * Only ONE SDK call can be in progress at a time across ALL API routes.
 * If another call is in progress, this will wait in a queue.
 * If rate-limited, rejects immediately.
 */
export async function withSDKMutex<T>(
  fn: () => Promise<T>,
  label = 'SDK call',
  timeoutMs = 180000, // 3 minute max wait
): Promise<T> {
  // Check rate limit first
  resetRateLimit()
  if (isRateLimited()) {
    const wait = getCooldownSeconds()
    throw new Error(`rate_limited: SDK rate limited, wait ${wait}s`)
  }

  // If no SDK call in progress, run immediately
  if (!state.sdkCallInProgress) {
    return executeSDKCall(fn, label)
  }

  // Otherwise, queue it
  return new Promise<T>((resolve, reject) => {
    const queueItem = {
      fn: fn as () => Promise<unknown>,
      resolve: resolve as (value: unknown) => void,
      reject,
      label,
    }
    state.sdkCallQueue.push(queueItem)
    console.log(`[sdk-mutex] Queued "${label}" (queue depth: ${state.sdkCallQueue.length})`)

    // Timeout for queued items
    const timeout = setTimeout(() => {
      const idx = state.sdkCallQueue.indexOf(queueItem)
      if (idx !== -1) {
        state.sdkCallQueue.splice(idx, 1)
        reject(new Error(`timeout: "${label}" timed out in queue after ${timeoutMs / 1000}s`))
      }
    }, timeoutMs)

    // Clear timeout when resolved
    const origResolve = queueItem.resolve
    queueItem.resolve = (val: unknown) => {
      clearTimeout(timeout)
      origResolve(val)
    }
    const origReject = queueItem.reject
    queueItem.reject = (err: unknown) => {
      clearTimeout(timeout)
      origReject(err)
    }
  })
}

/** Internal: execute an SDK call and process the queue after */
async function executeSDKCall<T>(fn: () => Promise<T>, label: string): Promise<T> {
  state.sdkCallInProgress = true
  state.sdkCallId++
  const callId = state.sdkCallId
  const startTime = Date.now()
  console.log(`[sdk-mutex] Starting call #${callId}: "${label}"`)

  try {
    const result = await fn()
    const elapsed = Date.now() - startTime
    console.log(`[sdk-mutex] Call #${callId} "${label}" completed in ${elapsed}ms`)
    return result
  } catch (err) {
    const elapsed = Date.now() - startTime
    const errMsg = err instanceof Error ? err.message : String(err)
    console.log(`[sdk-mutex] Call #${callId} "${label}" failed after ${elapsed}ms: ${errMsg.substring(0, 100)}`)

    if (isRateLimitError(err)) {
      markRateLimited()
    }

    throw err
  } finally {
    state.sdkCallInProgress = false

    // Process next queued item after a small delay to avoid rapid-fire
    if (state.sdkCallQueue.length > 0) {
      const next = state.sdkCallQueue.shift()!
      // Small delay between SDK calls to reduce contention
      setTimeout(() => {
        executeSDKCall(next.fn, next.label)
          .then(next.resolve)
          .catch(next.reject)
      }, 2000) // 2s between consecutive SDK calls
    }
  }
}

/**
 * Execute with single retry on rate limit / precondition errors.
 * Wraps withSDKMutex for proper serialization.
 */
export async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 1,
  context = 'API'
): Promise<T> {
  await waitForCooldown(context)

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const wait = Math.max(getWaitTime(), 25000) // at least 25s between retries
      console.log(`[rate-limit] ${context}: retry ${attempt}, waiting ${Math.round(wait / 1000)}s`)
      await new Promise(r => setTimeout(r, wait))
    }

    try {
      const result = await withSDKMutex(fn, context)
      markSuccess()
      return result
    } catch (err) {
      if (isRateLimitError(err)) {
        markRateLimited()
        if (attempt < maxRetries) continue
      }
      throw err
    }
  }
  throw new Error(`${context} failed after ${maxRetries + 1} attempts`)
}

/** Force reset (e.g., after server restart) */
export function forceReset() {
  state.consecutive429 = 0
  state.cooldownUntil = 0
  state.last429 = 0
  state.lastPreconditionFailed = 0
  state.sdkCallInProgress = false
  state.sdkCallQueue.length = 0
  state.sdkCallId = 0
  console.log('[rate-limit] Force reset (mutex cleared, queue emptied)')
}

// Legacy compatibility — these are no longer used by the API routes but kept for safety
export function acquireGeneration(): boolean {
  if (state.sdkCallInProgress) {
    console.log(`[rate-limit] acquireGeneration: SDK busy`)
    return false
  }
  return true
}

export function releaseGeneration() {
  // No-op — withSDKMutex handles this
}

export function isBusy(): boolean {
  return state.sdkCallInProgress
}
