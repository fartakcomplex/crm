'use client'

import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center px-4">
      {/* Animated icon with glass background */}
      <div className="relative mb-5">
        <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl glass-card flex items-center justify-center text-muted-foreground/40 float-animation shadow-inner">
          <div className="h-10 w-10 md:h-12 md:w-12 flex items-center justify-center">
            {icon}
          </div>
        </div>
        {/* Subtle glow behind */}
        <div className="absolute inset-0 rounded-2xl bg-muted/30 blur-xl -z-10 scale-125 animate-[pulse-soft_3s_ease-in-out_infinite]" />
      </div>

      {/* Text */}
      <h3 className="text-base font-semibold text-foreground/80 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground/70 max-w-xs leading-relaxed">
        {description}
      </p>

      {/* Optional action */}
      {action && (
        <Button
          className="mt-5 gap-2 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
