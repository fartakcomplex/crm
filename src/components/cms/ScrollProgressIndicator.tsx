'use client'

import { useState, useEffect } from 'react'

export default function ScrollProgressIndicator() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight

      if (scrollHeight > 0) {
        const pct = (scrollTop / scrollHeight) * 100
        setProgress(Math.min(pct, 100))
      }

      setVisible(scrollTop > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="fixed top-0 left-0 w-full z-50 transition-opacity duration-300"
      style={{
        height: '4px',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      <div
        className="h-full"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981)',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  )
}
