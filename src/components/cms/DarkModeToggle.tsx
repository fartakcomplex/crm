'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function DarkModeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Avoid hydration mismatch — next-themes resolvedTheme is undefined on server
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: mount flag for hydration safety with next-themes
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === 'dark'

  const handleToggle = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 350)

    // Apply theme transition class to body
    document.documentElement.classList.add('theme-transition')
    setTheme(isDark ? 'light' : 'dark')
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 350)
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="relative h-9 w-9 rounded-lg hover:bg-accent/60 transition-colors btn-depth"
        aria-label="تغییر تم"
      >
        <span className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 rounded-lg hover:bg-accent/60 transition-colors btn-depth"
          onClick={handleToggle}
          aria-label={isDark ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
        >
          <span className="relative flex items-center justify-center h-5 w-5">
            {isDark ? (
              <Sun className={`h-[18px] w-[18px] text-amber-400 ${isAnimating ? 'icon-exit' : 'icon-enter'}`} />
            ) : (
              <Moon className={`h-[18px] w-[18px] text-violet-500 ${isAnimating ? 'icon-exit' : 'icon-enter'}`} />
            )}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="tooltip-rich">
        <div className="flex items-center gap-2 text-xs" dir="rtl">
          {isDark ? (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span>حالت روشن</span>
              <span className="text-muted-foreground/50 font-persian-nums">
                {theme === 'dark' ? 'تاریک' : 'روشن'}
              </span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-violet-500" />
              <span>حالت تاریک</span>
              <span className="text-muted-foreground/50 font-persian-nums">
                {theme === 'light' ? 'روشن' : 'تاریک'}
              </span>
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
