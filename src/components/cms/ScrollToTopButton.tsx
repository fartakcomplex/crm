'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  const handleScroll = useCallback(() => {
    setIsVisible(window.scrollY > 300)
  }, [])

  useEffect(() => {
    // Check initial scroll position via subscription (not sync setState)
    const checkInitial = () => setIsVisible(window.scrollY > 300)
    // Schedule initial check as a microtask to satisfy react-hooks/set-state-in-effect
    const id = requestAnimationFrame(checkInitial)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [])

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`scroll-to-top-btn ${isVisible ? 'visible' : ''}`}
      aria-label="بازگشت به بالا"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  )
}
