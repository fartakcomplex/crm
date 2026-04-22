'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Play } from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'cms-notification-sound'

// ─── Web Audio API helper ────────────────────────────────────────────────

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)()
    } catch {
      return null
    }
  }
  return audioCtx
}

function playBeep() {
  const ctx = getAudioContext()
  if (!ctx) return

  // Resume context if suspended (required by autoplay policies)
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  // Pleasant notification beep: two-tone ascending
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(660, ctx.currentTime) // E5
  oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5

  gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.3)
}

// ─── Component ───────────────────────────────────────────────────────────

export function NotificationSoundToggle() {
  const [enabled, setEnabled] = useState(() => {
    try {
      const val = localStorage.getItem(STORAGE_KEY)
      if (val !== null) return val === 'true'
    } catch {
      // ignore
    }
    return false
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const waveformRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)

  // Save preference
  const updateEnabled = useCallback((val: boolean) => {
    setEnabled(val)
    try {
      localStorage.setItem(STORAGE_KEY, String(val))
    } catch {
      // ignore
    }
  }, [])

  // Waveform animation
  useEffect(() => {
    if (!isPlaying || !waveformRef.current) return

    const bars = waveformRef.current.children
    const frame = () => {
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as HTMLElement
        const h = Math.random() * 16 + 4
        bar.style.height = `${h}px`
      }
      animRef.current = requestAnimationFrame(frame)
    }
    frame()

    const timeout = setTimeout(() => {
      cancelAnimationFrame(animRef.current)
      setIsPlaying(false)
      // Reset bars
      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i] as HTMLElement
        bar.style.height = '4px'
      }
    }, 400)

    return () => {
      cancelAnimationFrame(animRef.current)
      clearTimeout(timeout)
    }
  }, [isPlaying])

  const handleTest = useCallback(() => {
    setIsPlaying(true)
    playBeep()
  }, [])

  const handleToggle = useCallback(() => {
    const newVal = !enabled
    updateEnabled(newVal)
    if (newVal) {
      // Play sound on enabling to confirm
      setIsPlaying(true)
      playBeep()
    }
  }, [enabled, updateEnabled])

  return (
    <div
      className="glass-card glass-card-violet rounded-xl overflow-hidden animate-in"
      dir="rtl"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm transition-all duration-300 ${
              enabled
                ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            {enabled ? (
              <Volume2 className="h-4 w-4 text-white" />
            ) : (
              <VolumeX className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          <div>
            <span className="text-sm font-medium block leading-tight">
              صدای اعلان
            </span>
            <span className="text-[10px] text-muted-foreground">
              {enabled ? 'فعال' : 'غیرفعال'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Waveform visualizer */}
          <div
            ref={waveformRef}
            className="flex items-end gap-[2px] h-5 w-12"
          >
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-[2px] rounded-full transition-all duration-150 ${
                  enabled
                    ? 'bg-violet-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                style={{ height: '4px' }}
              />
            ))}
          </div>

          {/* Test Button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-violet-500/10"
            onClick={handleTest}
            disabled={isPlaying}
            title="تست صدا"
          >
            <Play
              className={`h-3.5 w-3.5 text-violet-600 dark:text-violet-400 ${
                isPlaying ? 'animate-pulse' : ''
              }`}
            />
          </Button>

          {/* Toggle Switch */}
          <button
            className={`relative h-6 w-11 rounded-full transition-colors duration-300 cursor-pointer ${
              enabled
                ? 'bg-gradient-to-r from-violet-500 to-purple-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onClick={handleToggle}
            role="switch"
            aria-checked={enabled}
            aria-label="فعال/غیرفعال کردن صدای اعلان"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                enabled ? 'left-0.5' : 'left-[22px]'
              }`}
              style={{
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationSoundToggle
