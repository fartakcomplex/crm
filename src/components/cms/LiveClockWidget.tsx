'use client'

import { useState, useEffect } from 'react'
import { Clock, CalendarDays } from 'lucide-react'

export default function LiveClockWidget() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        new Intl.DateTimeFormat('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(now)
      )
      setDate(
        new Intl.DateTimeFormat('fa-IR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(now)
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) return null

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
      <Clock className="h-3.5 w-3.5 text-violet-500" />
      <span dir="ltr" className="text-xs font-mono tabular-nums font-medium text-foreground/80">
        {time}
      </span>
      <span className="w-px h-3.5 bg-border/50" />
      <CalendarDays className="h-3 w-3 text-muted-foreground" />
      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
        {date}
      </span>
    </div>
  )
}
